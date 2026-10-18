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
        name = "social_post_test_results",
        uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "test_name"})
)
@Data
@NoArgsConstructor
public class SocialPostTestResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "test_name", nullable = false, length = 200)
    private String testName;

    @Column(nullable = false)
    private boolean passed;
}
