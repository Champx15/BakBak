import { Client } from "@stomp/stompjs";
import conf from "../conf/conf";

let stompClient = null;
let messageCallback = null;
let connectionCallback = null;
let roomId=null;
let isConnecting = false;
const userId = "user" + Math.floor(Math.random() * 10000);

function initiateConnection(onMessageReceived, onConnected) {
  if (stompClient?.connected) {
    console.log("✓ WebSocket already connected");
    if (onConnected) onConnected();
    return;
  }

  messageCallback = onMessageReceived;
  connectionCallback = onConnected;

  let wsURL;
  
  try {
    const apiUrl = new URL(conf.apiBase);
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    wsURL = `${protocol}//${apiUrl.host}${apiUrl.pathname}ws`;
    console.log("🔧 WebSocket URL:", wsURL);
  } catch (error) {
    console.error("❌ Error parsing conf.apiBase:", error);
    return;
  }

  stompClient = new Client({
    brokerURL: wsURL,
       connectHeaders: {
      'Accept-Language': 'en-US',
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    onConnect: () => {
      console.log("✅ WebSocket Connected");

      stompClient.subscribe('/queue/match/' + userId, function(message) {
                const match = JSON.parse(message.body);
                roomId = match.roomId;
                isConnecting = false;
                console.log('Matched with ' + match.partnerId + ' in room ' + roomId);

                   const myNum = parseInt(userId.replace('user', ''));
                   const partnerNum = parseInt(match.partnerId.replace('user', ''));

                  //  isCaller = myNum < partnerNum;

                // subscribeToRoom(roomId); 
                });
                 stompClient.subscribe('/queue/disconnect/' + userId, function(msg) {
                    roomId = null;
                        setTimeout(function() {
                            // connect();
                        }, 3000);
                });

            stompClient.send("/app/connect", {}, JSON.stringify({ userId: userId }));
      // subscribeToMessages();
      if (connectionCallback) {
        console.log("🔧 Calling onConnected callback");
        connectionCallback();
      }
    },

    onDisconnect: () => {
      console.log("⚠️ WebSocket Disconnected");
    },

    onStompError: (frame) => {
      console.error("❌ STOMP Error:", frame);
    },

    onWebSocketError: (error) => {
      console.error("❌ WebSocket Error:", error);
    }
  });

  console.log("🔧 Activating STOMP client...");
  stompClient.activate();
}

function subscribeToMessages() {
  if (!stompClient?.connected) {
    console.error("❌ Cannot subscribe: WebSocket not connected");
    return;
  }

  console.log("📌 Subscribing to /user/queue/messages");
  
  stompClient.subscribe(`/user/${currentUserId}/queue/messages`, (frame) => {
    console.log("🎉 CALLBACK FIRED");
    try {
      console.log("📥 Raw frame received:", frame.body);
      
      const message = JSON.parse(frame.body);
      console.log("📨 Parsed message:", message);
      console.log("📨 Message senderId:", message.senderId);
      console.log("📨 Message receiverId:", message.receiverId);
      console.log("📨 Message text:", message.message);
      
      if (messageCallback) {
        console.log("🔄 Calling messageCallback with:", message);
        messageCallback(message);
        console.log("✅ messageCallback executed");
      } else {
        console.error("❌ messageCallback is null!");
      }
    } catch (error) {
      console.error("❌ Error parsing message:", error);
      console.error("❌ Raw body was:", frame.body);
    }
  });
  
  console.log("✅ Subscription successful");
}

function sendMessage(messageData) {
  console.log("📤 Attempting to send:", messageData);
  
  if (!stompClient?.connected) {
    console.error("❌ WebSocket not connected");
    return false;
  }

  try {
    const payload = {
      senderId: messageData.senderId,
      receiverId: messageData.receiverId,
      message: messageData.message,
    };

    console.log("📤 Publishing to /app/chat:", payload);
    
    stompClient.publish({
      destination: "/app/chat",
      body: JSON.stringify(payload),
    });
    
    console.log("✅ Message published");
    return true;
  } catch (error) {
    console.error("❌ Error sending:", error);
    return false;
  }
}

function disconnect() {
  if (stompClient?.connected) {
    stompClient.deactivate();
    console.log("WebSocket disconnected");
  }
}

function isConnected() {
  return stompClient?.connected || false;
}

export { initiateConnection, sendMessage, disconnect, isConnected,subscribeToMessages };