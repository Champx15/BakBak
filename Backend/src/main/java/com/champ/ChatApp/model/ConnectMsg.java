package com.champ.ChatApp.model;

public class ConnectMsg {
    private String userId;

    public ConnectMsg() {
    }

    public ConnectMsg(String userId) {
        this.userId = userId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
