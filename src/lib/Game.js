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

    this.connection.broadcast({ name: "game_start" });
    this.connection.broadcast({ name: "game_update", args: [this.tileData] });
    this.connection.broadcast({
      name: "next_turn",
      args: [this.currentPlayer, ...Game.genPanOffset()],
    });
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  static coordsInBounds(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
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
    // Random numbers in [-1, 1].
    const panX = (Math.random() * 2 - 1) / 2;
    const panY = (Math.random() * 2 - 1) / 2;

    return [panX, panY];
  }

  get currentPlayer() {
    return this.players[this.currPlayerIndex];
  }

  /**
   * @returns {TileContent}
   */
  get currentSymbol() {
    // @ts-ignore - idk why it's emitting an error here.
    return ["X", "O"][this.currPlayerIndex];
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

  placeOnTile(tileX, tileY) {
    if (!Game.coordsInBounds(tileX, tileY)) {
      return;
    }

    if (!this.tileContents[tileY][tileX]) {
      this.tileContents[tileY][tileX] = this.currentSymbol;

      // Attempted to place on a covered unoccupied tile
      if (this.coveredTiles[tileY][tileX]) {
        this.connection.send(this.currentPlayer, {
          name: "covered_tile_place",
          args: [tileX, tileY, this.currentSymbol],
        });
      }

      // Attempted to place on an uncovered unoccupied tile
      else {
        this.connection.send(this.currentPlayer, {
          name: "uncovered_tile_place",
          args: [tileX, tileY, this.currentSymbol],
        });
      }
    } else {
      // Attempted to place on an covered occupied tile
      if (this.coveredTiles[tileY][tileX]) {
        this.connection.send(this.currentPlayer, {
          name: "covered_tile_place",
          args: [tileX, tileY, null],
        });
      }
    }
  }

  nextTurn() {
    this.currPlayerIndex = (this.currPlayerIndex + 1) % 2;
    this.coveredTiles = Game.genRandomCoveredTiles();

    // Update the current player on the results of the actions of the prior
    // player + all players on the new covered tiles.
    this.connection.broadcast({
      name: "game_update",
      args: [this.tileData],
    });

    this.connection.broadcast({
      name: "next_turn",
      args: [this.currentPlayer, ...Game.genPanOffset()],
    });
  }
}
