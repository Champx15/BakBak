package com.champ.ChatApp.controller;

import com.champ.ChatApp.model.Message;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import java.time.LocalDateTime;

@Controller
public class ChatController {
    @MessageMapping("/room/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public Message send(@DestinationVariable String roomId, Message msg) {
        System.out.println(msg.getName()+": "+msg.getMessage());
        return msg; // returned object is sent to subscribers
    }

//    @MessageMapping("/room2")          // messages sent from client to this endpoint
//    @SendTo("/topic/room2")       // messages broadcasted to subscribers
//    public Message send1( Message msg) {
//        System.out.println(msg.getMessage());
//        return msg; // returned object is sent to subscribers
//    }
}
