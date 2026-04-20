package com.comp4801.jobportal.services;

import com.comp4801.jobportal.dto.MatchResult;
import com.comp4801.jobportal.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
public class RecommendationClient {

    private final RestTemplate restTemplate;
    private final String recommenderUrl;

    public RecommendationClient(RestTemplate restTemplate,
                                @Value("${recommender.url:http://localhost:8001}") String recommenderUrl) {
        this.restTemplate = restTemplate;
        this.recommenderUrl = recommenderUrl;
    }

    public List<MatchResult> getRecommendations(User user) {
        String url = recommenderUrl + "/match";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<User> requestEntity = new HttpEntity<>(user, headers);

        ResponseEntity<List<MatchResult>> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                requestEntity,
                new ParameterizedTypeReference<>() {}
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            return response.getBody();
        } else {
            throw new RuntimeException("Failed to get recommendations from recommender engine");
        }
    }
}