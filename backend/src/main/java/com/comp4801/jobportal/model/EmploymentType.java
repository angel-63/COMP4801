package com.comp4801.jobportal.model;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum EmploymentType {

    FULL_TIME("fulltime"),
    PART_TIME("parttime"),
    CONTRACT("contract"),
    TEMPORARY("temporary"),
    INTERNSHIP("internship"),
    OTHER("other");

    private final String value;

    EmploymentType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

}