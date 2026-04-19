package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Preference {
    @Field("_id")
    private String id;
    @Field("job_function")
    private List<String> jobFunctions;
    private List<String> industries;
    @Field("employment_type")
    private List<String> employmentTypes;
    @Field("experience_level")
    private List<String> experienceLevels;
    @Field("job_mode")
    private List<String> jobModes;
    private Integer minSalary;
    @Field("role_category")
    private List<String> roleCategories;
}
