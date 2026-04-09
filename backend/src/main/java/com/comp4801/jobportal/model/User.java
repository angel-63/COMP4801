package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String email;
    private String fullName;
    private String phone;
    private String location;
    private List<Education> education;
    private List<WorkExperience> workExperience;
    private List<Project> projects;
    private List<Skill> skills;
    private List<Language> languages;
    private List<Certificate> certificates;
    private Preference preferences;
}

