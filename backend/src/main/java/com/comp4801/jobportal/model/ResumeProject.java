package com.comp4801.jobportal.model;

import lombok.Data;

@Data
public class ResumeProject {
    private String projectId; // reference to Project document
    private String description;
}
