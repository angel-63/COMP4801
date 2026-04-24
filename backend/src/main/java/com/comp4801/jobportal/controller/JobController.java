package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.dto.JobResponse;
import com.comp4801.jobportal.dto.RecommendationResultResponse;
import com.comp4801.jobportal.model.Job;
import com.comp4801.jobportal.services.JobService;
//import com.comp4801.jobportal.services.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {
    @Autowired
    private JobService jobService;
//    private final RecommendationService recommendationService;

//    public JobController(JobService jobService, RecommendationService recommendationService) {
//        this.jobService = jobService;
//        this.recommendationService = recommendationService;
//    }

    @GetMapping()
    public ResponseEntity<PagedModel<JobResponse>> searchJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<String> employmentType,
            @RequestParam(required = false) List<String> jobMode,
            @RequestParam(required = false) List<String> experienceLevel,
            @RequestParam(required = false) List<String> industry,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) List<String> jobFunction,
            @RequestParam(required = false) Integer hours,

            @RequestParam(value="page", defaultValue = "0") int page,
            @RequestParam(value="size", defaultValue = "20") int size,
            @RequestParam(value="sortBy", defaultValue = "postedAt") String sortBy,
            @RequestParam(value = "direction", defaultValue = "desc") String direction
    ) {

        Pageable pageable = PageRequest.of(page, size);

        Page<Job> jobs = jobService.searchJobs(
                keyword, employmentType, jobMode, experienceLevel,
                industry, company, jobFunction, hours, pageable,
                sortBy, direction
        );

        Page<JobResponse> jobResponses = jobs.map(JobResponse::from);

        return ResponseEntity.ok(new PagedModel<>(jobResponses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> getJobById(@PathVariable String id) {
        Job job = jobService.getJobDetailsById(id);
        return ResponseEntity.ok(JobResponse.from(job));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<RecommendationResultResponse>> getRecommendations(
            @AuthenticationPrincipal(expression = "username") String id,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        return ResponseEntity.ok(jobService.recommendJobsForUser(id, token));
    }
}
