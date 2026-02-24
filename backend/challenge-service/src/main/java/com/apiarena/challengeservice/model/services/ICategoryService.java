package com.apiarena.challengeservice.model.services;

import java.util.List;

import com.apiarena.challengeservice.model.dto.CategoryDTO;
import com.apiarena.challengeservice.model.dto.CreateCategoryRequest;
import com.apiarena.challengeservice.model.dto.UpdateCategoryRequest;

public interface ICategoryService {
    
    List<CategoryDTO> getAllCategories();
    
    List<CategoryDTO> getActiveCategories();
    
    CategoryDTO getCategoryById(Long id);
    
    CategoryDTO getCategoryBySlug(String slug);
    
    CategoryDTO createCategory(CreateCategoryRequest request);
    
    CategoryDTO updateCategory(Long id, UpdateCategoryRequest request);
    
    void deleteCategory(Long id);
}
