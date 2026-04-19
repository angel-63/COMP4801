package com.comp4801.jobportal.dto;

import java.util.List;

public record ResumeAiImproveResponse(
        String improvedText,
        List<String> notes
) {
}
