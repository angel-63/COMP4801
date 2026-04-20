package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.dto.MatchResult;
import com.comp4801.jobportal.model.Job;
import com.comp4801.jobportal.services.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {
    @Autowired
    private JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping()
    public ResponseEntity<PagedModel<Job>> searchJobs(
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

        return ResponseEntity.ok(new PagedModel<>(jobs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> getJobById(@PathVariable String id) {
        Job job = jobService.getJobDetailsById(id);
        return ResponseEntity.ok(job);
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<MatchResult>> getRecommendations(@RequestParam String userId) {
        return ResponseEntity.ok(jobService.recommendJobsForUser(userId));
    }
}
