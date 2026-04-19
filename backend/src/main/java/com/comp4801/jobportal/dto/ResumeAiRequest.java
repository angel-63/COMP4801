package com.comp4801.jobportal.dto;

import java.util.List;

public record ResumeAiRequest(
        ResumePayload resume,
        TargetJob targetJob,
        String sectionType,
        String currentText,
        String itemTitle,
        String itemSubtitle
) {
    public record ResumePayload(
            String resumeName,
            String profileName,
            String phone,
            String location,
            List<LinkItem> links,
            String summary,
            List<EducationItem> education,
            List<SkillItem> skills,
            List<ContentItem> experiences,
            List<ContentItem> projects,
            List<String> certificates,
            List<LanguageItem> languages
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

    public record EducationItem(
            String institution,
            String degree,
            String startDate,
            String endDate,
            String fieldOfStudy,
            String description
    ) {}

    public record SkillItem(
            String name,
            String proficiency
    ) {}

    public record ContentItem(
            String title,
            String employer,
            String startDate,
            String endDate,
            String location,
            String description
    ) {}

    public record LanguageItem(
            String language,
            String proficiency
    ) {}
}
