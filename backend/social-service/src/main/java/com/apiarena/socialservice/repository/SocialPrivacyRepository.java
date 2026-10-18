package com.apiarena.socialservice.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.socialservice.model.entity.SocialPrivacySetting;

public interface SocialPrivacyRepository extends JpaRepository<SocialPrivacySetting, Long> {

    List<SocialPrivacySetting> findByUserIdIn(Collection<Long> userIds);
}
