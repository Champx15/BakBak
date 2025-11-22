package com.champ.ChatApp.model;

public class Message {
    private String name;
    private String message;

    public String getName() {
        return name;
    }

    public Message() {
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
