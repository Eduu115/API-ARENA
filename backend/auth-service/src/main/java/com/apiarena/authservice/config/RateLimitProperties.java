package com.apiarena.authservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "apiarena.rate-limit")
public class RateLimitProperties {

    /** Master switch for HTTP rate limiting (Redis-backed). */
    private boolean enabled = true;

    private int loginPerIpPerMinute = 8;
    private int registerPerIpPerMinute = 4;
    private int refreshPerIpPerMinute = 15;
    private int forgotPasswordPerIpPerMinute = 3;
    private int resendVerificationPerIpPerMinute = 3;
    private int resetPasswordPerIpPerMinute = 6;
    private int verifyEmailPerIpPerMinute = 24;
    private int publicProfilePerIpPerMinute = 120;

    /** Authenticated endpoints (keyed by user id). */
    private int friendRequestPerUserPerHour = 30;
    private int usageHeartbeatPerUserPerMinute = 60;
}
