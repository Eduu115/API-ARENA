package com.apiarena.contentservice.restcontroller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.contentservice.model.dto.ContentDtos.PostPage;
import com.apiarena.contentservice.model.dto.ContentDtos.PublicPost;
import com.apiarena.contentservice.model.dto.ContentDtos.RoadmapResponse;
import com.apiarena.contentservice.model.services.ContentPostService;
import com.apiarena.contentservice.model.services.RoadmapQueryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/content")
@RequiredArgsConstructor
public class PublicContentController {

    private final ContentPostService posts;
    private final RoadmapQueryService roadmap;

    @GetMapping("/posts")
    public PostPage posts(
            @RequestParam(defaultValue = "NEWS") String type,
            @RequestParam(defaultValue = "en") String locale,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        boolean includeBody = "CHANGELOG".equalsIgnoreCase(type);
        return posts.listPublic(type, locale, page, size, includeBody);
    }

    @GetMapping("/posts/{slug}")
    public PublicPost post(@PathVariable String slug, @RequestParam(defaultValue = "en") String locale) {
        return posts.getPublic(slug, locale);
    }

    @GetMapping("/roadmap")
    public RoadmapResponse roadmap(@RequestParam(defaultValue = "en") String locale) {
        return roadmap.roadmap(locale);
    }
}
