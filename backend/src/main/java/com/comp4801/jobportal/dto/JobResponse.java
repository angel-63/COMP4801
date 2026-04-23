package com.comp4801.jobportal.dto;

import com.comp4801.jobportal.model.Job;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

public record JobResponse(
        String id,
        String jobTitle,
        String companyName,
        String companyLogoDataUrl,
        List<String> companyIndustry,
        String experienceLevel,
        List<String> jobFunction,
        String employmentType,
        String jobMode,
        String jobDescription,
        Integer minSalary,
        Integer maxSalary,
        LocalDateTime postedAt,
        LocalDateTime expiresAt,
        LocalDateTime createdAt,
        String applicationUrl,
        String originalSourceSite,
        String originalPostId,
        List<String> skillTags,
        String roleCategory,
        String dedupKey
) {
    public static JobResponse from(Job job) {
        return new JobResponse(
                job.id(),
                job.jobTitle(),
                job.companyName(),
                toDataUrl(job),
                job.companyIndustry(),
                job.experienceLevel(),
                job.jobFunction(),
                job.employmentType(),
                job.jobMode(),
                job.jobDescription(),
                job.minSalary(),
                job.maxSalary(),
                job.postedAt(),
                job.expiresAt(),
                job.createdAt(),
                job.applicationUrl(),
                job.originalSourceSite(),
                job.originalPostId(),
                job.skillTags(),
                job.roleCategory(),
                job.dedupKey()
        );
    }

    private static String toDataUrl(Job job) {
        if (job.companyLogo() == null || job.companyLogo().getData() == null || job.companyLogo().getData().length == 0) {
            return null;
        }

        String base64 = Base64.getEncoder().encodeToString(job.companyLogo().getData());
        return "data:image/png;base64," + base64;
    }
}
