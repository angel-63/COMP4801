package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
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
    @Field("first_name")
    private String firstName;
    @Field("last_name")
    private String lastName;
    private String password;
    private String phone;
    private String location;
    @Field("resume_count")
    private Integer resumeCount;
    @Field("cover_letter_count")
    private Integer coverLetterCount;
    private List<Education> education;
    @Field("work_experience")
    private List<WorkExperience> workExperience;
    @Field("project")
    private List<Project> projects;
    @Field("skill_tags")
    private List<Skill> skills;
    @Field("language")
    private List<Language> languages;
    @Field("certificate")
    private List<Certificate> certificates;
    @Field("preference_tags")
    private Preference preferences;
    private List<Link> links;
    @Field("saved_jobs")
    private List<SavedJob> savedJobs;
}
