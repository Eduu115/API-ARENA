package com.apiarena.authservice.model.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.apiarena.authservice.model.entities.TeacherGroup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherGroupDTO {

    private Long id;
    private String name;
    private String description;
    private Long teacherId;
    private int studentCount;
    private List<GroupMemberDTO> members;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GroupMemberDTO {
        private Long userId;
        private String username;
        private String email;
        private String avatarUrl;
        private LocalDateTime addedAt;
    }

    public static TeacherGroupDTO fromEntity(TeacherGroup group, boolean includeMembers) {
        TeacherGroupDTOBuilder builder = TeacherGroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .teacherId(group.getTeacher().getId())
                .studentCount(group.getMembers() != null ? group.getMembers().size() : 0)
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt());

        if (includeMembers && group.getMembers() != null) {
            builder.members(group.getMembers().stream().map(m ->
                    GroupMemberDTO.builder()
                            .userId(m.getUser().getId())
                            .username(m.getUser().getUsername())
                            .email(m.getUser().getEmail())
                            .avatarUrl(m.getUser().getAvatarUrl())
                            .addedAt(m.getAddedAt())
                            .build()
            ).toList());
        }

        return builder.build();
    }
}
