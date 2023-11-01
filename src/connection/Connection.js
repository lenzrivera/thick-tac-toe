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
    this.messages = new EventEmitter();

    // @ts-ignore
    this.self.once("open", () => this.emit("open"), this);
    // @ts-ignore
    this.self.on("connection", this.handleConnectionToSelf, this);
  }

  get id() {
    return this.self.id;
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
  handleMessageReceive({ msgName, args }) {
    this.messages.emit(msgName, ...args);
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
