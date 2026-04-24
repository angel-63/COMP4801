package com.comp4801.jobportal.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Link {
    @Id
    @Builder.Default
    private String id = (new ObjectId()).toString();
    private String site;
    private String url;
}
