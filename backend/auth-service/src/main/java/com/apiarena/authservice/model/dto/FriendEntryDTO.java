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
public class FriendEntryDTO {
    private Long friendshipId;
    private UserDTO user;

    public static FriendEntryDTO of(Friendship f, User peer) {
        return FriendEntryDTO.builder()
                .friendshipId(f.getId())
                .user(UserDTO.fromEntity(peer))
                .build();
    }
}
