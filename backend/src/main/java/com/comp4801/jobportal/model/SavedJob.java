package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedJob {
    private String id;
    private String title;
    private String companyName;
    private String employmentType;
    private String jobMode;
    private String experienceLevel;
    private String description;
    private List<String> tags;
    private String companyLogoDataUrl;
    private String applicationUrl;
    private String originalSourceSite;
    private String postedAt;
    private String createdAt;
    private String savedAt;
    private String source;
}
