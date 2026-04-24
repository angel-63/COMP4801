package com.comp4801.jobportal.dto;

import com.comp4801.jobportal.model.Job;

public record RecommendationResultResponse(
        PythonJobResponse job,
        double relevanceScore,
        double semanticScore,
        double combinedScore
) {
}
