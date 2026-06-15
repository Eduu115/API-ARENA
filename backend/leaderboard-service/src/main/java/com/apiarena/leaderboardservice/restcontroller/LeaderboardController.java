package com.apiarena.leaderboardservice.restcontroller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.leaderboardservice.model.dto.GlobalLeaderboardDTO;
import com.apiarena.leaderboardservice.model.dto.GlobalUserRankDTO;
import com.apiarena.leaderboardservice.model.dto.LeaderboardEntryDTO;
import com.apiarena.leaderboardservice.model.dto.SubmitScoreRequest;
import com.apiarena.leaderboardservice.model.services.LeaderboardService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    @Autowired
    private LeaderboardService leaderboardService;

    @GetMapping("/global")
    public ResponseEntity<List<GlobalLeaderboardDTO>> getGlobalLeaderboard() {
        return ResponseEntity.ok(leaderboardService.getGlobalLeaderboard());
    }

    @GetMapping("/global/user/{userId}")
    public ResponseEntity<GlobalUserRankDTO> getGlobalUserRank(@PathVariable Long userId) {
        return leaderboardService.getGlobalUserRank(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/challenge/{challengeId}")
    public ResponseEntity<List<LeaderboardEntryDTO>> getChallengeLeaderboard(@PathVariable Long challengeId) {
        return ResponseEntity.ok(leaderboardService.getChallengeLeaderboard(challengeId));
    }

    @GetMapping("/challenge/{challengeId}/user/{userId}")
    public ResponseEntity<LeaderboardEntryDTO> getUserPosition(
            @PathVariable Long challengeId,
            @PathVariable Long userId) {
        return ResponseEntity.ok(leaderboardService.getUserPosition(challengeId, userId));
    }

    @PostMapping("/submit")
    public ResponseEntity<LeaderboardEntryDTO> submitScore(@Valid @RequestBody SubmitScoreRequest request) {
        LeaderboardEntryDTO result = leaderboardService.submitScore(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}
