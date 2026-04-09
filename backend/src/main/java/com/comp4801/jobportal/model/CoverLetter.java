package com.comp4801.jobportal.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "cover_letters")
public class CoverLetter {

    @Id
    private String id;

    private String userId;
    private String filename;
    private String receiver;
    private String content;

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

}
