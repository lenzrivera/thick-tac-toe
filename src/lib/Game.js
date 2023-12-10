/**
 * @typedef {'X'|'O'|null} TileContent
 */

/**
 * @typedef TileData
 * @prop {TileContent[][]} tileContents
 * @prop {boolean[][]} coveredTiles
 */

export const BOARD_SIZE = 3;
const WINNING_LINE_LEN = 3;

const MAX_COVER_PROBABILITY = 0.7;

export class Game {
  /**
   * @param {import('../connection/Connection').Connection} connection
   */
  constructor(connection) {
    this.connection = connection;

    this.players = Game.genPlayers(connection);
    this.currPlayerIndex = 0;
    this.turnCount = 0;

    this.tileContents = Game.genTileContents();
    this.coveredTiles = this.genRandomCoveredTiles();

    this.connection.broadcast({ name: 'game_start' });
    this.connection.broadcast({ name: 'game_update', args: [this.tileData] });
    this.connection.broadcast({
      name: 'next_turn',
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

  static computeCoverProbability(turnCount) {
    const START_VALUE = 0.1;
    const TARGET_VALUE = MAX_COVER_PROBABILITY;

    // Ideally, this would be a function of BOARD_SIZE.
    const RATE = 10;

    return (
      (TARGET_VALUE - START_VALUE) * (1 - Math.exp(-turnCount / RATE)) +
      START_VALUE
    );
  }

  genRandomCoveredTiles() {
    const p = Game.computeCoverProbability(this.turnCount);
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
    return ['X', 'O'][this.currPlayerIndex];
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

  checkWinCondition(placeX, placeY) {
    // Basically, try going over a line of length 2 * WINNING_LINE_LEN from the
    // tile placed on and see if there is a consecutive WINNING_LINE_LEN streak
    // to determine if a winning placement has occured.

    const leftX = placeX - (WINNING_LINE_LEN - 1);
    const rightX = placeX + (WINNING_LINE_LEN - 1);
    const topY = placeY - (WINNING_LINE_LEN - 1);

    /**
     * @param {(i: number) => number[]} nextTile
     */
    const hasWinningLine = nextTile => {
      let candidateTiles = [];

      for (let i = 0; i < WINNING_LINE_LEN * 2; i++) {
        const [nextX, nextY] = nextTile(i);

        if (!Game.coordsInBounds(nextX, nextY)) {
          continue;
        }

        if (candidateTiles.length < WINNING_LINE_LEN) {
          if (this.tileContents[nextY][nextX] !== this.currentSymbol) {
            candidateTiles = [];
            continue;
          }

          candidateTiles.push([nextX, nextY]);
        }

        // Keep on adding tiles even if WINNING_LINE_LEN has been reached to
        // cover cases where a winning line was built from between.
        else {
          if (this.tileContents[nextY][nextX] !== this.currentSymbol) {
            break;
          }

          candidateTiles.push([nextX, nextY]);
        }
      }

      return candidateTiles.length >= WINNING_LINE_LEN ? candidateTiles : [];
    };

    // Left-to-right diagonal
    const ltrdLine = hasWinningLine(i => [leftX + i, topY + i]);

    if (ltrdLine.length !== 0) {
      return ltrdLine;
    }

    // Top-to-down vertical
    const ttdvLine = hasWinningLine(i => [placeX, topY + i]);

    if (ttdvLine.length !== 0) {
      return ttdvLine;
    }

    // Right-to-left diagonal
    const rtldLine = hasWinningLine(i => [rightX - i, topY + i]);

    if (rtldLine.length !== 0) {
      return rtldLine;
    }

    // Left-to-right horizontal
    const ltrhLine = hasWinningLine(i => [leftX + i, placeY]);

    if (ltrhLine.length !== 0) {
      return ltrhLine;
    }

    return [];
  }

  checkDrawCondition() {
    return this.tileContents.every(row => row.every(tile => tile !== null));
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
          name: 'covered_tile_place',
          args: [tileX, tileY, this.currentSymbol],
        });
      }

      // Attempted to place on an uncovered unoccupied tile
      else {
        this.connection.send(this.currentPlayer, {
          name: 'uncovered_tile_place',
          args: [tileX, tileY, this.currentSymbol],
        });
      }
    } else {
      // Attempted to place on an covered occupied tile
      if (this.coveredTiles[tileY][tileX]) {
        this.connection.send(this.currentPlayer, {
          name: 'covered_tile_place',
          args: [tileX, tileY, null],
        });
      }
    }
  }

  // TODO: hacky parameters not supposed to be there
  // This method gets called before the end check completes, messing up the
  // end check. Would require a bit of reworking to fix cleanly, so we just
  // perform the end check here (involving the said parameter passing).
  nextTurn(lastPlaceX, lastPlaceY) {
    const winningTiles = this.checkWinCondition(lastPlaceX, lastPlaceY);

    if (winningTiles.length !== 0) {
      this.connection.broadcast({ name: 'game_end', args: [winningTiles] });

      // TODO: Hacky solution to reflect the new (winning) placement to the
      // player who did not place the tile.
      this.connection.broadcast({
        name: 'game_update',
        args: [this.tileData],
      });

      return;
    }

    if (this.checkDrawCondition()) {
      this.connection.broadcast({ name: 'game_end' });

      // TODO: Likewise.
      this.connection.broadcast({
        name: 'game_update',
        args: [this.tileData],
      });

      return;
    }

    this.turnCount += 1;

    this.currPlayerIndex = (this.currPlayerIndex + 1) % 2;
    this.coveredTiles = this.genRandomCoveredTiles();

    // Update the current player on the results of the actions of the prior
    // player + all players on the new covered tiles.
    this.connection.broadcast({
      name: 'game_update',
      args: [this.tileData],
    });

    this.connection.broadcast({
      name: 'next_turn',
      args: [this.currentPlayer, ...Game.genPanOffset()],
    });
  }
}
