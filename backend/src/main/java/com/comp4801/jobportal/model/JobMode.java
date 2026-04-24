package com.comp4801.jobportal.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum JobMode {

    ONSITE("on-site"),
    REMOTE("remote"),
    HYBRID("hybrid");

    private final String value;

    JobMode(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static JobMode fromValue(String value) {
        if (value == null) return null;
        for (JobMode type : JobMode.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        return ONSITE;
    }
}
