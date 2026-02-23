package com.apiarena.challengeservice.model.services;

import java.util.List;

import com.apiarena.challengeservice.model.dto.ChallengeDTO;
import com.apiarena.challengeservice.model.dto.ChallengeSummaryDTO;
import com.apiarena.challengeservice.model.dto.CreateChallengeRequest;
import com.apiarena.challengeservice.model.dto.UpdateChallengeRequest;

public interface IChallengeService {

    ChallengeDTO createChallenge(CreateChallengeRequest request, Long userId);

    ChallengeDTO getChallengeById(Long id);

    ChallengeDTO getChallengeBySlug(String slug);

    List<ChallengeSummaryDTO> getAllChallenges();

    List<ChallengeSummaryDTO> getChallengesByFilters(String difficulty, String category, String search);

    List<ChallengeSummaryDTO> getFeaturedChallenges();

    List<String> getAllCategories();

    ChallengeDTO updateChallenge(Long id, UpdateChallengeRequest request);

    void deleteChallenge(Long id);
}
