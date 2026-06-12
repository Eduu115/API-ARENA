package com.apiarena.authservice.security;

import java.io.IOException;
import java.time.Duration;

import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.apiarena.authservice.config.RateLimitProperties;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Redis-backed limits on authenticated write endpoints (keyed by principal email).
 */
@Component
@RequiredArgsConstructor
public class AuthenticatedRateLimitFilter extends OncePerRequestFilter {

    private final RateLimitProperties properties;
    private final RedisRateLimiter rateLimiter;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!properties.isEnabled()) {
            return true;
        }
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }
        String principal = RateLimitSupport.authenticatedPrincipalKey();
        if (principal == null) {
            return true;
        }
        String path = request.getRequestURI();
        return !("/api/friends/request".equals(path) && HttpMethod.POST.matches(request.getMethod()))
                && !("/api/auth/me/usage".equals(path) && HttpMethod.POST.matches(request.getMethod()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String principal = RateLimitSupport.authenticatedPrincipalKey();
        if (principal == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        RateLimitRule rule = null;
        if (HttpMethod.POST.matches(request.getMethod()) && "/api/friends/request".equals(path)) {
            rule = new RateLimitRule("friend-request", properties.getFriendRequestPerUserPerHour(), Duration.ofHours(1));
        } else if (HttpMethod.POST.matches(request.getMethod()) && "/api/auth/me/usage".equals(path)) {
            rule = new RateLimitRule("usage-heartbeat", properties.getUsageHeartbeatPerUserPerMinute(),
                    Duration.ofMinutes(1));
        }

        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String bucket = rule.name + ":user:" + principal;
        RedisRateLimiter.RateLimitDecision decision = rateLimiter.check(bucket, rule.limit, rule.window);
        if (!decision.allowed()) {
            RateLimitSupport.writeTooManyRequests(response, decision);
            return;
        }
        RateLimitSupport.writeRateLimitHeaders(response, decision);
        filterChain.doFilter(request, response);
    }

    private record RateLimitRule(String name, int limit, Duration window) {
    }
}
