package com.comp4801.jobportal.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import org.bson.types.Binary;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;

import java.time.LocalDateTime;
import java.util.List;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@Document(collection = "job")
public record Job (
    @Id
//    @JsonProperty("_id")
    String id,
    String jobTitle,
    String companyName,
    Binary companyLogo,
    List<String> companyIndustry,
    String experienceLevel,
    List<String> jobFunction,
    String employmentType,
    String jobMode,
    String jobDescription,
    Integer minSalary,    // optional
    Integer maxSalary,    // optional
    LocalDateTime postedAt,
    LocalDateTime expiresAt,
    @CreatedDate
    LocalDateTime createdAt,   // automatically set to UTC by default, we override via constructor
    String applicationUrl,
    String originalSourceSite,
    String originalPostId,     // optional
    List<String> skillTags,
    List<String> optionalSkillTags,
    String roleCategory,       // optional
    String dedupKey

){}