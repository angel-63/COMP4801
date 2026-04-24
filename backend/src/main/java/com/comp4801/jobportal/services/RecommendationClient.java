package com.comp4801.jobportal.services;

import com.comp4801.jobportal.dto.RecommendationResultResponse;
import com.comp4801.jobportal.model.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
public class RecommendationClient {

    private final RestTemplate restTemplate;
    private final String recommenderUrl;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RecommendationClient(RestTemplate restTemplate,
                                @Value("${recommender.url:http://localhost:8001}") String recommenderUrl) {
        this.restTemplate = restTemplate;
        this.recommenderUrl = recommenderUrl;
    }

    public List<RecommendationResultResponse> getRecommendations(User user) {
        String url = recommenderUrl + "/match";
        Map<String, Object> requestBody = buildRecommendationRequest(user);

        try {
            String json = objectMapper.writeValueAsString(requestBody);
            log.info("Sending request to {} with body: {}", url, json);
        } catch (Exception e) {
            log.error("Failed to serialize recommendation request", e);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<List<RecommendationResultResponse>> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                requestEntity,
                new ParameterizedTypeReference<>() {}
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            log.info("Received {} recommendations", response.getBody().size());
            return response.getBody();
        } else {
            log.error("Recommendation failed. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
            throw new RuntimeException("Failed to get recommendations from recommender engine");
        }
    }

    private Map<String, Object> buildRecommendationRequest(User user) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("_id", user.getId());
        payload.put("email", user.getEmail());
        payload.put("first_name", user.getFirstName());
        payload.put("last_name", user.getLastName());
        payload.put("password", user.getPassword());
        payload.put("phone", user.getPhone());
        payload.put("location", user.getLocation());
        payload.put("resume_count", user.getResumeCount() == null ? 0 : user.getResumeCount());
        payload.put("cover_letter_count", user.getCoverLetterCount() == null ? 0 : user.getCoverLetterCount());
        payload.put("preference_tags", buildPreference(user.getPreferenceTags()));
        payload.put("education", buildEducation(user.getEducation()));
        payload.put("work_experience", buildWorkExperience(user.getWorkExperience()));
        payload.put("project", buildProjects(user.getProject()));
        payload.put("skill_tags", buildSkills(user.getSkillTags()));
        payload.put("language", List.of());          // adjust if needed
        payload.put("certificate", List.of());       // adjust if needed
        payload.put("links", buildLinks(user.getLinks()));
        return payload;
    }

    private Map<String, Object> buildPreference(Preference preference) {
        Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("_id", preference.getId() != null? preference.getId() : null);
            payload.put("job_function", preference.getJobFunction() != null ? preference.getJobFunction() : List.of());
            payload.put("industries", preference.getIndustries() != null ? preference.getIndustries() : List.of());
            // Convert enums to string values if needed, otherwise assume they are strings
            payload.put("employment_type", preference.getEmploymentType() != null ? preference.getEmploymentType() : List.of());
            payload.put("experience_level", preference.getExperienceLevel() != null ? preference.getExperienceLevel() : List.of());
            payload.put("job_mode", preference.getJobMode() != null ? preference.getJobMode() : List.of());
            payload.put("min_salary", preference.getMinSalary() != null ? preference.getMinSalary() : 0);
            payload.put("role_category", preference.getRoleCategory() != null ? preference.getRoleCategory() : List.of());
        return payload;
    }

    private List<Map<String, Object>> buildEducation(List<Education> education) {
        if (education == null) return List.of();
        return education.stream().map(item -> {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("_id", item.getId());
            payload.put("institution", item.getInstitution());
            payload.put("degree", item.getDegree());
            payload.put("field_of_study", item.getFieldOfStudy());
            payload.put("start_date", item.getStartDate());
            payload.put("end_date", item.getEndDate());
            return payload;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildWorkExperience(List<WorkExperience> workExperience) {
        if (workExperience == null) return List.of();
        return workExperience.stream().map(item -> {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("_id", item.getId());
            payload.put("company", item.getCompany());
            payload.put("position", item.getPosition());
            payload.put("start_date", item.getStartDate());
            payload.put("end_date", item.getEndDate());
            payload.put("location", item.getLocation());
            return payload;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildProjects(List<Project> projects) {
        if (projects == null) return List.of();
        return projects.stream().map(item -> {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("_id", item.getId());
            payload.put("project_name", item.getProjectName());
            payload.put("project_owner", item.getProjectOwner());
            payload.put("start_date", item.getStartDate());
            payload.put("end_date", item.getEndDate());
            payload.put("location", item.getLocation());
            return payload;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildSkills(List<Skill> skills) {
        if (skills == null) return List.of();
        return skills.stream().map(item -> {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("_id", item.getId());
            payload.put("skill", item.getSkill());
            payload.put("proficiency", item.getProficiency());
            return payload;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildLinks(List<Link> links) {
        if (links == null) return List.of();
        return links.stream().map(item -> {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("_id", item.getId());
            payload.put("site", item.getSite());
            payload.put("url", item.getUrl());
            return payload;
        }).collect(Collectors.toList());
    }
}