import EventEmitter from "eventemitter3";
import Peer from "peerjs";

/**
 * @typedef Message
 * @prop {string} name
 * @prop {any[]} [args]
 */

// TODO: Explicitly close other connections when already connected to a peer.

export class Connection extends EventEmitter {
  /**
   * @type {?import("peerjs").DataConnection}
   */
  peer;

  constructor() {
    super();

    this.self = new Peer();
    this.peer = null;

    // @ts-ignore
    this.self.once("open", this.handleOpen, this);
    // @ts-ignore
    this.self.on("connection", this.handleConnectionToSelf, this);
  }

  get selfId() {
    return this.self.id;
  }

  get peerId() {
    return this.peer?.peer;
  }

  handleOpen() {
    this.emit("open");
  }

  /**
   * @param {import("peerjs").DataConnection} conn
   */
  handleConnectionToSelf(conn) {
    this.peer = conn;

    conn.once("open", () => {
      // @ts-ignore
      conn.on("data", this.handleMessageReceive, this);
    });
  }

  /**
   * @param {Message} messageData
   */
  handleMessageReceive(messageData) {
    this.emit("message", messageData);
  }

  /**
   * @param {Message} message
   */
  broadcast({ name, args }) {
    this.send(this.selfId, { name, args });
    this.send(this.peerId, { name, args });
  }

  /**
   * @param {string} peerId
   * @returns {Promise<void>}
   */
  connect(peerId) {
    const conn = this.self.connect(peerId);

    return new Promise((resolve, reject) => {
      this.self.once("error", reject);

      conn.once("open", () => {
        this.peer = conn;

        // Handle data from connections made *from* self.
        // @ts-ignore
        this.peer.on("data", this.handleMessageReceive, this);

        resolve();
      });
    });
  }

  /**
   * @param {string} peerId
   * @param {Message} message
   */
  send(peerId, { name, args }) {
    if (peerId !== this.selfId && peerId !== this.peerId) {
      throw new Error("Cannot send data to an invalid peer.");
    }

    if (peerId === this.selfId) {
      this.handleMessageReceive({ name, args: args ?? [] });
      return;
    }

    this.peer.send({ name, args: args ?? [] });
  }
}
