package com.champ.ChatApp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@NoArgsConstructor
@Data
public class Offer {
    public String type;
    Map<String, Object> sdp;
    public String userId;

}
