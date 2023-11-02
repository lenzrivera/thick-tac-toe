<script>
  import Tile from "./Tile.svelte";

  /**
   * @type {?import('../lib/Game').TileContent[][]}
   */
  let tileContents = null;

  /**
   * @type {?boolean[][]}
   */
  let coveredTiles = null;

  $: flatTileContents = tileContents ? tileContents.flat() : [];
  $: flatCoveredTiles = coveredTiles ? coveredTiles.flat() : [];

  /**
   * @param {import('../lib/Game').TileData} tileData
   */
  export function updateTileData(tileData) {
    tileContents = tileData.tileContents;
    coveredTiles = tileData.coveredTiles;
  }
</script>

<div
  class="board"
  style="--grid-count: {tileContents ? tileContents.length : 0};"
>
  <div class="pannable_board">
    {#each flatTileContents as content, i}
      <Tile {content} covered={flatCoveredTiles[i]} />
    {/each}
  </div>
</div>

<style>
  .board {
    --visible-tile-count: 5;
    --pan-x: 0;
    --pan-y: 0;
    --zoom-scale: 0;

    position: absolute;
    inset: 0;
    overflow: hidden;

    /* Scale such that only the supposedly visible region of the board is shown. */
    --DEFAULT-SCALE: 100% * var(--grid-count) / var(--visible-tile-count);

    /* Lerp from --zoom-scale: 0 (normal view) to 1 (all zoomed out). */
    scale: calc(
      var(--DEFAULT-SCALE) + var(--zoom-scale) * (100% - var(--DEFAULT-SCALE))
    );
  }

  .pannable_board {
    /* Position the board's top-left corner to its container's center. */
    position: absolute;
    top: 50%;
    left: 50%;

    /* Translate the board's center to its container's center + pan offset. */
    translate: calc(-50% + var(--pan-x) * 50%) calc(-50% + var(--pan-y) * 50%);

    display: grid;
    grid-template-columns: repeat(var(--grid-count), auto);
    justify-content: center;
  }
</style>
