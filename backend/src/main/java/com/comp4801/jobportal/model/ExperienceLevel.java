package com.comp4801.jobportal.model;

import lombok.Getter;

@Getter
public enum ExperienceLevel {

    INTERNSHIP("internship"),
    ENTRY("entry level"),
    ASSOCIATE("associate"),
    MID_SENIOR("mid-senior level"),
    DIRECTOR("director"),
    OTHER("other");

    private final String[] values;

    ExperienceLevel(String... values) {
        this.values = values;
    }

}
