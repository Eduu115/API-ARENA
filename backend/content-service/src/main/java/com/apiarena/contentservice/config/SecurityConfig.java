package com.apiarena.contentservice.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Public reads do not need a JWT. Writes are annotated
 * {@code hasRole('ADMIN') and hasAuthority('CAP_CONTENT')}.
 *
 * CAP_CONTENT is issued by auth-service only after AdminCapability.CONTENT
 * exists (T1). Deploy that auth-service build before this service, or every
 * write is rejected with 403 because the authority is absent from the token.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    public static final String CONTENT_WRITE = "hasRole('ADMIN') and hasAuthority('CAP_CONTENT')";

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .exceptionHandling(ex -> ex
                    .authenticationEntryPoint((req, res, e) -> res.sendError(HttpStatus.UNAUTHORIZED.value()))
                    .accessDeniedHandler((req, res, e) -> res.sendError(HttpStatus.FORBIDDEN.value()))
            )
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers(
                            "/actuator/health",
                            "/actuator/info",
                            "/actuator/prometheus",
                            "/error"
                    ).permitAll()
                    .requestMatchers("/api/content/admin/**").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/content/**").permitAll()
                    .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "https://apiarena.net",
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://[::1]:*"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
