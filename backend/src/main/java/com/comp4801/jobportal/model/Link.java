package com.comp4801.jobportal.model;

import org.springframework.data.annotation.Id;

public class Link {
    @Id
    private String id;
    private String site;
    private String url;
}
