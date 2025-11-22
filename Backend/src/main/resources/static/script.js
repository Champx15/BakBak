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

    function initializeConnection() {
        document.getElementById('messages').innerHTML = '';
        document.getElementById('emptyState').style.display = 'flex';
        roomId = null;

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

                subscribeToRoom(roomId);
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
        stompClient.subscribe('/topic/room/' + roomId, function(msg) {
            const messageObj = JSON.parse(msg.body);
            const isSent = messageObj.name === userId;
            showMessage(messageObj.name, messageObj.message, isSent);
        });
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