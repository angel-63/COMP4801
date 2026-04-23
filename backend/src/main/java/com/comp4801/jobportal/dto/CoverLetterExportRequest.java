package com.comp4801.jobportal.dto;

import java.util.List;

public record CoverLetterExportRequest(
        Meta meta,
        Sender sender,
        Recipient recipient,
        Body body
) {
    public record Meta(
            String coverLetterName,
            String exportFormat
    ) {}

    public record Sender(
            String name,
            String phone,
            String location,
            List<LinkItem> links
    ) {}

    public record Recipient(
            String companyName,
            String hiringManagerName,
            String date
    ) {}

    public record Body(
            String greeting,
            List<String> paragraphs,
            String closing,
            String signature
    ) {}

    public record LinkItem(
            String label,
            String url
    ) {}
}
