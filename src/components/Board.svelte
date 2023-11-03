<script>
  import Tile from "./Tile.svelte";

  const PAN_VEL = 0.0005;

  /**
   * @type {?import('../lib/Game').TileContent[][]}
   */
  let tileContents = null;

  /**
   * @type {?boolean[][]}
   */
  let coveredTiles = null;

  let panOffset = { x: 0, y: 0 };
  let panAnchor = null;
  let prevPanOffset = null;

  $: flatTileContents = tileContents ? tileContents.flat() : [];
  $: flatCoveredTiles = coveredTiles ? coveredTiles.flat() : [];

  /**
   * @param {import('../lib/Game').TileData} tileData
   */
  export function updateTileData(tileData) {
    tileContents = tileData.tileContents;
    coveredTiles = tileData.coveredTiles;
  }

  function getBoardStyle(tileContents, panOffset) {
    return (
      `--grid-count: ${tileContents ? tileContents.length : 0};` +
      `--pan-x: ${panOffset.x}; --pan-y: ${panOffset.y};`
    );
  }

  /* For panning */

  function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
  }

  function handleBoardPointerDown({ clientX, clientY }) {
    panAnchor = { x: clientX, y: clientY };
    prevPanOffset = { ...panOffset };
  }

  function handlePointerMove({ clientX, clientY }) {
    if (!panAnchor || !prevPanOffset) {
      return;
    }

    const dx = clientX - panAnchor.x;
    const dy = clientY - panAnchor.y;

    panOffset = {
      x: clamp(prevPanOffset.x + dx * PAN_VEL, -1, 1),
      y: clamp(prevPanOffset.y + dy * PAN_VEL, -1, 1),
    };
  }

  function handleBoardPointerUp() {
    panAnchor = null;
    prevPanOffset = null;
  }
</script>

<svelte:body
  on:pointermove={handlePointerMove}
  on:pointerup={handleBoardPointerUp}
/>

<div
  class="board"
  style={getBoardStyle(tileContents, panOffset)}
  on:pointerdown={handleBoardPointerDown}
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
