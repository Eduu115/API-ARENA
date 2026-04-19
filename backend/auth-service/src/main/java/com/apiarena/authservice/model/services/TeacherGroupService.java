package com.apiarena.authservice.model.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.model.dto.AddMemberRequest;
import com.apiarena.authservice.model.dto.CreateGroupRequest;
import com.apiarena.authservice.model.dto.TeacherGroupDTO;
import com.apiarena.authservice.model.entities.TeacherGroup;
import com.apiarena.authservice.model.entities.TeacherGroupMember;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.TeacherGroupMemberRepository;
import com.apiarena.authservice.repository.TeacherGroupRepository;
import com.apiarena.authservice.repository.UserRepository;

@Service
public class TeacherGroupService {

    @Autowired
    private TeacherGroupRepository groupRepository;

    @Autowired
    private TeacherGroupMemberRepository memberRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<TeacherGroupDTO> getMyGroups(Long teacherId) {
        return groupRepository.findAccessibleByTeacherId(teacherId)
                .stream()
                .map(g -> TeacherGroupDTO.fromEntity(g, false, teacherId))
                .toList();
    }

    @Transactional(readOnly = true)
    public TeacherGroupDTO getGroupById(Long groupId, Long teacherId) {
        TeacherGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        if (!canAccessGroup(group, teacherId)) {
            throw new SecurityException("Not your group");
        }
        return TeacherGroupDTO.fromEntity(group, true, teacherId);
    }

    @Transactional
    public TeacherGroupDTO createGroup(CreateGroupRequest request, Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found"));

        TeacherGroup group = new TeacherGroup();
        group.setName(request.getName());
        group.setDescription(request.getDescription());
        group.setTeacher(teacher);
        validateAndSetCoTeacher(group, request.getCoTeacherId(), teacherId);

        TeacherGroup saved = groupRepository.save(group);
        return TeacherGroupDTO.fromEntity(saved, true, teacherId);
    }

    @Transactional
    public TeacherGroupDTO updateGroup(Long groupId, CreateGroupRequest request, Long teacherId) {
        TeacherGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        if (!canAccessGroup(group, teacherId)) {
            throw new SecurityException("Not your group");
        }

        group.setName(request.getName());
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }

        TeacherGroup saved = groupRepository.save(group);
        return TeacherGroupDTO.fromEntity(saved, true, teacherId);
    }

    /** Primary teacher only: set or remove co-teacher (does not change name/description). */
    @Transactional
    public TeacherGroupDTO setCoTeacher(Long groupId, Long coTeacherId, Long teacherId) {
        TeacherGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        if (!isPrimaryTeacher(group, teacherId)) {
            throw new SecurityException("Only the primary teacher can assign a co-teacher");
        }
        validateAndSetCoTeacher(group, coTeacherId, group.getTeacher().getId());
        TeacherGroup saved = groupRepository.save(group);
        return TeacherGroupDTO.fromEntity(saved, true, teacherId);
    }

    @Transactional
    public void deleteGroup(Long groupId, Long teacherId) {
        TeacherGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        if (!isPrimaryTeacher(group, teacherId)) {
            throw new SecurityException("Only the primary teacher can delete this group");
        }
        groupRepository.delete(group);
    }

    @Transactional
    public TeacherGroupDTO addMember(Long groupId, AddMemberRequest request, Long teacherId) {
        TeacherGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        if (!canAccessGroup(group, teacherId)) {
            throw new SecurityException("Not your group");
        }

        User student = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (student.getRole() != User.Role.STUDENT) {
            throw new IllegalArgumentException("Only students can be added to groups");
        }

        if (memberRepository.existsByGroupIdAndUserId(groupId, request.getUserId())) {
            throw new IllegalArgumentException("Student is already in this group");
        }

        TeacherGroupMember member = new TeacherGroupMember();
        member.setGroup(group);
        member.setUser(student);
        memberRepository.save(member);

        TeacherGroup refreshed = groupRepository.findById(groupId).orElseThrow();
        return TeacherGroupDTO.fromEntity(refreshed, true, teacherId);
    }

    @Transactional
    public TeacherGroupDTO removeMember(Long groupId, Long userId, Long teacherId) {
        TeacherGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        if (!canAccessGroup(group, teacherId)) {
            throw new SecurityException("Not your group");
        }

        TeacherGroupMember member = memberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in this group"));

        memberRepository.delete(member);

        TeacherGroup refreshed = groupRepository.findById(groupId).orElseThrow();
        return TeacherGroupDTO.fromEntity(refreshed, true, teacherId);
    }

    /** True if the student is in any group where this teacher is primary or co-teacher. */
    public boolean isStudentInAnyTeacherGroup(Long teacherId, Long studentUserId) {
        if (teacherId == null || studentUserId == null) {
            return false;
        }
        return memberRepository.existsByTeacherIdAndStudentUserId(teacherId, studentUserId);
    }

    private boolean canAccessGroup(TeacherGroup group, Long userId) {
        if (userId == null) {
            return false;
        }
        if (group.getTeacher().getId().equals(userId)) {
            return true;
        }
        return group.getCoTeacher() != null && group.getCoTeacher().getId().equals(userId);
    }

    private boolean isPrimaryTeacher(TeacherGroup group, Long userId) {
        return userId != null && group.getTeacher().getId().equals(userId);
    }

    private void validateAndSetCoTeacher(TeacherGroup group, Long coTeacherId, Long primaryTeacherId) {
        if (coTeacherId == null) {
            group.setCoTeacher(null);
            return;
        }
        if (coTeacherId.equals(primaryTeacherId)) {
            throw new IllegalArgumentException("Co-teacher must be a different user than the primary teacher");
        }
        User co = userRepository.findById(coTeacherId)
                .orElseThrow(() -> new IllegalArgumentException("Co-teacher user not found"));
        if (co.getRole() != User.Role.TEACHER) {
            throw new IllegalArgumentException("Co-teacher must be a user with role TEACHER");
        }
        group.setCoTeacher(co);
    }
}
