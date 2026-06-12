package com.apiarena.submissionservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "apiarena.rate-limit")
public class RateLimitProperties {

    private boolean enabled = true;

    /** Burst guard on expensive POST /api/submissions (in addition to anti-farm rules). */
    private int submissionPostPerUserPerMinute = 4;
    private int submissionPostPerIpPerMinute = 12;
}
