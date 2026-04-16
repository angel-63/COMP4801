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
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class JobRepository{

    private final MongoTemplate mongoTemplate;

    // return list of jobs with basic info only
    public Page<Job> findJobsByFilters(String keyword,
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
        Sort sort = Sort.by(getSortDirection(direction), sortBy);
        query.with(sort);

        // pagination
        return queryJobs(query, pageable);
    }

    // for user to get info of list of saved jobs
    public Page<Job> findJobsById(List<String> ids, Pageable pageable,String sortBy, String direction){
        Query query = new Query();

        if (ids != null && !ids.isEmpty()) {
            query.addCriteria(Criteria.where("id").in(ids));
        }

        // sort before pagination
        Sort sort = Sort.by(getSortDirection(direction), sortBy);
        query.with(sort);

        // pagination
        return queryJobs(query, pageable);
    }

    // return full job details e.g., job description
    public Optional<Job> findJobDetailsById(String id) {
        Job job = mongoTemplate.findById(id, Job.class);
        return Optional.ofNullable(job);
    }

    private Sort.Direction getSortDirection(String direction){
        return "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
    }

    private PageImpl<Job> queryJobs(Query query, Pageable pageable){
        // pagination
        long total = mongoTemplate.count(query, Job.class);

        query.fields().include("companyName")
                .include("companyLogo")
                .include("jobTitle")
                .include("employmentType")
                .include("jobMode")
                .include("companyIndustry")
                .include("jobFunction")
                .include("skillTags")
                .include("createdAt")
                .include("expiresAt");

        query.with(pageable);
        List<Job> jobs = mongoTemplate.find(query, Job.class);
        return new PageImpl<>(jobs, pageable, total);
    }
}

