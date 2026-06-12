package com.apiarena.metricsservice.security;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Component;

/**
 * Lightweight in-process IP rate limiter for public write endpoints (no Redis in metrics-service).
 */
@Component
public class LocalIpRateLimiter {

    private static final long WINDOW_MS = 60_000L;

    private final ConcurrentHashMap<String, WindowCounter> counters = new ConcurrentHashMap<>();

    public boolean tryConsume(String bucket, int limit) {
        if (limit <= 0) {
            return true;
        }
        long now = System.currentTimeMillis();
        WindowCounter counter = counters.compute(bucket, (key, existing) -> {
            if (existing == null || now - existing.windowStartMs >= WINDOW_MS) {
                return new WindowCounter(now, new AtomicInteger(0));
            }
            return existing;
        });
        int used = counter.count.incrementAndGet();
        return used <= limit;
    }

    private record WindowCounter(long windowStartMs, AtomicInteger count) {
    }
}
