let stompClient = null;
    let roomId = null;
    let isConnecting = false;
    const userId = "user" + Math.floor(Math.random() * 10000);

    function setButtonState(state) {
        const btn = document.getElementById('nextBtn');
        const btnText = document.getElementById('btnText');

        if (state === 'connecting') {
            btn.disabled = true;
            btnText.innerHTML = 'Connecting<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>';
            document.getElementById('send').disabled = true;
        } else if (state === 'connected') {
            btn.disabled = false;
            btnText.innerHTML = '<span class="status-indicator"></span>Next Person';
            document.getElementById('send').disabled = false;
        } else {
            btn.disabled = false;
            btnText.innerHTML = 'Find Someone New';
            document.getElementById('send').disabled = true;
        }
    }

    // constraints
    const constraints = {
      video: {
        width: { ideal: 320, max: 480 },
        height: { ideal: 240, max: 360 },
        frameRate: { ideal: 15, max: 15 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };

    const [ roomDiv, localVideo, remoteVideo] = ["roomDiv",
      "localVideo", "remoteVideo"].map((id) => document.getElementById(id));
    let remoteDescriptionPromise, localStream, remoteStream,
        rtcPeerConnection, isCaller;

        const iceServers = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        };

     const streamConstraints = constraints;




function applyBitrateLimit(peerConnection) {
  peerConnection.getSenders().forEach(sender => {
    if (sender.track && sender.track.kind === 'video') {
      const parameters = sender.getParameters();
      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      parameters.encodings[0].maxBitrate = 200000;
      parameters.encodings[0].maxFramerate = 15;
      sender.setParameters(parameters).then(() => {
        console.log("✓ Video optimized for smooth random chat");
      }).catch(err =>
        console.log("Error setting bitrate:", err)
      );
    }
  });

  setTimeout(() => {
    peerConnection.getSenders().forEach(sender => {
      if (sender.track && sender.track.kind === 'video') {
        const settings = sender.track.getSettings();
        console.log("📹 Sending:", settings.width + "x" + settings.height + " @ " + settings.frameRate + "fps");
      }
    });
  }, 2000);
}

    function connect() {
        if (isConnecting) return;

        isConnecting = true;
        setButtonState('connecting');

        if (stompClient && stompClient.connected) {
            stompClient.disconnect(function() {
                initializeConnection();
            });
        } else {
            initializeConnection();
        }
    }
    events=[""]


    function initializeConnection() {
        document.getElementById('messages').innerHTML = '';
        document.getElementById('emptyState').style.display = 'flex';
        roomId = null;
        //camera access
        navigator.mediaDevices.getUserMedia(streamConstraints).then(stream => {
            console.log("Camera access granted!");

            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            console.log("Camera settings:", settings);
            console.log(`Resolution: ${settings.width}x${settings.height} @ ${settings.frameRate}fps`);

            localStream = stream;
            localVideo.srcObject = stream;
            localVideo.muted = true;

            // Start monitoring local video (optional)
            // startNSFWMonitoring(localVideo, handleNSFWDetection);
          }).catch(error => {
            console.error("Camera error:", error);
            alert(`Camera access failed: ${error.name} - ${error.message}`);
          });

        const socket = new SockJS("/ws");
        stompClient = Stomp.over(socket);

        stompClient.connect({ userId: userId }, function(frame) {
            console.log("Connected as:", userId);

            stompClient.subscribe('/queue/match/' + userId, function(message) {
                const match = JSON.parse(message.body);
                roomId = match.roomId;
                isConnecting = false;
                console.log('Matched with ' + match.partnerId + ' in room ' + roomId);

                setButtonState('connected');
                showGreeting('🎯 Connected with a stranger! Say hi!', true);
                   const myNum = parseInt(userId.replace('user', ''));
                   const partnerNum = parseInt(match.partnerId.replace('user', ''));

                   isCaller = myNum < partnerNum;

                subscribeToRoom(roomId);
            });

                stompClient.subscribe('/queue/disconnect/' + userId, function(msg) {
                    showGreeting("⚠️ Your partner has disconnected.", true);
                    setButtonState('ready');
                    roomId = null;
                        setTimeout(function() {
                            showGreeting("🔄 Finding you someone new...", true);
                            connect();
                        }, 3000);
                });

            stompClient.send("/app/connect", {}, JSON.stringify({ userId: userId }));
        }, function(error) {
            console.error("Connection error:", error);
            isConnecting = false;
            setButtonState('ready');
            showGreeting('❌ Connection failed. Please try again.', true);
        });
    }

    function subscribeToRoom(roomId) {
    console.log("isCaller",isCaller);
     if (isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;

        localStream.getTracks().forEach(track => {
          console.log("Adding track:", track.kind);
          rtcPeerConnection.addTrack(track, localStream);
        });

        rtcPeerConnection
        .createOffer()
        .then(sessionDescription => {
          rtcPeerConnection.setLocalDescription(sessionDescription);
          stompClient.send('/app/offer',{} , JSON.stringify({
               type: "offer", sdp: sessionDescription, userId
                 }));
          applyBitrateLimit(rtcPeerConnection);
        })
        .catch(error => console.log(error));
      }

      stompClient.subscribe("/queue/offer/"+userId,function(msg){
         const offer = JSON.parse(msg.body);
        if (!isCaller) {
          rtcPeerConnection = new RTCPeerConnection(iceServers);
          rtcPeerConnection.onicecandidate = onIceCandidate;
          rtcPeerConnection.ontrack = onAddStream;

          localStream.getTracks().forEach(track => {
            console.log("Adding track:", track.kind);
            rtcPeerConnection.addTrack(track, localStream);
          });

          if (rtcPeerConnection.signalingState === "stable") {
            remoteDescriptionPromise = rtcPeerConnection.setRemoteDescription(
                new RTCSessionDescription(offer));
            remoteDescriptionPromise
            .then(() => {
              return rtcPeerConnection.createAnswer();
            })
            .then(sessionDescription => {
              rtcPeerConnection.setLocalDescription(sessionDescription);
          stompClient.send('/app/answer',{} , JSON.stringify({
               type: "answer", sdp: sessionDescription, userId
                 }));
              applyBitrateLimit(rtcPeerConnection);
            })
            .catch(error => console.log(error));
          }
        }
      })

      stompClient.subscribe("/queue/answer/"+userId,function(msg){
      const answer = JSON.parse(msg.body);
       if (isCaller && rtcPeerConnection.signalingState === "have-local-offer") {
          remoteDescriptionPromise = rtcPeerConnection.setRemoteDescription(
              new RTCSessionDescription(answer));
          remoteDescriptionPromise.catch(error => console.log(error));
        }
      })
      stompClient.subscribe("/queue/candidate/"+userId,function(msg){
      const e = JSON.parse(msg.body)
        if (rtcPeerConnection) {
            const candidate = new RTCIceCandidate({
              sdpMLineIndex: e.label, candidate: e.candidate,
            });

            rtcPeerConnection.onicecandidateerror = (error) => {
              console.error("Error adding ICE candidate: ", error);
            };

            if (remoteDescriptionPromise) {
              remoteDescriptionPromise
              .then(() => {
                if (candidate != null) {
                  return rtcPeerConnection.addIceCandidate(candidate);
                }
              })
              .catch(error => console.log(
                  "Error adding ICE candidate after remote description: ", error));
            }
            }
      })


    //subscribe for messages
        stompClient.subscribe('/topic/room/' + roomId, function(msg) {
            const messageObj = JSON.parse(msg.body);
            const isSent = messageObj.name === userId;
            showMessage(messageObj.name, messageObj.message, isSent);
        });
    }

    const onIceCandidate = e => {
      if (e.candidate) {
        console.log("sending ice candidate");
                  stompClient.send('/app/candidate',{} , JSON.stringify({
                                 type: "candidate",
                                 label: e.candidate.sdpMLineIndex,
                                 id: e.candidate.sdpMid,
                                 candidate: e.candidate.candidate,
                                  userId
                         }));
      }
    }

    const onAddStream = e => {
      remoteVideo.srcObject = e.streams[0];
      remoteStream = e.stream;
      }



    function sendMessage() {
        if (!stompClient || !roomId) {
            console.log("Cannot send: stompClient or roomId missing");
            return;
        }

        const messageInput = document.getElementById('message');
        const message = messageInput.value;
        if (!message.trim()) {
            return;
        }

        console.log("Sending message:", message, "to room:", roomId);

        stompClient.send('/app/room/' + roomId, {}, JSON.stringify({
            name: userId,
            message: message
        }));

        messageInput.value = '';
    }

    function showMessage(sender, text, isSent) {
        document.getElementById('emptyState').style.display = 'none';
        const messageClass = isSent ? 'message-item sent' : 'message-item received';

        const messagesDiv = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = messageClass;
        messageDiv.innerHTML = '<div class="message-sender">' + '</div><div class="message-text">' + text + '</div>';
        messagesDiv.appendChild(messageDiv);

        const messageArea = document.getElementById('messageArea');
        messageArea.scrollTop = messageArea.scrollHeight;
    }

    function showGreeting(msg, isSystem) {
        document.getElementById('emptyState').style.display = 'none';
        const messageClass = isSystem ? 'message-item system-message' : 'message-item';

        const messagesDiv = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = messageClass;
        messageDiv.textContent = msg;
        messagesDiv.appendChild(messageDiv);

        const messageArea = document.getElementById('messageArea');
        messageArea.scrollTop = messageArea.scrollHeight;
    }

    document.addEventListener('DOMContentLoaded', function() {
        connect();

        document.getElementById('messageForm').addEventListener('submit', function(e) {
            e.preventDefault();
            sendMessage();
        });

        document.getElementById('nextBtn').addEventListener('click', function() {
            connect();
        });

        document.getElementById('message').addEventListener('keypress', function(e) {
            if (e.which === 13 && !document.getElementById('send').disabled) {
                e.preventDefault();
                sendMessage();
            }
        });
    });

