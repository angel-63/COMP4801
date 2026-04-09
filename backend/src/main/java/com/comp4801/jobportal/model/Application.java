package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "applications")
public class Application {

    @Id
    private String id;

    private String userId;
    private String jobId;
    private String resumeId;
    private String coverLetterId;

    @CreatedDate
    private Date appliedAt;

    private String status = "applied"; // applied, saved, viewed

}
