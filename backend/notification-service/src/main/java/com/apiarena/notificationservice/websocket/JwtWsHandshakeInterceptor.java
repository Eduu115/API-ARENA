package com.apiarena.notificationservice.websocket;

import java.util.Map;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.apiarena.notificationservice.config.IJwtService;

import io.jsonwebtoken.Claims;

@Component
public class JwtWsHandshakeInterceptor implements HandshakeInterceptor {

    private final IJwtService jwtService;

    public JwtWsHandshakeInterceptor(IJwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return false;
        }
        String token = servletRequest.getServletRequest().getParameter("access_token");
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            if (!jwtService.isTokenValid(token)) {
                return false;
            }
            Claims claims = jwtService.extractAllClaims(token);
            Object uid = claims.get("userId");
            if (uid == null) {
                return false;
            }
            long userId = uid instanceof Number n ? n.longValue() : Long.parseLong(uid.toString());
            attributes.put("userId", userId);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {
        // no-op
    }
}
