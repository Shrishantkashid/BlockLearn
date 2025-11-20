class PeerService {
  constructor() {
    if (!this.peer) {
      console.log("Creating new RTCPeerConnection");
      this.peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      });
      
      this.peer.onicecandidate = (event) => {
        console.log("ICE candidate event:", event);
        if (event.candidate) {
          console.log("ICE candidate gathered:", event.candidate);
        } else {
          console.log("ICE gathering completed");
        }
      };
      
      this.peer.onconnectionstatechange = () => {
        console.log("Connection state changed:", this.peer.connectionState);
      };
      
      this.peer.oniceconnectionstatechange = () => {
        console.log("ICE connection state changed:", this.peer.iceConnectionState);
      };
      
      this.peer.onsignalingstatechange = () => {
        console.log("Signaling state changed:", this.peer.signalingState);
      };
      
      this.peer.ontrack = (event) => {
        console.log("Track event received:", event);
      };
    }
  }

  async getAnswer(offer) {
    if (this.peer) {
      console.log("Setting remote description for answer", offer);
      await this.peer.setRemoteDescription(offer);
      console.log("Creating answer");
      const ans = await this.peer.createAnswer();
      console.log("Setting local description for answer", ans);
      await this.peer.setLocalDescription(new RTCSessionDescription(ans));
      console.log("Answer created and local description set");
      return ans;
    }
  }

  async setLocalDescription(ans) {
    if (this.peer) {
      console.log("Setting remote description for setLocalDescription", ans);
      await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
      console.log("Remote description set");
    }
  }

  async getOffer() {
    if (this.peer) {
      console.log("Creating offer");
      const offer = await this.peer.createOffer();
      console.log("Offer created:", offer);
      console.log("Setting local description for offer");
      await this.peer.setLocalDescription(new RTCSessionDescription(offer));
      console.log("Local description set for offer");
      return offer;
    }
  }
}

export default new PeerService();