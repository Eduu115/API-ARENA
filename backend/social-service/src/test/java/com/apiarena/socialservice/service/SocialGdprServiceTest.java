package com.apiarena.socialservice.service;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.apiarena.socialservice.repository.SocialActivityRepository;
import com.apiarena.socialservice.repository.SocialPostRepository;
import com.apiarena.socialservice.repository.SocialPostScoreRepository;
import com.apiarena.socialservice.repository.SocialPostTestRepository;
import com.apiarena.socialservice.repository.SocialPrivacyRepository;
import com.apiarena.socialservice.repository.SocialReactionRepository;
import com.apiarena.socialservice.repository.SocialReportRepository;

@ExtendWith(MockitoExtension.class)
class SocialGdprServiceTest {

    @Mock SocialActivityRepository activityRepository;
    @Mock SocialPostRepository postRepository;
    @Mock SocialPostTestRepository testRepository;
    @Mock SocialPostScoreRepository scoreRepository;
    @Mock SocialReactionRepository reactionRepository;
    @Mock SocialReportRepository reportRepository;
    @Mock SocialPrivacyRepository privacyRepository;
    @InjectMocks SocialGdprService gdprService;

    @Test
    void purgeRemovesPostsActivityReactionsAndPrivacy() {
        when(postRepository.findIdsByUserId(7L)).thenReturn(List.of(3L));
        when(activityRepository.findIdsByUserId(7L)).thenReturn(List.of(9L));

        gdprService.purge(7L);

        verify(reactionRepository).deleteByUserId(7L);
        verify(reportRepository).deleteByReporterUserId(7L);
        verify(reactionRepository).deleteByTargetTypeAndTargetIdIn("POST", List.of(3L));
        verify(reactionRepository).deleteByTargetTypeAndTargetIdIn("ACTIVITY", List.of(9L));
        verify(testRepository).deleteByPostId(3L);
        verify(scoreRepository).deleteByPostId(3L);
        verify(postRepository).deleteByUserId(7L);
        verify(activityRepository).deleteByUserId(7L);
        verify(privacyRepository).deleteById(7L);
    }
}
