package com.apiarena.socialservice.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.apiarena.socialservice.model.entity.SocialActivityEntry;
import com.apiarena.socialservice.repository.SocialActivityRepository;

@ExtendWith(MockitoExtension.class)
class SocialIngestServiceTest {

    @Mock
    SocialActivityRepository activityRepository;

    @InjectMocks
    SocialIngestService ingestService;

    @Test
    void duplicateSourceEventIsIgnored() {
        SocialActivityEntry row = new SocialActivityEntry();
        row.setSourceEventId("submission:4:completed");
        when(activityRepository.existsBySourceEventId("submission:4:completed")).thenReturn(false, true);

        assertTrue(ingestService.accept(row));
        assertFalse(ingestService.accept(row));

        verify(activityRepository, times(1)).save(row);
    }
}
