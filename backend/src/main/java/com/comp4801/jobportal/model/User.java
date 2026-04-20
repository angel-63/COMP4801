package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

//@Document(collection = "users")
//public record User (
//    @Id
//    String id,
//    String email,
//    String fullName,
//    String phone,
//    String location,
//    List<Education> education,
//    List<WorkExperience> workExperience,
//    List<Project> projects,
//    List<Skill> skills,
//    List<Language> languages,
//    List<Certificate> certificates,
//    Preference preferences,
//    List<String> savedJobs,
//    List<String> appliedJobs,
//    List<String> dislikedJobs
//){}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String email;
    private String password; // hashed with BCrypt
    private String firstName;
    private String lastName;
    private String phone;
    private String location;
    private List<Education> education;
    private List<Experience> workExperience;
    private List<Project> projects;
    private List<Skill> skills;
    private List<Link> links;
    private List<Language> languages;
    private List<Certificate> certificates;
    private Preference preferences;
    private List<String> savedJobs;
    private List<String> appliedJobs;
    private List<String> dislikedJobs;
    private Integer resumeCount;
    private Integer coverLetterCount;
}

