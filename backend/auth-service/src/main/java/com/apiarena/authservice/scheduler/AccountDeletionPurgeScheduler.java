package com.apiarena.authservice.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.apiarena.authservice.model.services.IUserService;

import lombok.RequiredArgsConstructor;

/** Removes deletion archives past their retention window, freeing the reserved email for good. */
@Component
@RequiredArgsConstructor
public class AccountDeletionPurgeScheduler {

    private static final Logger log = LoggerFactory.getLogger(AccountDeletionPurgeScheduler.class);

    private final IUserService userService;

    @Scheduled(cron = "${app.account-deletion.purge-cron:0 30 3 * * *}", zone = "UTC")
    public void purgeExpired() {
        try {
            int purged = userService.purgeExpiredAccountDeletions();
            if (purged > 0) {
                log.info("Purged {} expired account-deletion archive(s)", purged);
            }
        } catch (Exception e) {
            log.error("Account-deletion purge job failed: {}", e.getMessage(), e);
        }
    }
}
