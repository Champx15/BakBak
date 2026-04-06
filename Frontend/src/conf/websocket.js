import { Client } from "@stomp/stompjs";

let stompClient = null;
let roomId = null;
let isConnecting = false;
let localStream = null;
let remoteStream = null;
let rtcPeerConnection = null;
let remoteDescriptionPromise = null;
let isCaller = false;

const userId = "user" + Math.floor(Math.random() * 10000);

const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const streamConstraints = {
  video: {
    width: { ideal: 320, max: 480 },
    height: { ideal: 240, max: 360 },
    frameRate: { ideal: 15, max: 15 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

// ==================== BITRATE OPTIMIZATION ====================
function applyBitrateLimit(peerConnection) {
  peerConnection.getSenders().forEach((sender) => {
    if (sender.track && sender.track.kind === "video") {
      const parameters = sender.getParameters();
      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      parameters.encodings[0].maxBitrate = 200000;
      parameters.encodings[0].maxFramerate = 15;
      sender.setParameters(parameters).then(() => {
        console.log("✓ Video optimized for smooth random chat");
      });
    }
  });

  setTimeout(() => {
    peerConnection.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === "video") {
        const settings = sender.track.getSettings();
        console.log(
          `📹 Sending: ${settings.width}x${settings.height} @ ${settings.frameRate}fps`
        );
      }
    });
  }, 2000);
}

// ==================== ICE CANDIDATE HANDLER ====================
const onIceCandidate = (e) => {
  if (e.candidate) {
    console.log("sending ice candidate");
    stompClient.publish({
      destination: "/app/candidate",
      body: JSON.stringify({
        type: "candidate",
        label: e.candidate.sdpMLineIndex,
        id: e.candidate.sdpMid,
        candidate: e.candidate.candidate,
        userId,
      }),
    });
  }
};

// ==================== REMOTE STREAM HANDLER ====================
const onAddStream = (e, onRemoteStreamCallback) => {
  remoteStream = e.streams[0];
  console.log("Remote stream added:", remoteStream);
  if (onRemoteStreamCallback) {
    onRemoteStreamCallback(remoteStream);
  }
};

// ==================== INITIALIZE WEBSOCKET CONNECTION ====================
export function initiateConnection(onMessageReceived, callbacks = {}) {
  const {
    onRemoteStream,
    onConnectionEstablished,
    onConnectionError,
    onDisconnected,
    onLocalStreamReady,
  } = callbacks;

  if (stompClient && stompClient.active) {
    console.log("Already connected");
    return;
  }

  isConnecting = true;

  // Get camera access first
  navigator.mediaDevices
    .getUserMedia(streamConstraints)
    .then((stream) => {
      console.log("✓ Camera access granted!");

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log(
        `Camera settings: ${settings.width}x${settings.height} @ ${settings.frameRate}fps`
      );

      localStream = stream;

      // Notify that local stream is ready
      if (onLocalStreamReady) {
        onLocalStreamReady(stream);
      }

      // Initialize STOMP client
      stompClient = new Client({
        brokerURL: `ws://${window.location.hostname}:8080/ws`, // Change to your backend URL ws://localhost:8080/ws
        onConnect: () => {
          console.log("✓ Connected to WebSocket");
          isConnecting = false;

          // Subscribe to match queue
          stompClient.subscribe(`/queue/match/${userId}`, (message) => {
            const match = JSON.parse(message.body);
            roomId = match.roomId;
            console.log(
              `🎯 Matched with ${match.partnerId} in room ${roomId}`
            );

            if (onConnectionEstablished) {
              onConnectionEstablished(match);
            }

            const myNum = parseInt(userId.replace("user", ""));
            const partnerNum = parseInt(match.partnerId.replace("user", ""));
            isCaller = myNum < partnerNum;

            subscribeToRoom(roomId, onMessageReceived, onRemoteStream);
          });

          // Subscribe to disconnect queue
          stompClient.subscribe(`/queue/disconnect/${userId}`, () => {
            console.log("⚠️ Partner disconnected");
            if (onDisconnected) {
              onDisconnected();
            }
            roomId = null;
            closeRTCConnection();
          });

          // Send connect message
          stompClient.publish({
            destination: "/app/connect",
            body: JSON.stringify({ userId }),
          });

          console.log("✓ Connect request sent");
        },
        onStompError: (frame) => {
          console.error("Broker reported error:", frame.headers.message);
          console.error("Additional details:", frame.body);
          isConnecting = false;
          if (onConnectionError) {
            onConnectionError(frame.body);
          }
        },
        onDisconnect: () => {
          console.log("Disconnected from broker");
          stompClient = null;
        },
      });

      stompClient.activate();
    })
    .catch((error) => {
      console.error("❌ Camera error:", error);
      isConnecting = false;
      if (onConnectionError) {
        onConnectionError(error.message);
      }
    });
}

// ==================== SUBSCRIBE TO ROOM ====================
function subscribeToRoom(roomId, onMessageReceived, onRemoteStream) {
  console.log("isCaller:", isCaller);

  if (isCaller) {
    createOfferAndSubscribe(onMessageReceived, onRemoteStream);
  } else {
    // Answerer waits for offer subscription
    subscribeToOffer(onMessageReceived, onRemoteStream);
  }

  // Subscribe to messages in room
  stompClient.subscribe(`/topic/room/${roomId}`, (message) => {
    const messageObj = JSON.parse(message.body);
    const isSent = messageObj.name === userId;
    console.log(`📨 Message from ${messageObj.name}: ${messageObj.message}`);
    if (onMessageReceived) {
      onMessageReceived({
        sender: isSent ? "local" : "remote",
        text: messageObj.message,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
  });
}

// ==================== CREATE OFFER (CALLER) ====================
function createOfferAndSubscribe(onMessageReceived, onRemoteStream) {
  rtcPeerConnection = new RTCPeerConnection(iceServers);
  rtcPeerConnection.onicecandidate = onIceCandidate;
  rtcPeerConnection.ontrack = (e) => onAddStream(e, onRemoteStream);

  // Add local tracks
  localStream.getTracks().forEach((track) => {
    console.log(`Adding track: ${track.kind}`);
    rtcPeerConnection.addTrack(track, localStream);
  });

  // Create and send offer
  rtcPeerConnection
    .createOffer()
    .then((sessionDescription) => {
      rtcPeerConnection.setLocalDescription(sessionDescription);
      stompClient.publish({
        destination: "/app/offer",
        body: JSON.stringify({
          type: "offer",
          sdp: sessionDescription,
          userId,
        }),
      });
      applyBitrateLimit(rtcPeerConnection);
      console.log("✓ Offer sent");
    })
    .catch((error) => console.error("Error creating offer:", error));

  // Subscribe to answer
  stompClient.subscribe(`/queue/answer/${userId}`, (message) => {
    const answer = JSON.parse(message.body);
    if (isCaller && rtcPeerConnection.signalingState === "have-local-offer") {
      remoteDescriptionPromise = rtcPeerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      remoteDescriptionPromise.catch((error) =>
        console.error("Error setting remote description:", error)
      );
    }
  });

  // Subscribe to ICE candidates
  subscribeToIceCandidates();
}

// ==================== CREATE ANSWER (ANSWERER) ====================
function subscribeToOffer(onMessageReceived, onRemoteStream) {
  stompClient.subscribe(`/queue/offer/${userId}`, (message) => {
    const offer = JSON.parse(message.body);

    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = (e) => onAddStream(e, onRemoteStream);

    // Add local tracks
    localStream.getTracks().forEach((track) => {
      console.log(`Adding track: ${track.kind}`);
      rtcPeerConnection.addTrack(track, localStream);
    });

    if (rtcPeerConnection.signalingState === "stable") {
      remoteDescriptionPromise = rtcPeerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      remoteDescriptionPromise
        .then(() => {
          return rtcPeerConnection.createAnswer();
        })
        .then((sessionDescription) => {
          rtcPeerConnection.setLocalDescription(sessionDescription);
          stompClient.publish({
            destination: "/app/answer",
            body: JSON.stringify({
              type: "answer",
              sdp: sessionDescription,
              userId,
            }),
          });
          applyBitrateLimit(rtcPeerConnection);
          console.log("✓ Answer sent");
        })
        .catch((error) => console.error("Error creating answer:", error));
    }
  });

  // Subscribe to ICE candidates
  subscribeToIceCandidates();
}

// ==================== SUBSCRIBE TO ICE CANDIDATES ====================
function subscribeToIceCandidates() {
  stompClient.subscribe(`/queue/candidate/${userId}`, (message) => {
    const e = JSON.parse(message.body);
    if (rtcPeerConnection) {
      const candidate = new RTCIceCandidate({
        sdpMLineIndex: e.label,
        candidate: e.candidate,
      });

      rtcPeerConnection.onicecandidateerror = (error) => {
        console.error("Error adding ICE candidate:", error);
      };

      if (remoteDescriptionPromise) {
        remoteDescriptionPromise
          .then(() => {
            if (candidate != null) {
              return rtcPeerConnection.addIceCandidate(candidate);
            }
          })
          .catch((error) =>
            console.error("Error adding ICE candidate after remote description:", error)
          );
      }
    }
  });
}

// ==================== SEND MESSAGE ====================
export function sendMessage(messageText) {
  if (!stompClient || !stompClient.active || !roomId) {
    console.error("Cannot send: WebSocket or roomId missing");
    return;
  }

  if (!messageText.trim()) {
    return;
  }

  console.log(`📤 Sending message to room ${roomId}: ${messageText}`);

  stompClient.publish({
    destination: `/app/room/${roomId}`,
    body: JSON.stringify({
      name: userId,
      message: messageText,
    }),
  });
}

// ==================== CONNECT TO NEXT PERSON ====================
export function connectToNextPerson(callbacks = {}) {
  const { onConnectionEstablished, onConnectionError, onDisconnected } =
    callbacks;

  console.log("🔄 Connecting to next person...");

  // Close current RTC connection
  closeRTCConnection();

  if (stompClient && stompClient.active) {
    stompClient.publish({
      destination: "/app/connect",
      body: JSON.stringify({ userId }),
    });
  }
}

// ==================== CLOSE RTC CONNECTION ====================
function closeRTCConnection() {
  if (rtcPeerConnection) {
    rtcPeerConnection.close();
    rtcPeerConnection = null;
  }
  remoteStream = null;
  roomId = null;
}

// ==================== DISCONNECT ====================
export function disconnect() {
  if (stompClient && stompClient.active) {
    stompClient.deactivate();
  }
  closeRTCConnection();
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
}

// ==================== GET STREAMS ====================
export function getLocalStream() {
  return localStream;
}

export function getRemoteStream() {
  return remoteStream;
}

export function getRTCPeerConnection() {
  return rtcPeerConnection;
}

// ==================== AUDIO/VIDEO CONTROLS ====================
export function toggleAudio(enabled) {
  if (localStream) {
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    console.log(`🎙️ Audio ${enabled ? "enabled" : "disabled"}`);
  }
}

export function toggleVideo(enabled) {
  if (localStream) {
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
    console.log(`📹 Video ${enabled ? "enabled" : "disabled"}`);
  }
}

export function getUserId() {
  return userId;
}