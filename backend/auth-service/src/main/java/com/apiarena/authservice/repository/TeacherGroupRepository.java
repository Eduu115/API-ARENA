package com.apiarena.authservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.authservice.model.entities.TeacherGroup;

public interface TeacherGroupRepository extends JpaRepository<TeacherGroup, Long> {
    List<TeacherGroup> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);

    @Query("SELECT g FROM TeacherGroup g WHERE g.teacher.id = :uid OR (g.coTeacher IS NOT NULL AND g.coTeacher.id = :uid) "
            + "ORDER BY g.createdAt DESC")
    List<TeacherGroup> findAccessibleByTeacherId(@Param("uid") Long teacherId);
}
