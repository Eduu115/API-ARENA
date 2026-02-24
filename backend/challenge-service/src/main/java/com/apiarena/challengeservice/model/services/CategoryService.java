package com.apiarena.challengeservice.model.services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.challengeservice.model.dto.CategoryDTO;
import com.apiarena.challengeservice.model.dto.CreateCategoryRequest;
import com.apiarena.challengeservice.model.dto.UpdateCategoryRequest;
import com.apiarena.challengeservice.model.entities.Category;
import com.apiarena.challengeservice.model.repositories.CategoryRepository;

@Service
public class CategoryService implements ICategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(CategoryDTO::fromEntityWithoutCount)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getActiveCategories() {
        return categoryRepository.findAllByIsActiveOrderByDisplayOrderAsc(true)
                .stream()
                .map(CategoryDTO::fromEntityWithoutCount)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findByIdWithChallenges(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));
        return CategoryDTO.fromEntity(category);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with slug: " + slug));
        return CategoryDTO.fromEntityWithoutCount(category);
    }

    @Override
    @Transactional
    public CategoryDTO createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsBySlug(request.getSlug())) {
            throw new IllegalArgumentException("Category with slug '" + request.getSlug() + "' already exists");
        }
        if (categoryRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Category with name '" + request.getName() + "' already exists");
        }

        Category category = new Category();
        category.setName(request.getName());
        category.setSlug(request.getSlug());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        category.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);

        Category saved = categoryRepository.save(category);
        return CategoryDTO.fromEntityWithoutCount(saved);
    }

    @Override
    @Transactional
    public CategoryDTO updateCategory(Long id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));

        if (request.getName() != null) {
            if (categoryRepository.existsByName(request.getName()) && !category.getName().equals(request.getName())) {
                throw new IllegalArgumentException("Category with name '" + request.getName() + "' already exists");
            }
            category.setName(request.getName());
        }

        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }

        if (request.getIcon() != null) {
            category.setIcon(request.getIcon());
        }

        if (request.getColor() != null) {
            category.setColor(request.getColor());
        }

        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(request.getDisplayOrder());
        }

        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        Category updated = categoryRepository.save(category);
        return CategoryDTO.fromEntityWithoutCount(updated);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));

        if (!category.getChallenges().isEmpty()) {
            throw new IllegalStateException("Cannot delete category with existing challenges. Please reassign or delete challenges first.");
        }

        categoryRepository.delete(category);
    }
}
