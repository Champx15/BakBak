import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  SkipForward,
} from "lucide-react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import conf from "../conf/conf"

const ChatComponent = () => {
  // State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState("Waiting for connection...");

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const stompClientRef = useRef(null);
  const rtcPeerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteDescriptionPromiseRef = useRef(null);
  const isCallerRef = useRef(false);
  const userIdRef = useRef("user" + Math.floor(Math.random() * 10000));
  const chatContainerRef = useRef(null);
  


  // WebRTC configuration
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

  // Apply bitrate limit for video
  const applyBitrateLimit = (peerConnection) => {
    peerConnection.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === "video") {
        const parameters = sender.getParameters();
        if (!parameters.encodings) {
          parameters.encodings = [{}];
        }
        parameters.encodings[0].maxBitrate = 200000;
        parameters.encodings[0].maxFramerate = 15;
        sender.setParameters(parameters);
      }
    });
  };

  // Handle incoming message
  const handleAddStream = (e) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = e.streams[0];
      remoteStreamRef.current = e.streams[0];
    }
  };

  // Handle ICE candidates
  const handleIceCandidate = (e) => {
    if (e.candidate) {
      console.log("Sending ICE candidate");
      stompClientRef.current.send(
        "/app/candidate",
        {},
        JSON.stringify({
          type: "candidate",
          label: e.candidate.sdpMLineIndex,
          id: e.candidate.sdpMId,
          candidate: e.candidate.candidate,
          userId: userIdRef.current,
        })
      );
    }
  };

  // Create offer (caller)
  const createOffer = async () => {
    try {
      const sessionDescription = await rtcPeerConnectionRef.current.createOffer();
      await rtcPeerConnectionRef.current.setLocalDescription(sessionDescription);
      stompClientRef.current.send(
        "/app/offer",
        {},
        JSON.stringify({
          type: "offer",
          sdp: sessionDescription,
          userId: userIdRef.current,
        })
      );
      applyBitrateLimit(rtcPeerConnectionRef.current);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  // Handle incoming offer
  const handleOffer = async (offer) => {
    if (isCallerRef.current) return;

    try {
      rtcPeerConnectionRef.current = new RTCPeerConnection(iceServers);
      rtcPeerConnectionRef.current.onicecandidate = handleIceCandidate;
      rtcPeerConnectionRef.current.ontrack = handleAddStream;

      localStreamRef.current.getTracks().forEach((track) => {
        rtcPeerConnectionRef.current.addTrack(track, localStreamRef.current);
      });

      if (rtcPeerConnectionRef.current.signalingState === "stable") {
        remoteDescriptionPromiseRef.current =
          rtcPeerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(offer)
          );

        await remoteDescriptionPromiseRef.current;
        const answer = await rtcPeerConnectionRef.current.createAnswer();
        await rtcPeerConnectionRef.current.setLocalDescription(answer);

        stompClientRef.current.send(
          "/app/answer",
          {},
          JSON.stringify({
            type: "answer",
            sdp: answer,
            userId: userIdRef.current,
          })
        );
        applyBitrateLimit(rtcPeerConnectionRef.current);
      }
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };

  // Handle incoming answer
  const handleAnswer = async (answer) => {
    if (
      !isCallerRef.current ||
      !rtcPeerConnectionRef.current ||
      rtcPeerConnectionRef.current.signalingState !== "have-local-offer"
    )
      return;

    try {
      remoteDescriptionPromiseRef.current =
        rtcPeerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      await remoteDescriptionPromiseRef.current;
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  };

  // Handle incoming ICE candidate
  const handleCandidate = async (candidateData) => {
    if (!rtcPeerConnectionRef.current) return;

    try {
      const candidate = new RTCIceCandidate({
        sdpMLineIndex: candidateData.label,
        candidate: candidateData.candidate,
      });

      if (!candidateData.candidate || candidateData.candidate.trim() === "") {
        return;
      }

      if (remoteDescriptionPromiseRef.current) {
        await remoteDescriptionPromiseRef.current;
        await rtcPeerConnectionRef.current.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  };

  // Subscribe to room
  const subscribeToRoom = (roomId, partnerId) => {
    // Determine if this user is the caller
    const myNum = parseInt(userIdRef.current.replace("user", ""));
    const partnerNum = parseInt(partnerId.replace("user", ""));
    isCallerRef.current = myNum < partnerNum;

    console.log("isCaller:", isCallerRef.current);

    // Create peer connection if caller
    if (isCallerRef.current) {
      rtcPeerConnectionRef.current = new RTCPeerConnection(iceServers);
      rtcPeerConnectionRef.current.onicecandidate = handleIceCandidate;
      rtcPeerConnectionRef.current.ontrack = handleAddStream;

      localStreamRef.current.getTracks().forEach((track) => {
        console.log("Adding track:", track.kind);
        rtcPeerConnectionRef.current.addTrack(track, localStreamRef.current);
      });

      createOffer();
    }

    // Subscribe to offer
    stompClientRef.current.subscribe(
      "/queue/offer/" + userIdRef.current,
      (msg) => {
        const offer = JSON.parse(msg.body);
        handleOffer(offer);
      }
    );

    // Subscribe to answer
    stompClientRef.current.subscribe(
      "/queue/answer/" + userIdRef.current,
      (msg) => {
        const answer = JSON.parse(msg.body);
        handleAnswer(answer);
      }
    );

    // Subscribe to ICE candidates
    stompClientRef.current.subscribe(
      "/queue/candidate/" + userIdRef.current,
      (msg) => {
        const candidateData = JSON.parse(msg.body);
        handleCandidate(candidateData);
      }
    );

    // Subscribe to messages
    stompClientRef.current.subscribe("/topic/room/" + roomId, (msg) => {
      const messageObj = JSON.parse(msg.body);
      const isSent = messageObj.name === userIdRef.current;
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: messageObj.message,
          sender: isSent ? "local" : "remote",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    });
  };

  // Initialize connection
  const initializeConnection = async () => {
    setMessages([]);
    setRoomId(null);

    try {
      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia(
        streamConstraints
      );
      console.log("Camera access granted!");
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert(`Camera access failed: ${error.name} - ${error.message}`);
      return;
    }

    // Connect to WebSocket
    const socket = new SockJS( `${conf.apiBase}/ws`);
    stompClientRef.current = Stomp.over(socket);

    stompClientRef.current.connect(
      { userId: userIdRef.current },
      (frame) => {
        console.log("Connected as:", userIdRef.current);

        // Subscribe to match
        stompClientRef.current.subscribe(
          "/queue/match/" + userIdRef.current,
          (message) => {
            const match = JSON.parse(message.body);
            setRoomId(match.roomId);
            setIsConnecting(false);
            setPartnerStatus("🎯 Connected with a stranger!");
            subscribeToRoom(match.roomId, match.partnerId);
          }
        );

        // Subscribe to disconnect
        stompClientRef.current.subscribe(
          "/queue/disconnect/" + userIdRef.current,
          (msg) => {
            setPartnerStatus("⚠️ Your partner has disconnected.");
            setRoomId(null);
            setTimeout(() => {
              connect();
            }, 3000);
          }
        );

        // Send connect message
        stompClientRef.current.send(
          "/app/connect",
          {},
          JSON.stringify({ userId: userIdRef.current })
        );
      },
      (error) => {
        console.error("Connection error:", error);
        setIsConnecting(false);
        setPartnerStatus("❌ Connection failed. Please try again.");
      }
    );
  };

  // Connect function
  const connect = () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setPartnerStatus("Connecting...");

    if (
      stompClientRef.current &&
      stompClientRef.current.connected
    ) {
      stompClientRef.current.disconnect(() => {
        initializeConnection();
      });
    } else {
      initializeConnection();
    }
  };

  // Send message
  const sendMessage = () => {
    if (
      !stompClientRef.current ||
      !roomId ||
      !newMessage.trim()
    ) {
      return;
    }

    stompClientRef.current.send(
      "/app/room/" + roomId,
      {},
      JSON.stringify({
        name: userIdRef.current,
        message: newMessage,
      })
    );

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        text: newMessage,
        sender: "local",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setNewMessage("");
  };

  // Initialize on mount
  useEffect(() => {
    connect();

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.disconnect();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (rtcPeerConnectionRef.current) {
        rtcPeerConnectionRef.current.close();
      }
    };
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="w-screen h-screen bg-black flex overflow-hidden">
      <div className="flex flex-col max-w-[1600px] mx-auto w-full">
        <div className="relative overflow-auto flex flex-grow gap-4 p-5">
          {/* Video Section */}
          <div className="flex flex-1">
            <div
              ref={remoteVideoRef}
              className="w-full h-full flex items-center justify-center relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900"
            >
              {!remoteVideoRef.current?.srcObject && (
                <div className="text-white/50">
                  Waiting for remote stream...
                </div>
              )}

              {/* Local Video (Picture-in-Picture) */}
              <div
                className="absolute bottom-20 right-4 z-10 w-34 h-34 rounded-full overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 bg-gradient-to-br from-slate-700 to-slate-900"
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Video Controls */}
              <div className="absolute z-10 bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/20 backdrop-blur-md p-2 rounded-full border border-white/10">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                >
                  {isMicOn ? (
                    <Mic size={22} />
                  ) : (
                    <MicOff size={22} className="text-red-500" />
                  )}
                </button>
                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                >
                  {isVideoOn ? (
                    <Video size={22} />
                  ) : (
                    <VideoOff size={22} className="text-red-500" />
                  )}
                </button>
                <button
                  onClick={connect}
                  className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-all shadow-lg shadow-blue-500/20"
                >
                  <SkipForward size={20} fill="currentColor" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex flex-[1.3] flex-col rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10 shadow-2xl">
            {/* Status */}
            <div className="px-4 py-3 border-b border-white/10 text-white/70 text-sm">
              {partnerStatus}
            </div>

            {/* Messages Container */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "local" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl backdrop-blur-sm ${
                      msg.sender === "local"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none"
                        : "bg-white/12 text-white/90 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="px-4 py-4 border-t border-white/10 bg-gradient-to-t from-white/8 to-transparent">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-none text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                <button
                  onClick={sendMessage}
                  className={`px-4 py-2.5 rounded-full ${
                    newMessage
                      ? "bg-gradient-to-br from-blue-500 to-blue-600"
                      : "bg-gray-500"
                  } text-white hover:shadow-lg transition-all`}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;