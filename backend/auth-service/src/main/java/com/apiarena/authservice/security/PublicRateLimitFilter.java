package com.apiarena.authservice.security;

import java.io.IOException;
import java.time.Duration;

import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import com.apiarena.authservice.config.RateLimitProperties;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Redis-backed limits on public auth and profile endpoints (keyed by client IP).
 */
@Component
@RequiredArgsConstructor
public class PublicRateLimitFilter extends OncePerRequestFilter {

    private final RateLimitProperties properties;
    private final RedisRateLimiter rateLimiter;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!properties.isEnabled()) {
            return true;
        }
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        return !(path.startsWith("/api/auth/")
                || pathMatcher.match("/api/auth/users/*/profile", path)
                || pathMatcher.match("/api/auth/users/*/achievements", path));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        String ipHash = RateLimitSupport.hashIp(RateLimitSupport.clientIp(request));

        RateLimitRule rule = resolveRule(method, path);
        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String bucket = rule.name + ":ip:" + ipHash;
        RedisRateLimiter.RateLimitDecision decision = rateLimiter.check(bucket, rule.limit, rule.window);
        if (!decision.allowed()) {
            RateLimitSupport.writeTooManyRequests(response, decision);
            return;
        }
        RateLimitSupport.writeRateLimitHeaders(response, decision);
        filterChain.doFilter(request, response);
    }

    private RateLimitRule resolveRule(String method, String path) {
        if (HttpMethod.POST.matches(method) && "/api/auth/login".equals(path)) {
            return new RateLimitRule("login", properties.getLoginPerIpPerMinute(), Duration.ofMinutes(1));
        }
        if (HttpMethod.POST.matches(method) && "/api/auth/register".equals(path)) {
            return new RateLimitRule("register", properties.getRegisterPerIpPerMinute(), Duration.ofMinutes(1));
        }
        if (HttpMethod.POST.matches(method) && "/api/auth/refresh".equals(path)) {
            return new RateLimitRule("refresh", properties.getRefreshPerIpPerMinute(), Duration.ofMinutes(1));
        }
        if (HttpMethod.POST.matches(method) && "/api/auth/forgot-password".equals(path)) {
            return new RateLimitRule("forgot-password", properties.getForgotPasswordPerIpPerMinute(), Duration.ofMinutes(1));
        }
        if (HttpMethod.POST.matches(method) && "/api/auth/resend-verification".equals(path)) {
            return new RateLimitRule("resend-verification", properties.getResendVerificationPerIpPerMinute(),
                    Duration.ofMinutes(1));
        }
        if (HttpMethod.POST.matches(method) && "/api/auth/reset-password".equals(path)) {
            return new RateLimitRule("reset-password", properties.getResetPasswordPerIpPerMinute(), Duration.ofMinutes(1));
        }
        if (HttpMethod.GET.matches(method) && "/api/auth/verify-email".equals(path)) {
            return new RateLimitRule("verify-email", properties.getVerifyEmailPerIpPerMinute(), Duration.ofMinutes(1));
        }
        if (HttpMethod.GET.matches(method) && pathMatcher.match("/api/auth/users/*/profile", path)) {
            return new RateLimitRule("public-profile", properties.getPublicProfilePerIpPerMinute(), Duration.ofMinutes(1));
        }
        if (HttpMethod.GET.matches(method) && pathMatcher.match("/api/auth/users/*/achievements", path)) {
            return new RateLimitRule("public-achievements", properties.getPublicProfilePerIpPerMinute(),
                    Duration.ofMinutes(1));
        }
        if (HttpMethod.GET.matches(method) && pathMatcher.match("/api/auth/users/*/badges", path)) {
            return new RateLimitRule("public-badges", properties.getPublicProfilePerIpPerMinute(),
                    Duration.ofMinutes(1));
        }
        if (HttpMethod.GET.matches(method) && path.startsWith("/api/auth/leaderboard/")) {
            return new RateLimitRule("public-leaderboard", properties.getPublicProfilePerIpPerMinute(),
                    Duration.ofMinutes(1));
        }
        return null;
    }

    private record RateLimitRule(String name, int limit, Duration window) {
    }
}
