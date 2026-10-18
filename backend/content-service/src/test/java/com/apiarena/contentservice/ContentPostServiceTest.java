package com.apiarena.contentservice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.apiarena.contentservice.model.dto.ContentDtos.AdminPostResponse;
import com.apiarena.contentservice.model.dto.ContentDtos.TranslationView;
import com.apiarena.contentservice.model.dto.ContentDtos.SavePostRequest;
import com.apiarena.contentservice.model.entities.ContentPost;
import com.apiarena.contentservice.model.entities.ContentPostTranslation;
import com.apiarena.contentservice.model.entities.PostStatus;
import com.apiarena.contentservice.model.entities.PostType;
import com.apiarena.contentservice.model.services.ContentPostService;
import com.apiarena.contentservice.model.services.MachineTranslator;
import com.apiarena.contentservice.repository.ContentPostRepository;
import com.apiarena.contentservice.repository.ContentPostTagRepository;
import com.apiarena.contentservice.repository.ContentPostTranslationRepository;
import com.apiarena.contentservice.repository.ContentTagRepository;

@ExtendWith(MockitoExtension.class)
class ContentPostServiceTest {

    @Mock ContentPostRepository posts;
    @Mock ContentPostTranslationRepository translations;
    @Mock ContentTagRepository tags;
    @Mock ContentPostTagRepository postTags;
    @Mock MachineTranslator translator;

    ContentPostService service;

    @BeforeEach
    void setUp() {
        service = new ContentPostService(posts, translations, tags, postTags, translator);
        when(posts.save(any())).thenAnswer(invocation -> {
            ContentPost post = invocation.getArgument(0);
            if (post.getId() == null) post.setId(5L);
            return post;
        });
    }

    @Test
    void keepsSourceTextWhenDeepLReturnsNothing() {
        when(posts.existsBySlug("hello")).thenReturn(false);
        when(translator.translate(any(), any(), any())).thenReturn(null);
        AdminPostResponse saved = service.create(request(null), 9L);
        assertEquals(ContentPostService.TRANSLATION_UNAVAILABLE, saved.translationWarning());
        assertEquals(1, saved.translations().size());
        assertEquals("Hello", saved.translations().get(0).title());
        assertEquals("en", saved.translations().get(0).locale());
        assertFalse(saved.translations().get(0).machineTranslated());
    }

    @Test
    void marksGeneratedLocaleAsMachineTranslated() {
        when(posts.existsBySlug("hello")).thenReturn(false);
        when(translator.translate(any(), any(), any())).thenReturn(List.of("Hola", "Resumen", "Cuerpo"));
        AdminPostResponse saved = service.create(request(null), 9L);
        assertEquals(null, saved.translationWarning());
        TranslationView es = saved.translations().stream()
                .filter(row -> "es".equals(row.locale())).findFirst().orElseThrow();
        assertEquals("Hola", es.title());
        assertTrue(es.machineTranslated());
    }

    @Test
    void doesNotOverwriteAHumanTranslationUnlessForced() {
        ContentPost post = existing();
        when(posts.findById(5L)).thenReturn(Optional.of(post));
        when(posts.existsBySlugAndIdNot("hello", 5L)).thenReturn(false);
        AdminPostResponse saved = service.update(5L, request(null));
        assertEquals("Manual", saved.translations().stream().filter(row -> "es".equals(row.locale())).findFirst().orElseThrow().title());
        verify(translator, never()).translate(any(), any(), any());

        when(translator.translate(any(), any(), any())).thenReturn(List.of("Nueva", "", "Cuerpo"));
        AdminPostResponse again = service.retranslate(5L);
        assertEquals("Nueva", again.translations().stream().filter(row -> "es".equals(row.locale())).findFirst().orElseThrow().title());
        assertTrue(again.translations().stream().filter(row -> "es".equals(row.locale())).findFirst().orElseThrow().machineTranslated());
        verify(posts, never()).delete(any());
        verify(translations, never()).delete(any());
        verify(postTags, never()).delete(any());
    }

    private static SavePostRequest request(com.apiarena.contentservice.model.dto.ContentDtos.ManualTranslation other) {
        return new SavePostRequest("NEWS", "hello", "en", null, null, "Hello", "Excerpt", "Body", List.of(), other);
    }

    private static ContentPost existing() {
        ContentPost post = new ContentPost();
        post.setId(5L);
        post.setType(PostType.NEWS);
        post.setSlug("hello");
        post.setStatus(PostStatus.DRAFT);
        post.setSourceLocale("en");
        post.setAuthorId(9L);
        post.setTranslations(new ArrayList<>());
        post.getTranslations().add(row(post, "en", "Hello", false));
        post.getTranslations().add(row(post, "es", "Manual", false));
        return post;
    }

    private static ContentPostTranslation row(ContentPost post, String locale, String title, boolean machine) {
        ContentPostTranslation row = new ContentPostTranslation();
        row.setPost(post);
        row.setLocale(locale);
        row.setTitle(title);
        row.setBodyMd("Body");
        row.setMachineTranslated(machine);
        return row;
    }
}
