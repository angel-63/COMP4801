package com.comp4801.jobportal.repository;

import com.comp4801.jobportal.model.Resume;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ResumeRepository extends MongoRepository<Resume, String> {
    Optional<Resume> findByIdAndUserId(String id, String userId);
    long countByUserId(String userId);
}
