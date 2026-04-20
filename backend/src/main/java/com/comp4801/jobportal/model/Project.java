package com.comp4801.jobportal.model;

import lombok.Data;
import org.springframework.data.annotation.Id;

import java.time.LocalDate;

@Data
public class Project {
    @Id
    private String id;
    private String projectName;
    private String projectOwner;
    private LocalDate startDate;
    private LocalDate endDate;
    private String location;
}
