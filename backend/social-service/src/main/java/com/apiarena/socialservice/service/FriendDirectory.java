package com.apiarena.socialservice.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Friend ids stay in auth-service. This cache is per JVM and expires quickly.
 * ponytail: not shared across replicas and not stampede-safe. Upgrade path is Redis if social-service scales out.
 */
@Service
public class FriendDirectory {

    private static final Logger log = LoggerFactory.getLogger(FriendDirectory.class);

    private final RestTemplate restTemplate;
    private final InternalTokens tokens;
    private final long ttlMs;
    private final String authUrl;
    private final ConcurrentHashMap<Long, CacheItem<List<Long>>> friends = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, CacheItem<String>> names = new ConcurrentHashMap<>();

    public FriendDirectory(
            RestTemplate restTemplate,
            InternalTokens tokens,
            @Value("${services.auth-url:http://localhost:8081}") String authUrl,
            @Value("${app.social.friend-cache-seconds:30}") long ttlSeconds) {
        this.restTemplate = restTemplate;
        this.tokens = tokens;
        this.authUrl = trim(authUrl);
        this.ttlMs = Math.max(5, ttlSeconds) * 1000L;
    }

    public List<Long> friendIds(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return cached(friends, userId, () -> loadFriendIds(userId), ttlMs);
    }

    public Map<Long, String> usernames(Collection<Long> ids) {
        Map<Long, String> out = new HashMap<>();
        List<Long> missing = new ArrayList<>();
        long now = System.currentTimeMillis();
        for (Long id : ids) {
            if (id == null) {
                continue;
            }
            CacheItem<String> hit = names.get(id);
            if (hit != null && hit.expiresAt > now) {
                out.put(id, hit.value);
            } else {
                missing.add(id);
            }
        }
        if (!missing.isEmpty()) {
            for (Map.Entry<Long, String> e : loadNames(missing).entrySet()) {
                names.put(e.getKey(), new CacheItem<>(e.getValue(), now + ttlMs));
                out.put(e.getKey(), e.getValue());
            }
        }
        return out;
    }

    private List<Long> loadFriendIds(Long userId) {
        try {
            Map<String, Object> body = restTemplate.exchange(
                    authUrl + "/internal/users/" + userId + "/friend-ids",
                    HttpMethod.GET,
                    new HttpEntity<>(headers()),
                    new ParameterizedTypeReference<Map<String, Object>>() {}).getBody();
            if (body == null || !(body.get("userIds") instanceof List<?> list)) {
                return List.of();
            }
            List<Long> ids = new ArrayList<>();
            for (Object o : list) {
                if (o instanceof Number n) {
                    ids.add(n.longValue());
                }
            }
            return List.copyOf(ids);
        } catch (Exception e) {
            log.warn("Friend id lookup failed for {}: {}", userId, e.getMessage());
            return List.of();
        }
    }

    private Map<Long, String> loadNames(List<Long> ids) {
        Map<Long, String> out = new HashMap<>();
        try {
            String joined = ids.stream().map(String::valueOf).reduce((a, b) -> a + "," + b).orElse("");
            List<Map<String, Object>> rows = restTemplate.exchange(
                    authUrl + "/internal/users/summaries?ids=" + joined,
                    HttpMethod.GET,
                    new HttpEntity<>(headers()),
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}).getBody();
            if (rows == null) {
                return out;
            }
            for (Map<String, Object> row : rows) {
                Object id = row.get("id");
                Object name = row.get("username");
                if (id instanceof Number n && name != null) {
                    out.put(n.longValue(), String.valueOf(name));
                }
            }
        } catch (Exception e) {
            log.warn("Username lookup failed: {}", e.getMessage());
        }
        return out;
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Token", tokens.headerValue());
        return headers;
    }

    private static <T> T cached(ConcurrentHashMap<Long, CacheItem<T>> map, Long key, Supplier<T> loader, long ttlMs) {
        long now = System.currentTimeMillis();
        CacheItem<T> hit = map.get(key);
        if (hit != null && hit.expiresAt > now) {
            return hit.value;
        }
        T loaded = loader.get();
        map.put(key, new CacheItem<>(loaded, now + ttlMs));
        return loaded;
    }

    private static String trim(String url) {
        if (url == null || url.isBlank()) {
            return "http://localhost:8081";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private record CacheItem<T>(T value, long expiresAt) {
    }
}
