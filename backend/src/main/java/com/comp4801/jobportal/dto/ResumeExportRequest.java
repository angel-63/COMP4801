package com.comp4801.jobportal.dto;

import java.util.List;

public record ResumeExportRequest(
        Meta meta,
        Personal personal,
        List<EducationItem> education,
        List<SkillItem> skills,
        List<ExperienceItem> experiences,
        List<ExperienceItem> projects,
        List<String> certificates,
        List<LanguageItem> languages,
        SectionTitles sectionTitles
) {
    public record Meta(
            String resumeName,
            String exportFormat
    ) {}

    public record Personal(
            String name,
            String phone,
            String location,
            List<LinkItem> links,
            String summary
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
            List<String> bullets
    ) {}

    public record SkillItem(
            String name,
            String proficiency
    ) {}

    public record ExperienceItem(
            String title,
            String employer,
            String startDate,
            String endDate,
            String location,
            List<String> bullets
    ) {}

    public record LanguageItem(
            String language,
            String proficiency
    ) {}

    public record SectionTitles(
            String personalDetails,
            String professionalSummary,
            String educations,
            String skills,
            String professionalExperiences,
            String projectExperiences,
            String certificates,
            String languages
    ) {}
}
