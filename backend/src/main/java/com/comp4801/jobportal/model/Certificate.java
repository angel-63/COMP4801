package com.comp4801.jobportal.model;

import lombok.Data;

import java.time.LocalDate;

@Data
public class Certificate {
    private String id;
    private String certificateName;
    private  String issuingOrganization;
    private  LocalDate issueDate;
    private  LocalDate expirationDate;
}
