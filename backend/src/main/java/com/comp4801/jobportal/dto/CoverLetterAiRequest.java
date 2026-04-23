package com.comp4801.jobportal.dto;

import java.util.List;

public record CoverLetterAiRequest(
        CoverLetterPayload coverLetter,
        TargetJob targetJob,
        String sectionType,
        String currentText,
        String itemTitle,
        String itemSubtitle
) {
    public record CoverLetterPayload(
            String coverLetterName,
            String profileName,
            String phone,
            String location,
            List<LinkItem> links,
            String companyName,
            String hiringManagerName,
            String letterBody
    ) {}

    public record TargetJob(
            String jobId,
            String jobTitle,
            String companyName,
            String employmentType,
            String jobMode,
            String experienceLevel,
            String jobDescription,
            String applicationUrl,
            List<String> skillTags
    ) {}

    public record LinkItem(
            String label,
            String url
    ) {}
}
