package com.comp4801.jobportal.model;

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

}
