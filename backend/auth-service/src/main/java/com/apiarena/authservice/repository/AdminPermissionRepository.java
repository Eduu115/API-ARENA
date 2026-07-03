package com.apiarena.authservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.authservice.model.entities.AdminCapability;
import com.apiarena.authservice.model.entities.AdminPermission;

public interface AdminPermissionRepository extends JpaRepository<AdminPermission, Long> {

    List<AdminPermission> findByAdminUserId(Long adminUserId);

    boolean existsByAdminUserIdAndCapability(Long adminUserId, AdminCapability capability);

    void deleteByAdminUserIdAndCapability(Long adminUserId, AdminCapability capability);

    void deleteByAdminUserId(Long adminUserId);
}
