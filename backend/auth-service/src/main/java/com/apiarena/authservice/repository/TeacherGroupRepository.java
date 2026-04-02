package com.apiarena.authservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.authservice.model.entities.TeacherGroup;

public interface TeacherGroupRepository extends JpaRepository<TeacherGroup, Long> {
    List<TeacherGroup> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);
}
