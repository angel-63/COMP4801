package com.comp4801.jobportal.services;

import com.comp4801.jobportal.dto.MatchResult;
import com.comp4801.jobportal.model.Job;
import com.comp4801.jobportal.model.User;
import com.comp4801.jobportal.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {
    private final JobRepository jobRepository;
    private final RecommendationClient recommendationClient;
    private final UserService userService;

    public Page<Job> searchJobs(String keyword,
                                List<String> employmentTypes,
                                List<String> jobModes,
                                List<String> experienceLevels,
                                List<String> industries,
                                String company,
                                List<String> jobFunctions,
                                Integer hours,
                                Pageable pageable,
                                String sortBy,
                                String direction) {

        Instant now = Instant.now();
        Instant cutOffTime = (hours != null) ? now.minus(Duration.ofHours(hours)) : null;

        return jobRepository.findJobsByFilters(keyword,
                employmentTypes,
                jobModes,
                experienceLevels,
                industries,
                company,
                jobFunctions,
                cutOffTime,
                now,
                pageable,
                sortBy,
                direction
                );
    }

    public Job getJobDetailsById(String id) {
        return jobRepository.findJobDetailsById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found: " + id));
    }

    public List<Job> getJobsByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        List<Job> jobs = new ArrayList<>();
        for (String id : ids) {
            jobRepository.findJobDetailsById(id).ifPresent(jobs::add);
        }
        return jobs;
    }

    public List<MatchResult> recommendJobsForUser(String userId) {
        User profile = userService.getUserById(userId);
        return recommendationClient.getRecommendations(profile);
    }
}
