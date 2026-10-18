package com.apiarena.contentservice.model.services;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.contentservice.markdown.SafeMarkdown;
import com.apiarena.contentservice.model.dto.ContentDtos.AdminPostResponse;
import com.apiarena.contentservice.model.dto.ContentDtos.AdminPostSummary;
import com.apiarena.contentservice.model.dto.ContentDtos.ManualTranslation;
import com.apiarena.contentservice.model.dto.ContentDtos.PostPage;
import com.apiarena.contentservice.model.dto.ContentDtos.PublicPost;
import com.apiarena.contentservice.model.dto.ContentDtos.SavePostRequest;
import com.apiarena.contentservice.model.dto.ContentDtos.TranslationView;
import com.apiarena.contentservice.model.entities.ContentPost;
import com.apiarena.contentservice.model.entities.ContentPostTag;
import com.apiarena.contentservice.model.entities.ContentPostTranslation;
import com.apiarena.contentservice.model.entities.ContentTag;
import com.apiarena.contentservice.model.entities.PostStatus;
import com.apiarena.contentservice.model.entities.PostType;
import com.apiarena.contentservice.repository.ContentPostRepository;
import com.apiarena.contentservice.repository.ContentPostTagRepository;
import com.apiarena.contentservice.repository.ContentPostTranslationRepository;
import com.apiarena.contentservice.repository.ContentTagRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContentPostService {

    public static final String TRANSLATION_UNAVAILABLE = "TRANSLATION_UNAVAILABLE";

    private final ContentPostRepository posts;
    private final ContentPostTranslationRepository translations;
    private final ContentTagRepository tags;
    private final ContentPostTagRepository postTags;
    private final MachineTranslator translator;

    @Transactional
    public AdminPostResponse create(SavePostRequest request, Long authorId) {
        if (authorId == null) {
            throw new ContentException(HttpStatus.UNAUTHORIZED, "CONTENT_UNAUTHENTICATED", "Sign in is required");
        }
        ContentPost post = new ContentPost();
        post.setAuthorId(authorId);
        post.setStatus(PostStatus.DRAFT);
        apply(post, request, null);
        posts.save(post);
        String warning = syncTranslation(post, request.other(), false);
        replaceTags(post, request.tags());
        return toAdmin(posts.save(post), warning);
    }

    @Transactional
    public AdminPostResponse update(Long id, SavePostRequest request) {
        ContentPost post = load(id);
        apply(post, request, id);
        String warning = syncTranslation(post, request.other(), false);
        replaceTags(post, request.tags());
        return toAdmin(posts.save(post), warning);
    }

    @Transactional
    public AdminPostResponse publish(Long id) {
        ContentPost post = load(id);
        post.setStatus(PostStatus.PUBLISHED);
        if (post.getPublishedAt() == null) post.setPublishedAt(Instant.now());
        String warning = syncTranslation(post, null, false);
        return toAdmin(posts.save(post), warning);
    }

    @Transactional
    public AdminPostResponse archive(Long id) {
        ContentPost post = load(id);
        post.setStatus(PostStatus.ARCHIVED);
        return toAdmin(posts.save(post), null);
    }

    @Transactional
    public AdminPostResponse retranslate(Long id) {
        ContentPost post = load(id);
        String warning = syncTranslation(post, null, true);
        return toAdmin(posts.save(post), warning);
    }

    @Transactional(readOnly = true)
    public AdminPostResponse getAdmin(Long id) {
        return toAdmin(load(id), null);
    }

    @Transactional(readOnly = true)
    public PostPage listAdmin(String type, String status, int page, int size) {
        PageRequest request = PageRequest.of(clampPage(page), clampSize(size));
        Page<ContentPost> result = queryAdmin(parseType(type, true), parseStatus(status, true), request);
        List<Long> ids = result.getContent().stream().map(ContentPost::getId).toList();
        Map<Long, List<ContentPostTranslation>> byPost = groupTranslations(ids);
        List<AdminPostSummary> items = new ArrayList<>();
        for (ContentPost post : result.getContent()) {
            ContentPostTranslation source = pick(byPost.get(post.getId()), post.getSourceLocale());
            items.add(new AdminPostSummary(
                    post.getId(),
                    post.getType().name(),
                    post.getSlug(),
                    post.getStatus().name(),
                    post.getSourceLocale(),
                    source == null ? "" : source.getTitle(),
                    post.getVersionLabel(),
                    post.getPublishedAt(),
                    post.getUpdatedAt()
            ));
        }
        return new PostPage(items, result.getNumber(), result.getSize(), result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PostPage listPublic(String type, String locale, int page, int size, boolean includeBody) {
        PostType postType = parseType(type, false);
        String requested = localeOf(locale);
        Page<ContentPost> result = posts.findByTypeAndStatusOrderByPublishedAtDesc(
                postType, PostStatus.PUBLISHED, PageRequest.of(clampPage(page), clampSize(size)));
        List<Long> ids = result.getContent().stream().map(ContentPost::getId).toList();
        Map<Long, List<ContentPostTranslation>> byPost = groupTranslations(ids);
        Map<Long, List<String>> tagMap = tagsFor(ids);
        List<PublicPost> items = new ArrayList<>();
        for (ContentPost post : result.getContent()) {
            items.add(toPublic(post, byPost.get(post.getId()), tagMap.getOrDefault(post.getId(), List.of()), requested, includeBody));
        }
        return new PostPage(items, result.getNumber(), result.getSize(), result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PublicPost getPublic(String slug, String locale) {
        ContentPost post = posts.findBySlug(slug)
                .filter(p -> p.getStatus() == PostStatus.PUBLISHED)
                .orElseThrow(() -> new ContentException(HttpStatus.NOT_FOUND, "CONTENT_NOT_FOUND", "Post not found"));
        List<ContentPostTranslation> rows = translations.findByPostIdIn(List.of(post.getId()));
        return toPublic(post, rows, tagsFor(List.of(post.getId())).getOrDefault(post.getId(), List.of()), localeOf(locale), true);
    }

    private void apply(ContentPost post, SavePostRequest request, Long currentId) {
        PostType type = parseType(request.type(), false);
        String source = localeOf(request.sourceLocale());
        String slug = slugOf(request.slug(), request.title());
        boolean taken = currentId == null
                ? posts.existsBySlug(slug)
                : posts.existsBySlugAndIdNot(slug, currentId);
        if (taken) {
            throw new ContentException(HttpStatus.CONFLICT, "CONTENT_SLUG_TAKEN", "That slug is already used");
        }
        String cover = blank(request.coverImageUrl());
        if (cover != null && SafeMarkdown.safeUrl(cover) == null) {
            throw new ContentException(HttpStatus.BAD_REQUEST, "CONTENT_BAD_COVER", "Cover image must be an http(s) URL");
        }
        post.setType(type);
        post.setSourceLocale(source);
        post.setSlug(slug);
        post.setVersionLabel(blank(request.versionLabel()));
        post.setCoverImageUrl(cover);
        ContentPostTranslation sourceRow = findLocale(post, source).orElseGet(() -> {
            ContentPostTranslation created = new ContentPostTranslation();
            created.setPost(post);
            created.setLocale(source);
            post.getTranslations().add(created);
            return created;
        });
        sourceRow.setTitle(request.title().trim());
        sourceRow.setExcerpt(blank(request.excerpt()));
        sourceRow.setBodyMd(request.bodyMd());
        sourceRow.setMachineTranslated(false);
        sourceRow.setTranslatedAt(null);
    }

    /**
     * Writes the other locale. A manual edit is stored as human text.
     * Otherwise DeepL fills a missing or still-machine translation.
     * Failure leaves every existing row in place.
     */
    private String syncTranslation(ContentPost post, ManualTranslation manual, boolean force) {
        String otherLocale = "en".equals(post.getSourceLocale()) ? "es" : "en";
        if (manual != null) {
            if (!otherLocale.equals(manual.locale())) {
                throw new ContentException(HttpStatus.BAD_REQUEST, "CONTENT_BAD_LOCALE", "Manual translation must be the other locale");
            }
            if (manual.title() == null || manual.title().isBlank() || manual.bodyMd() == null || manual.bodyMd().isBlank()) {
                throw new ContentException(HttpStatus.BAD_REQUEST, "CONTENT_BAD_TRANSLATION", "A manual translation needs a title and a body");
            }
            ContentPostTranslation row = findLocale(post, otherLocale).orElseGet(() -> {
                ContentPostTranslation created = new ContentPostTranslation();
                created.setPost(post);
                created.setLocale(otherLocale);
                post.getTranslations().add(created);
                return created;
            });
            row.setTitle(manual.title().trim());
            row.setExcerpt(blank(manual.excerpt()));
            row.setBodyMd(manual.bodyMd());
            row.setMachineTranslated(false);
            row.setTranslatedAt(Instant.now());
            return null;
        }
        Optional<ContentPostTranslation> existing = findLocale(post, otherLocale);
        if (!force && existing.isPresent() && !existing.get().isMachineTranslated()) {
            return null;
        }
        ContentPostTranslation source = findLocale(post, post.getSourceLocale())
                .orElseThrow(() -> new ContentException(HttpStatus.BAD_REQUEST, "CONTENT_NO_SOURCE", "Source text is missing"));
        List<String> translated = translator.translate(
                List.of(source.getTitle(), source.getExcerpt() == null ? "" : source.getExcerpt(), source.getBodyMd()),
                post.getSourceLocale(),
                otherLocale
        );
        if (translated == null || translated.size() != 3) {
            return TRANSLATION_UNAVAILABLE;
        }
        ContentPostTranslation row = existing.orElseGet(() -> {
            ContentPostTranslation created = new ContentPostTranslation();
            created.setPost(post);
            created.setLocale(otherLocale);
            post.getTranslations().add(created);
            return created;
        });
        row.setTitle(translated.get(0));
        row.setExcerpt(blank(translated.get(1)));
        row.setBodyMd(translated.get(2));
        row.setMachineTranslated(true);
        row.setTranslatedAt(Instant.now());
        return null;
    }

    private void replaceTags(ContentPost post, List<String> raw) {
        if (post.getId() != null) postTags.deleteByPostId(post.getId());
        if (raw == null) return;
        int count = 0;
        for (String value : raw) {
            if (value == null || value.isBlank()) continue;
            if (count >= 12) break;
            String slug = value.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9-]", "");
            if (slug.isBlank() || slug.length() > 40) continue;
            ContentTag tag = tags.findBySlug(slug).orElseGet(() -> {
                ContentTag created = new ContentTag();
                created.setSlug(slug);
                return tags.save(created);
            });
            ContentPostTag link = new ContentPostTag();
            link.setPost(post);
            link.setTag(tag);
            postTags.save(link);
            count++;
        }
    }

    private PublicPost toPublic(ContentPost post, List<ContentPostTranslation> rows, List<String> tagSlugs, String requested, boolean includeBody) {
        ContentPostTranslation chosen = pick(rows, requested);
        boolean fallback = false;
        if (chosen == null) {
            chosen = pick(rows, post.getSourceLocale());
            fallback = chosen != null;
        }
        if (chosen == null && rows != null && !rows.isEmpty()) {
            chosen = rows.get(0);
            fallback = true;
        }
        if (chosen == null) {
            throw new ContentException(HttpStatus.NOT_FOUND, "CONTENT_NOT_FOUND", "Post not found");
        }
        String body = includeBody ? chosen.getBodyMd() : null;
        return new PublicPost(
                post.getType().name(),
                post.getSlug(),
                chosen.getTitle(),
                chosen.getExcerpt(),
                body,
                includeBody ? SafeMarkdown.toHtml(body) : null,
                chosen.getLocale(),
                requested,
                fallback || !requested.equals(chosen.getLocale()),
                post.getVersionLabel(),
                post.getCoverImageUrl(),
                post.getPublishedAt(),
                post.getUpdatedAt(),
                tagSlugs
        );
    }

    private AdminPostResponse toAdmin(ContentPost post, String warning) {
        List<TranslationView> views = new ArrayList<>();
        for (ContentPostTranslation row : post.getTranslations()) {
            views.add(new TranslationView(
                    row.getLocale(), row.getTitle(), row.getExcerpt(), row.getBodyMd(),
                    row.isMachineTranslated(), row.getTranslatedAt()));
        }
        List<String> tagSlugs = post.getId() == null
                ? List.of()
                : tagsFor(List.of(post.getId())).getOrDefault(post.getId(), List.of());
        return new AdminPostResponse(
                post.getId(),
                post.getType().name(),
                post.getSlug(),
                post.getStatus().name(),
                post.getSourceLocale(),
                post.getVersionLabel(),
                post.getCoverImageUrl(),
                post.getAuthorId(),
                post.getPublishedAt(),
                post.getUpdatedAt(),
                tagSlugs,
                views,
                warning
        );
    }

    private Map<Long, List<ContentPostTranslation>> groupTranslations(List<Long> ids) {
        Map<Long, List<ContentPostTranslation>> grouped = new LinkedHashMap<>();
        if (ids.isEmpty()) return grouped;
        for (ContentPostTranslation row : translations.findByPostIdIn(ids)) {
            grouped.computeIfAbsent(row.getPost().getId(), key -> new ArrayList<>()).add(row);
        }
        return grouped;
    }

    private Map<Long, List<String>> tagsFor(List<Long> ids) {
        Map<Long, List<String>> grouped = new LinkedHashMap<>();
        if (ids.isEmpty()) return grouped;
        for (ContentPostTag link : postTags.findByPostIdIn(ids)) {
            grouped.computeIfAbsent(link.getPost().getId(), key -> new ArrayList<>()).add(link.getTag().getSlug());
        }
        return grouped;
    }

    private static ContentPostTranslation pick(List<ContentPostTranslation> rows, String locale) {
        if (rows == null) return null;
        for (ContentPostTranslation row : rows) {
            if (locale.equals(row.getLocale())) return row;
        }
        return null;
    }

    private static Optional<ContentPostTranslation> findLocale(ContentPost post, String locale) {
        return post.getTranslations().stream().filter(row -> locale.equals(row.getLocale())).findFirst();
    }

    private ContentPost load(Long id) {
        return posts.findById(id).orElseThrow(() ->
                new ContentException(HttpStatus.NOT_FOUND, "CONTENT_NOT_FOUND", "Post not found"));
    }

    private Page<ContentPost> queryAdmin(PostType type, PostStatus status, PageRequest request) {
        if (type != null && status != null) {
            return posts.findByTypeAndStatusOrderByPublishedAtDesc(type, status, request);
        }
        if (type != null) return posts.findByTypeOrderByUpdatedAtDesc(type, request);
        if (status != null) return posts.findByStatusOrderByUpdatedAtDesc(status, request);
        return posts.findAllByOrderByUpdatedAtDesc(request);
    }

    static PostType parseType(String raw, boolean optional) {
        if (raw == null || raw.isBlank()) {
            if (optional) return null;
            throw new ContentException(HttpStatus.BAD_REQUEST, "CONTENT_BAD_TYPE", "Type must be NEWS or CHANGELOG");
        }
        try {
            return PostType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ContentException(HttpStatus.BAD_REQUEST, "CONTENT_BAD_TYPE", "Type must be NEWS or CHANGELOG");
        }
    }

    static PostStatus parseStatus(String raw, boolean optional) {
        if (raw == null || raw.isBlank()) {
            if (optional) return null;
            throw new ContentException(HttpStatus.BAD_REQUEST, "CONTENT_BAD_STATUS", "Unknown status");
        }
        try {
            return PostStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ContentException(HttpStatus.BAD_REQUEST, "CONTENT_BAD_STATUS", "Unknown status");
        }
    }

    static String localeOf(String raw) {
        if (raw == null) {
            throw new ContentException(HttpStatus.BAD_REQUEST, "CONTENT_BAD_LOCALE", "Locale must be en or es");
        }
        String locale = raw.trim().toLowerCase(Locale.ROOT);
        if (!locale.equals("en") && !locale.equals("es")) {
            throw new ContentException(HttpStatus.BAD_REQUEST, "CONTENT_BAD_LOCALE", "Locale must be en or es");
        }
        return locale;
    }

    static String slugOf(String requested, String title) {
        String base = (requested == null || requested.isBlank()) ? title : requested;
        String slug = base.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        if (slug.isBlank() || slug.length() > 160) {
            throw new ContentException(HttpStatus.BAD_REQUEST, "CONTENT_BAD_SLUG", "Slug must be 1-160 letters, numbers or hyphens");
        }
        return slug;
    }

    private static String blank(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static int clampPage(int page) {
        return Math.max(page, 0);
    }

    private static int clampSize(int size) {
        if (size < 1) return 20;
        return Math.min(size, 50);
    }
}
