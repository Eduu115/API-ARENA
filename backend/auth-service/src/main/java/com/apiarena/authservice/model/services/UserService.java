package com.apiarena.authservice.model.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.apiarena.authservice.model.dto.PublicProfileDTO;
import com.apiarena.authservice.model.dto.RewardRequest;
import com.apiarena.authservice.model.dto.UpdateProfileRequest;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class UserService implements IUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailDispatchService emailDispatchService;

    @Autowired
    private IRefreshTokenService refreshTokenService;

    @Autowired
    private SubmissionPurgeDispatchService submissionPurgeDispatchService;

    @Autowired
    private WeeklyStreakService weeklyStreakService;

    @Autowired
    private AchievementService achievementService;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmailIgnoreCase(email.trim())
            .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getPasswordHash())
            .roles(user.getRole().name())
            .build();
    }

    @Override
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return UserDTO.fromEntity(user);
    }

    @Override
    public PublicProfileDTO getPublicProfile(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        var streakState = weeklyStreakService.findState(id).orElse(null);
        return PublicProfileDTO.fromEntity(user, streakState);
    }

    @Override
    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email.trim())
            .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
        return UserDTO.fromEntity(user);
    }

    @Override
    @Transactional
    public UserDTO updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getGithubUsername() != null) {
            user.setGithubUsername(request.getGithubUsername());
        }
        if (request.getNewChallengeEmailAlerts() != null) {
            if (user.getRole() != User.Role.STUDENT) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "New challenge email alerts are only available for student accounts");
            }
            user.setNewChallengeEmailAlerts(request.getNewChallengeEmailAlerts());
        }

        User savedUser = userRepository.save(user);
        achievementService.syncForUserId(userId);
        return UserDTO.fromEntity(savedUser);
    }

    @Override
    @Transactional
    public void updateLastLogin(String email) {
        User user = userRepository.findByEmailIgnoreCase(email.trim())
            .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public User getUserEntityByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email.trim())
            .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
    }

    @Override
    @Transactional
    public void applyReward(Long userId, RewardRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        int xp = request.getXpEarned() != null ? request.getXpEarned() : 0;
        int elo = request.getEloChange() != null ? request.getEloChange() : 0;

        user.setExperiencePoints(user.getExperiencePoints() + xp);
        user.setRating(user.getRating() + elo);

        user.setLevel(calculateLevel(user.getExperiencePoints()));

        if (Boolean.TRUE.equals(request.getIsFirstCompletion())) {
            user.setTotalChallengesCompleted(user.getTotalChallengesCompleted() + 1);
        }

        userRepository.save(user);

        int pipelineScore = request.getPipelineTotalScore() != null ? request.getPipelineTotalScore() : 0;
        weeklyStreakService.recordActivity(userId, xp, request.getChallengeId(), pipelineScore);
        achievementService.syncForUserId(userId);
    }

    private int calculateLevel(int totalXp) {
        // level = floor((1 + sqrt(1 + 8*xp/300)) / 2)
        // L1: 0, L2: 300, L3: 900, L4: 1800, L5: 3000, L6: 4500 ...
        return (int) Math.floor((1.0 + Math.sqrt(1.0 + 8.0 * totalXp / 300.0)) / 2.0);
    }

    @Override
    @Transactional
    public void sendNotificationEmail(Long userId, String title, String body, String importanceLabel) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        emailDispatchService.sendNotificationAlertEmail(
                user.getEmail(),
                user.getUsername(),
                title,
                body != null ? body : "",
                importanceLabel);
    }

    @Override
    @Transactional
    public void addDevelopmentTimeSeconds(Long userId, int seconds) {
        if (seconds <= 0) {
            return;
        }
        int capped = Math.min(seconds, 604800);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        long cur = user.getTotalDevelopmentSeconds() != null ? user.getTotalDevelopmentSeconds() : 0L;
        user.setTotalDevelopmentSeconds(cur + capped);
        userRepository.save(user);
        achievementService.syncForUserId(userId);
    }

    @Override
    @Transactional
    public void addBrowsingTimeSeconds(Long userId, int seconds) {
        if (seconds <= 0) {
            return;
        }
        int capped = Math.min(seconds, 120);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        long cur = user.getTotalBrowsingSeconds() != null ? user.getTotalBrowsingSeconds() : 0L;
        user.setTotalBrowsingSeconds(cur + capped);
        userRepository.save(user);
        achievementService.syncForUserId(userId);
    }

    @Override
    @Transactional
    public void notifyNewChallengeEmailSubscribers(Long challengeId, String challengeTitle, Long createdByUserId) {
        if (challengeId == null) {
            return;
        }
        List<User> subscribers = userRepository.findByRoleAndEmailVerifiedTrueAndNewChallengeEmailAlertsTrue(
                User.Role.STUDENT);
        String title = challengeTitle != null && !challengeTitle.isBlank() ? challengeTitle : "New challenge";
        for (User u : subscribers) {
            if (createdByUserId != null && createdByUserId.equals(u.getId())) {
                continue;
            }
            emailDispatchService.sendNewChallengePublishedEmail(u.getEmail(), u.getUsername(), title, challengeId);
        }
    }

    @Override
    public java.util.Map<String, Object> exportUserData(String email) {
        User u = getUserEntityByEmail(email);

        java.util.Map<String, Object> account = new java.util.LinkedHashMap<>();
        account.put("id", u.getId());
        account.put("username", u.getUsername());
        account.put("email", u.getEmail());
        account.put("role", u.getRole() != null ? u.getRole().name() : null);
        account.put("dateOfBirth", u.getDateOfBirth());
        account.put("emailVerified", u.getEmailVerified());
        account.put("betaLegacy", u.getBetaLegacy());
        account.put("createdAt", u.getCreatedAt());
        account.put("updatedAt", u.getUpdatedAt());
        account.put("lastLogin", u.getLastLogin());

        java.util.Map<String, Object> profile = new java.util.LinkedHashMap<>();
        profile.put("avatarUrl", u.getAvatarUrl());
        profile.put("bio", u.getBio());
        profile.put("githubUsername", u.getGithubUsername());

        java.util.Map<String, Object> activity = new java.util.LinkedHashMap<>();
        activity.put("rating", u.getRating());
        activity.put("level", u.getLevel());
        activity.put("experiencePoints", u.getExperiencePoints());
        activity.put("totalChallengesCompleted", u.getTotalChallengesCompleted());
        activity.put("totalTestsPassed", u.getTotalTestsPassed());
        activity.put("totalDevelopmentSeconds", u.getTotalDevelopmentSeconds());
        activity.put("totalBrowsingSeconds", u.getTotalBrowsingSeconds());

        java.util.Map<String, Object> consent = new java.util.LinkedHashMap<>();
        consent.put("privacyConsentAt", u.getPrivacyConsentAt());
        consent.put("privacyConsentVersion", u.getPrivacyConsentVersion());
        consent.put("newChallengeEmailAlerts", u.getNewChallengeEmailAlerts());

        java.util.Map<String, Object> root = new java.util.LinkedHashMap<>();
        root.put("exportedAt", LocalDateTime.now().toString());
        root.put("account", account);
        root.put("profile", profile);
        root.put("activity", activity);
        root.put("consent", consent);
        root.put("note", "Submissions and uploaded files are available from the Submissions area of the app.");
        return root;
    }

    @Override
    @Transactional
    public void deleteAccount(String email) {
        User user = getUserEntityByEmail(email);
        Long userId = user.getId();

        // Best-effort cross-service erasure of submissions, ZIPs and replays.
        submissionPurgeDispatchService.purgeUserData(userId);

        // Invalidate sessions, then delete the account. Postgres ON DELETE CASCADE removes
        // refresh tokens, friendships, notifications, achievements, leaderboard entries and
        // group memberships linked to this user.
        refreshTokenService.revokeAllUserTokens(user);
        userRepository.delete(user);
    }
}
