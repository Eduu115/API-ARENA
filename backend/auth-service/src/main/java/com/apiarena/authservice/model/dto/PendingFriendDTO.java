package com.apiarena.authservice.model.dto;

import com.apiarena.authservice.model.entities.Friendship;
import com.apiarena.authservice.model.entities.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingFriendDTO {
    private Long friendshipId;
    private UserDTO user;
    /** True if the current user should accept (they did not send the request). */
    private boolean incoming;

    public static PendingFriendDTO of(Friendship f, User peer, Long currentUserId) {
        boolean incoming = !f.getRequestedByUserId().equals(currentUserId);
        return PendingFriendDTO.builder()
                .friendshipId(f.getId())
                .user(UserDTO.fromEntity(peer))
                .incoming(incoming)
                .build();
    }
}
