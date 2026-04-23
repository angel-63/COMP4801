package com.comp4801.jobportal.services;

import com.comp4801.jobportal.dto.ResumeExportRequest;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ResumeExportServiceTest {

    private final ResumeExportService service = new ResumeExportService();

    @Test
    void renderLinksDetokenizesUrlsAndEscapesLabels() throws Exception {
        Method method = ResumeExportService.class.getDeclaredMethod("renderLinks", List.class);
        method.setAccessible(true);

        @SuppressWarnings("unchecked")
        String rendered = (String) method.invoke(
                service,
                List.of(new ResumeExportRequest.LinkItem("Portfolio & Work", "https://example.com/a_b?x=1&y=2#top"))
        );

        assertTrue(rendered.contains("\\href{\\detokenize{https://example.com/a_b?x=1&y=2#top}}"));
        assertTrue(rendered.contains("{Portfolio \\& Work}"));
    }

    @Test
    void latexNormalizesCommonPastedCharacters() throws Exception {
        Method method = ResumeExportService.class.getDeclaredMethod("latex", String.class);
        method.setAccessible(true);

        String rendered = (String) method.invoke(
                service,
                "Led \u2014 team \u2022 shipped \u201Cresume\u201D\u200B"
        );

        assertFalse(rendered.contains("\u2014"));
        assertFalse(rendered.contains("\u2022"));
        assertFalse(rendered.contains("\u200B"));
        assertTrue(rendered.contains("\"resume\""));
    }
}
