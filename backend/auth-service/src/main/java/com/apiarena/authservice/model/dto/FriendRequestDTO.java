package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FriendRequestDTO {
    @NotNull
    private Long userId;
}
