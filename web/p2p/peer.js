/**
 * UNITED experimental WebRTC peer transport.
 *
 * This is NOT a blockchain consensus implementation and does not speak the
 * Bitcoin P2P wire protocol. Treat every received payload as untrusted.
 */
const PROTOCOL = "united-browser-p2p";
const VERSION = 1;
const MAX_MESSAGE_BYTES = 256 * 1024;
const ALLOWED_TYPES = new Set(["hello", "getheaders", "headers", "getdata", "block", "tx", "ping", "pong"]);

function bytes(value) {
  return new TextEncoder().encode(value).byteLength;
}

function validSignal(signal, localId) {
  return signal && typeof signal === "object" &&
    signal.to === localId && typeof signal.from === "string" &&
    signal.from.length > 0 && signal.from.length <= 128 &&
    (signal.description || signal.candidate);
}

export class UnitedWebRTCPeer {
  constructor({ peerId, localId, signal, rtcConfig = {}, onMessage = () => {}, onState = () => {} }) {
    if (!peerId || !localId || !signal || typeof signal.send !== "function" ||
        typeof signal.subscribe !== "function") {
      throw new TypeError("peerId, localId and a signalling adapter are required");
    }
    if (typeof RTCPeerConnection === "undefined") {
      throw new Error("WebRTC is unavailable in this runtime");
    }
    this.peerId = peerId;
    this.localId = localId;
    this.signal = signal;
    this.onMessage = onMessage;
    this.onState = onState;
    this.pc = new RTCPeerConnection(rtcConfig);
    this.channel = null;
    this.closed = false;
    this.unsubscribe = signal.subscribe(message => this.handleSignal(message));
    this.pc.onconnectionstatechange = () => this.onState(this.pc.connectionState);
    this.pc.onicecandidate = event => {
      if (event.candidate && !this.closed) {
        this.signal.send({ to: this.peerId, from: this.localId, candidate: event.candidate }).catch(() => this.onState("signalling-error"));
      }
    };
    this.pc.ondatachannel = event => this.attachChannel(event.channel);
  }

  attachChannel(channel) {
    if (this.closed) { channel.close(); return; }
    this.channel = channel;
    channel.binaryType = "arraybuffer";
    channel.onmessage = event => this.receive(event.data);
    channel.onopen = () => this.onState("datachannel-open");
    channel.onclose = () => this.onState("datachannel-closed");
    channel.onerror = () => this.onState("datachannel-error");
  }

  async connect() {
    if (this.channel) throw new Error("A data channel already exists");
    this.attachChannel(this.pc.createDataChannel(PROTOCOL, { ordered: true }));
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await this.signal.send({ to: this.peerId, from: this.localId, description: this.pc.localDescription });
  }

  async handleSignal(message) {
    if (this.closed || !validSignal(message, this.localId) || message.from !== this.peerId) return;
    try {
      if (message.description) {
        const description = message.description;
        await this.pc.setRemoteDescription(description);
        if (description.type === "offer") {
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          await this.signal.send({ to: this.peerId, from: this.localId, description: this.pc.localDescription });
        }
      } else if (message.candidate) {
        await this.pc.addIceCandidate(message.candidate);
      }
    } catch (error) {
      this.onState("signalling-error");
    }
  }

  send(type, payload) {
    if (!ALLOWED_TYPES.has(type)) throw new TypeError("Unsupported UNITED browser message type");
    if (!this.channel || this.channel.readyState !== "open") throw new Error("Peer data channel is not open");
    const message = JSON.stringify({ protocol: PROTOCOL, version: VERSION, type, payload });
    if (bytes(message) > MAX_MESSAGE_BYTES) throw new RangeError("Message exceeds browser transport limit");
    this.channel.send(message);
  }

  receive(data) {
    let text;
    if (typeof data === "string") text = data;
    else if (data instanceof ArrayBuffer) text = new TextDecoder().decode(data);
    else return;
    if (bytes(text) > MAX_MESSAGE_BYTES) return;
    try {
      const message = JSON.parse(text);
      if (message.protocol !== PROTOCOL || message.version !== VERSION ||
          !ALLOWED_TYPES.has(message.type) || !Object.hasOwn(message, "payload")) return;
      this.onMessage(message, this.peerId);
    } catch {
      // Malformed peer data is dropped; it must never reach consensus code directly.
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    if (typeof this.unsubscribe === "function") this.unsubscribe();
    if (this.channel) this.channel.close();
    this.pc.close();
    this.onState("closed");
  }
}
