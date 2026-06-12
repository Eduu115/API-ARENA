package com.apiarena.submissionservice.security;

import java.io.IOException;
import java.time.Duration;

import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.apiarena.submissionservice.config.RateLimitProperties;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Burst protection for POST /api/submissions (Redis). Complements anti-farm (daily/cooldown) rules.
 */
@Component
@RequiredArgsConstructor
public class SubmissionRateLimitFilter extends OncePerRequestFilter {

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
        return !(HttpMethod.POST.matches(request.getMethod()) && "/api/submissions".equals(request.getRequestURI()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String ipHash = RateLimitSupport.hashIp(RateLimitSupport.clientIp(request));

        RedisRateLimiter.RateLimitDecision ipDecision = rateLimiter.check(
                "submit:ip:" + ipHash,
                properties.getSubmissionPostPerIpPerMinute(),
                Duration.ofMinutes(1));
        if (!ipDecision.allowed()) {
            RateLimitSupport.writeTooManyRequests(response, ipDecision);
            return;
        }

        if (!RateLimitSupport.isStaff()) {
            Long userId = RateLimitSupport.authenticatedUserId();
            if (userId != null) {
                RedisRateLimiter.RateLimitDecision userDecision = rateLimiter.check(
                        "submit:user:" + userId,
                        properties.getSubmissionPostPerUserPerMinute(),
                        Duration.ofMinutes(1));
                if (!userDecision.allowed()) {
                    RateLimitSupport.writeTooManyRequests(response, userDecision);
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
