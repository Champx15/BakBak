import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {Mic,Video,SkipForward,PhoneOff,MicOff,VideoOff, MessageCircle} from "lucide-react";
import ChaiLoader from "../components/ChaiLoader";
import {
  initiateConnection,
  sendMessage,
  connectToNextPerson,
  disconnect,
  toggleAudio,
  toggleVideo,
} from "../conf/websocket";

const TestMobile = () => {
  // ==================== STATE MANAGEMENT ====================
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [connectionState, setConnectionState] = useState("connecting");
  const [errorMessage, setErrorMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // ==================== REFS ====================
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();

  // ==================== INITIALIZE WEBSOCKET ====================
  useEffect(() => {
    console.log("🚀 Initializing WebSocket connection");

    const handleMessageReceived = (msg) => {
      console.log("📨 Message received:", msg);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: msg.text,
          sender: msg.sender,
        },
      ]);

      // Auto-scroll to latest message
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      }, 0);
    };

    const callbacks = {
      onLocalStreamReady: (stream) => {
        console.log("✓ Local stream ready");
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      },
      onRemoteStream: (stream) => {
        console.log("🎥 Remote stream received");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      },
      onConnectionEstablished: (match) => {
        console.log("✓ Connected with:", match.partnerId);
        setConnectionState("connected");
        setIsConnected(true);
        setMessages([
          {
            id: Date.now(),
            text: "🎯 Connected with a stranger! Say hi!",
            sender: "system",

          },
        ]);
      },
      onConnectionError: (error) => {
        console.error("❌ Connection error:", error);
        setConnectionState("disconnected");
        setErrorMessage(`Connection error: ${error}`);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: "❌ Connection failed. Please try again.",
            sender: "system",

          },
        ]);
      },
      onDisconnected: () => {
        console.log("⚠️ Partner disconnected");
        setConnectionState("disconnected");
        setIsConnected(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: "⚠️ Your partner has disconnected.",
            sender: "system",
          },
        ]);

        setTimeout(() => {
          handleNextClick();
        }, 3000);
      },
    };

    initiateConnection(handleMessageReceived, callbacks);

    return () => {
      disconnect();
    };
  }, []);

  // ==================== AUTO-SCROLL CHAT ====================
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // ==================== HANDLERS ====================
  const handleToggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    toggleAudio(newState);
  };

  const handleToggleVideo = () => {
    const newState = !isVideoOn;
    setIsVideoOn(newState);
    toggleVideo(newState);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage("");
    }
  };

  const handleNextClick = () => {
    console.log("🔄 Finding next person...");
    setConnectionState("connecting");
    setMessages([]);
    setIsConnected(false);
    setIsChatOpen(false);

    connectToNextPerson({
      onConnectionEstablished: (match) => {
        console.log("✓ Connected with:", match.partnerId);
        setConnectionState("connected");
        setIsConnected(true);
      },
      onConnectionError: (error) => {
        console.error("❌ Connection error:", error);
        setConnectionState("disconnected");
        setErrorMessage(`Connection error: ${error}`);
      },
    });
  };

  const handleDisconnect = () => {
    disconnect();
    navigate("/");
  };

  const openChat = () => {
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  // ==================== RENDER ====================
  return (
    <div
      style={{
        minHeight: "100%",
        background: "pink",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          background: "#1a1a2e",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          height: "100dvh",
        }}
      >
        {/* Video Stack */}
        <div
          style={{
            flex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Their video (top) */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#888",
              fontSize: "13px",
             backgroundColor:"pink",
              borderBottom: "1px solid rgba(0,0,0,0.1)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {connectionState === "connecting" ? (
            <div
              style={{
                width:"100%",
                height:"100%",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "black",
                backdropFilter: "blur(5px)",
                zIndex: 20,
              }}
            >
              <ChaiLoader />
            </div>
          ):
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />}
          </div>

          {/* Your video (bottom) */}
          <div
            style={{
              flex: 1,
              background: "linear-gradient(135deg, rgba(83, 74, 183, 0.4), rgba(29, 78, 137, 0.4))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#888",
              fontSize: "13px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          {/* Control Buttons (Bottom Center) */}
        <div className="absolute z-10 bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-lg">
                        <button
                          onClick={handleToggleMic}
                          className={`p-2 rounded-full hover:bg-white/10 text-white transition-all ${!isMicOn ? "bg-red-500/20" : ""}`}
                          title={isMicOn ? "Mute microphone" : "Unmute microphone"}
                        >
                          {isMicOn ? (
                            <Mic size={22} />
                          ) : (
                            <MicOff size={22} className="text-red-500" />
                          )}
                        </button>
        
                        <button
                          onClick={handleToggleVideo}
                          className={`p-2 rounded-full hover:bg-white/10 text-white transition-all ${!isVideoOn ? "bg-red-500/20" : ""}`}
                          title={isVideoOn ? "Turn off camera" : "Turn on camera"}
                        >
                          {isVideoOn ? (
                            <Video size={22} />
                          ) : (
                            <VideoOff size={22} className="text-red-500" />
                          )}
                        </button>
                        <button
                          onClick={openChat}
                          className="p-2 rounded-full text-white transition-all shadow-lg "
                          title="Chat"
                        >
                          <MessageCircle size={22} fill="currentColor" />
                        </button>
        
                        <div className="w-px h-6 bg-white/20"></div>
        
                        <button
                          onClick={handleNextClick}
                          disabled={connectionState === "connecting"}
                          className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-full text-white transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none"
                          title="Skip to next person"
                        >
                          <SkipForward size={20} fill="currentColor" />
                        </button>
        
                      </div>
        
        

          {/* Loading State */}

        </div>

        {/* Chat Modal (Half Screen with Glassmorphism) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            display: isChatOpen ? "flex" : "none",
            flexDirection: "column",
            borderRadius: "20px",
            zIndex: 20,
            backdropFilter: "blur(2px)",
            opacity: isChatOpen ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          <div style={{ flex: 1 }}></div>

          {/* Glass Bottom Sheet (Half Screen) */}
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "24px 24px 0 0",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              height: "50%",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.1)",
              position: "relative",
            }}
          >
            {/* Drag Handle */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "4px",
                  background: "rgba(255,255,255,0.4)",
                  borderRadius: "2px",
                  margin: "0 auto",
                }}
              ></div>
            </div>

            {/* Header with Close Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "#fff",
                }}
              >
                Chat
              </h3>
              <button
                onClick={closeChat}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages Container */}
            <div
              ref={chatContainerRef}
              style={{
                flex: 1,
                overflowY: "auto",
                marginBottom: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                paddingRight: "4px",
              }}
            >
              {messages.length === 0 && connectionState === "connected" ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                    Start a conversation!
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent:
                        msg.sender === "local"
                          ? "flex-end"
                          : msg.sender === "system"
                            ? "center"
                            : "flex-start",
                    }}
                  >
                    {msg.sender === "system" ? (
                      <div
                        style={{
                          background: "rgba(0,0,0,0.2)",
                          backdropFilter: "blur(10px)",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          maxWidth: "75%",
                          fontSize: "11px",
                          color: "#999",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {msg.text}
                      </div>
                    ) : (
                      <div
                        style={{
                          background:
                            msg.sender === "local"
                              ? "rgba(100,200,255,0.3)"
                              : "rgba(0,0,0,0.1)",
                          backdropFilter: "blur(10px)",
                          padding: "8px 12px",
                          borderRadius: "12px",
                          maxWidth: "75%",
                          fontSize: "13px",
                          color: "#fff",
                        }}
                      >
                        <p style={{ margin: 0 }}>{msg.text}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Type message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    connectionState === "connected"
                  ) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={connectionState !== "connected"}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  fontSize: "13px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                  color: "#fff",
                  outline: "none",
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={
                  !newMessage.trim() || connectionState !== "connected"
                }
                style={{
                  padding: "10px 12px",
                  background:
                    newMessage.trim() && connectionState === "connected"
                      ? "rgba(100,200,255,0.4)"
                      : "rgba(100,100,100,0.3)",
                  backdropFilter: "blur(10px)",
                  border:
                    newMessage.trim() && connectionState === "connected"
                      ? "1px solid rgba(100,200,255,0.5)"
                      : "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  cursor:
                    newMessage.trim() && connectionState === "connected"
                      ? "pointer"
                      : "not-allowed",
                  fontWeight: "500",
                  fontSize: "13px",
                  color: "#fff",
                  transition: "all 0.2s",
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {errorMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "20px",
            right: "20px",
            background: "rgba(239, 68, 68, 0.2)",
            border: "1px solid rgba(239, 68, 68, 0.5)",
            color: "#fca5a5",
            padding: "12px 16px",
            borderRadius: "8px",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#ef4444",
            }}
          ></div>
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default TestMobile;