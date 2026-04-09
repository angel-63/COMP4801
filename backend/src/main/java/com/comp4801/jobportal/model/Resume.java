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
    private String filename = "My Resume";
    private String summary;

    private List<Education> education;
    private List<ResumeExperience> experiences;
    private List<ResumeProject> projects;
    private List<String> skills;
    private List<String> languages;
    private List<String> certificates;

    private byte[] file; // optional

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

}