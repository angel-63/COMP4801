package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {
//    @Field("_id")
    @Id
    @Builder.Default
    private String id = (new ObjectId()).toString();
//    @Field("project_name")
    private String projectName;
//    @Field("project_owner")
    private String projectOwner;
//    @Field("start_date")
    private Instant startDate;
//    @Field("end_date")
    private Instant endDate;
    private String location;
    private String description;
    private List<String> technologies;
}
