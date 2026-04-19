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
import java.util.regex.Pattern;

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
            criteriaList.add(buildAnyValueCriteria("employmentType", employmentTypes));
        }
        if (jobModes != null && !jobModes.isEmpty()) {
            criteriaList.add(buildAnyValueCriteria("jobMode", jobModes));
        }
        if (experienceLevels != null && !experienceLevels.isEmpty()) {
            criteriaList.add(buildAnyValueCriteria("experienceLevel", experienceLevels));
        }
        if (industries != null && !industries.isEmpty()) {
            criteriaList.add(buildAnyValueCriteria("companyIndustry", industries));
        }
        if (company != null && !company.trim().isEmpty()) {
            criteriaList.add(Criteria.where("companyName").regex(company, "i"));
        }
        if (jobFunctions != null && !jobFunctions.isEmpty()) {
            criteriaList.add(buildAnyValueCriteria("jobFunction", jobFunctions));
        }
        if (now != null) {
            criteriaList.add(Criteria.where("expiresAt").gte(now));
        }
        if (cutOffTime != null) {
            criteriaList.add(Criteria.where("createdAt").gte(cutOffTime));
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

    private Criteria buildAnyValueCriteria(String field, List<String> values) {
        List<Criteria> alternatives = values.stream()
                .filter(value -> value != null && !value.trim().isEmpty())
                .map(value -> Criteria.where(field).regex(Pattern.quote(value.trim()), "i"))
                .toList();

        if (alternatives.isEmpty()) {
            return new Criteria();
        }

        if (alternatives.size() == 1) {
            return alternatives.get(0);
        }

        return new Criteria().orOperator(alternatives.toArray(new Criteria[0]));
    }

    private PageImpl<Job> queryJobs(Query query, Pageable pageable){
        // pagination
        long total = mongoTemplate.count(query, Job.class);

        query.fields().include("companyName")
                .include("companyLogo")
                .include("jobTitle")
                .include("employmentType")
                .include("jobMode")
                .include("experienceLevel")
                .include("companyIndustry")
                .include("jobFunction")
                .include("skillTags")
                .include("minSalary")
                .include("maxSalary")
                .include("postedAt")
                .include("applicationUrl")
                .include("jobDescription")
                .include("originalSourceSite")
                .include("createdAt")
                .include("expiresAt");

        query.with(pageable);
        List<Job> jobs = mongoTemplate.find(query, Job.class);
        return new PageImpl<>(jobs, pageable, total);
    }
}

