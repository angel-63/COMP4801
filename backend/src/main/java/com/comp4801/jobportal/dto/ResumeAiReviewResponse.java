package com.comp4801.jobportal.dto;

import java.util.List;

public record ResumeAiReviewResponse(
        String overallAssessment,
        List<String> strengths,
        List<String> improvements,
        List<String> priorityChanges,
        String tailoredSummary
) {
}
