export const BOARD_SIZE = 31;

/**
 * @typedef {'X'|'O'|null} TileContent
 */

export class Game {
  constructor() {
    this.tileContents = Game.genTileContents();
    this.coveredTiles = Game.genRandomCoveredTiles();
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

  get tileData() {
    return {
      tileContents: this.tileContents,
      coveredTiles: this.coveredTiles,
    };
  }
}
