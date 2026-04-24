package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkExperience {
//    @Field("_id")
    @Id
    @Builder.Default
    private String id = (new ObjectId()).toString();
    private String company;
    private String position;
//    @Field("start_date")
    private Instant startDate;
//    @Field("end_date")
    private Instant endDate;
    private String location;
}
