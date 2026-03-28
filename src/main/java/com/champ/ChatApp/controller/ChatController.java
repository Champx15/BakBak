package com.champ.ChatApp.controller;

import com.champ.ChatApp.dto.PerspectiveResponse;
import com.champ.ChatApp.model.Message;
import com.champ.ChatApp.service.PerspectiveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import java.time.LocalDateTime;
import java.util.List;

@Controller
public class ChatController {

    @Autowired private PerspectiveService perspectiveService;

    @MessageMapping("/room/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public Message send(@DestinationVariable String roomId, Message msg) {
        System.out.println(msg.getName()+": "+msg.getMessage());
        PerspectiveResponse response = perspectiveService.apiCall(msg.getMessage());
        boolean toxic = perspectiveService.isToxic(response)
                || containsIndianSwear(msg.getMessage());
        if(!toxic) return msg;
        return new Message(msg.getName(),""); // returned object is sent to subscribers
    }

    public boolean containsIndianSwear(String message){
     final List<String> INDIAN_SWEARS = List.of(
            "mc", "bc", "bkl", "chutiya", "madarchod", "bhenchod",
            "lund", "gandu", "harami", "randi"
    );
        String msg = message.toLowerCase();

        for(String swear : INDIAN_SWEARS){
            if(msg.contains(swear)){
                return true;
            }
        }

        return false;
    }

//    @MessageMapping("/room2")          // messages sent from client to this endpoint
//    @SendTo("/topic/room2")       // messages broadcasted to subscribers
//    public Message send1( Message msg) {
//        System.out.println(msg.getMessage());
//        return msg; // returned object is sent to subscribers
//    }
}
