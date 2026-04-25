package com.comp4801.jobportal.services;

import com.comp4801.jobportal.dto.PaginatedRecommendations;
import com.comp4801.jobportal.dto.RecommendationResultResponse;
import com.comp4801.jobportal.model.Job;
import com.comp4801.jobportal.model.User;
import com.comp4801.jobportal.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.RedisSystemException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {
    private static final String REC_CACHE_PREFIX = "rec:";
    @Autowired
    private JobRepository jobRepository;
    @Autowired
    private RecommendationClient recommendationClient;
    @Autowired
    private UserService userService;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public Page<Job> searchJobs(String keyword,
                                List<String> employmentTypes,
                                List<String> jobModes,
                                List<String> experienceLevels,
                                List<String> industries,
                                String company,
                                List<String> jobFunctions,
                                Integer hours,
                                Pageable pageable,
                                String sortBy,
                                String direction) {

        Instant now = Instant.now();
        Instant cutOffTime = (hours != null) ? now.minus(Duration.ofHours(hours)) : null;

        return jobRepository.findJobsByFilters(keyword,
                employmentTypes,
                jobModes,
                experienceLevels,
                industries,
                company,
                jobFunctions,
                cutOffTime,
                now,
                pageable,
                sortBy,
                direction
                );
    }

    public Job getJobDetailsById(String id) {
        return jobRepository.findJobDetailsById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found: " + id));
    }

    public List<Job> getJobsByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        List<Job> jobs = new ArrayList<>();
        for (String id : ids) {
            jobRepository.findJobDetailsById(id).ifPresent(jobs::add);
        }
        return jobs;
    }

    public List<RecommendationResultResponse> recommendJobsForUser(String id, String token) {
        Date expiration = jwtUtil.getTokenExpiryFromToken(token);
        long ttl = (expiration.getTime() - System.currentTimeMillis()) / 1000;
        if (ttl <= 0) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token expired – please log in again");
        }
        String cacheKey = REC_CACHE_PREFIX + id;
        ValueOperations<String, Object> ops = redisTemplate.opsForValue();
        @SuppressWarnings("unchecked")
        List<RecommendationResultResponse> cached = (List<RecommendationResultResponse>) ops.get(cacheKey);
        if (cached != null && !cached.isEmpty()) {
            return cached;
        }
        // cache miss
        return fetchAndCacheRecommendations(id, ttl);
    }

    public PaginatedRecommendations getPaginatedRecommendations(String id, String token, int page, int size) {
        // full list from redis or recommender engine
        List<RecommendationResultResponse> all = recommendJobsForUser(id, token);

        int totalRecords = all.size();
        int totalPages = (int) Math.ceil((double) totalRecords / size);
        
        int adjustedPage = Math.max(0, Math.min(page, totalPages - 1));
        int start = adjustedPage * size;
        int end = Math.min(start + size, totalRecords);

        List<RecommendationResultResponse> content = (start < end) ? all.subList(start, end) : List.of();

        return new PaginatedRecommendations(content, adjustedPage, size, totalRecords, totalPages);
    }

    public List<RecommendationResultResponse> fetchAndCacheRecommendations(String id, long ttl) {
        User profile = userService.getUserById(id);
        List<RecommendationResultResponse> results = recommendationClient.getRecommendations(profile);
        log.info(results.get(0).toString());
        String cacheKey = REC_CACHE_PREFIX + id;
        redisTemplate.opsForValue().set(cacheKey, results, ttl, TimeUnit.SECONDS);
        return results;
    }
}
