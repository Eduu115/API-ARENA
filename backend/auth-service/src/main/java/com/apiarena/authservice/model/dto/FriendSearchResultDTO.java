package com.apiarena.authservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendSearchResultDTO {
    private UserDTO user;
    /** NONE, FRIEND, PENDING_OUTGOING, PENDING_INCOMING */
    private String relationship;
}
