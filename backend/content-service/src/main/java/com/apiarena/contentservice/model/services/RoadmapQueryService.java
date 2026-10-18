package com.apiarena.contentservice.model.services;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.contentservice.model.dto.ContentDtos.RoadmapItemView;
import com.apiarena.contentservice.model.dto.ContentDtos.RoadmapPhaseView;
import com.apiarena.contentservice.model.dto.ContentDtos.RoadmapResponse;
import com.apiarena.contentservice.model.entities.RoadmapItem;
import com.apiarena.contentservice.model.entities.RoadmapItemTranslation;
import com.apiarena.contentservice.model.entities.RoadmapPhase;
import com.apiarena.contentservice.model.entities.RoadmapPhaseTranslation;
import com.apiarena.contentservice.repository.RoadmapItemRepository;
import com.apiarena.contentservice.repository.RoadmapItemTranslationRepository;
import com.apiarena.contentservice.repository.RoadmapPhaseRepository;
import com.apiarena.contentservice.repository.RoadmapPhaseTranslationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoadmapQueryService {

    private final RoadmapPhaseRepository phases;
    private final RoadmapPhaseTranslationRepository phaseTranslations;
    private final RoadmapItemRepository items;
    private final RoadmapItemTranslationRepository itemTranslations;

    @Transactional(readOnly = true)
    public RoadmapResponse roadmap(String locale) {
        String requested = ContentPostService.localeOf(locale == null || locale.isBlank() ? "en" : locale);
        List<RoadmapPhase> phaseRows = phases.findAllByOrderByPositionAsc();
        if (phaseRows.isEmpty()) {
            return new RoadmapResponse(requested, false, List.of());
        }
        List<Long> phaseIds = phaseRows.stream().map(RoadmapPhase::getId).toList();
        Map<Long, List<RoadmapPhaseTranslation>> phaseCopy = new LinkedHashMap<>();
        for (RoadmapPhaseTranslation row : phaseTranslations.findByPhaseIdIn(phaseIds)) {
            phaseCopy.computeIfAbsent(row.getPhaseId(), key -> new ArrayList<>()).add(row);
        }
        List<RoadmapItem> itemRows = items.findByPhaseIdInOrderByPositionAsc(phaseIds);
        List<Long> itemIds = itemRows.stream().map(RoadmapItem::getId).toList();
        Map<Long, List<RoadmapItemTranslation>> itemCopy = new LinkedHashMap<>();
        if (!itemIds.isEmpty()) {
            for (RoadmapItemTranslation row : itemTranslations.findByItemIdIn(itemIds)) {
                itemCopy.computeIfAbsent(row.getItemId(), key -> new ArrayList<>()).add(row);
            }
        }
        Map<Long, List<RoadmapItem>> itemsByPhase = new LinkedHashMap<>();
        for (RoadmapItem item : itemRows) {
            itemsByPhase.computeIfAbsent(item.getPhaseId(), key -> new ArrayList<>()).add(item);
        }
        boolean anyFallback = false;
        List<RoadmapPhaseView> views = new ArrayList<>();
        for (RoadmapPhase phase : phaseRows) {
            Picked phaseText = pickPhase(phaseCopy.get(phase.getId()), requested);
            if (phaseText.fallback()) anyFallback = true;
            List<RoadmapItemView> itemViews = new ArrayList<>();
            for (RoadmapItem item : itemsByPhase.getOrDefault(phase.getId(), List.of())) {
                Picked itemText = pickItem(itemCopy.get(item.getId()), requested);
                if (itemText.fallback()) anyFallback = true;
                itemViews.add(new RoadmapItemView(
                        item.getSlug(),
                        item.getPosition(),
                        item.getStatus().name(),
                        itemText.title(),
                        itemText.summary(),
                        itemText.fallback()
                ));
            }
            views.add(new RoadmapPhaseView(
                    phase.getSlug(),
                    phase.getPosition(),
                    phase.getStatus().name(),
                    phase.getTargetLabel(),
                    phaseText.title(),
                    phaseText.summary(),
                    phaseText.fallback(),
                    itemViews
            ));
        }
        return new RoadmapResponse(requested, anyFallback, views);
    }

    private Picked pickPhase(List<RoadmapPhaseTranslation> rows, String requested) {
        RoadmapPhaseTranslation exact = findPhase(rows, requested);
        if (exact != null) return new Picked(exact.getTitle(), exact.getSummary(), false);
        RoadmapPhaseTranslation fallback = findPhase(rows, other(requested));
        if (fallback != null) return new Picked(fallback.getTitle(), fallback.getSummary(), true);
        return new Picked("", null, true);
    }

    private Picked pickItem(List<RoadmapItemTranslation> rows, String requested) {
        RoadmapItemTranslation exact = findItem(rows, requested);
        if (exact != null) return new Picked(exact.getTitle(), exact.getSummary(), false);
        RoadmapItemTranslation fallback = findItem(rows, other(requested));
        if (fallback != null) return new Picked(fallback.getTitle(), fallback.getSummary(), true);
        return new Picked("", null, true);
    }

    private static RoadmapPhaseTranslation findPhase(List<RoadmapPhaseTranslation> rows, String locale) {
        if (rows == null) return null;
        for (RoadmapPhaseTranslation row : rows) {
            if (locale.equals(row.getLocale())) return row;
        }
        return null;
    }

    private static RoadmapItemTranslation findItem(List<RoadmapItemTranslation> rows, String locale) {
        if (rows == null) return null;
        for (RoadmapItemTranslation row : rows) {
            if (locale.equals(row.getLocale())) return row;
        }
        return null;
    }

    private static String other(String locale) {
        return "en".equals(locale) ? "es" : "en";
    }

    private record Picked(String title, String summary, boolean fallback) {}
}
