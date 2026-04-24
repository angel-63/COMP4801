package com.comp4801.jobportal.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;

public record PythonJobResponse(

        @JsonProperty("_id") String id,
        @JsonProperty("job_title") String jobTitle,
        @JsonProperty("company_name") String companyName,
        @JsonProperty("company_logo") String companyLogo,          // base64 string
        @JsonProperty("company_industry") List<String> companyIndustry,
        @JsonProperty("experience_level") String experienceLevel,
        @JsonProperty("job_function") List<String> jobFunction,
        @JsonProperty("employment_type") String employmentType,
        @JsonProperty("job_mode") String jobMode,
        @JsonProperty("job_description") String jobDescription,
        @JsonProperty("min_salary") Integer minSalary,
        @JsonProperty("max_salary") Integer maxSalary,
        @JsonProperty("posted_at") LocalDateTime postedAt,
        @JsonProperty("expires_at") LocalDateTime expiresAt,
        @JsonProperty("created_at") LocalDateTime createdAt,
        @JsonProperty("application_url") String applicationUrl,
        @JsonProperty("original_source_site") String originalSourceSite,
        @JsonProperty("original_post_id") String originalPostId,
        @JsonProperty("skill_tags") List<String> skillTags,
        @JsonProperty("optional_skill_tags") List<String> optionalSkillTags,
        @JsonProperty("role_category") String roleCategory,
        @JsonProperty("dedup_key") String dedupKey
) {}