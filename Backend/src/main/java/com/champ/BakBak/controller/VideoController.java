package com.champ.BakBak.controller;

import com.champ.BakBak.dto.Offer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class VideoController {

    ConcurrentHashMap<String, String> userToUserMap = RoomController.userToUserMap;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/offer")
    public void onOffer(Offer offer) {
        String userId = offer.getUserId();
        String partnerId = userToUserMap.get(userId);
        System.out.println("Reached at offer from user"+userId+" to "+partnerId);
        Map<String, Object> sdp = offer.getSdp();
        System.out.println("SDP : "+sdp);
        messagingTemplate.convertAndSend("/queue/offer/" + partnerId, sdp);
        System.out.println("Offer sent");
    }

    @MessageMapping("/answer")
    public void onAnswer(Offer offer) {
        String userId = offer.getUserId();
        String partnerId = userToUserMap.get(userId);
        System.out.println("Reached at answer from user "+userId+" to "+partnerId);
        Map<String, Object> sdp = offer.getSdp();
        System.out.println("SDP : "+sdp);
        messagingTemplate.convertAndSend("/queue/answer/"+partnerId,sdp);
        System.out.println("answer sent");
    }

    @MessageMapping("/candidate")
    public void handleCandidate(Map<String, Object> candidate) {
        String userId = (String) candidate.get("userId");
        String partnerId = userToUserMap.get(userId);
        messagingTemplate.convertAndSend("/queue/candidate/" + partnerId, candidate);
    }

}
