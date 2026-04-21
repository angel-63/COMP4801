package com.comp4801.jobportal.services;

import com.comp4801.jobportal.dto.CoverLetterAiImproveResponse;
import com.comp4801.jobportal.dto.CoverLetterAiRequest;
import com.comp4801.jobportal.dto.CoverLetterAiReviewResponse;
import com.comp4801.jobportal.dto.ResumeAiImproveResponse;
import com.comp4801.jobportal.dto.ResumeAiRequest;
import com.comp4801.jobportal.dto.ResumeAiReviewResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ResumeAiService {
    private static final String DEFAULT_AI_API_BASE_URL = "https://api.openai.com/v1";
    private static final String CHAT_COMPLETIONS_PATH = "/chat/completions";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final Map<String, String> dotEnvValues;

    public ResumeAiService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(20))
                .build();
        this.dotEnvValues = loadDotEnvValues();
    }

    public ResumeAiReviewResponse reviewResume(ResumeAiRequest request) {
        validateRequest(request);

        String responseText = callOpenAi(buildReviewSystemPrompt(), buildReviewUserPrompt(request));

        try {
            return objectMapper.readValue(responseText, ResumeAiReviewResponse.class);
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "AI returned an unreadable review response.",
                    e
            );
        }
    }

    public ResumeAiImproveResponse improveResumeSection(ResumeAiRequest request) {
        validateRequest(request);

        String responseText = callOpenAi(buildImproveSystemPrompt(), buildImproveUserPrompt(request));

        try {
            return objectMapper.readValue(responseText, ResumeAiImproveResponse.class);
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "AI returned an unreadable improvement response.",
                    e
            );
        }
    }

    public CoverLetterAiReviewResponse reviewCoverLetter(CoverLetterAiRequest request) {
        validateCoverLetterRequest(request);

        String responseText = callOpenAi(buildCoverLetterReviewSystemPrompt(), buildCoverLetterReviewUserPrompt(request));

        try {
            return objectMapper.readValue(responseText, CoverLetterAiReviewResponse.class);
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "AI returned an unreadable cover letter review response.",
                    e
            );
        }
    }

    public CoverLetterAiImproveResponse improveCoverLetter(CoverLetterAiRequest request) {
        validateCoverLetterRequest(request);

        String responseText = callOpenAi(buildCoverLetterImproveSystemPrompt(), buildCoverLetterImproveUserPrompt(request));

        try {
            return objectMapper.readValue(responseText, CoverLetterAiImproveResponse.class);
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "AI returned an unreadable cover letter improvement response.",
                    e
            );
        }
    }

    private void validateRequest(ResumeAiRequest request) {
        if (request == null || request.resume() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume content is required.");
        }

        if (request.targetJob() == null || isBlank(request.targetJob().jobTitle()) || isBlank(request.targetJob().companyName())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A target job is required. Create the resume from a specific job or match first."
            );
        }
    }

    private void validateCoverLetterRequest(CoverLetterAiRequest request) {
        if (request == null || request.coverLetter() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cover letter content is required.");
        }

        if (request.targetJob() == null || isBlank(request.targetJob().jobTitle()) || isBlank(request.targetJob().companyName())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A target job is required. Create the cover letter from a specific job or match first."
            );
        }
    }

    private String callOpenAi(String systemPrompt, String userPrompt) {
        String apiKey = firstConfiguredValue("AI_API_KEY", "POE_API_KEY", "OPENAI_API_KEY");
        String model = firstConfiguredValue("AI_MODEL", "POE_MODEL", "OPENAI_MODEL");
        String requestUrl = firstConfiguredValue(
                "AI_CHAT_COMPLETIONS_URL",
                "POE_CHAT_COMPLETIONS_URL",
                "OPENAI_CHAT_COMPLETIONS_URL"
        );

        if (isBlank(apiKey)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "No AI API key is configured on the backend. Set AI_API_KEY, POE_API_KEY, or OPENAI_API_KEY."
            );
        }

        if (isBlank(model)) {
            model = "gpt-4.1-mini";
        }

        if (isBlank(requestUrl)) {
            String baseUrl = firstConfiguredValue("AI_API_BASE_URL", "POE_API_BASE_URL", "OPENAI_API_BASE_URL");
            requestUrl = joinUrl(isBlank(baseUrl) ? DEFAULT_AI_API_BASE_URL : baseUrl, CHAT_COMPLETIONS_PATH);
        }

        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "model", model,
                    "temperature", 0.4,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userPrompt)
                    ),
                    "response_format", Map.of(
                            "type", "json_object"
                    )
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(requestUrl))
                    .timeout(Duration.ofSeconds(90))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                if (response.statusCode() == 401) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_GATEWAY,
                            buildUnauthorizedMessage(requestUrl, response.body())
                    );
                }

                if (response.statusCode() == 429) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_GATEWAY,
                            "The AI provider is temporarily busy for the selected model. Please try again in a moment or switch to another model."
                    );
                }

                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "AI request failed: " + summarize(response.body())
                );
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
            if (contentNode.isMissingNode() || contentNode.asText().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI provider returned an empty response.");
            }

            return contentNode.asText();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to communicate with the AI provider.", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI request was interrupted.", e);
        }
    }

    private String firstConfiguredValue(String... keys) {
        for (String key : keys) {
            String value = System.getenv(key);
            if (!isBlank(value)) {
                return value;
            }

            value = System.getProperty(key);
            if (!isBlank(value)) {
                return value;
            }

            value = dotEnvValues.get(key);
            if (!isBlank(value)) {
                return value;
            }
        }

        return null;
    }

    private Map<String, String> loadDotEnvValues() {
        List<Path> candidatePaths = List.of(
                Path.of(".env"),
                Path.of("backend", ".env")
        );

        for (Path path : candidatePaths) {
            if (!Files.exists(path)) {
                continue;
            }

            try {
                Map<String, String> values = new java.util.HashMap<>();
                for (String rawLine : Files.readAllLines(path)) {
                    String line = rawLine.trim();
                    if (line.isEmpty() || line.startsWith("#")) {
                        continue;
                    }

                    if (line.startsWith("export ")) {
                        line = line.substring(7).trim();
                    }

                    int separatorIndex = line.indexOf('=');
                    if (separatorIndex <= 0) {
                        continue;
                    }

                    String key = line.substring(0, separatorIndex).trim();
                    String value = line.substring(separatorIndex + 1).trim();
                    if (value.length() >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
                        value = value.substring(1, value.length() - 1);
                    }

                    values.put(key, value);
                }
                return values;
            } catch (IOException ignored) {
                return Map.of();
            }
        }

        return Map.of();
    }

    private String joinUrl(String baseUrl, String path) {
        String sanitizedBase = baseUrl == null ? "" : baseUrl.trim();
        String normalizedPath = path == null ? "" : path.trim();

        if (sanitizedBase.endsWith(normalizedPath)) {
            return sanitizedBase;
        }

        if (sanitizedBase.endsWith("/")) {
            sanitizedBase = sanitizedBase.substring(0, sanitizedBase.length() - 1);
        }

        return sanitizedBase + normalizedPath;
    }

    private String buildUnauthorizedMessage(String requestUrl, String responseBody) {
        String host = "the configured AI provider";

        try {
            host = URI.create(requestUrl).getHost();
        } catch (Exception ignored) {
            // Keep the generic host label when the URL is malformed or missing.
        }

        return "AI authentication failed for %s. Check that the API key matches the provider endpoint and model configuration. Provider response: %s"
                .formatted(host, summarize(responseBody));
    }

    private String buildReviewSystemPrompt() {
        return """
                You are an expert resume reviewer. Review the resume against the target job posting.
                Return strict JSON with keys:
                overallAssessment: string
                strengths: string[]
                improvements: string[]
                priorityChanges: string[]
                tailoredSummary: string
                Keep feedback concise, specific, and actionable.
                Do not invent experience or claims not present in the resume.
                """;
    }

    private String buildImproveSystemPrompt() {
        return """
                You are an expert resume writing assistant.
                Improve the user's current resume text so it is clearer, stronger, and better aligned to the target job.
                If the current text is blank, generate a strong first draft for that section instead.
                Return strict JSON with keys:
                improvedText: string
                notes: string[]
                Keep the user's facts truthful. Do not fabricate achievements, tools, titles, or metrics.
                Prefer concise, resume-style writing.
                For sectionType "experience" and "project":
                - Write the improvedText in point form using short resume bullet lines separated by newlines.
                - Do not repeat the role title, project name, employer, or company name inside the bullet text.
                - Focus each bullet on actions, outcomes, responsibilities, tools, and impact only.
                - Do not add bullet symbols; return plain lines so the UI can format them.
                """;
    }

    private String buildReviewUserPrompt(ResumeAiRequest request) {
        return """
                Target job:
                %s

                Resume:
                %s
                """.formatted(renderTargetJob(request.targetJob()), renderResume(request.resume()));
    }

    private String buildImproveUserPrompt(ResumeAiRequest request) {
        return """
                Target job:
                %s

                Resume context:
                %s

                Section type: %s
                Item title: %s
                Item subtitle: %s
                Current text is blank: %s
                Current text:
                %s
                """.formatted(
                renderTargetJob(request.targetJob()),
                renderResume(request.resume()),
                defaultString(request.sectionType()),
                defaultString(request.itemTitle()),
                defaultString(request.itemSubtitle()),
                Boolean.toString(isBlank(request.currentText())),
                defaultString(request.currentText())
        );
    }

    private String buildCoverLetterReviewSystemPrompt() {
        return """
                You are an expert cover letter reviewer. Review the cover letter against the target job posting.
                Return strict JSON with keys:
                overallAssessment: string
                strengths: string[]
                improvements: string[]
                priorityChanges: string[]
                suggestedLetterBody: string
                Keep feedback concise, specific, and actionable.
                Do not invent experience or claims not present in the cover letter context.
                suggestedLetterBody must contain only the body paragraphs of the cover letter.
                Do not include greeting lines such as "Dear Hiring Manager".
                Do not include closing lines such as "Sincerely" or the sender's name.
                """;
    }

    private String buildCoverLetterImproveSystemPrompt() {
        return """
                You are an expert cover letter writing assistant.
                Improve the user's current cover letter text so it is clearer, stronger, and better aligned to the target job.
                If the current text is blank, generate a strong first draft for that section instead.
                Return strict JSON with keys:
                improvedText: string
                notes: string[]
                Keep the user's facts truthful. Do not fabricate achievements, tools, titles, or metrics.
                Prefer polished, professional paragraph writing for cover letters.
                improvedText must contain only the body paragraphs for the cover letter template.
                Do not include greeting lines such as "Dear Hiring Manager".
                Do not include closing lines such as "Sincerely" or the sender's name.
                """;
    }

    private String buildCoverLetterReviewUserPrompt(CoverLetterAiRequest request) {
        return """
                Target job:
                %s

                Cover letter:
                %s
                """.formatted(renderTargetJob(request.targetJob()), renderCoverLetter(request.coverLetter()));
    }

    private String buildCoverLetterImproveUserPrompt(CoverLetterAiRequest request) {
        return """
                Target job:
                %s

                Cover letter context:
                %s

                Section type: %s
                Item title: %s
                Item subtitle: %s
                Current text is blank: %s
                Current text:
                %s
                """.formatted(
                renderTargetJob(request.targetJob()),
                renderCoverLetter(request.coverLetter()),
                defaultString(request.sectionType()),
                defaultString(request.itemTitle()),
                defaultString(request.itemSubtitle()),
                Boolean.toString(isBlank(request.currentText())),
                defaultString(request.currentText())
        );
    }

    private String renderTargetJob(ResumeAiRequest.TargetJob job) {
        List<String> lines = new ArrayList<>();
        lines.add("Title: " + defaultString(job.jobTitle()));
        lines.add("Company: " + defaultString(job.companyName()));
        lines.add("Employment type: " + defaultString(job.employmentType()));
        lines.add("Job mode: " + defaultString(job.jobMode()));
        lines.add("Experience level: " + defaultString(job.experienceLevel()));
        if (job.skillTags() != null && !job.skillTags().isEmpty()) {
            lines.add("Skills: " + String.join(", ", job.skillTags()));
        }
        lines.add("Description: " + defaultString(job.jobDescription()));
        return String.join("\n", lines);
    }

    private String renderTargetJob(CoverLetterAiRequest.TargetJob job) {
        List<String> lines = new ArrayList<>();
        lines.add("Title: " + defaultString(job.jobTitle()));
        lines.add("Company: " + defaultString(job.companyName()));
        lines.add("Employment type: " + defaultString(job.employmentType()));
        lines.add("Job mode: " + defaultString(job.jobMode()));
        lines.add("Experience level: " + defaultString(job.experienceLevel()));
        if (job.skillTags() != null && !job.skillTags().isEmpty()) {
            lines.add("Skills: " + String.join(", ", job.skillTags()));
        }
        lines.add("Description: " + defaultString(job.jobDescription()));
        return String.join("\n", lines);
    }

    private String renderResume(ResumeAiRequest.ResumePayload resume) {
        StringBuilder builder = new StringBuilder();
        builder.append("Name: ").append(defaultString(resume.profileName())).append("\n");
        builder.append("Summary: ").append(defaultString(resume.summary())).append("\n");

        if (resume.skills() != null && !resume.skills().isEmpty()) {
            builder.append("Skills: ");
            builder.append(resume.skills().stream()
                    .map(skill -> defaultString(skill.name()) + " (" + defaultString(skill.proficiency()) + ")")
                    .toList());
            builder.append("\n");
        }

        if (resume.experiences() != null) {
            builder.append("Experiences:\n");
            for (ResumeAiRequest.ContentItem item : resume.experiences()) {
                builder.append("- ")
                        .append(defaultString(item.title()))
                        .append(" @ ")
                        .append(defaultString(item.employer()))
                        .append(": ")
                        .append(defaultString(item.description()))
                        .append("\n");
            }
        }

        if (resume.projects() != null) {
            builder.append("Projects:\n");
            for (ResumeAiRequest.ContentItem item : resume.projects()) {
                builder.append("- ")
                        .append(defaultString(item.title()))
                        .append(": ")
                        .append(defaultString(item.description()))
                        .append("\n");
            }
        }

        if (resume.education() != null) {
            builder.append("Education:\n");
            for (ResumeAiRequest.EducationItem item : resume.education()) {
                builder.append("- ")
                        .append(defaultString(item.degree()))
                        .append(" in ")
                        .append(defaultString(item.fieldOfStudy()))
                        .append(" at ")
                        .append(defaultString(item.institution()))
                        .append(": ")
                        .append(defaultString(item.description()))
                        .append("\n");
            }
        }

        return builder.toString();
    }

    private String renderCoverLetter(CoverLetterAiRequest.CoverLetterPayload coverLetter) {
        StringBuilder builder = new StringBuilder();
        builder.append("Name: ").append(defaultString(coverLetter.profileName())).append("\n");
        builder.append("Company: ").append(defaultString(coverLetter.companyName())).append("\n");
        builder.append("Hiring manager: ").append(defaultString(coverLetter.hiringManagerName())).append("\n");
        builder.append("Body: ").append(defaultString(coverLetter.letterBody())).append("\n");

        if (coverLetter.links() != null && !coverLetter.links().isEmpty()) {
            builder.append("Links: ");
            builder.append(coverLetter.links().stream()
                    .map(link -> defaultString(link.label()) + " (" + defaultString(link.url()) + ")")
                    .toList());
            builder.append("\n");
        }

        return builder.toString();
    }

    private String summarize(String value) {
        String text = defaultString(value).replaceAll("\\s+", " ");
        return text.length() > 300 ? text.substring(0, 300) + "..." : text;
    }

    private String defaultString(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
