package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeContentItem {
    private String title;
    private String employer;
    private String startDate;
    private String endDate;
    private String location;
    private String description;
}
