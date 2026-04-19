package com.apiarena.authservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoTeacherUpdateRequest {

    /** Set to null to remove the co-teacher. */
    private Long coTeacherId;
}
