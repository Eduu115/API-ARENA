package com.apiarena.challengeservice.config;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private IJwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);
            final String userEmail = jwtService.extractUsername(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                if (jwtService.isTokenValid(jwt)) {
                    Claims claims = jwtService.extractAllClaims(jwt);
                    List<SimpleGrantedAuthority> authorities = extractAuthorities(claims);

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userEmail,
                            null,
                            authorities
                    );

                    Map<String, Object> details = new HashMap<>();
                    details.put("web", new WebAuthenticationDetailsSource().buildDetails(request));
                    Object userId = claims.get("userId");
                    if (userId != null) details.put("userId", userId);
                    authToken.setDetails(details);

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * El claim {@code authorities} puede llegar como {@code List<String>} u otros tipos según el deserializado JWT;
     * si falla el parseo y se cae a STUDENT, {@code @PreAuthorize} devuelve 403 para profesores.
     */
    private List<SimpleGrantedAuthority> extractAuthorities(Claims claims) {
        Object raw = claims.get("authorities");
        if (raw instanceof List<?> list && !list.isEmpty()) {
            List<SimpleGrantedAuthority> out = new ArrayList<>();
            for (Object o : list) {
                if (o == null) {
                    continue;
                }
                String name = (o instanceof String s) ? s : String.valueOf(o);
                if (!name.isBlank()) {
                    out.add(new SimpleGrantedAuthority(name));
                }
            }
            if (!out.isEmpty()) {
                return out;
            }
        }
        String role = claims.get("role", String.class);
        if (role != null && !role.isBlank()) {
            String r = role.startsWith("ROLE_") ? role : "ROLE_" + role;
            return List.of(new SimpleGrantedAuthority(r));
        }
        logger.warn("JWT sin authorities ni role reconocibles; usando ROLE_STUDENT");
        return List.of(new SimpleGrantedAuthority("ROLE_STUDENT"));
    }
}
