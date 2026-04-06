import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ArrowRight,
  MoveUpRight,
  Settings,
  SkipForward,
} from "lucide-react";
import logo from "../images/logo.png";
import { useNavigate } from "react-router";

const Chat = () => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! Where are you from?",
      sender: "remote",
      timestamp: "10:30",
    },
    {
      id: 2,
      text: "I am from Bangladesh. Please share your Instagram id",
      sender: "local",
      timestamp: "10:31",
    },
    {
      id: 3,
      text: "Sure. My id @mariaus",
      sender: "remote",
      timestamp: "10:32",
    },
    {
      id: 4,
      text: "Thank you for sharing. I will text you there.",
      sender: "local",
      timestamp: "10:33",
    },
    { id: 5, text: "Okay. No problem.", sender: "remote", timestamp: "10:34" },
    {
      id: 6,
      text: "Now bye. See you later",
      sender: "local",
      timestamp: "10:35",
    },
    { id: 7, text: "Sure. Tata 👋", sender: "remote", timestamp: "10:36" },
    { id: 8, text: "Sure. Tata 👋", sender: "remote", timestamp: "10:36" },
    { id: 9, text: "Sure. Tata 👋", sender: "remote", timestamp: "10:36" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const wsRef = useRef(null);
  const navigate = useNavigate();
  const [state, setState] = useState("connecting");
  const facts = [
    "Take your age, subract 2 and add 2, that's your age"
  ]



  // Initialize WebSocket connection
  useEffect(() => {
    wsRef.current = new WebSocket("ws://your-server:8080/ws");

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: data.text,
            sender: "remote",
          },
        ]);
      }
    };

    wsRef.current.onerror = () => {
      console.log("WebSocket error");
      setIsConnected(false);
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket closed");
      setIsConnected(false);
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const msg = {
        id: messages.length + 1,
        text: newMessage,
        sender: "local",
      };
      setMessages((prev) => [...prev, msg]);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "message",
            text: newMessage,
          }),
        );
      }

      setNewMessage("");
    }
  };

  const handleNextClick = () => {
    console.log("Next button clicked - connecting to next user");
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
  };

  return (
    <div className="w-screen h-screen bg-black flex overflow-hidden">

      {/* Main container */}
      <div className="flex flex-col max-w-5xl mx-auto">
          <div
            className="absolute bottom-2 right-3 opacity-95 "
            onClick={() => navigate("/")}
          >
              <img
                src={logo}
                alt="Logo"
                className="md:h-12 md:w-15 inline-block mr-1"
              />
          </div>

        <div className="relative overflow-auto flex gap-4 p-8 pt-4 pb-4">
          {/* Video Section - Left */}
          <div className="flex flex-col gap-2">
            {/* Remote Video */}
            <div className="bg-red-50 rounded-3xl overflow-hidden shadow-2xl">
              <div
                ref={remoteVideoRef}
                className="w-110 h-85  flex items-center justify-center relative"
              >
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=600&fit=crop"
                  alt="Remote user"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Local Video with Controls */}
            <div className="w-110 h-85  rounded-3xl overflow-hidden shadow-2xl relative">
              <div
                ref={localVideoRef}
                className={`w-full h-full flex items-center justify-center relative transition-all duration-300
                ${isVideoOn ? "bg-gradient-to-br from-slate-700 to-slate-900" : "bg-gradient-to-br from-gray-400 to-gray-600"}`}
              >
                {isVideoOn ? (
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop"
                    alt="Local user"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <VideoOff className="w-16 h-16 text-white/60" />
                    <span className="text-white/60 font-medium">Video Off</span>
                  </div>
                )}

                {/* Control Buttons - Overlay on Local Video */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
                  {/* Mic Button */}
                  <button
                    onClick={toggleMic}
                    className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl
                    bg-gray-200 opacity-80 border-2 border-white/30 group`}
                    title={isMicOn ? "Mute" : "Unmute"}
                  >
                    {isMicOn ? (
                      <Mic
                        className="w-5 h-5 text-emerald-500 relative z-10"
                        strokeWidth={2}
                      />
                    ) : (
                      <MicOff
                        className="w-4.5 h-4.5 text-red-500 relative z-10"
                        strokeWidth={2}
                      />
                    )}
                  </button>

                  {/* Video Button */}
                  <button
                    onClick={toggleVideo}
                    className={`relative  w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl
  
                    bg-gray-200 opacity-80 border-2 border-white/30 group`}
                    title={isVideoOn ? "Stop Video" : "Start Video"}
                  >
                    {isVideoOn ? (
                      <Video
                        className="w-5 h-5 text-emerald-500 relative z-10"
                        strokeWidth={2}
                      />
                    ) : (
                      <VideoOff
                        className="w-4.5 h-4.5 text-red-500 relative z-10"
                        strokeWidth={2}
                      />
                    )}
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={handleNextClick}
                    className="relative w-fit h-9 p-2 rounded-2xl flex gap-1 items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl
                  
                    bg-gray-200 opacity-80 border-2 border-white/30 group"
                    title="Next user"
                  >
                    Skip
                    <SkipForward
                      className="w-3.5 h-3.5 text-blue-700 relative z-10"
                      strokeWidth={2}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section - Right */}
          <div className="flex flex-[1.3] flex-col rounded-2xl overflow-hidden backdrop-blur-xl bg-white/14 shadow-2xl border border-white/10">
          {state==="connecting"&&(
            <div className="flex items-center justify-center h-full p-4">
              <p className="text-white/60 text-base">{facts[0]}</p>
            </div>
          )}
            {/* Messages Container */}
            <div
              ref={chatContainerRef}
              className={`${state==="connecting" ? "hidden" : "flex-1"} overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent`}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "local" ? "justify-end" : "justify-start"} animate-fadeIn`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 mb-0.5 rounded-2xl backdrop-blur-sm transition-all duration-300 
                    ${
                      msg.sender === "local"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none shadow-lg shadow-blue-500/30"
                        : "bg-white/12 text-white/90 rounded-bl-none shadow-lg shadow-black/20"
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
                  className="flex-1 px-4 py-2.5 rounded-full bg-none text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all backdrop-blur-sm"
                />
                <button
                  onClick={sendMessage}
                  className={`w-10 h-10 rounded-full ${newMessage ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gray-500"} flex items-center justify-center hover:shadow-lg hover:shadow-blue-500/50 transition-all active:scale-95 flex-shrink-0`}
                  title="Send message"
                >
                  <MoveUpRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

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
    </div>
  );
};

export default Chat;
