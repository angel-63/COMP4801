package com.comp4801.jobportal.model;

import lombok.*;
import org.bson.types.Binary;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "job")
public class Job {
    @Id
    private String id;

    private String jobTitle;
    private String companyName;
    private Binary companyLogo;
    private List<String> companyIndustry;
    private String experienceLevel;
    private List<String> jobFunction;
    private String employmentType;
    private String jobMode;
    private String jobDescription;
    private Integer minSalary;    // optional
    private Integer maxSalary;    // optional

    private LocalDateTime postedAt;
    private LocalDateTime expiresAt;

    @CreatedDate
    private LocalDateTime createdAt;   // automatically set to UTC by default; we override via constructor

    private String applicationUrl;
    private String originalSourceSite;
    private String originalPostId;     // optional

    private List<String> skillTags;
    private String roleCategory;       // optional
    private String dedupKey;

}
