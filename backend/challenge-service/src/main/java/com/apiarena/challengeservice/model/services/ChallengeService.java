package com.apiarena.challengeservice.model.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.challengeservice.exception.BadRequestException;
import com.apiarena.challengeservice.exception.ResourceNotFoundException;
import com.apiarena.challengeservice.model.dto.ChallengeDTO;
import com.apiarena.challengeservice.model.dto.ChallengeSummaryDTO;
import com.apiarena.challengeservice.model.dto.CreateChallengeRequest;
import com.apiarena.challengeservice.model.dto.UpdateChallengeRequest;
import com.apiarena.challengeservice.model.entities.Challenge;
import com.apiarena.challengeservice.repository.ChallengeRepository;


@Service
public class ChallengeService implements IChallengeService {

    @Autowired
    private ChallengeRepository challengeRepository;

    @Override
    @Transactional
    public ChallengeDTO createChallenge(CreateChallengeRequest request, Long userId) {
        // Generar slug desde el título
        String slug = generateSlug(request.getTitle());

        // Validar que el slug no exista
        if (challengeRepository.existsBySlug(slug)) {
            throw new BadRequestException("Challenge with this title already exists");
        }

        // Validar dificultad
        Challenge.Difficulty difficulty;
        try {
            difficulty = Challenge.Difficulty.valueOf(request.getDifficulty().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid difficulty: " + request.getDifficulty());
        }

        // Crear challenge
        Challenge challenge = new Challenge();
        challenge.setTitle(request.getTitle());
        challenge.setSlug(slug);
        challenge.setDescription(request.getDescription());
        challenge.setDifficulty(difficulty);
        challenge.setCategory(request.getCategory());
        challenge.setRequiredEndpoints(request.getRequiredEndpoints());
        challenge.setRequiredStatusCodes(request.getRequiredStatusCodes());
        challenge.setRequiredHeaders(request.getRequiredHeaders());
        challenge.setTestSuite(request.getTestSuite());
        challenge.setPerformanceRequirements(request.getPerformanceRequirements());
        challenge.setDesignCriteria(request.getDesignCriteria());
        challenge.setHints(request.getHints());
        challenge.setSolutionExplanation(request.getSolutionExplanation());
        challenge.setLearningObjectives(request.getLearningObjectives());
        challenge.setCreatedBy(userId);
        
        // Solo sobrescribir valores por defecto si vienen en el request
        if (request.getMaxScore() != null) {
            challenge.setMaxScore(request.getMaxScore());
        }
        if (request.getTimeLimitMinutes() != null) {
            challenge.setTimeLimitMinutes(request.getTimeLimitMinutes());
        }
        
        Challenge savedChallenge = challengeRepository.save(challenge);
        return ChallengeDTO.fromEntity(savedChallenge);
    }

    @Override
    public ChallengeDTO getChallengeById(Long id) {
        Challenge challenge = challengeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge not found with id: " + id));
        return ChallengeDTO.fromEntity(challenge);
    }

    @Override
    public ChallengeDTO getChallengeBySlug(String slug) {
        Challenge challenge = challengeRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge not found with slug: " + slug));
        return ChallengeDTO.fromEntity(challenge);
    }

    @Override
    public List<ChallengeSummaryDTO> getAllChallenges() {
        return challengeRepository.findByIsActiveTrue().stream()
                .map(ChallengeSummaryDTO::fromEntity)
                .toList();
    }

    @Override
    public List<ChallengeSummaryDTO> getChallengesByFilters(
            String difficulty,
            String category,
            String search
    ) {
        // Si hay búsqueda, usarla
        if (search != null && !search.isEmpty()) {
            return challengeRepository.searchChallenges(search).stream()
                    .map(ChallengeSummaryDTO::fromEntity)
                    .toList();
        }

        // Filtros combinados
        if (difficulty != null && category != null) {
            Challenge.Difficulty diff = Challenge.Difficulty.valueOf(difficulty.toUpperCase());
            return challengeRepository.findByDifficultyAndCategoryAndIsActiveTrue(diff, category).stream()
                    .map(ChallengeSummaryDTO::fromEntity)
                    .toList();
        }

        // Solo dificultad
        if (difficulty != null) {
            Challenge.Difficulty diff = Challenge.Difficulty.valueOf(difficulty.toUpperCase());
            return challengeRepository.findByDifficultyAndIsActiveTrue(diff).stream()
                    .map(ChallengeSummaryDTO::fromEntity)
                    .toList();
        }

        // Solo categoría
        if (category != null) {
            return challengeRepository.findByCategoryAndIsActiveTrue(category).stream()
                    .map(ChallengeSummaryDTO::fromEntity)
                    .toList();
        }

        // Sin filtros
        return getAllChallenges();
    }

    @Override
    public List<ChallengeSummaryDTO> getFeaturedChallenges() {
        return challengeRepository.findByFeaturedTrue().stream()
                .map(ChallengeSummaryDTO::fromEntity)
                .toList();
    }

    @Override
    public List<String> getAllCategories() {
        return challengeRepository.findAllCategories();
    }

    @Override
    @Transactional
    public ChallengeDTO updateChallenge(Long id, UpdateChallengeRequest request) {
        Challenge challenge = challengeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge not found with id: " + id));

        // Actualizar campos solo si vienen en el request
        if (request.getTitle() != null) {
            challenge.setTitle(request.getTitle());
            challenge.setSlug(generateSlug(request.getTitle()));
        }
        if (request.getDescription() != null) {
            challenge.setDescription(request.getDescription());
        }
        if (request.getDifficulty() != null) {
            challenge.setDifficulty(Challenge.Difficulty.valueOf(request.getDifficulty().toUpperCase()));
        }
        if (request.getCategory() != null) {
            challenge.setCategory(request.getCategory());
        }
        if (request.getMaxScore() != null) {
            challenge.setMaxScore(request.getMaxScore());
        }
        if (request.getTimeLimitMinutes() != null) {
            challenge.setTimeLimitMinutes(request.getTimeLimitMinutes());
        }
        if (request.getRequiredEndpoints() != null) {
            challenge.setRequiredEndpoints(request.getRequiredEndpoints());
        }
        if (request.getRequiredStatusCodes() != null) {
            challenge.setRequiredStatusCodes(request.getRequiredStatusCodes());
        }
        if (request.getRequiredHeaders() != null) {
            challenge.setRequiredHeaders(request.getRequiredHeaders());
        }
        if (request.getTestSuite() != null) {
            challenge.setTestSuite(request.getTestSuite());
        }
        if (request.getPerformanceRequirements() != null) {
            challenge.setPerformanceRequirements(request.getPerformanceRequirements());
        }
        if (request.getDesignCriteria() != null) {
            challenge.setDesignCriteria(request.getDesignCriteria());
        }
        if (request.getIsActive() != null) {
            challenge.setIsActive(request.getIsActive());
        }
        if (request.getFeatured() != null) {
            challenge.setFeatured(request.getFeatured());
        }
        if (request.getHints() != null) {
            challenge.setHints(request.getHints());
        }
        if (request.getSolutionExplanation() != null) {
            challenge.setSolutionExplanation(request.getSolutionExplanation());
        }
        if (request.getLearningObjectives() != null) {
            challenge.setLearningObjectives(request.getLearningObjectives());
        }

        Challenge updatedChallenge = challengeRepository.save(challenge);
        return ChallengeDTO.fromEntity(updatedChallenge);
    }

    @Override
    @Transactional
    public void deleteChallenge(Long id) {
        Challenge challenge = challengeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge not found with id: " + id));
        
        // Soft delete
        challenge.setIsActive(false);
        challengeRepository.save(challenge);
    }

    // Utilidad: generar slug desde título
    private String generateSlug(String title) {
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();
    }
}
