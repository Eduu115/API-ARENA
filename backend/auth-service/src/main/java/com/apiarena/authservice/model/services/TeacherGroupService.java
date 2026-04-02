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

    public List<TeacherGroupDTO> getMyGroups(Long teacherId) {
        return groupRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId)
                .stream()
                .map(g -> TeacherGroupDTO.fromEntity(g, false))
                .toList();
    }

    public TeacherGroupDTO getGroupById(Long groupId, Long teacherId) {
        TeacherGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        if (!group.getTeacher().getId().equals(teacherId)) {
            throw new SecurityException("Not your group");
        }
        return TeacherGroupDTO.fromEntity(group, true);
    }

    @Transactional
    public TeacherGroupDTO createGroup(CreateGroupRequest request, Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found"));

        TeacherGroup group = new TeacherGroup();
        group.setName(request.getName());
        group.setDescription(request.getDescription());
        group.setTeacher(teacher);

        TeacherGroup saved = groupRepository.save(group);
        return TeacherGroupDTO.fromEntity(saved, true);
    }

    @Transactional
    public TeacherGroupDTO updateGroup(Long groupId, CreateGroupRequest request, Long teacherId) {
        TeacherGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        if (!group.getTeacher().getId().equals(teacherId)) {
            throw new SecurityException("Not your group");
        }

        group.setName(request.getName());
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }

        TeacherGroup saved = groupRepository.save(group);
        return TeacherGroupDTO.fromEntity(saved, true);
    }

    @Transactional
    public void deleteGroup(Long groupId, Long teacherId) {
        TeacherGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        if (!group.getTeacher().getId().equals(teacherId)) {
            throw new SecurityException("Not your group");
        }
        groupRepository.delete(group);
    }

    @Transactional
    public TeacherGroupDTO addMember(Long groupId, AddMemberRequest request, Long teacherId) {
        TeacherGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        if (!group.getTeacher().getId().equals(teacherId)) {
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
        return TeacherGroupDTO.fromEntity(refreshed, true);
    }

    @Transactional
    public TeacherGroupDTO removeMember(Long groupId, Long userId, Long teacherId) {
        TeacherGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        if (!group.getTeacher().getId().equals(teacherId)) {
            throw new SecurityException("Not your group");
        }

        TeacherGroupMember member = memberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in this group"));

        memberRepository.delete(member);

        TeacherGroup refreshed = groupRepository.findById(groupId).orElseThrow();
        return TeacherGroupDTO.fromEntity(refreshed, true);
    }
}
