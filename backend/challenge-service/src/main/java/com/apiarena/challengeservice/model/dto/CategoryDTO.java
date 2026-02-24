package com.apiarena.challengeservice.model.dto;

import com.apiarena.challengeservice.model.entities.Category;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {
    
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String icon;
    private String color;
    private Integer displayOrder;
    private Integer challengeCount;

    public static CategoryDTO fromEntity(Category category) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setSlug(category.getSlug());
        dto.setDescription(category.getDescription());
        dto.setIcon(category.getIcon());
        dto.setColor(category.getColor());
        dto.setDisplayOrder(category.getDisplayOrder());
        dto.setChallengeCount(category.getChallenges() != null ? category.getChallenges().size() : 0);
        return dto;
    }

    public static CategoryDTO fromEntityWithoutCount(Category category) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setSlug(category.getSlug());
        dto.setDescription(category.getDescription());
        dto.setIcon(category.getIcon());
        dto.setColor(category.getColor());
        dto.setDisplayOrder(category.getDisplayOrder());
        dto.setChallengeCount(null);
        return dto;
    }
}
