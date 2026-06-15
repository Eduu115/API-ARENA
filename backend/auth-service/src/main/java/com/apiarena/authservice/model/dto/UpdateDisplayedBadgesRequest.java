package com.apiarena.authservice.model.dto;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDisplayedBadgesRequest {

    @NotNull
    private List<String> codes;
}
