package com.apiarena.authservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "app.password-reminder")
public class PasswordReminderProperties {

    /** Master switch for the scheduled password rotation reminder emails. */
    private boolean enabled = true;

    /** Days between password change (or last reminder) and the next reminder email. */
    private int intervalDays = 60;

    /** Cron expression (UTC) for the reminder job. Default: daily at 09:00 UTC. */
    private String cron = "0 0 9 * * *";
}
