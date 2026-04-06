package com.champ.BakBak.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class RoomIdService {
    public String getRoomId(){
        return "chat_"+ LocalDateTime.now();
    }
}
