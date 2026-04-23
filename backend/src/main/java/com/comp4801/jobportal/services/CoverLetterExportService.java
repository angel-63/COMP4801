package com.comp4801.jobportal.services;

import com.comp4801.jobportal.dto.CoverLetterExportRequest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Service
public class CoverLetterExportService {
    private static final long DEFAULT_LATEX_TIMEOUT_SECONDS = 120;

    public byte[] exportPdf(CoverLetterExportRequest payload) {
        validatePayload(payload);

        try {
            String rendered = renderTemplate(payload);

            Path tempDir = Files.createTempDirectory("cover-letter-export-");
            Path texPath = tempDir.resolve("cover-letter.tex");
            Path pdfPath = tempDir.resolve("cover-letter.pdf");
            Files.writeString(texPath, rendered, StandardCharsets.UTF_8);

            runLatex(tempDir, texPath.getFileName().toString());

            if (!Files.exists(pdfPath)) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "PDF generation failed");
            }

            return Files.readAllBytes(pdfPath);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate cover letter PDF", e);
        }
    }

    private void validatePayload(CoverLetterExportRequest payload) {
        if (payload == null || payload.sender() == null || isBlank(payload.sender().name())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cover letter payload is missing sender name");
        }
    }

    private String renderTemplate(CoverLetterExportRequest payload) throws IOException {
        String template = loadTemplate("templates/cover-letter.tex");
        return template
                .replace("{{SENDER_NAME}}", latex(payload.sender().name()))
                .replace("{{SENDER_DETAILS}}", renderSenderDetails(payload.sender()))
                .replace("{{DATE}}", latex(defaultString(payload.recipient() == null ? null : payload.recipient().date())))
                .replace("{{RECIPIENT_BLOCK}}", renderRecipientBlock(payload.recipient()))
                .replace("{{GREETING}}", latex(defaultString(payload.body() == null ? null : payload.body().greeting())))
                .replace("{{PARAGRAPHS}}", renderParagraphs(payload.body() == null ? null : payload.body().paragraphs()))
                .replace("{{CLOSING}}", latex(defaultString(payload.body() == null ? null : payload.body().closing())))
                .replace("{{SIGNATURE}}", latex(defaultString(payload.body() == null ? null : payload.body().signature())));
    }

    private String loadTemplate(String path) throws IOException {
        return new ClassPathResource(path).getContentAsString(StandardCharsets.UTF_8);
    }

    private String renderSenderDetails(CoverLetterExportRequest.Sender sender) {
        List<String> lines = new ArrayList<>();

        if (!isBlank(sender.phone())) {
            lines.add(latex(sender.phone()));
        }

        if (!isBlank(sender.location())) {
            lines.add(latex(sender.location()));
        }

        if (sender.links() != null) {
            sender.links().stream()
                    .filter(link -> !isBlank(link.url()) || !isBlank(link.label()))
                    .map(link -> {
                        String label = latex(isBlank(link.label()) ? defaultString(link.url()) : link.label());
                        String url = latexUrl(defaultString(link.url()));
                        return isBlank(url)
                                ? label
                                : "\\href{\\detokenize{" + url + "}}{" + label + "}";
                    })
                    .forEach(lines::add);
        }

        return lines.isEmpty() ? "" : String.join(" \\\\\n", lines);
    }

    private String renderRecipientBlock(CoverLetterExportRequest.Recipient recipient) {
        if (recipient == null) {
            return "";
        }

        List<String> lines = new ArrayList<>();
        if (!isBlank(recipient.companyName())) {
            lines.add(latex(recipient.companyName()));
        }
        if (!isBlank(recipient.hiringManagerName())) {
            lines.add(latex(recipient.hiringManagerName()));
        }

        return lines.isEmpty() ? "" : String.join(" \\\\\n", lines);
    }

    private String renderParagraphs(List<String> paragraphs) {
        List<String> cleanedParagraphs = paragraphs == null
                ? List.of()
                : paragraphs.stream().filter(item -> !isBlank(item)).toList();

        if (cleanedParagraphs.isEmpty()) {
            return "";
        }

        return cleanedParagraphs.stream()
                .map(this::latex)
                .reduce((a, b) -> a + "\n\n" + b)
                .orElse("");
    }

    private void runLatex(Path workingDirectory, String texFilename) throws IOException {
        List<String> engines = new ArrayList<>();
        String configuredEngine = System.getenv("LATEX_ENGINE");
        if (!isBlank(configuredEngine)) {
            engines.add(configuredEngine);
        }
        engines.add("xelatex");
        engines.add("pdflatex");

        IOException lastIoException = null;
        List<String> failures = new ArrayList<>();

        for (String engine : engines.stream().filter(Objects::nonNull).distinct().toList()) {
            List<String> command = List.of(
                    engine,
                    "-interaction=nonstopmode",
                    "-halt-on-error",
                    texFilename
            );

            try {
                Path outputPath = workingDirectory.resolve(engine + ".out.log");
                Process process = new ProcessBuilder(command)
                        .directory(workingDirectory.toFile())
                        .redirectErrorStream(true)
                        .redirectOutput(outputPath.toFile())
                        .start();

                long timeoutSeconds = latexTimeoutSeconds();
                boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
                if (!finished) {
                    process.destroyForcibly();
                    String partialOutput = readProcessOutput(outputPath);
                    throw new ResponseStatusException(
                            HttpStatus.GATEWAY_TIMEOUT,
                            "PDF export timed out while waiting for LaTeX (" + engine + ", " + timeoutSeconds
                                    + "s). This usually means MiKTeX is still installing packages or LaTeX is stuck on a missing dependency. "
                                    + "Try again in a moment. Details: " + summarizeOutput(partialOutput)
                    );
                }

                String output = readProcessOutput(outputPath);
                int exitCode = process.exitValue();

                if (exitCode == 0) {
                    return;
                }
                failures.add(engine + ": " + summarizeOutput(output));
            } catch (IOException e) {
                lastIoException = e;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "LaTeX compilation was interrupted", e);
            }
        }

        if (!failures.isEmpty()) {
            String combinedMessage = String.join(" | ", failures);
            if (combinedMessage.toLowerCase().contains("fresh tex installation")
                    || combinedMessage.toLowerCase().contains("finish the setup before proceeding")) {
                throw new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "LaTeX is installed but MiKTeX setup is incomplete. Open MiKTeX Console and finish first-time setup, then try export again. Details: " + combinedMessage
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "LaTeX compilation failed. Details: " + combinedMessage
            );
        }

        throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "No LaTeX engine found. Install xelatex or pdflatex and ensure it is on PATH.",
                lastIoException
        );
    }

    private String latex(String value) {
        return sanitizeForLatex(defaultString(value))
                .replace("\\", "\\textbackslash{}")
                .replace("&", "\\&")
                .replace("%", "\\%")
                .replace("$", "\\$")
                .replace("#", "\\#")
                .replace("_", "\\_")
                .replace("{", "\\{")
                .replace("}", "\\}")
                .replace("~", "\\textasciitilde{}")
                .replace("^", "\\textasciicircum{}");
    }

    private String latexUrl(String value) {
        return sanitizeForLatex(defaultString(value))
                .replace("\\", "/")
                .replace("{", "")
                .replace("}", "");
    }

    private String defaultString(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String summarizeOutput(String output) {
        if (output == null || output.isBlank()) {
            return "unknown LaTeX error";
        }

        String singleLine = output.replaceAll("\\s+", " ").trim();
        return singleLine.length() > 300 ? singleLine.substring(0, 300) + "..." : singleLine;
    }

    private long latexTimeoutSeconds() {
        String configuredTimeout = System.getenv("LATEX_TIMEOUT_SECONDS");
        if (configuredTimeout == null || configuredTimeout.isBlank()) {
            return DEFAULT_LATEX_TIMEOUT_SECONDS;
        }

        try {
            long parsed = Long.parseLong(configuredTimeout.trim());
            return parsed > 0 ? parsed : DEFAULT_LATEX_TIMEOUT_SECONDS;
        } catch (NumberFormatException ignored) {
            return DEFAULT_LATEX_TIMEOUT_SECONDS;
        }
    }

    private String readProcessOutput(Path outputPath) {
        try {
            if (!Files.exists(outputPath)) {
                return "";
            }

            return Files.readString(outputPath, StandardCharsets.UTF_8);
        } catch (IOException ignored) {
            return "";
        }
    }

    private String sanitizeForLatex(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String normalized = Normalizer.normalize(value, Normalizer.Form.NFKC)
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .replace('\u00A0', ' ')
                .replace("\u200B", "")
                .replace("\u200C", "")
                .replace("\u200D", "")
                .replace("\u2060", "")
                .replace('\u2013', '-')
                .replace('\u2014', '-')
                .replace('\u2212', '-')
                .replace('\u2022', '-')
                .replace('\u00B7', '-')
                .replace("\u2026", "...")
                .replace('\u201C', '"')
                .replace('\u201D', '"')
                .replace('\u2018', '\'')
                .replace('\u2019', '\'');

        return normalized.replaceAll("[\\p{Cntrl}&&[^\n\t]]", "");
    }
}
