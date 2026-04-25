package com.comp4801.jobportal.dto;

public record RecommendationResultResponse(
        PythonJobResponse job,
        double relevanceScore,
        double semanticScore,
        double combinedScore
) {
}
