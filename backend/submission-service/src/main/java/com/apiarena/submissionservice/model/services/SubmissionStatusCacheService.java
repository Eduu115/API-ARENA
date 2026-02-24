package com.apiarena.submissionservice.model.services;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import com.apiarena.submissionservice.model.dto.SubmissionStatusCacheDTO;
import com.apiarena.submissionservice.model.entities.Submission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class SubmissionStatusCacheService {

    private static final String KEY_PREFIX = "live:submission:";

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${submission.redis-ttl-seconds:7200}")
    private long ttlSeconds;

    public void cacheStatus(Submission submission) {
        SubmissionStatusCacheDTO dto = SubmissionStatusCacheDTO.fromEntity(submission);
        try {
            String json = objectMapper.writeValueAsString(dto);
            redisTemplate.opsForValue().set(KEY_PREFIX + submission.getId(), json, Duration.ofSeconds(ttlSeconds));
        } catch (JsonProcessingException e) {

        }
    }

    public SubmissionStatusCacheDTO getCachedStatus(Long submissionId) {
        String json = redisTemplate.opsForValue().get(KEY_PREFIX + submissionId);
        if (json == null) return null;
        try {
            return objectMapper.readValue(json, SubmissionStatusCacheDTO.class);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    public void evictStatus(Long submissionId) {
        redisTemplate.delete(KEY_PREFIX + submissionId);
    }
}
