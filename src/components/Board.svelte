<script>
  import { createEventDispatcher, getContext, tick } from 'svelte';
  const dispatch = createEventDispatcher();

  import Tile from './Tile.svelte';

  export let pannable = true;

  /**
   * @type {?import('../lib/Game').TileContent[][]}
   */
  let tileContents = null;

  /**
   * @type {?boolean[][]}
   */
  let coveredTiles = null;

  let enableCovering = true;

  /**
   * Offset from board's top-left (0, 0) to bottom-right (1, 1).
   * @type {{x: number, y: number}}
   */
  let panOffset = { x: 0, y: 0 };
  let panAnchor = null;
  let prevPanOffset = null;
  let panVelocity = 0;

  let zoomedOut = false;

  $: computePanVelocity(tileContents);

  const { fogRadius } = getContext('fog_screen');

  export function placeOnTile(tileX, tileY, type) {
    // TODO: Handle case where tileContents is null.
    tileContents[tileY][tileX] = type;
    tileContents = tileContents;
  }

  export function uncoverTile(tileX, tileY) {
    // TODO: Handle case where coveredTiles is null.
    return new Promise(resolve => {
      coveredTiles[tileY][tileX] = false;
      coveredTiles = coveredTiles;

      setTimeout(resolve, 1500);
    });
  }

  /**
   * @param {import('../lib/Game').TileData} tileData
   */
  export function updateTileData(tileData) {
    // TODO: Consider using a prop instead?
    tileContents = tileData.tileContents;
    coveredTiles = tileData.coveredTiles;
  }

  export function setPanOffset(x, y) {
    panOffset = { x, y };
  }

  export function zoomOut(winningTiles) {
    // The way winningTiles is computed somewhat ensures tile ordering.
    const centerTile = winningTiles[Math.floor(winningTiles.length / 2)];
    zoomToTile(...centerTile);
  }

  export function resetZoom() {
    zoomedOut = false;
  }

  export function setCoverShow(value) {
    enableCovering = value;
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

    dispatch('tile_click', [tileX, tileY]);
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
    const tileElem = document.querySelector('.tile');

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
    if (!pannable) {
      return;
    }

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
      x: clamp(prevPanOffset.x - dx * panVelocity, -1, 1),
      y: clamp(prevPanOffset.y - dy * panVelocity, -1, 1),
    };
  }

  function handleBoardPointerUp() {
    panAnchor = null;
    prevPanOffset = null;
  }

  /* For zooming */

  function zoomToTile(tileX, tileY) {
    // TODO: Bound to only one dimension
    const cellCount = tileContents.length;
    const midpoint = (cellCount - 1) / 2;

    setPanOffset((tileX - midpoint) / midpoint, (tileY - midpoint) / midpoint);
    zoomedOut = true;
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
  <div class="pannable_board" class:zoomed_out={zoomedOut}>
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
            covered={enableCovering && coveredTiles[y][x]}
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
    --tile-size: calc(100vmin / var(--visible-tile-count));
    --visible-tile-count: 5;

    position: absolute;
    inset: 0;
    overflow: hidden;

    user-select: none;

    background-color: #0f0f0f;
  }

  .pannable_board {
    --zoom: 1;

    /* Position the board's top-left corner to its container's center. */
    position: absolute;
    top: 50%;
    left: 50%;

    translate: calc(
        -50% - (50% - var(--tile-size) / 2) * var(--pan-x) * var(--zoom)
      )
      calc(-50% - (50% - var(--tile-size) / 2) * var(--pan-y) * var(--zoom));
    scale: var(--zoom);

    display: grid;
    grid-template-columns: repeat(var(--grid-count), auto);
    justify-content: center;
  }

  .pannable_board.zoomed_out {
    --zoom: 0.5;
  }
</style>
