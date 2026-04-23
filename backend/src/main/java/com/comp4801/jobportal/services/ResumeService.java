package com.comp4801.jobportal.services;

import com.comp4801.jobportal.model.Resume;
import com.comp4801.jobportal.repository.ResumeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Date;

@Service
public class ResumeService {
    private final ResumeRepository resumeRepository;

    public ResumeService(ResumeRepository resumeRepository) {
        this.resumeRepository = resumeRepository;
    }

    public Resume getResume(String resumeId, String userId) {
        return resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume not found: " + resumeId));
    }

    public Resume saveResume(String resumeId, String userId, Resume resume) {
        Resume existing = resumeRepository.findByIdAndUserId(resumeId, userId).orElse(null);

        resume.setId(resumeId);
        resume.setUserId(userId);
        resume.setCreatedAt(existing != null ? existing.getCreatedAt() : new Date());
        resume.setUpdatedAt(new Date());

        if (resume.getFilename() == null || resume.getFilename().trim().isEmpty()) {
            resume.setFilename("My Resume");
        }

        return resumeRepository.save(resume);
    }
}
