package com.comp4801.jobportal.repository;

import com.comp4801.jobportal.model.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface JobRepository extends MongoRepository<Job, String> {
    @Query("{ " +
            "$and: [ " +
            "  { $or: [ " +
            "    { 'title': { $regex: ?0, $options: 'i' } }, " +
            "    { 'description': { $regex: ?0, $options: 'i' } } " +
            "  ]}, " +
            "  { 'employmentType': { $in: ?1 } }, " +
            "  { 'jobMode': { $in: ?2 } }, " +
            "  { 'experienceLevel': { $in: ?3 } }, " +
            "  { 'industry': { $in: ?4 } }, " +
            "  { 'company': ?5 }, " +
            "  { 'jobFunction': { $in: ?6 } } " +
            "  { 'expires_at': { $gt: ?7 } }" +
            "] }")

    Page<Job> findByFilters(
            String keyword,
            List<String> employmentTypes,
            List<String> jobModes,
            List<String> experienceLevels,
            List<String> industries,
            String company,
            List<String> jobFunctions,
            Instant now,
            Pageable pageable);
}
