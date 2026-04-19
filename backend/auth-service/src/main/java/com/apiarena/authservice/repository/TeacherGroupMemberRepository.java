package com.apiarena.authservice.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.authservice.model.entities.TeacherGroupMember;

public interface TeacherGroupMemberRepository extends JpaRepository<TeacherGroupMember, Long> {
    Optional<TeacherGroupMember> findByGroupIdAndUserId(Long groupId, Long userId);
    boolean existsByGroupIdAndUserId(Long groupId, Long userId);
    long countByGroupId(Long groupId);

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM TeacherGroupMember m JOIN m.group g "
            + "WHERE (g.teacher.id = :tid OR (g.coTeacher IS NOT NULL AND g.coTeacher.id = :tid)) "
            + "AND m.user.id = :uid")
    boolean existsByTeacherIdAndStudentUserId(@Param("tid") Long teacherId, @Param("uid") Long studentUserId);
}
