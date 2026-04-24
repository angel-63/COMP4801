package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.model.Resume;
import com.comp4801.jobportal.services.ResumeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {
    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @GetMapping
    public ResponseEntity<List<Resume>> listResumes(@RequestParam String userId) {
        return ResponseEntity.ok(resumeService.listResumes(userId));
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResume(@PathVariable String id, @RequestParam String userId) {
        resumeService.deleteResume(id, userId);
        return ResponseEntity.noContent().build();
    }
}
