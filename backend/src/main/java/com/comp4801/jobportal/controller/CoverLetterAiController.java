package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.dto.CoverLetterAiImproveResponse;
import com.comp4801.jobportal.dto.CoverLetterAiRequest;
import com.comp4801.jobportal.dto.CoverLetterAiReviewResponse;
import com.comp4801.jobportal.services.ResumeAiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/cover-letter")
public class CoverLetterAiController {
    private final ResumeAiService resumeAiService;

    public CoverLetterAiController(ResumeAiService resumeAiService) {
        this.resumeAiService = resumeAiService;
    }

    @PostMapping("/review")
    public ResponseEntity<CoverLetterAiReviewResponse> reviewCoverLetter(@RequestBody CoverLetterAiRequest request) {
        return ResponseEntity.ok(resumeAiService.reviewCoverLetter(request));
    }

    @PostMapping("/improve")
    public ResponseEntity<CoverLetterAiImproveResponse> improveCoverLetter(@RequestBody CoverLetterAiRequest request) {
        return ResponseEntity.ok(resumeAiService.improveCoverLetter(request));
    }
}
