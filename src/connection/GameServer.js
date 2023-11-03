import EventEmitter from "eventemitter3";

import { Game } from "../lib/Game";
import { Connection } from "./Connection";

export class GameServer extends EventEmitter {
  constructor() {
    super();

    this.connection = new Connection();
    this.instance = null;

    this.connection.once("open", this.handleConnectionOpen, this);
    this.connection.on("message", this.handleConnectionMessage, this);
  }

  get selfId() {
    return this.connection.selfId;
  }

  get joinLink() {
    return `${location.origin}${location.pathname}?id=${this.selfId}`;
  }

  handleConnectionOpen() {
    this.emit("connection_ready");
  }

  handleConnectionMessage({ msgName, args }) {
    this.emit(msgName, ...args);
  }

  /**
   * @param {string} opponentId
   */
  async startGame(opponentId) {
    // TODO: Handle connection failure.
    await this.connection.connect(opponentId);

    this.instance = new Game(this.connection);
  }
}
