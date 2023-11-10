<script>
  import { createEventDispatcher, getContext, tick } from "svelte";
  const dispatch = createEventDispatcher();

  import Tile from "./Tile.svelte";

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
  let panVelocity = 0;

  $: computePanVelocity(tileContents);

  const { fogRadius } = getContext("fog_screen");

  export function placeOnTile(tileX, tileY, type) {
    // TODO: Handle case where tileContents is null.
    tileContents[tileY][tileX] = type;
    tileContents = tileContents;
  }

  export function uncoverTile(tileX, tileY) {
    // TODO: Handle case where coveredTiles is null.
    return new Promise((resolve) => {
      coveredTiles[tileY][tileX] = false;
      coveredTiles = coveredTiles;

      setTimeout(resolve, 1500);
    });
  }

  /**
   * @param {import('../lib/Game').TileData} tileData
   */
  export function updateTileData(tileData) {
    tileContents = tileData.tileContents;
    coveredTiles = tileData.coveredTiles;
  }

  export function setPanOffset(x, y) {
    panOffset = { x, y };
  }

  function getBoardStyle(tileContents, panOffset) {
    return (
      `--grid-count: ${tileContents ? tileContents.length : 0};` +
      `--pan-x: ${panOffset.x}; --pan-y: ${panOffset.y};`
    );
  }

  function handleTileClick(clientX, clientY, tileX, tileY) {
    if (
      isInFogZone(clientX, clientY) ||
      (panAnchor && (panAnchor.x !== clientX || panAnchor.y !== clientY))
    ) {
      return;
    }

    dispatch("tile_click", [tileX, tileY]);
  }

  /* For panning */

  function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
  }

  async function computePanVelocity(tileContents) {
    // TODO: Think of a less janky way to do this (looking at you, querySelector()).

    if (!tileContents) {
      return 0;
    }

    await tick();

    /**
     * @type {HTMLDivElement}
     */
    const tileElem = document.querySelector(".tile");

    const tileSize = tileElem.offsetWidth;
    const tileLineCount = tileContents.length;

    panVelocity = 1.2 / (tileLineCount * tileSize);
  }

  function isInFogZone(cursorX, cursorY) {
    const cx = window.innerWidth / 2 - cursorX;
    const cy = window.innerHeight / 2 - cursorY;

    return cx ** 2 + cy ** 2 > $fogRadius ** 2;
  }

  function handleBoardPointerDown({ clientX, clientY }) {
    panAnchor = { x: clientX, y: clientY };
    prevPanOffset = { ...panOffset };
  }

  function handlePointerMove({ clientX, clientY }) {
    if (isInFogZone(clientX, clientY) || !panAnchor || !prevPanOffset) {
      return;
    }

    const dx = clientX - panAnchor.x;
    const dy = clientY - panAnchor.y;

    panOffset = {
      x: clamp(prevPanOffset.x + dx * panVelocity, -1, 1),
      y: clamp(prevPanOffset.y + dy * panVelocity, -1, 1),
    };
  }

  function handleBoardPointerUp() {
    panAnchor = null;
    prevPanOffset = null;
  }
</script>

<!-- Pan velocity depends on the actual size of the tiles. -->
<svelte:window on:resize={() => computePanVelocity(tileContents)} />

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
    {#if tileContents}
      {#each tileContents as row, y}
        {#each row as content, x}
          <!-- 
            Clicking a tile means having finished a press (pointerup) without
            having moved the pointer, i.e. no panning occurred. Simply using
            on:click will not work due to panning.
          -->
          <Tile
            {content}
            covered={coveredTiles[y][x]}
            on:pointerup={({ clientX, clientY }) =>
              handleTileClick(clientX, clientY, x, y)}
          />
        {/each}
      {/each}
    {/if}
  </div>
</div>

<style>
  .board {
    --visible-tile-count: 5;

    position: absolute;
    inset: 0;
    overflow: hidden;

    user-select: none;
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
