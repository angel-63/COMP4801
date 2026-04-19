package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {
    @Field("_id")
    private String id;
    @Field("project_name")
    private String name;
    @Field("project_owner")
    private String owner;
    @Field("start_date")
    private Instant startDate;
    @Field("end_date")
    private Instant endDate;
    private String location;
    private String description;
    private List<String> technologies;
}
