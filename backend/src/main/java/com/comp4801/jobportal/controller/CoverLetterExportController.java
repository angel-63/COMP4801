package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.dto.CoverLetterExportRequest;
import com.comp4801.jobportal.services.CoverLetterExportService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cover-letters")
public class CoverLetterExportController {
    private final CoverLetterExportService coverLetterExportService;

    public CoverLetterExportController(CoverLetterExportService coverLetterExportService) {
        this.coverLetterExportService = coverLetterExportService;
    }

    @PostMapping("/export")
    public ResponseEntity<byte[]> exportCoverLetter(@RequestBody CoverLetterExportRequest request) {
        byte[] pdf = coverLetterExportService.exportPdf(request);
        String filename = buildFilename(request);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(pdf);
    }

    private String buildFilename(CoverLetterExportRequest request) {
        String baseName = request != null && request.meta() != null && request.meta().coverLetterName() != null
                ? request.meta().coverLetterName().trim()
                : "cover-letter";

        String sanitized = baseName.replaceAll("[\\\\/:*?\"<>|]+", "").trim();
        return (sanitized.isEmpty() ? "cover-letter" : sanitized) + ".pdf";
    }
}
