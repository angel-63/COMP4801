package com.comp4801.jobportal.model;

import lombok.Getter;

@Getter
public enum EmploymentType {

    FULL_TIME("fulltime"),
    PART_TIME("parttime"),
    CONTRACT("contract", "contractor"),
    TEMPORARY("temporary"),
    INTERNSHIP("internship", "summer"),
    OTHER("other");

    private final String[] values;

    EmploymentType(String... values) {
        this.values = values;
    }

}