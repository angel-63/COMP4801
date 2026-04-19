package com.comp4801.jobportal.services;

import com.comp4801.jobportal.model.Job;
import com.comp4801.jobportal.repository.JobRepository;
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
public class JobService {
    @Autowired
    private final JobRepository jobRepository;

    public JobService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }
//    private final RecommendationClient recommendationClient;
//    private final ProfileService profileService; // allowed to read profile data

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

    /*
    public List<MatchResult> recommendJobsForUser(String userId) {
        User profile = profileService.getProfileByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<Job> allJobs = jobRepository.findAll(); // naive; implement pagination if needed
        return recommendationClient.getRecommendations(profile, allJobs);
    }
     */
}
