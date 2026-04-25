package com.comp4801.jobportal.dto;

import java.util.List;

public record PaginatedRecommendations(
        List<RecommendationResultResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {}