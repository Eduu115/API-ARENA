package com.apiarena.contentservice.restcontroller;

import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.contentservice.config.SecurityConfig;
import com.apiarena.contentservice.markdown.MarkdownImport;
import com.apiarena.contentservice.model.dto.ContentDtos.AdminPostResponse;
import com.apiarena.contentservice.model.dto.ContentDtos.ImportResponse;
import com.apiarena.contentservice.model.dto.ContentDtos.PostPage;
import com.apiarena.contentservice.model.dto.ContentDtos.SavePostRequest;
import com.apiarena.contentservice.model.services.ContentPostService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Every method requires ADMIN + CAP_CONTENT. That authority is minted by
 * auth-service after T1 (AdminCapability.CONTENT) is deployed.
 */
@RestController
@RequestMapping("/api/content/admin")
@PreAuthorize(SecurityConfig.CONTENT_WRITE)
@RequiredArgsConstructor
public class AdminContentController {

    private final ContentPostService posts;

    @GetMapping("/posts")
    public PostPage list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return posts.listAdmin(type, status, page, size);
    }

    @GetMapping("/posts/{id}")
    public AdminPostResponse get(@PathVariable Long id) {
        return posts.getAdmin(id);
    }

    @PostMapping("/posts")
    public AdminPostResponse create(@Valid @RequestBody SavePostRequest body, Authentication auth) {
        return posts.create(body, userId(auth));
    }

    @PutMapping("/posts/{id}")
    public AdminPostResponse update(@PathVariable Long id, @Valid @RequestBody SavePostRequest body) {
        return posts.update(id, body);
    }

    @PostMapping("/posts/{id}/publish")
    public AdminPostResponse publish(@PathVariable Long id) {
        return posts.publish(id);
    }

    @PostMapping("/posts/{id}/archive")
    public AdminPostResponse archive(@PathVariable Long id) {
        return posts.archive(id);
    }

    @PostMapping("/posts/{id}/retranslate")
    public AdminPostResponse retranslate(@PathVariable Long id) {
        return posts.retranslate(id);
    }

    @PostMapping(value = "/import", consumes = {MediaType.TEXT_PLAIN_VALUE, "text/markdown", MediaType.ALL_VALUE})
    public ImportResponse importMarkdown(@RequestBody String markdown) {
        MarkdownImport.Imported imported = MarkdownImport.parse(markdown);
        return new ImportResponse(imported.title(), imported.version(), imported.tags(), imported.body());
    }

    static Long userId(Authentication auth) {
        if (auth == null || !(auth.getDetails() instanceof Map<?, ?> details)) return null;
        Object raw = details.get("userId");
        if (raw instanceof Number number) return number.longValue();
        if (raw instanceof String text && !text.isBlank()) {
            try {
                return Long.parseLong(text);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
