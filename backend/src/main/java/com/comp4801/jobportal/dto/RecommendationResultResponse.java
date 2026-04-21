package com.comp4801.jobportal.dto;

public record RecommendationResultResponse(
        String jobId,
        double relevanceScore,
        Double semanticScore,
        double combinedScore
) {
}
