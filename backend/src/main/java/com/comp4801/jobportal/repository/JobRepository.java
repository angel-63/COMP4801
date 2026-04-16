package com.comp4801.jobportal.repository;

import com.comp4801.jobportal.model.Job;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class JobRepository{

    private final MongoTemplate mongoTemplate;

    public Page<Job> searchJobsByFilters(String keyword,
                                         List<String> employmentTypes,
                                         List<String> jobModes,
                                         List<String> experienceLevels,
                                         List<String> industries,
                                         String company,
                                         List<String> jobFunctions,
                                         Instant cutOffTime,
                                         Instant now,
                                         Pageable pageable,
                                         String sortBy,
                                         String direction
                                ) {

        Query query = new Query();
        List<Criteria> criteriaList = new ArrayList<>();

        // keyword search (jobTitle, companyName, jobDescription)
        if (keyword != null && !keyword.trim().isEmpty()) {
            Criteria keywordCriteria = new Criteria().orOperator(
                    Criteria.where("jobTitle").regex(keyword, "i"),
                    Criteria.where("companyName").regex(keyword, "i"),
                    Criteria.where("jobDescription").regex(keyword, "i")
            );
            criteriaList.add(keywordCriteria);
        }
        if (employmentTypes != null && !employmentTypes.isEmpty()) {
            criteriaList.add(Criteria.where("employmentType").in(employmentTypes));
        }
        if (jobModes != null && !jobModes.isEmpty()) {
            criteriaList.add(Criteria.where("jobMode").in(jobModes));
        }
        if (experienceLevels != null && !experienceLevels.isEmpty()) {
            criteriaList.add(Criteria.where("experienceLevel").in(experienceLevels));
        }
        if (industries != null && !industries.isEmpty()) {
            criteriaList.add(Criteria.where("companyIndustry").in(industries));
        }
        if (company != null && !company.trim().isEmpty()) {
            criteriaList.add(Criteria.where("companyName").regex(company, "i"));
        }
        if (jobFunctions != null && !jobFunctions.isEmpty()) {
            criteriaList.add(Criteria.where("jobFunction").in(jobFunctions));
        }
        if (now != null) {
            criteriaList.add(Criteria.where("expiresAt").gte(now));
        }
        if (cutOffTime != null) {
            criteriaList.add(Criteria.where("createdAt").lte(cutOffTime));
        }
        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        // sort before pagination
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Sort sort = Sort.by(sortDirection, convertCamelCaseToSnakeCase(sortBy));
        query.with(sort);

        // pagination
        long total = mongoTemplate.count(query, Job.class);

        query.with(pageable);
        List<Job> jobs = mongoTemplate.find(query, Job.class);
        return new PageImpl<>(jobs, pageable, total);
    }

    private String convertCamelCaseToSnakeCase(String camelCase) {
        return camelCase.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }
}

