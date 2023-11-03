export const BOARD_SIZE = 31;

/**
 * @typedef {'X'|'O'|null} TileContent
 */

/**
 * @typedef TileData
 * @prop {TileContent[][]} tileContents
 * @prop {boolean[][]} coveredTiles
 */

export class Game {
  /**
   * @param {import('../connection/Connection').Connection} connection
   */
  constructor(connection) {
    this.connection = connection;

    this.players = Game.genPlayers(connection);
    this.currPlayerIndex = 0;

    this.tileContents = Game.genTileContents();
    this.coveredTiles = Game.genRandomCoveredTiles();

    this.connection.broadcast("game_start");
    this.connection.broadcast("game_update", this.tileData);
    this.connection.broadcast(
      "next_turn",
      this.currentPlayer,
      ...Game.genPanOffset(),
    );
  }

  /**
   * @param {import('../connection/Connection').Connection} connection
   */
  static genPlayers(connection) {
    const playerList = [];

    if (Math.random() < 0.5) {
      playerList.push(connection.selfId);
      playerList.push(connection.peerId);
    } else {
      playerList.push(connection.peerId);
      playerList.push(connection.selfId);
    }

    return playerList;
  }

  /**
   * @returns {TileContent[][]}
   */
  static genTileContents() {
    const tileContents = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
      tileContents.push([...Array(BOARD_SIZE)].map(() => null));
    }

    return tileContents;
  }

  static genRandomCoveredTiles() {
    const p = 0.3; // TODO
    const coveredTiles = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
      coveredTiles.push([...Array(BOARD_SIZE)].map(() => Math.random() < p));
    }

    return coveredTiles;
  }

  static genPanOffset() {
    const halfSize = Math.floor(BOARD_SIZE / 2);

    const panX = Math.floor(Math.random() * halfSize);
    const panY = Math.floor(Math.random() * halfSize);

    return [panX, panY];
  }

  get currentPlayer() {
    return this.players[this.currPlayerIndex];
  }

  /**
   * @returns {TileData}
   */
  get tileData() {
    return {
      tileContents: this.tileContents,
      coveredTiles: this.coveredTiles,
    };
  }
}
