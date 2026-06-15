package com.apiarena.authservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendRelationshipDTO {

    /** SELF, NONE, FRIEND, PENDING_OUTGOING, PENDING_INCOMING */
    private String relationship;

    /** Present when relationship is FRIEND or pending. */
    private Long friendshipId;
}
