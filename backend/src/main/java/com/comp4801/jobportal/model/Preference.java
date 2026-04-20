package com.comp4801.jobportal.model;

import java.util.List;

public class Preference {
    private String id;
    private List<String> jobFunctions;
    private List<String> industries;
    private List<EmploymentType> employmentTypes;
    private List<ExperienceLevel> experienceLevels;
    private List<JobMode> jobModes;
    private Integer minSalary;
}
