package com.comp4801.jobportal.services;

import com.comp4801.jobportal.dto.ResumeExportRequest;
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

import static java.util.Map.entry;

@Service
public class ResumeExportService {
    private static final long DEFAULT_LATEX_TIMEOUT_SECONDS = 120;

    public byte[] exportPdf(ResumeExportRequest payload) {
        validatePayload(payload);

        try {
            String rendered = renderTemplate(payload);

            Path tempDir = Files.createTempDirectory("resume-export-");
            Path texPath = tempDir.resolve("resume.tex");
            Path pdfPath = tempDir.resolve("resume.pdf");
            Files.writeString(texPath, rendered, StandardCharsets.UTF_8);

            runLatex(tempDir, texPath.getFileName().toString());

            if (!Files.exists(pdfPath)) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "PDF generation failed");
            }

            return Files.readAllBytes(pdfPath);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate resume PDF", e);
        }
    }

    private void validatePayload(ResumeExportRequest payload) {
        if (payload == null || payload.personal() == null || isBlank(payload.personal().name())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume payload is missing personal name");
        }
    }

    private String renderTemplate(ResumeExportRequest payload) throws IOException {
        String template = loadTemplate("templates/resume/resume.tex");
        String headingTemplate = loadTemplate("templates/resume/src/heading.tex");
        String summaryTemplate = loadTemplate("templates/resume/src/summary.tex");
        String educationTemplate = loadTemplate("templates/resume/src/education.tex");
        String skillsTemplate = loadTemplate("templates/resume/src/skills.tex");
        String experienceTemplate = loadTemplate("templates/resume/src/experience.tex");
        String projectsTemplate = loadTemplate("templates/resume/src/projects.tex");
        String certificatesTemplate = loadTemplate("templates/resume/src/certificates.tex");
        String languagesTemplate = loadTemplate("templates/resume/src/languages.tex");

        Map<String, String> replacements = Map.ofEntries(
                entry("{{CUSTOM_COMMANDS}}", loadTemplate("templates/resume/custom-commands.tex")),
                entry("{{HEADING}}", renderFragment(headingTemplate, Map.ofEntries(
                        entry("{{NAME}}", latex(payload.personal().name())),
                        entry("{{CONTACT_LINE}}", renderContactLine(payload))
                ))),
                entry("{{SUMMARY}}", renderFragment(summaryTemplate, Map.ofEntries(
                        entry("{{SUMMARY_BLOCK}}", renderSummarySection(payload))
                ))),
                entry("{{EDUCATION}}", renderFragment(educationTemplate, Map.ofEntries(
                        entry("{{EDUCATION_BLOCK}}", renderEducationSection(payload))
                ))),
                entry("{{SKILLS}}", renderFragment(skillsTemplate, Map.ofEntries(
                        entry("{{SKILLS_BLOCK}}", renderSkillsSection(payload))
                ))),
                entry("{{EXPERIENCE}}", renderFragment(experienceTemplate, Map.ofEntries(
                        entry("{{EXPERIENCE_BLOCK}}", renderExperienceSection(payload))
                ))),
                entry("{{PROJECTS}}", renderFragment(projectsTemplate, Map.ofEntries(
                        entry("{{PROJECTS_BLOCK}}", renderProjectsSection(payload))
                ))),
                entry("{{CERTIFICATES}}", renderFragment(certificatesTemplate, Map.ofEntries(
                        entry("{{CERTIFICATES_BLOCK}}", renderCertificatesSection(payload))
                ))),
                entry("{{LANGUAGES}}", renderFragment(languagesTemplate, Map.ofEntries(
                        entry("{{LANGUAGES_BLOCK}}", renderLanguagesSection(payload))
                )))
        );

        return renderFragment(template, replacements);
    }

    private String buildSectionBlock(String customTitle, String fallbackTitle, String content) {
        if (isBlank(content)) {
            return "";
        }

        return "\\resumesection{" + latex(sectionTitle(customTitle, fallbackTitle)) + "}\n" + content + "\n";
    }

    private String renderSummarySection(ResumeExportRequest payload) {
        return buildSectionBlock(
                payload.sectionTitles() == null ? null : payload.sectionTitles().professionalSummary(),
                "Professional Summary",
                renderParagraph(defaultString(payload.personal().summary()))
        );
    }

    private String renderEducationSection(ResumeExportRequest payload) {
        String content = renderEducation(payload.education());
        if (isBlank(content)) {
            return "";
        }

        return "\\resumesection{" + latex(sectionTitle(
                payload.sectionTitles() == null ? null : payload.sectionTitles().educations(),
                "Education"
        )) + "}\n"
                + "\\resumeSubHeadingListStart\n"
                + content
                + "\\resumeSubHeadingListEnd\n";
    }

    private String renderSkillsSection(ResumeExportRequest payload) {
        return buildSectionBlock(
                payload.sectionTitles() == null ? null : payload.sectionTitles().skills(),
                "Skills",
                renderSkills(payload.skills())
        );
    }

    private String renderExperienceSection(ResumeExportRequest payload) {
        String content = renderExperiences(payload.experiences());
        if (isBlank(content)) {
            return "";
        }

        return "\\resumesection{" + latex(sectionTitle(
                payload.sectionTitles() == null ? null : payload.sectionTitles().professionalExperiences(),
                "Professional Experience"
        )) + "}\n"
                + "\\resumeSubHeadingListStart\n"
                + content
                + "\\resumeSubHeadingListEnd\n";
    }

    private String renderProjectsSection(ResumeExportRequest payload) {
        String content = renderProjects(payload.projects());
        if (isBlank(content)) {
            return "";
        }

        return "\\resumesection{" + latex(sectionTitle(
                payload.sectionTitles() == null ? null : payload.sectionTitles().projectExperiences(),
                "Projects"
        )) + "}\n"
                + "\\resumeSubHeadingListStart\n"
                + content
                + "\\resumeSubHeadingListEnd\n";
    }

    private String renderCertificatesSection(ResumeExportRequest payload) {
        return buildSectionBlock(
                payload.sectionTitles() == null ? null : payload.sectionTitles().certificates(),
                "Certificates",
                renderSimpleList(payload.certificates())
        );
    }

    private String renderLanguagesSection(ResumeExportRequest payload) {
        return buildSectionBlock(
                payload.sectionTitles() == null ? null : payload.sectionTitles().languages(),
                "Languages",
                renderLanguages(payload.languages())
        );
    }

    private String renderFragment(String template, Map<String, String> replacements) {
        String rendered = template;
        for (Map.Entry<String, String> entry : replacements.entrySet()) {
            rendered = rendered.replace(entry.getKey(), entry.getValue());
        }
        return rendered;
    }

    private String loadTemplate(String path) throws IOException {
        return new ClassPathResource(path).getContentAsString(StandardCharsets.UTF_8);
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

    private String renderLinks(List<ResumeExportRequest.LinkItem> links) {
        if (links == null || links.isEmpty()) {
            return "";
        }

        return links.stream()
                .filter(link -> !isBlank(link.url()) || !isBlank(link.label()))
                .map(link -> {
                    String rawUrl = defaultString(link.url());
                    String label = latex(isBlank(link.label()) ? rawUrl : link.label());
                    String url = latexUrl(rawUrl);
                    return isBlank(url)
                            ? label
                            : "\\href{\\detokenize{" + url + "}}{" + label + "}";
                })
                .reduce((a, b) -> a + " \\textbar{} " + b)
                .orElse("");
    }

    private String renderContactLine(ResumeExportRequest payload) {
        List<String> parts = new ArrayList<>();

        if (!isBlank(payload.personal().phone())) {
            parts.add(latex(payload.personal().phone()));
        }

        if (!isBlank(payload.personal().location())) {
            parts.add(latex(payload.personal().location()));
        }

        if (payload.personal().links() != null) {
            parts.addAll(payload.personal().links().stream()
                    .filter(link -> !isBlank(link.url()) || !isBlank(link.label()))
                    .map(link -> {
                        String rawUrl = defaultString(link.url());
                        String label = latex(isBlank(link.label()) ? rawUrl : link.label());
                        if (isBlank(rawUrl)) {
                            return label;
                        }
                        return "\\href{\\detokenize{" + latexUrl(rawUrl) + "}}{" + label + "}";
                    })
                    .toList());
        }

        return String.join(" \\quad ", parts);
    }

    private String renderParagraph(String value) {
        if (isBlank(value)) {
            return "";
        }

        return latex(value).replace("\n", "\n\n") + "\n";
    }

    private String renderEducation(List<ResumeExportRequest.EducationItem> education) {
        if (education == null || education.isEmpty()) {
            return "";
        }

        StringBuilder builder = new StringBuilder();
        for (ResumeExportRequest.EducationItem item : education) {
            String dateRight = latex(defaultString(item.endDate()));
            String degreeLine = latex(joinWithDelimiter(" in ", item.degree(), item.fieldOfStudy()));
            String rightDetails = latex(joinWithDelimiter(" | ", item.startDate(), item.endDate()));

            builder.append("\\resumeSubheading{")
                    .append(latex(defaultString(item.institution())))
                    .append("}{")
                    .append(dateRight)
                    .append("}{")
                    .append(degreeLine)
                    .append("}{")
                    .append(rightDetails)
                    .append("}")
                    .append("\n");

            String bullets = renderResumeItems(item.bullets());
            if (!isBlank(bullets)) {
                builder.append(bullets);
            }
        }
        return builder.toString();
    }

    private String renderExperiences(List<ResumeExportRequest.ExperienceItem> items) {
        if (items == null || items.isEmpty()) {
            return "";
        }

        StringBuilder builder = new StringBuilder();
        for (ResumeExportRequest.ExperienceItem item : items) {
            builder.append("\\resumeSubheading{")
                    .append(latex(defaultString(item.employer())))
                    .append("}{")
                    .append(latex(formatDateRange(item.startDate(), item.endDate())))
                    .append("}{")
                    .append(latex(defaultString(item.title())))
                    .append("}{")
                    .append(latex(defaultString(item.location())))
                    .append("}")
                    .append("\n");

            String bullets = renderResumeItems(item.bullets());
            if (!isBlank(bullets)) {
                builder.append(bullets);
            }
        }
        return builder.toString();
    }

    private String renderProjects(List<ResumeExportRequest.ExperienceItem> items) {
        if (items == null || items.isEmpty()) {
            return "";
        }

        StringBuilder builder = new StringBuilder();
        for (ResumeExportRequest.ExperienceItem item : items) {
            builder.append("\\resumeSubheading{")
                    .append(latex(defaultString(item.title())))
                    .append("}{")
                    .append(latex(formatDateRange(item.startDate(), item.endDate())))
                    .append("}{")
                    .append(latex(defaultString(item.employer())))
                    .append("}{")
                    .append(latex(defaultString(item.location())))
                    .append("}")
                    .append("\n");

            String bullets = renderResumeItems(item.bullets());
            if (!isBlank(bullets)) {
                builder.append(bullets);
            }
        }
        return builder.toString();
    }

    private String renderSkills(List<ResumeExportRequest.SkillItem> skills) {
        if (skills == null || skills.isEmpty()) {
            return "";
        }

        List<String> entries = skills.stream()
                .filter(skill -> !isBlank(skill.name()))
                .map(skill -> "\\textbf{" + latex(skill.name()) + "} & " + latex(defaultString(skill.proficiency())))
                .toList();

        if (entries.isEmpty()) {
            return "";
        }

        return renderTwoColumnTable(entries);
    }

    private String renderSimpleList(List<String> items) {
        if (items == null || items.isEmpty()) {
            return "";
        }

        return renderResumeItems(items);
    }

    private String renderLanguages(List<ResumeExportRequest.LanguageItem> items) {
        if (items == null || items.isEmpty()) {
            return "";
        }

        List<String> lines = items.stream()
                .filter(item -> !isBlank(item.language()))
                .map(item -> "\\textbf{" + latex(item.language()) + "} & " + latex(defaultString(item.proficiency())))
                .toList();

        if (lines.isEmpty()) {
            return "";
        }

        return renderTwoColumnTable(lines);
    }

    private String renderResumeItems(List<String> bullets) {
        List<String> cleanedBullets = bullets == null
                ? List.of()
                : bullets.stream().filter(item -> !isBlank(item)).toList();

        if (cleanedBullets.isEmpty()) {
            return "";
        }

        StringBuilder builder = new StringBuilder("\\resumeItemListStart\n");
        for (String bullet : cleanedBullets) {
            builder.append("\\resumeItem{")
                    .append(latex(bullet))
                    .append("}\n");
        }
        builder.append("\\resumeItemListEnd\n");
        return builder.toString();
    }

    private String renderTwoColumnTable(List<String> entries) {
        if (entries.isEmpty()) {
            return "";
        }

        StringBuilder builder = new StringBuilder("\\begin{tabular}{p{0.28\\textwidth} p{0.18\\textwidth} p{0.28\\textwidth} p{0.18\\textwidth}}\n");
        for (int index = 0; index < entries.size(); index += 2) {
            String left = entries.get(index);
            String right = index + 1 < entries.size() ? entries.get(index + 1) : " & ";
            builder.append(left)
                    .append(" & ")
                    .append(right)
                    .append(" \\\\\n");
        }
        builder.append("\\end{tabular}\n");
        return builder.toString();
    }

    private String joinWithDelimiter(String delimiter, String first, String second) {
        List<String> parts = new ArrayList<>();
        if (!isBlank(first)) parts.add(first.trim());
        if (!isBlank(second)) parts.add(second.trim());
        return String.join(delimiter, parts);
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

    private String formatDateRange(String startDate, String endDate) {
        String start = defaultString(startDate);
        String end = isBlank(endDate) ? "Present" : defaultString(endDate);
        if (!isBlank(start) && !isBlank(end)) {
            return start + " - " + end;
        }

        if (!isBlank(start)) {
            return start;
        }

        return end;
    }

    private String joinNonBlank(String first, String second) {
        List<String> parts = new ArrayList<>();
        if (!isBlank(first)) parts.add(first.trim());
        if (!isBlank(second)) parts.add(second.trim());
        return String.join(" | ", parts);
    }

    private String sectionTitle(String customTitle, String fallbackTitle) {
        return isBlank(customTitle) ? fallbackTitle : customTitle.trim();
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
