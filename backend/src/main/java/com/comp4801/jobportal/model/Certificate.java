package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate {
    @Field("_id")
    @Builder.Default
    private String id = (new ObjectId()).toString();
    @Field("certificate_name")
    private String certificateName;
    @Field("issuing_organization")
    private  String issuingOrganization;
    @Field("issue_date")
    private  Instant issueDate;
    @Field("expiration_date")
    private  Instant expirationDate;
}
