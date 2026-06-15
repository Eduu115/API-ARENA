package com.apiarena.authservice.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.apiarena.authservice.model.services.PasswordReminderService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
@Order(10)
public class PasswordReminderScheduler implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(PasswordReminderScheduler.class);

    private final PasswordReminderService passwordReminderService;

    @Override
    public void run(String... args) {
        passwordReminderService.backfillPasswordChangedAt();
    }

    @Scheduled(cron = "${app.password-reminder.cron:0 0 9 * * *}", zone = "UTC")
    public void sendDueReminders() {
        try {
            passwordReminderService.processDueReminders();
        } catch (Exception e) {
            log.error("Password reminder job failed: {}", e.getMessage(), e);
        }
    }
}
