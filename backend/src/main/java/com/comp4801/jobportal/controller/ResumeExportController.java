package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.dto.ResumeExportRequest;
import com.comp4801.jobportal.services.ResumeExportService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resumes")
public class ResumeExportController {
    private final ResumeExportService resumeExportService;

    public ResumeExportController(ResumeExportService resumeExportService) {
        this.resumeExportService = resumeExportService;
    }

    @PostMapping("/export")
    public ResponseEntity<byte[]> exportResume(@RequestBody ResumeExportRequest request) {
        byte[] pdf = resumeExportService.exportPdf(request);
        String filename = buildFilename(request);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(pdf);
    }

    private String buildFilename(ResumeExportRequest request) {
        String baseName = request != null && request.meta() != null && request.meta().resumeName() != null
                ? request.meta().resumeName().trim()
                : "resume";

        String sanitized = baseName.replaceAll("[\\\\/:*?\"<>|]+", "").trim();
        return (sanitized.isEmpty() ? "resume" : sanitized) + ".pdf";
    }
}
