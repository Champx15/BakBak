import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  SkipForward,
  Phone,
  PhoneOff,
} from "lucide-react";
import logo from "../images/logo.png";
import { useNavigate } from "react-router";
import ChaiLoader from "../components/ChaiLoader";
import {
  initiateConnection,
  sendMessage,
  connectToNextPerson,
  disconnect,
  toggleAudio,
  toggleVideo,
} from "../conf/websocket";

const Test = () => {

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isLocalMainVideo, setIsLocalMainVideo] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [connectionState, setConnectionState] = useState("connecting"); 
  const [errorMessage, setErrorMessage] = useState("");

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();

  // initialize websocket
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

        // Auto-connect to next person after 3 seconds
        setTimeout(() => {
          handleNextClick();
        }, 3000);
      },
    };

    initiateConnection(handleMessageReceived, callbacks);

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  // ==================== SET LOCAL VIDEO STREAM ====================
  // (Now handled by onLocalStreamReady callback in initiateConnection)

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

  const handleToggleVideoPosition = () => {
    setIsLocalMainVideo(!isLocalMainVideo);
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

  // ==================== RENDER ====================
  return (
    <div className="w-screen h-screen bg-black flex overflow-hidden">
      {/* Main container */}
      <div className="flex flex-col max-w-[1600px] mx-auto w-full">
        <div className="relative overflow-auto flex flex-grow gap-4 p-5">
          {/* Video Section - Left */}
          <div className="flex flex-1">
            {/* Remote Video */}
            <div
              className="w-full h-full flex items-center justify-center relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 to-slate-950"
            >
              {/* Main Video - Remote or Local based on state */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`absolute ${isLocalMainVideo ? "bottom-20 right-4 z-20 w-37 h-37 rounded-full border-2 border-white/20 cursor-pointer -scale-x-100 hover:-scale-x-100 hover:scale-105" : "inset-0 w-full h-full"} overflow-hidden transition-all duration-300 object-cover`}
                onClick={!isLocalMainVideo ? undefined : handleToggleVideoPosition}
              />

              {/* Local Video - PiP or Main based on state */}
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`absolute ${isLocalMainVideo ? "inset-0 w-full h-full" : "bottom-20 right-4 z-20 w-37 h-37 rounded-full border-2 border-white/20 cursor-pointer -scale-x-100 hover:-scale-x-100 hover:scale-105"} -scale-x-100 overflow-hidden transition-all duration-300 object-cover`}
                onClick={isLocalMainVideo ? undefined : handleToggleVideoPosition}
              />

              {/* Logo */}
              <div
                className="absolute top-2 right-1 opacity-77 z-10 cursor-pointer hover:opacity-100 transition-opacity"
                onClick={() => navigate("/")}
              >
                <img
                  src={logo}
                  alt="Logo"
                  className="h-9 w-12 inline-block mr-1"
                />
              </div>

              {/* Video Controls Overlay */}
              <div className="absolute z-10 bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-lg">
                <button
                  onClick={handleToggleMic}
                  className={`p-2 rounded-full hover:bg-white/10 text-white transition-all ${!isMicOn ? "bg-red-500/20" : ""}`}
                  title={isMicOn ? "Mute microphone" : "Unmute microphone"}
                >
                  {isMicOn ? (
                    <Mic size={21} />
                  ) : (
                    <MicOff size={21} className="text-red-500" />
                  )}
                </button>

                <button
                  onClick={handleToggleVideo}
                  className={`p-2 rounded-full hover:bg-white/10 text-white transition-all ${!isVideoOn ? "bg-red-500/20" : ""}`}
                  title={isVideoOn ? "Turn off camera" : "Turn on camera"}
                >
                  {isVideoOn ? (
                    <Video size={21} />
                  ) : (
                    <VideoOff size={21} className="text-red-500" />
                  )}
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
            </div>
          </div>

          {/* Chat Section - Right */}
          <div className="flex flex-[1.3] flex-col rounded-2xl overflow-hidden backdrop-blur-xl bg-white/14 shadow-2xl border border-white/10">
            {connectionState === "connecting" ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <ChaiLoader />
              </div>
            ) : (
              <>
                {/* Messages Container */}
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                >
                  {messages.length === 0 && connectionState === "connected" ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white/40 text-center">
                        Start a conversation!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === "local" ? "justify-end" : msg.sender === "system" ? "justify-center" : "justify-start"} animate-fadeIn`}
                      >
                        {msg.sender === "system" ? (
                          <div className="max-w-xs px-4 py-2 rounded-lg bg-white/8 border border-white/10 backdrop-blur-sm">
                            <p className="text-xs text-white/60">{msg.text}</p>
                          </div>
                        ) : (
                          <div
                            className={`max-w-xs px-4 py-2 rounded-2xl backdrop-blur-sm transition-all duration-300 shadow-lg
                    ${
                      msg.sender === "local"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none shadow-blue-500/30"
                        : "bg-white/12 text-white/90 rounded-bl-none shadow-black/20"
                    }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                            <p className="text-xs opacity-60 mt-1">
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="px-4 py-4 border-t border-white/10 bg-gradient-to-t from-white/8 to-transparent">
                  <div className="flex gap-2">
                    <input
                      type="text"
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
                      placeholder="Type a message..."
                      disabled={connectionState !== "connected"}
                      className="flex-1 px-4 py-2.5 rounded-full bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/8 focus:border-transparent transition-all backdrop-blur-sm border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || connectionState !== "connected"}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0 ${
                        newMessage.trim() && connectionState === "connected"
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/50 text-white cursor-pointer"
                          : "bg-gray-500/50 text-white/50 cursor-not-allowed"
                      }`}
                      title="Send message"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.488 5.951 1.488a1 1 0 001.169-1.409l-7-14z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed bottom-4 left-4 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg backdrop-blur-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          {errorMessage}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Test;