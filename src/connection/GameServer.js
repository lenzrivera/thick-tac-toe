import EventEmitter from "eventemitter3";

import { Game } from "../lib/Game";
import { Connection } from "./Connection";

export class GameServer extends EventEmitter {
  constructor() {
    super();

    this.connection = new Connection();
    this.connection.once("open", this.handleConnectionOpen, this);

    this.instance = null;
  }

  get selfId() {
    return this.connection.id;
  }

  get joinLink() {
    return `${location.origin}${location.pathname}?id=${this.selfId}`;
  }

  handleConnectionOpen() {
    this.emit("connection_ready");
  }

  broadcast(eventName, ...args) {
    this.connection.send("gs_event", { eventName, args });
    this.emit(eventName, ...args);
  }

  /**
   * @param {string} opponentId
   */
  async startGame(opponentId) {
    await this.connection.connect(opponentId);

    this.instance = new Game();
    this.broadcast("game_start");
    this.broadcast("game_update", this.instance.tileData);
  }
}
