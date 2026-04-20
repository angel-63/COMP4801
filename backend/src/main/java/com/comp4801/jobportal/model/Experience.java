package com.comp4801.jobportal.model;

import lombok.Data;

import java.time.LocalDate;

@Data
public class Experience {
    private String id;
    private String company;
    private String position;
    private LocalDate startDate;
    private LocalDate endDate;
    private String location;
}
