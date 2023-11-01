import EventEmitter from "eventemitter3";
import Peer from "peerjs";

export class GameServer extends EventEmitter {
  constructor() {
    super();

    this.conn = new Peer();
    // @ts-ignore
    this.conn.once("open", this.handleConnOpen, this);
  }

  get selfId() {
    return this.conn.id;
  }

  get joinLink() {
    return `${location.origin}${location.pathname}?id=${this.selfId}`;
  }

  handleConnOpen() {
    this.emit("connection_ready");
  }

  /**
   * @param {string} opponentId
   */
  startConnection(opponentId) {}
}
