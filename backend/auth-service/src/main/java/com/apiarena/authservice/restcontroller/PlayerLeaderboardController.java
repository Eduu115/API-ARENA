package com.apiarena.authservice.restcontroller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.authservice.model.dto.PlayerLeaderboardEntryDTO;
import com.apiarena.authservice.model.services.PlayerLeaderboardService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth/leaderboard")
@Tag(name = "Player leaderboard", description = "Public ELO and level rankings")
@RequiredArgsConstructor
public class PlayerLeaderboardController {

    private final PlayerLeaderboardService playerLeaderboardService;

    @GetMapping("/elo")
    @Operation(summary = "Global ELO ranking", description = "Active students with at least 3 completed challenges, ordered by ELO.")
    public ResponseEntity<List<PlayerLeaderboardEntryDTO>> getEloLeaderboard() {
        return ResponseEntity.ok(playerLeaderboardService.getEloLeaderboard());
    }

    @GetMapping("/level")
    @Operation(summary = "Global level ranking", description = "Active students ordered by account level, then XP.")
    public ResponseEntity<List<PlayerLeaderboardEntryDTO>> getLevelLeaderboard() {
        return ResponseEntity.ok(playerLeaderboardService.getLevelLeaderboard());
    }
}
