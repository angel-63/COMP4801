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
public class ResumeTargetJob {
    private String jobId;
    private String jobTitle;
    private String companyName;
    private String employmentType;
    private String jobMode;
    private String experienceLevel;
    private String jobDescription;
    private String applicationUrl;
    private List<String> skillTags;
}
