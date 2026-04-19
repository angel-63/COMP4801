package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.dto.JobResponse;
import com.comp4801.jobportal.dto.RecommendationResultResponse;
import com.comp4801.jobportal.dto.RecommendedJobResponse;
import com.comp4801.jobportal.model.Job;
import com.comp4801.jobportal.services.JobService;
import com.comp4801.jobportal.services.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/jobs")
public class JobController {
    @Autowired
    private JobService jobService;
    private final RecommendationService recommendationService;

    public JobController(JobService jobService, RecommendationService recommendationService) {
        this.jobService = jobService;
        this.recommendationService = recommendationService;
    }

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
    public ResponseEntity<List<RecommendedJobResponse>> getRecommendations(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int fromIndex = safePage * safeSize;

        List<RecommendationResultResponse> rankedResults = recommendationService.recommendJobsForUser(userId, email)
                .stream()
                .sorted((left, right) -> Double.compare(right.combinedScore(), left.combinedScore()))
                .toList();

        if (fromIndex >= rankedResults.size()) {
            return ResponseEntity.ok(List.of());
        }

        int toIndex = Math.min(fromIndex + safeSize, rankedResults.size());
        List<RecommendationResultResponse> results = rankedResults.subList(fromIndex, toIndex);

        Map<String, Job> jobsById = jobService.getJobsByIds(results.stream().map(RecommendationResultResponse::jobId).toList())
                .stream()
                .collect(Collectors.toMap(Job::id, Function.identity()));

        List<RecommendedJobResponse> response = results.stream()
                .map(result -> jobsById.containsKey(result.jobId())
                        ? new RecommendedJobResponse(JobResponse.from(jobsById.get(result.jobId())), result)
                        : null)
                .filter(item -> item != null)
                .toList();

        return ResponseEntity.ok(response);
    }
}
