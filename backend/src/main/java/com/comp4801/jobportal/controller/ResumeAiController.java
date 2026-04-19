package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.dto.ResumeAiImproveResponse;
import com.comp4801.jobportal.dto.ResumeAiRequest;
import com.comp4801.jobportal.dto.ResumeAiReviewResponse;
import com.comp4801.jobportal.services.ResumeAiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/resume")
public class ResumeAiController {
    private final ResumeAiService resumeAiService;

    public ResumeAiController(ResumeAiService resumeAiService) {
        this.resumeAiService = resumeAiService;
    }

    @PostMapping("/review")
    public ResponseEntity<ResumeAiReviewResponse> reviewResume(@RequestBody ResumeAiRequest request) {
        return ResponseEntity.ok(resumeAiService.reviewResume(request));
    }

    @PostMapping("/improve")
    public ResponseEntity<ResumeAiImproveResponse> improveResume(@RequestBody ResumeAiRequest request) {
        return ResponseEntity.ok(resumeAiService.improveResumeSection(request));
    }
}
