package com.apiarena.authservice.model.services;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.apiarena.authservice.model.dto.PlayerLeaderboardEntryDTO;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PlayerLeaderboardService {

    /** Matches frontend rankConstants.MIN_RANKED_CHALLENGES and docs/xp-elo-system.md */
    public static final int MIN_CHALLENGES_FOR_ELO_LEADERBOARD = 3;

    private final UserRepository userRepository;

    public List<PlayerLeaderboardEntryDTO> getEloLeaderboard() {
        List<User> users = userRepository.findActiveStudentsForEloLeaderboard(MIN_CHALLENGES_FOR_ELO_LEADERBOARD);
        return toRankedList(users);
    }

    public List<PlayerLeaderboardEntryDTO> getLevelLeaderboard() {
        List<User> users = userRepository.findActiveStudentsForLevelLeaderboard();
        return toRankedList(users);
    }

    private List<PlayerLeaderboardEntryDTO> toRankedList(List<User> users) {
        List<PlayerLeaderboardEntryDTO> result = new ArrayList<>(users.size());
        int rank = 1;
        for (User user : users) {
            result.add(PlayerLeaderboardEntryDTO.fromUser(user, rank++));
        }
        return result;
    }
}
