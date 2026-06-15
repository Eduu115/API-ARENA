package com.apiarena.authservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileBadgeDisplayDTO {

    private String code;
    private String displayLabel;
    private String styleKey;
}
