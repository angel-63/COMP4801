package com.comp4801.jobportal.services;

import com.comp4801.jobportal.model.Job;
import com.comp4801.jobportal.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
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

    public Page<Job> getAllJobs(Pageable pageable) {
        return jobRepository.findAll(pageable);
    }

    public Page<Job> getFilteredJobs(String keyword, List<String> employmentTypes, List<String> jobModes,
                                     List<String> experienceLevels, List<String> industries, String company,
                                    List<String> jobFunctions) {
        Pageable pageable = PageRequest.of(0, 100)
                .withSort(Sort.by(Sort.Direction.DESC, "createdAt"));
        return jobRepository.findByFilters(keyword, employmentTypes, jobModes,
                experienceLevels, industries, company, jobFunctions, Instant.now(), pageable);
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
