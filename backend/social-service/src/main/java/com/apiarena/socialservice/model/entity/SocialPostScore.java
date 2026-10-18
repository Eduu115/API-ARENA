package com.apiarena.socialservice.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "social_post_scores",
        uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "score_key"})
)
@Data
@NoArgsConstructor
public class SocialPostScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "score_key", nullable = false, length = 40)
    private String scoreKey;

    @Column(name = "score_value", nullable = false)
    private Integer scoreValue;

    @Column(name = "max_value")
    private Integer maxValue;
}
