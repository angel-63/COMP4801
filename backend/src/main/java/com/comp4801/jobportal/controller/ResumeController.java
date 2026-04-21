package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.model.Resume;
import com.comp4801.jobportal.services.ResumeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {
    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resume> getResume(@PathVariable String id, @RequestParam String userId) {
        return ResponseEntity.ok(resumeService.getResume(id, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Resume> saveResume(
            @PathVariable String id,
            @RequestParam String userId,
            @RequestBody Resume resume
    ) {
        return ResponseEntity.ok(resumeService.saveResume(id, userId, resume));
    }
}
