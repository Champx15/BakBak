package com.champ.ChatApp.config;

import com.champ.ChatApp.controller.RoomController;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketEventListener {

    @Autowired
    private RoomController roomController;
    // userId -> sessionId
//    public static final ConcurrentHashMap<String, String> userSessionMap = new ConcurrentHashMap<>();
    // sessionId -> userId
    public static final ConcurrentHashMap<String, String> sessionUserMap = new ConcurrentHashMap<>();


    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        String userId = sha.getFirstNativeHeader("userId");
//        if (userId != null) {
//            sessionUserMap.put(sha.getSessionId(),userId);
////            userSessionMap.put(userId, sha.getSessionId());
//            System.out.println("Connected: " + userId + " -> " + sha.getSessionId());
//        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String sessionId = StompHeaderAccessor.wrap(event.getMessage()).getSessionId();
        String userId = sessionUserMap.get(sessionId);
        sessionUserMap.remove(sessionId);

        if (userId != null) {  // ← Add this check!
            roomController.managerRooms(userId);
            System.out.println("Disconnected: " + userId);
        } else {
            System.out.println("Disconnected unknown session: " + sessionId);
        }
    }
}
