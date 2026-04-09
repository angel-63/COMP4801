package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.model.Job;
import com.comp4801.jobportal.services.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<Page<Job>> getAllJobs(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(jobService.getAllJobs(pageable));
    }
    @GetMapping("/filter")
    public ResponseEntity<Page<Job>> filterJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<String> employmentType,
            @RequestParam(required = false) List<String> jobMode,
            @RequestParam(required = false) List<String> experienceLevel,
            @RequestParam(required = false) List<String> industry,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) List<String> jobFunction
//            @PageableDefault(size = 20) Pageable pageable,
    ) {

        Page<Job> jobs = jobService.getFilteredJobs(keyword, employmentType, jobMode,
                experienceLevel, industry, company, jobFunction);
        return ResponseEntity.ok(jobs);
    }

//    @GetMapping("/recommendations")
//    public List<MatchResult> getRecommendations(@AuthenticationPrincipal String userId) {
//        return jobService.recommendJobsForUser(userId);
//    }
}
