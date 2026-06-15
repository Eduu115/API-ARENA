package com.apiarena.leaderboardservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.leaderboardservice.model.entities.LeaderboardEntry;

public interface LeaderboardEntryRepository extends JpaRepository<LeaderboardEntry, Long> {

    List<LeaderboardEntry> findByChallengeIdOrderByScoreDescCompletionTimeSecondsAsc(Long challengeId);

    Optional<LeaderboardEntry> findByChallengeIdAndUserId(Long challengeId, Long userId);

    @Query("SELECT e.userId, e.username, SUM(e.score), COUNT(e) " +
           "FROM LeaderboardEntry e " +
           "GROUP BY e.userId, e.username " +
           "ORDER BY SUM(e.score) DESC")
    List<Object[]> getGlobalLeaderboard();

    @Query(value = """
            SELECT ranked.rnk, ranked.total_score, ranked.challenges_completed
            FROM (
                SELECT e.user_id,
                       SUM(e.score)::bigint AS total_score,
                       COUNT(*)::bigint AS challenges_completed,
                       ROW_NUMBER() OVER (ORDER BY SUM(e.score) DESC)::int AS rnk
                FROM leaderboard_entries e
                GROUP BY e.user_id, e.username
            ) ranked
            WHERE ranked.user_id = :userId
            """, nativeQuery = true)
    List<Object[]> findGlobalRankRowByUserId(@Param("userId") Long userId);

    @Query("SELECT e FROM LeaderboardEntry e WHERE e.userId = :userId ORDER BY e.score DESC")
    List<LeaderboardEntry> findByUserIdOrderByScoreDesc(@Param("userId") Long userId);

    long countByUserId(Long userId);
}
