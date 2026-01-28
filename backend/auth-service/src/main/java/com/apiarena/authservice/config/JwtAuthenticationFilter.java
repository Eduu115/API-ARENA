package com.apiarena.authservice.config;

import com.apiarena.authservice.model.services.JwtService;
import com.apiarena.authservice.model.services.UserService;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {
        // Extraer el header Auth
        final String authHeader = request.getHeader("Authorization");
        
        // Si no hay header o no empieza con "Bearer ", continuar sin autenticar
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extraer el token (quitar "Bearer ")
        final String jwt = authHeader.substring(7);
        final String userEmail;

        // Try 1: Extraer el email del token JWT
        try {
            userEmail = jwtService.extractUsername(jwt);
        } catch (MalformedJwtException e) { // no manejaria los errores de esta manera, pero es para las buenas practicas y si no, me sale en amarillo
            logger.error("Token JWT mal formado", e); // tanto en este, como en los demas, porque son excepciones que no voy a manejar, 
                                                      // sino que las manejo en el exception handler, si no, me sale en amarillo,
                                                      //  pero en este caso, no me interesa manejarlo
            filterChain.doFilter(request, response);
            return;
        } catch (ExpiredJwtException e) {
            logger.error("Token JWT expirado", e);
            filterChain.doFilter(request, response);
            return;
        } catch (SignatureException e) {
            logger.error("Firma del token JWT inválida", e);
            filterChain.doFilter(request, response);
            return;
        } catch (UnsupportedJwtException e) {
            logger.error("Token JWT no soportado", e);
            filterChain.doFilter(request, response);
            return;
        } catch (IllegalArgumentException e) {
            logger.error("Token JWT vacío o inválido", e);
            filterChain.doFilter(request, response);
            return;
        } catch (JwtException e) {
            logger.error("Error al procesar el token JWT", e);
            filterChain.doFilter(request, response);
            return;
        } 

        // Si hay email y el usuario no está ya autenticado
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            final UserDetails userDetails;

            // Try 2: Cargar el usuario de la base de datos
            try {
                userDetails = userService.loadUserByUsername(userEmail);
            } catch (UsernameNotFoundException e) {
                logger.error("Usuario no encontrado", e);
                filterChain.doFilter(request, response);
                return;
            } catch (NullPointerException e) {
                logger.error("Error de referencia nula al cargar usuario", e);
                filterChain.doFilter(request, response);
                return;
            } catch (DataAccessException e) {
                logger.error("Error de acceso a datos", e);
                filterChain.doFilter(request, response);
                return;
            }

            // Try 3: Validar el token y establecer autenticación
            try {
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    // Crear authentication token
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

                    // Agregar detalles del request
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    // Establecer en el SecurityContext
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (JwtException | IllegalArgumentException e) {
                logger.error("Error al validar el token", e);
                filterChain.doFilter(request, response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}