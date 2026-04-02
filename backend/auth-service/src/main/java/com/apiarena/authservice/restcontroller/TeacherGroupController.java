package com.apiarena.authservice.restcontroller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.authservice.model.dto.AddMemberRequest;
import com.apiarena.authservice.model.dto.CreateGroupRequest;
import com.apiarena.authservice.model.dto.TeacherGroupDTO;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.model.services.TeacherGroupService;
import com.apiarena.authservice.repository.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/groups")
public class TeacherGroupController {

    @Autowired
    private TeacherGroupService groupService;

    @Autowired
    private UserRepository userRepository;

    private Long getCurrentTeacherId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getId();
    }

    @GetMapping
    public ResponseEntity<List<TeacherGroupDTO>> getMyGroups() {
        Long teacherId = getCurrentTeacherId();
        return ResponseEntity.ok(groupService.getMyGroups(teacherId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeacherGroupDTO> getGroup(@PathVariable Long id) {
        Long teacherId = getCurrentTeacherId();
        return ResponseEntity.ok(groupService.getGroupById(id, teacherId));
    }

    @PostMapping
    public ResponseEntity<TeacherGroupDTO> createGroup(@Valid @RequestBody CreateGroupRequest request) {
        Long teacherId = getCurrentTeacherId();
        TeacherGroupDTO created = groupService.createGroup(request, teacherId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeacherGroupDTO> updateGroup(
            @PathVariable Long id,
            @Valid @RequestBody CreateGroupRequest request) {
        Long teacherId = getCurrentTeacherId();
        return ResponseEntity.ok(groupService.updateGroup(id, request, teacherId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        Long teacherId = getCurrentTeacherId();
        groupService.deleteGroup(id, teacherId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<TeacherGroupDTO> addMember(
            @PathVariable Long id,
            @Valid @RequestBody AddMemberRequest request) {
        Long teacherId = getCurrentTeacherId();
        return ResponseEntity.ok(groupService.addMember(id, request, teacherId));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<TeacherGroupDTO> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId) {
        Long teacherId = getCurrentTeacherId();
        return ResponseEntity.ok(groupService.removeMember(id, userId, teacherId));
    }

    @GetMapping("/search-students")
    public ResponseEntity<List<UserDTO>> searchStudents(@RequestParam String q) {
        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }
        List<UserDTO> results = userRepository.searchStudents(q.trim())
                .stream()
                .map(UserDTO::fromEntity)
                .limit(20)
                .toList();
        return ResponseEntity.ok(results);
    }
}
