package com.apiarena.notificationservice.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class NotificationWebSocketConfig implements WebSocketConfigurer {

    public static final String WS_PATH = "/ws/notifications";

    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final JwtWsHandshakeInterceptor jwtWsHandshakeInterceptor;

    public NotificationWebSocketConfig(
            NotificationWebSocketHandler notificationWebSocketHandler,
            JwtWsHandshakeInterceptor jwtWsHandshakeInterceptor
    ) {
        this.notificationWebSocketHandler = notificationWebSocketHandler;
        this.jwtWsHandshakeInterceptor = jwtWsHandshakeInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(notificationWebSocketHandler, WS_PATH)
                .addInterceptors(jwtWsHandshakeInterceptor)
                .setAllowedOrigins(
                        "http://localhost:3000",
                        "http://localhost:5173",
                        "http://127.0.0.1:3000",
                        "http://127.0.0.1:5173");
    }
}
