package com.apiarena.leaderboardservice.model.dto;

import java.time.LocalDateTime;

import com.apiarena.leaderboardservice.model.entities.LeaderboardEntry;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardEntryDTO {

    private Long id;
    private Long challengeId;
    private Long userId;
    private String username;
    private Long submissionId;
    private Integer score;
    private Integer completionTimeSeconds;
    private Integer rank;
    private LocalDateTime createdAt;

    public static LeaderboardEntryDTO fromEntity(LeaderboardEntry entry) {
        return LeaderboardEntryDTO.builder()
                .id(entry.getId())
                .challengeId(entry.getChallengeId())
                .userId(entry.getUserId())
                .username(entry.getUsername())
                .submissionId(entry.getSubmissionId())
                .score(entry.getScore())
                .completionTimeSeconds(entry.getCompletionTimeSeconds())
                .rank(entry.getRank())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
