package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Preference {
    @Id
    private String id;
//    @Field("job_function")
    private List<String> jobFunction;
    private List<String> industries;
//    @Field("employment_type")
//    private List<String> employmentTypes;
//    @Field("experience_level")
//    private List<String> experienceLevels;
//    @Field("job_mode")
//    private List<String> jobModes;
    private List<EmploymentType> employmentType;
    private List<ExperienceLevel> experienceLevel;
    private List<JobMode> jobMode;
    private Integer minSalary;
//    @Field("role_category")
    private List<String> roleCategory;
}
