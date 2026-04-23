package com.comp4801.jobportal.dto;

import com.comp4801.jobportal.model.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class RegistrationRequest {

    @NotBlank
    private String email;

    @NotBlank
    private String password;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank
    private String phone;

    @NotBlank
    private String location;

//    @NotNull
    private List<Link> links;

    @NotNull
    private Preference preferences;

//    @NotNull
    private List<Education> educations;

//    @NotNull
    private List<WorkExperience> experiences;

//    @NotNull
    private List<Project> projects;

//    @NotNull
    private List<String> skills; // convert in UserService to List<Skill> by setting proficiency to null
}