// Get interview code from URL if present
const urlParams = new URLSearchParams(window.location.search);
const interviewCode = urlParams.get('code');

const signalingServerUrl = "/";
let socket;
let pc;
let localStream;
let remoteStream;
let roomId = interviewCode || null;

const configuration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" } // public STUN server
    ]
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const joinBtn = document.getElementById("joinBtn");
const startCallBtn = document.getElementById("startCallBtn");
const roomInput = document.getElementById("roomInput");

// Set room input value if interview code is present
if (interviewCode) {
    roomInput.value = interviewCode;
    roomInput.disabled = true;
}

// 1. Get local media (camera + mic)
async function initLocalMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
    } catch (err) {
        console.error("Error getting user media:", err);
        alert("Could not access camera/microphone");
    }
}

// 2. Create PeerConnection and set up handlers
function createPeerConnection() {
    pc = new RTCPeerConnection(configuration);

    // Send any ICE candidates to the other peer
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice-candidate", {
                roomId,
                candidate: event.candidate
            });
        }
    };

    // When remote track arrives, show it in remoteVideo
    pc.ontrack = (event) => {
        if (!remoteStream) {
            remoteStream = new MediaStream();
            remoteVideo.srcObject = remoteStream;
        }
        remoteStream.addTrack(event.track);
    };

    // Add local tracks to the connection
    localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
    });
}

// 3. Connect to signaling server
function connectSocket() {
    // Use the existing Socket.IO connection
    socket = io(signalingServerUrl);

    socket.on("connect", () => {
        console.log("Connected to signaling server with ID:", socket.id);
        
        // Automatically join room if interview code is present
        if (interviewCode) {
            joinRoom();
        }
    });

    socket.on("offer", async (data) => {
        console.log("Received offer");
        if (!pc) createPeerConnection();

        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer", {
            roomId,
            answer
        });
    });

    socket.on("answer", async (data) => {
        console.log("Received answer");
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on("ice-candidate", async (data) => {
        // Add ICE candidate
        try {
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        } catch (e) {
            console.error("Error adding received ICE candidate", e);
        }
    });

    socket.on("user-joined", (userId) => {
        console.log("User joined:", userId);
        // If we're already in a call, send an offer to the new user
        if (pc && pc.signalingState === "stable") {
            startCall();
        }
    });

    socket.on("disconnect", (reason) => {
        console.log("Disconnected from signaling server:", reason);
    });
}

// 4. Join room
function joinRoom() {
    roomId = roomInput.value.trim();
    if (!roomId) {
        alert("Enter a room ID");
        return;
    }
    if (!socket || !socket.connected) {
        alert("Socket not connected yet, please wait and try again.");
        return;
    }

    socket.emit("join-room", roomId);

    console.log("Joined room:", roomId);
    startCallBtn.disabled = false;
}

joinBtn.onclick = joinRoom;

// 5. Start call (caller side)
async function startCall() {
    if (!roomId) {
        alert("Join a room first");
        return;
    }

    if (!pc) createPeerConnection();

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", {
        roomId,
        offer
    });

    console.log("Offer sent");
}

startCallBtn.onclick = startCall;

// Initialize everything
(async function () {
    await initLocalMedia();
    connectSocket();
})();