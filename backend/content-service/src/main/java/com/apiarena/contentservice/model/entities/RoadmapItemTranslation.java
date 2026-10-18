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
@Table(name = "roadmap_item_translations")
@IdClass(ItemLocaleKey.class)
@Getter
@Setter
@NoArgsConstructor
public class RoadmapItemTranslation {

    @Id
    @Column(name = "item_id")
    private Long itemId;

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
