package com.comp4801.jobportal.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum ExperienceLevel {

    INTERNSHIP("internship"),
    ENTRY("entry level"),
    ASSOCIATE("associate"),
    MID_SENIOR("mid-senior level"),
    DIRECTOR("director"),
    OTHER("other");

    private final String value;

    ExperienceLevel(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static ExperienceLevel fromValue(String value) {
        if (value == null) return null;
        for (ExperienceLevel type : ExperienceLevel.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        return OTHER;
    }
}
