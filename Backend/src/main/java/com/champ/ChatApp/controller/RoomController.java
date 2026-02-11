package com.champ.ChatApp.controller;

import com.champ.ChatApp.config.WebSocketEventListener;
import com.champ.ChatApp.model.ConnectMsg;
import com.champ.ChatApp.service.RoomIdService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.Objects;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Controller
public class RoomController {

    @Autowired
    private RoomIdService roomIdService;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final Queue<String> waitingUsers = new ConcurrentLinkedQueue<>();
    public static final ConcurrentHashMap<String, String> userToUserMap = new ConcurrentHashMap<>();



    @MessageMapping("/connect")
    public void connect(ConnectMsg msg, StompHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String userId = msg.getUserId();

        // Store the mapping HERE, not in WebSocketEventListener!
        WebSocketEventListener.sessionUserMap.put(sessionId, userId);

        waitingUsers.add(userId);
//        waitingUsers.add(msg.getUserId());
        matchUsers();
    }

    private synchronized void matchUsers() {
        if (waitingUsers.size() >= 2) {
            String user1 = waitingUsers.poll();
            String user2 = waitingUsers.poll();

            String roomId = roomIdService.getRoomId();

//            String session1 = WebSocketEventListener.userSessionMap.get(user1);
//            String session2 = WebSocketEventListener.userSessionMap.get(user2);

            messagingTemplate.convertAndSend("/queue/match/" + user1, new MatchResponse(roomId, user2));
            messagingTemplate.convertAndSend("/queue/match/" + user2, new MatchResponse(roomId, user1));
            userToUserMap.put(user1,user2);
            userToUserMap.put(user2,user1);
            System.out.println("Matched " + user1 + " <-> " + user2 + " in room " + roomId);
        }
    }
    public synchronized void managerRooms(String userId){
        String partnerId= userToUserMap.remove(userId);
        userToUserMap.remove(partnerId);
        messagingTemplate.convertAndSend("/queue/disconnect/"+partnerId,"Partner Disconnected");
    }

    static class MatchResponse {
        private String roomId;
        private String partnerId;

        public MatchResponse(String roomId, String partnerId) {
            this.roomId = roomId;
            this.partnerId = partnerId;
        }

        public String getRoomId() { return roomId; }
        public String getPartnerId() { return partnerId; }
    }
}
