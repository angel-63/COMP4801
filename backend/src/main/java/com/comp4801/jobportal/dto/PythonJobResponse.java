package com.comp4801.jobportal.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import java.time.LocalDateTime;
import java.util.List;

public record PythonJobResponse(

        @JsonAlias("_id") String id,
        @JsonAlias("job_title") String jobTitle,
        @JsonAlias("company_name") String companyName,
        @JsonAlias("company_logo") String companyLogo,          // base64 string
        @JsonAlias("company_industry") List<String> companyIndustry,
        @JsonAlias("experience_level") String experienceLevel,
        @JsonAlias("job_function") List<String> jobFunction,
        @JsonAlias("employment_type") String employmentType,
        @JsonAlias("job_mode") String jobMode,
        @JsonAlias("job_description") String jobDescription,
        @JsonAlias("min_salary") Integer minSalary,
        @JsonAlias("max_salary") Integer maxSalary,
        @JsonAlias("posted_at") LocalDateTime postedAt,
        @JsonAlias("expires_at") LocalDateTime expiresAt,
        @JsonAlias("created_at") LocalDateTime createdAt,
        @JsonAlias("application_url") String applicationUrl,
        @JsonAlias("original_source_site") String originalSourceSite,
        @JsonAlias("original_post_id") String originalPostId,
        @JsonAlias("skill_tags") List<String> skillTags,
        @JsonAlias("optional_skill_tags") List<String> optionalSkillTags,
        @JsonAlias("role_category") String roleCategory,
        @JsonAlias("dedup_key") String dedupKey,
        @JsonAlias("location") String location
) {}