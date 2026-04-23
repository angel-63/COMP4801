package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "resumes")
public class Resume {

    @Id
    private String id;

    private String userId;
//    @Builder.Default
    private String filename = "My Resume";
    private String profileName;
    private String phone;
    private String location;
//    @Builder.Default
    private List<ResumeLinkItem> links = new ArrayList<>();
    private String summary;
//    @Builder.Default
    private List<ResumeEducationItem> education = new ArrayList<>();
//    @Builder.Default
    private List<ResumeSkillItem> skills = new ArrayList<>();
//    @Builder.Default
    private List<ResumeContentItem> experiences = new ArrayList<>();
//    @Builder.Default
    private List<ResumeContentItem> projects = new ArrayList<>();
//    @Builder.Default
    private List<String> certificates = new ArrayList<>();
//    @Builder.Default
    private List<ResumeLanguageItem> languages = new ArrayList<>();
    private ResumeSectionTitles sectionTitles;
    private ResumeTargetJob targetJob;

    private byte[] file; // optional

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

//    private List<String> education;
//    private List<ResumeExperience> experiences;
//    private List<ResumeProject> projects;
//    private List<String> skills;
//    private List<String> languages;
//    private List<String> certificates;

}