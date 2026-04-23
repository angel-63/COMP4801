//package com.comp4801.jobportal.services;
//
//import com.comp4801.jobportal.dto.RecommendationResultResponse;
//import com.comp4801.jobportal.model.*;
//import com.fasterxml.jackson.core.type.TypeReference;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.HttpStatus;
//import org.springframework.stereotype.Service;
//import org.springframework.web.server.ResponseStatusException;
//
//import java.io.IOException;
//import java.net.URI;
//import java.net.http.HttpClient;
//import java.net.http.HttpRequest;
//import java.net.http.HttpResponse;
//import java.time.Instant;
//import java.util.LinkedHashMap;
//import java.util.List;
//import java.util.Map;
//
//@Service
//public class RecommendationService {
//    private final UserService userService;
//    private final ObjectMapper objectMapper;
//    private final HttpClient httpClient;
//    private final String recommenderBaseUrl;
//
//    public RecommendationService(
//            UserService userService,
//            ObjectMapper objectMapper,
//            @Value("${RECOMMENDER_URL:http://localhost:8000}") String recommenderBaseUrl
//    ) {
//        this.userService = userService;
//        this.objectMapper = objectMapper;
//        this.httpClient = HttpClient.newHttpClient();
//        this.recommenderBaseUrl = recommenderBaseUrl;
//    }
//
//    public List<RecommendationResultResponse> recommendJobsForUser(String userId, String email) {
//        User user = resolveUser(userId, email);
//        Map<String, Object> requestBody = buildRecommendationRequest(user);
//
//        try {
//            String payload = objectMapper.writeValueAsString(requestBody);
//            HttpRequest request = HttpRequest.newBuilder()
//                    .uri(URI.create(recommenderBaseUrl + "/match"))
//                    .header("Content-Type", "application/json")
//                    .POST(HttpRequest.BodyPublishers.ofString(payload))
//                    .build();
//
//            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
//            if (response.statusCode() < 200 || response.statusCode() >= 300) {
//                throw new ResponseStatusException(
//                        HttpStatus.BAD_GATEWAY,
//                        "Recommendation service returned status " + response.statusCode()
//                );
//            }
//
//            return objectMapper.readValue(
//                    response.body(),
//                    new TypeReference<List<RecommendationResultResponse>>() {}
//            );
//        } catch (IOException | InterruptedException exception) {
//            Thread.currentThread().interrupt();
//            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to load recommendations", exception);
//        }
//    }
//
//    private User resolveUser(String userId, String email) {
//        if (email != null && !email.isBlank()) {
//            return userService.getUserByEmail(email);
//        }
//        if (userId != null && !userId.isBlank()) {
//            return userService.getUserById(userId);
//        }
//        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId or email is required");
//    }
//
//    private Map<String, Object> buildRecommendationRequest(User user) {
//        Map<String, Object> payload = new LinkedHashMap<>();
//        payload.put("_id", user.getId());
//        payload.put("email", defaultString(user.getEmail()));
//        payload.put("first_name", defaultString(user.getFirstName()));
//        payload.put("last_name", defaultString(user.getLastName()));
//        payload.put("password", defaultString(user.getPassword()));
//        payload.put("phone", defaultString(user.getPhone()));
//        payload.put("location", defaultString(user.getLocation()));
//        payload.put("resume_count", user.getResumeCount() == null ? 0 : user.getResumeCount());
//        payload.put("cover_letter_count", user.getCoverLetterCount() == null ? 0 : user.getCoverLetterCount());
//        payload.put("preference_tags", buildPreference(user.getPreferences()));
//        payload.put("education", buildEducation(user.getEducation()));
//        payload.put("work_experience", buildWorkExperience(user.getWorkExperience()));
//        payload.put("project", buildProjects(user.getProjects()));
//        payload.put("skill_tags", buildSkills(user.getSkills()));
//        payload.put("language", List.of());
//        payload.put("certificate", List.of());
//        payload.put("links", buildLinks(user.getLinks()));
//        return payload;
//    }
//
//    private Map<String, Object> buildPreference(Preference preference) {
//        Map<String, Object> payload = new LinkedHashMap<>();
//        payload.put("_id", preference != null ? preference.getId() : null);
//        payload.put("job_function", preference != null && preference.getJobFunctions() != null ? preference.getJobFunctions() : List.of());
//        payload.put("industries", preference != null && preference.getIndustries() != null ? preference.getIndustries() : List.of());
//        payload.put("employment_type", normalizeEmploymentTypes(preference != null ? preference.getEmploymentTypes() : List.of()));
//        payload.put("experience_level", normalizeExperienceLevels(preference != null ? preference.getExperienceLevels() : List.of()));
//        payload.put("job_mode", normalizeJobModes(preference != null ? preference.getJobModes() : List.of()));
//        payload.put("min_salary", preference != null && preference.getMinSalary() != null ? preference.getMinSalary() : 0);
//        payload.put("role_category", preference != null && preference.getRoleCategories() != null ? preference.getRoleCategories() : List.of());
//        return payload;
//    }
//
//    private List<Map<String, Object>> buildEducation(List<Education> education) {
//        if (education == null) return List.of();
//        return education.stream().map(item -> {
//            Map<String, Object> payload = new LinkedHashMap<>();
//            payload.put("_id", item.getId());
//            payload.put("institution", defaultString(item.getInstitution()));
//            payload.put("degree", defaultString(item.getDegree()));
//            payload.put("field_of_study", defaultString(item.getFieldOfStudy()));
//            payload.put("start_date", formatInstant(item.getStartDate()));
//            payload.put("end_date", formatInstant(item.getEndDate()));
//            return payload;
//        }).toList();
//    }
//
//    private List<Map<String, Object>> buildWorkExperience(List<WorkExperience> workExperience) {
//        if (workExperience == null) return List.of();
//        return workExperience.stream().map(item -> {
//            Map<String, Object> payload = new LinkedHashMap<>();
//            payload.put("_id", item.getId());
//            payload.put("company", defaultString(item.getCompany()));
//            payload.put("position", defaultString(item.getPosition()));
//            payload.put("start_date", formatInstant(item.getStartDate()));
//            payload.put("end_date", formatInstant(item.getEndDate()));
//            payload.put("location", defaultString(item.getLocation()));
//            return payload;
//        }).toList();
//    }
//
//    private List<Map<String, Object>> buildProjects(List<Project> projects) {
//        if (projects == null) return List.of();
//        return projects.stream().map(item -> {
//            Map<String, Object> payload = new LinkedHashMap<>();
//            payload.put("_id", item.getId());
//            payload.put("project_name", defaultString(item.getName()));
//            payload.put("project_owner", defaultString(item.getOwner()));
//            payload.put("start_date", formatInstant(item.getStartDate()));
//            payload.put("end_date", formatInstant(item.getEndDate()));
//            payload.put("location", defaultString(item.getLocation()));
//            return payload;
//        }).toList();
//    }
//
//    private List<Map<String, Object>> buildSkills(List<Skill> skills) {
//        if (skills == null) return List.of();
//        return skills.stream().map(item -> {
//            Map<String, Object> payload = new LinkedHashMap<>();
//            payload.put("_id", item.getId());
//            payload.put("skill", defaultString(item.getName()));
//            payload.put("proficiency", defaultString(item.getProficiency()));
//            return payload;
//        }).toList();
//    }
//
//    private List<Map<String, Object>> buildLinks(List<Link> links) {
//        if (links == null) return List.of();
//        return links.stream().map(item -> {
//            Map<String, Object> payload = new LinkedHashMap<>();
//            payload.put("_id", item.getId());
//            payload.put("site", defaultString(item.getSite()));
//            payload.put("url", defaultString(item.getUrl()));
//            return payload;
//        }).toList();
//    }
//
//    private List<String> normalizeEmploymentTypes(List<String> values) {
//        return values == null ? List.of() : values.stream().map(value -> switch (value == null ? "" : value.trim().toLowerCase()) {
//            case "full-time", "full time", "fulltime" -> "fulltime";
//            case "part-time", "part time", "parttime" -> "parttime";
//            case "contract", "contract/temp", "contract temp", "temporary" -> "contract";
//            case "internship" -> "internship";
//            default -> "other";
//        }).toList();
//    }
//
//    private List<String> normalizeExperienceLevels(List<String> values) {
//        return values == null ? List.of() : values.stream().map(value -> switch (value == null ? "" : value.trim().toLowerCase()) {
//            case "internship" -> "internship";
//            case "entry", "entry level" -> "entry level";
//            case "associate" -> "associate";
//            case "mid", "mid-senior", "mid senior", "mid-senior level" -> "mid-senior level";
//            case "director" -> "director";
//            default -> "other";
//        }).toList();
//    }
//
//    private List<String> normalizeJobModes(List<String> values) {
//        return values == null ? List.of() : values.stream().map(value -> switch (value == null ? "" : value.trim().toLowerCase()) {
//            case "on-site", "onsite", "on site" -> "on-site";
//            case "remote" -> "remote";
//            case "hybrid" -> "hybrid";
//            default -> value;
//        }).toList();
//    }
//
//    private String formatInstant(Instant value) {
//        return value == null ? null : value.toString();
//    }
//
//    private String defaultString(String value) {
//        return value == null ? "" : value;
//    }
//}
