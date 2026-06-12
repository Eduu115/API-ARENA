package com.apiarena.authservice.security;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RedisRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(RedisRateLimiter.class);
    private static final String KEY_PREFIX = "rl:auth:";

    private final StringRedisTemplate redisTemplate;

    public RedisRateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public RateLimitDecision check(String bucket, int limit, Duration window) {
        if (limit <= 0) {
            return RateLimitDecision.allowed(limit, window);
        }
        try {
            String key = KEY_PREFIX + bucket;
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redisTemplate.expire(key, window);
            }
            if (count == null) {
                return RateLimitDecision.allowed(limit, window);
            }
            long retryAfter = Math.max(1L, redisTemplate.getExpire(key));
            long remaining = Math.max(0L, limit - count);
            if (count > limit) {
                return RateLimitDecision.denied(limit, remaining, retryAfter);
            }
            return RateLimitDecision.allowed(limit, remaining, retryAfter);
        } catch (Exception e) {
            log.warn("Rate limit check skipped (Redis unavailable) for bucket {}: {}", bucket, e.getMessage());
            return RateLimitDecision.allowed(limit, window);
        }
    }

    public record RateLimitDecision(boolean allowed, int limit, long remaining, long retryAfterSeconds) {

        static RateLimitDecision allowed(int limit, Duration window) {
            return new RateLimitDecision(true, limit, limit, window.toSeconds());
        }

        static RateLimitDecision allowed(int limit, long remaining, long retryAfterSeconds) {
            return new RateLimitDecision(true, limit, remaining, retryAfterSeconds);
        }

        static RateLimitDecision denied(int limit, long remaining, long retryAfterSeconds) {
            return new RateLimitDecision(false, limit, remaining, retryAfterSeconds);
        }
    }
}
