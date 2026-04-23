package com.comp4801.jobportal.dto;

public record RecommendedJobResponse(
        JobResponse job,
        RecommendationResultResponse scores
) {
}
