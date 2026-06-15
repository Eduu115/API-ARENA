package com.apiarena.leaderboardservice.model.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.leaderboardservice.model.dto.GlobalLeaderboardDTO;
import com.apiarena.leaderboardservice.model.dto.GlobalUserRankDTO;
import com.apiarena.leaderboardservice.model.dto.LeaderboardEntryDTO;
import com.apiarena.leaderboardservice.model.dto.SubmitScoreRequest;
import com.apiarena.leaderboardservice.model.entities.LeaderboardEntry;
import com.apiarena.leaderboardservice.repository.LeaderboardEntryRepository;

@Service
public class LeaderboardService {

    @Autowired
    private LeaderboardEntryRepository entryRepository;

    public List<LeaderboardEntryDTO> getChallengeLeaderboard(Long challengeId) {
        List<LeaderboardEntry> entries = entryRepository
                .findByChallengeIdOrderByScoreDescCompletionTimeSecondsAsc(challengeId);
        List<LeaderboardEntryDTO> dtos = new ArrayList<>();
        for (int i = 0; i < entries.size(); i++) {
            LeaderboardEntry e = entries.get(i);
            LeaderboardEntryDTO dto = LeaderboardEntryDTO.fromEntity(e);
            dto.setRank(i + 1);
            dtos.add(dto);
        }
        return dtos;
    }

    public List<GlobalLeaderboardDTO> getGlobalLeaderboard() {
        List<Object[]> rows = entryRepository.getGlobalLeaderboard();
        List<GlobalLeaderboardDTO> result = new ArrayList<>();
        int rank = 1;
        for (Object[] row : rows) {
            result.add(GlobalLeaderboardDTO.builder()
                    .userId((Long) row[0])
                    .username((String) row[1])
                    .totalScore(((Number) row[2]).intValue())
                    .challengesCompleted(((Number) row[3]).intValue())
                    .rank(rank++)
                    .build());
        }
        return result;
    }

    public java.util.Optional<GlobalUserRankDTO> getGlobalUserRank(Long userId) {
        if (userId == null) {
            return java.util.Optional.empty();
        }
        List<Object[]> rows = entryRepository.findGlobalRankRowByUserId(userId);
        if (rows.isEmpty()) {
            return java.util.Optional.empty();
        }
        Object[] row = rows.get(0);
        int rank = ((Number) row[0]).intValue();
        int totalScore = ((Number) row[1]).intValue();
        int challengesCompleted = ((Number) row[2]).intValue();
        return java.util.Optional.of(GlobalUserRankDTO.builder()
                .userId(userId)
                .rank(rank)
                .totalScore(totalScore)
                .challengesCompleted(challengesCompleted)
                .build());
    }

    @Transactional
    public LeaderboardEntryDTO submitScore(SubmitScoreRequest request) {
        LeaderboardEntry entry = entryRepository
                .findByChallengeIdAndUserId(request.getChallengeId(), request.getUserId())
                .orElse(null);

        if (entry != null) {
            if (request.getScore() > entry.getScore()) {
                entry.setScore(request.getScore());
                entry.setSubmissionId(request.getSubmissionId());
                entry.setCompletionTimeSeconds(request.getCompletionTimeSeconds());
                entry.setUpdatedAt(LocalDateTime.now());
            } else {
                return LeaderboardEntryDTO.fromEntity(entry);
            }
        } else {
            entry = new LeaderboardEntry();
            entry.setChallengeId(request.getChallengeId());
            entry.setUserId(request.getUserId());
            entry.setUsername(request.getUsername());
            entry.setSubmissionId(request.getSubmissionId());
            entry.setScore(request.getScore());
            entry.setCompletionTimeSeconds(request.getCompletionTimeSeconds());
        }

        LeaderboardEntry saved = entryRepository.save(entry);
        recalculateRanks(request.getChallengeId());
        return LeaderboardEntryDTO.fromEntity(saved);
    }

    public LeaderboardEntryDTO getUserPosition(Long challengeId, Long userId) {
        LeaderboardEntry entry = entryRepository.findByChallengeIdAndUserId(challengeId, userId)
                .orElseThrow(() -> new IllegalArgumentException("User has no entry in this challenge leaderboard"));
        return LeaderboardEntryDTO.fromEntity(entry);
    }

    private void recalculateRanks(Long challengeId) {
        List<LeaderboardEntry> entries = entryRepository
                .findByChallengeIdOrderByScoreDescCompletionTimeSecondsAsc(challengeId);
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }
        entryRepository.saveAll(entries);
    }
}
