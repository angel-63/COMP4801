package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate {
    @Field("_id")
    private String id;
    @Field("certificate_name")
    private String name;
    @Field("issuing_organization")
    private  String issuingOrg;
    @Field("issue_date")
    private  Instant issueDate;
    @Field("expiration_date")
    private  Instant expirationDate;
}
