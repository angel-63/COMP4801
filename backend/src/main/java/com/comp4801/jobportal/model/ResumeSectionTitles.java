package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeSectionTitles {
    private String personalDetails;
    private String professionalSummary;
    private String educations;
    private String skills;
    private String professionalExperiences;
    private String projectExperiences;
    private String certificates;
    private String languages;
}
