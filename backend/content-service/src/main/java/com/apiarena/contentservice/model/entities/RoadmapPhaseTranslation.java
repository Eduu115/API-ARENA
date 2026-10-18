package com.apiarena.contentservice.model.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "roadmap_phase_translations")
@IdClass(PhaseLocaleKey.class)
@Getter
@Setter
@NoArgsConstructor
public class RoadmapPhaseTranslation {

    @Id
    @Column(name = "phase_id")
    private Long phaseId;

    @Id
    @Column(length = 2)
    private String locale;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "machine_translated", nullable = false)
    private boolean machineTranslated;
}
