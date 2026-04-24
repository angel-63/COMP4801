package com.comp4801.jobportal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Skill {
//    @Field("_id")
    @Id
    @Builder.Default
    private String id = new ObjectId().toString();
//    @Field("skill")
    private String skill;
    private String proficiency;
}
