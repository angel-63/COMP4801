package com.comp4801.jobportal.dto;

import com.comp4801.jobportal.model.*;

import java.util.List;

public record UserProfileResponse(
        String id,
        String email,
        String firstName,
        String lastName,
        String fullName,
        String phone,
        String location,
        Integer resumeCount,
        Integer coverLetterCount,
        List<Education> education,
        List<WorkExperience> workExperience,
        List<Project> projects,
        List<Skill> skills,
        List<Language> languages,
        List<Certificate> certificates,
        Preference preferences,
        List<Link> links
) {
    public static UserProfileResponse from(User user) {
        String fullName = String.join(" ",
                user.getFirstName() == null ? "" : user.getFirstName(),
                user.getLastName() == null ? "" : user.getLastName()
        ).trim();

        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                fullName,
                user.getPhone(),
                user.getLocation(),
                user.getResumeCount(),
                user.getCoverLetterCount(),
                user.getEducation(),
                user.getWorkExperience(),
                user.getProjects(),
                user.getSkills(),
                user.getLanguages(),
                user.getCertificates(),
                user.getPreferences(),
                user.getLinks()
        );
    }
}
