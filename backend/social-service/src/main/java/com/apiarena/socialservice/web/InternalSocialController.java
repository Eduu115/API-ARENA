package com.apiarena.socialservice.web;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.socialservice.service.InternalTokens;
import com.apiarena.socialservice.service.SocialGdprService;

@RestController
@RequestMapping("/internal/users")
public class InternalSocialController {

    private final InternalTokens tokens;
    private final SocialGdprService gdprService;

    public InternalSocialController(InternalTokens tokens, SocialGdprService gdprService) {
        this.tokens = tokens;
        this.gdprService = gdprService;
    }

    @DeleteMapping("/{userId}/data")
    public ResponseEntity<Map<String, Object>> purge(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @PathVariable Long userId) {
        tokens.require(token);
        return ResponseEntity.ok(gdprService.purge(userId));
    }

    @GetMapping("/{userId}/export")
    public ResponseEntity<Map<String, Object>> export(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @PathVariable Long userId) {
        tokens.require(token);
        return ResponseEntity.ok(gdprService.export(userId));
    }
}
