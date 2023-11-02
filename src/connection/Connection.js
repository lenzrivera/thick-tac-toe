import EventEmitter from "eventemitter3";
import Peer from "peerjs";

/**
 * @typedef Message
 * @prop {string} msgName
 * @prop {any[]} args
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

  get id() {
    return this.self.id;
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
   * @param {string} msgName
   * @param  {...any} args
   */
  broadcast(msgName, ...args) {
    this.send(msgName, ...args);
    this.handleMessageReceive({ msgName, args });
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
   * @param {string} msgName
   * @param {...any} args
   */
  send(msgName, ...args) {
    if (!this.peer) {
      throw new Error("Cannot send data to nonexistent peer.");
    }

    this.peer.send({ msgName, args });
  }
}
