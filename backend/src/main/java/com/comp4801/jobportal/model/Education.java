package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Education {
    @Field("_id")
    private String id;
    private String institution;
    private String degree;
    @Field("field_of_study")
    private String fieldOfStudy;
    @Field("start_date")
    private Instant startDate;
    @Field("end_date")
    private Instant endDate;
}
