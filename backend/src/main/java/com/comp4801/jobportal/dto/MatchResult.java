package com.comp4801.jobportal.dto;

import lombok.Data;

@Data
public class MatchResult {
    private String jobId;
    private double relevanceScore;
    private double semanticScore;
    private double combinedScore;
}
