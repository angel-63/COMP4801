package com.comp4801.jobportal.dto;

import com.comp4801.jobportal.model.*;

import java.util.List;

public record UserUpdateRequest(
        String id,
        String email,
        String firstName,
        String lastName,
        String phone,
        String location,
        List<Education> education,
        List<WorkExperience> workExperience,
        List<Project> projects,
        List<Skill> skills,
        List<Link> links,
        Preference preferences,
        List<SavedJob> savedJobs,
        List<String> appliedJobs,
        List<String> dislikedJobs
) {
    public User toUser() {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhone(phone);
        user.setLocation(location);
        user.setEducation(education);
        user.setWorkExperience(workExperience);
        user.setProject(projects);
        user.setSkillTags(skills);
        user.setLinks(links);
        user.setPreferenceTags(preferences);
        user.setSavedJobs(savedJobs);
        user.setAppliedJobs(appliedJobs);
        user.setDislikedJobs(dislikedJobs);
        return user;
    }
}
