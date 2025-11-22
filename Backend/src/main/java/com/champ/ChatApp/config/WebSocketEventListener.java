package com.champ.ChatApp.config;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketEventListener {

    // userId -> sessionId
    public static final ConcurrentHashMap<String, String> userSessionMap = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        String userId = sha.getFirstNativeHeader("userId");
        if (userId != null) {
            userSessionMap.put(userId, sha.getSessionId());
            System.out.println("Connected: " + userId + " -> " + sha.getSessionId());
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String sessionId = StompHeaderAccessor.wrap(event.getMessage()).getSessionId();
        userSessionMap.entrySet().removeIf(e -> e.getValue().equals(sessionId));
        System.out.println("Disconnected: " + sessionId);
    }
}
