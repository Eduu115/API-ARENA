package com.apiarena.challengeservice.model.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCategoryRequest {

    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @Size(max = 50, message = "Icon must not exceed 50 characters")
    private String icon;

    @Size(max = 20, message = "Color must not exceed 20 characters")
    private String color;

    private Integer displayOrder;

    private Boolean isActive;
}
