package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeEducationItem {
    private String institution;
    private String degree;
    private String startDate;
    private String endDate;
    private String fieldOfStudy;
    private String description;
}
