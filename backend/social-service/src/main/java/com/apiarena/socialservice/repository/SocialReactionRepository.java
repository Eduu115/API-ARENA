package com.apiarena.socialservice.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.socialservice.model.entity.SocialReaction;

public interface SocialReactionRepository extends JpaRepository<SocialReaction, Long> {

    Optional<SocialReaction> findByTargetTypeAndTargetIdAndUserId(String targetType, Long targetId, Long userId);

    List<SocialReaction> findByUserId(Long userId);

    List<SocialReaction> findByTargetTypeAndTargetIdInAndUserId(String targetType, Collection<Long> targetIds, Long userId);

    @Query("""
            SELECT r.targetId, r.reaction, COUNT(r)
            FROM SocialReaction r
            WHERE r.targetType = :type AND r.targetId IN :ids
            GROUP BY r.targetId, r.reaction
            """)
    List<Object[]> counts(@Param("type") String type, @Param("ids") Collection<Long> ids);

    void deleteByUserId(Long userId);

    void deleteByTargetTypeAndTargetIdIn(String targetType, Collection<Long> targetIds);

    void deleteByTargetTypeAndTargetId(String targetType, Long targetId);
}
