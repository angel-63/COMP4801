package com.comp4801.jobportal.model;

import lombok.*;
import org.bson.types.Binary;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "job")
public record Job (
    @Id
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
    String roleCategory,       // optional
    String dedupKey

){}

//@Data
//@NoArgsConstructor
//@AllArgsConstructor
//@Builder
//@Document(collection = "job")
//public class Job {
//    @Id
//    private String id;
//
//    private String jobTitle;
//    private String companyName;
//    private Binary companyLogo;
//    private List<String> companyIndustry;
//    private String experienceLevel;
//    private List<String> jobFunction;
//    private String employmentType;
//    private String jobMode;
//    private String jobDescription;
//    private Integer minSalary;    // optional
//    private Integer maxSalary;    // optional
//
//    private LocalDateTime postedAt;
//    private LocalDateTime expiresAt;
//
//    @CreatedDate
//    private LocalDateTime createdAt;   // automatically set to UTC by default; we override via constructor
//
//    private String applicationUrl;
//    private String originalSourceSite;
//    private String originalPostId;     // optional
//
//    private List<String> skillTags;
//    private String roleCategory;       // optional
//    private String dedupKey;
//
//}
