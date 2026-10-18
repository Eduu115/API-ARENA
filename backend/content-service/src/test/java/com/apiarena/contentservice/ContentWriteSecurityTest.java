package com.apiarena.contentservice;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.apiarena.contentservice.config.JwtAuthenticationFilter;
import com.apiarena.contentservice.config.JwtProperties;
import com.apiarena.contentservice.config.JwtService;
import com.apiarena.contentservice.config.SecurityConfig;
import com.apiarena.contentservice.model.dto.ContentDtos.AdminPostResponse;
import com.apiarena.contentservice.model.dto.ContentDtos.PostPage;
import com.apiarena.contentservice.model.dto.ContentDtos.SavePostRequest;
import com.apiarena.contentservice.model.services.ContentPostService;
import com.apiarena.contentservice.restcontroller.AdminContentController;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@WebMvcTest(controllers = AdminContentController.class)
@AutoConfigureMockMvc
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, JwtProperties.class})
@TestPropertySource(properties = "jwt.secret=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=")
class ContentWriteSecurityTest {

    private static final SecretKey KEY = Keys.hmacShaKeyFor(
            Decoders.BASE64.decode("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY="));

    @Autowired MockMvc mvc;
    @MockitoBean ContentPostService posts;

    private static final String BODY = """
            {"type":"NEWS","sourceLocale":"en","title":"Hello","bodyMd":"Body"}
            """;

    @Test
    void writesRequireAdminAndContentCapability() throws Exception {
        when(posts.listAdmin(any(), any(), anyInt(), anyInt())).thenReturn(new PostPage(List.of(), 0, 20, 0));
        when(posts.create(any(SavePostRequest.class), any())).thenReturn(new AdminPostResponse(
                1L, "NEWS", "hello", "DRAFT", "en", null, null, 1L, null, null, List.of(), List.of(), null));
        mvc.perform(post("/api/content/admin/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/content/admin/posts")
                        .header("Authorization", "Bearer " + token("ROLE_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/content/admin/posts")
                        .header("Authorization", "Bearer " + token("ROLE_STUDENT", "CAP_CONTENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/content/admin/posts")
                        .header("Authorization", "Bearer " + token("ROLE_ADMIN", "CAP_CONTENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isOk());

        mvc.perform(get("/api/content/admin/posts")
                        .header("Authorization", "Bearer " + token("ROLE_ADMIN", "CAP_CONTENT")))
                .andExpect(status().isOk());
    }

    private static String token(String... authorities) {
        return Jwts.builder()
                .subject("sysop@apiarena.dev")
                .claim("authorities", List.of(authorities))
                .claim("userId", 1)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(KEY)
                .compact();
    }
}
