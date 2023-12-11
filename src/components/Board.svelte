<script>
  // TODO: This may need a refactor to become more svelte-y.

  import { createEventDispatcher, getContext, tick } from 'svelte';
  const dispatch = createEventDispatcher();

  import Tile from './Tile.svelte';
  import anime from 'animejs';

  export let pannable = true;

  let animProps = {
    /**
     * Offset from board's top-left (0, 0) to bottom-right (1, 1).
     */
    panOffset: { x: 0, y: 0 },

    /**
     * Zoom in/out form board's center; 1 is default scale.
     */
    zoom: 1,
  };

  /**
   * @type {Tile[]}
   */
  let tileComps = [];

  /**
   * @type {?import('../lib/Game').TileContent[][]}
   */
  let tileContents = null;

  /**
   * @type {?boolean[][]}
   */
  let coveredTiles = null;

  let panAnchor = null;
  let prevPanOffset = null;
  let panVelocity = 0;

  $: computePanVelocity(tileContents);

  const { fogRadius } = getContext('fog_screen');

  // TODO: May be better done imperatively via tileComps.
  export function placeOnTile(tileX, tileY, type) {
    tileContents[tileY][tileX] = type;
    tileContents = tileContents;
  }

  // TODO: May be better done imperatively via tileComps.
  export async function uncoverTile(tileX, tileY) {
    const tileIndex = tileY * tileContents.length + tileX;
    const tileComp = tileComps[tileIndex];

    await tileComp.uncover();
  }

  /**
   * @param {import('../lib/Game').TileData} tileData
   */
  export function updateTileDataImmediately(tileData) {
    tileContents = tileData.tileContents;
    coveredTiles = tileData.coveredTiles;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  export function setPanOffsetImmediately(x, y) {
    animProps = { ...animProps, panOffset: { x, y } };
  }

  /**
   * Presents the board to show a winning or drawn move.
   * @param {[number, number][]} winningTiles
   */
  export async function toWinningView(winningTiles) {
    // The way winningTiles is computed somewhat ensures tile ordering.
    const centerTile = winningTiles[Math.floor(winningTiles.length / 2)];

    await focusOnTile(...centerTile);
    await uncoverAllTiles();
    await highlightTiles(winningTiles);
  }

  /**
   * Readies the board for a new game.
   */
  export function resetToInitialView() {
    animProps = { ...animProps, zoom: 1 };
    tileComps.forEach(tc => tc.unflashSymbol());
  }

  /**
   * @param {number} tileCol
   * @param {number} tileRow
   */
  function focusOnTile(tileCol, tileRow) {
    // TODO: Bound to only one board dimension.
    const cellCount = tileContents.length;
    const midpoint = (cellCount - 1) / 2;

    const targetPanX = (tileCol - midpoint) / midpoint;
    const targetPanY = (tileRow - midpoint) / midpoint;

    return new Promise(resolve => {
      anime({
        targets: [animProps, animProps.panOffset],
        x: targetPanX,
        y: targetPanY,
        zoom: 0.5,
        duration: 1500,
        easing: 'easeOutExpo',
        update: () => (animProps = animProps),
        complete: resolve,
      });
    });
  }

  function uncoverAllTiles() {
    return Promise.allSettled(tileComps.map(tc => tc.uncover()));
  }

  /**
   * @param {[number, number][]} winningTiles
   */
  function highlightTiles(winningTiles) {
    return Promise.allSettled(
      winningTiles.map(([tileCol, tileRow]) => {
        const tileComp = tileComps[tileRow * tileContents.length + tileCol];
        return tileComp.flashSymbol();
      }),
    );
  }

  /* For tile click */

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
    prevPanOffset = { ...animProps.panOffset };
  }

  function handlePointerMove({ clientX, clientY }) {
    if (isInFogZone(clientX, clientY) || !panAnchor || !prevPanOffset) {
      return;
    }

    const dx = clientX - panAnchor.x;
    const dy = clientY - panAnchor.y;

    animProps = {
      ...animProps,
      panOffset: {
        x: clamp(prevPanOffset.x - dx * panVelocity, -1, 1),
        y: clamp(prevPanOffset.y - dy * panVelocity, -1, 1),
      },
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
  style={`--grid-count: ${tileContents ? tileContents.length : 0};` +
    `--pan-x: ${animProps.panOffset.x}; --pan-y: ${animProps.panOffset.y};`}
  on:pointerdown={handleBoardPointerDown}
>
  <div class="pannable_board" style="--zoom: {animProps.zoom}">
    {#if tileContents}
      {#each tileContents as row, y}
        {#each row as content, x}
          <!-- 
            Clicking a tile means having finished a press (pointerup) without
            having moved the pointer, i.e. no panning occurred. Simply using
            on:click will not work due to panning.
          -->
          <Tile
            bind:this={tileComps[y * tileContents.length + x]}
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
    --tile-size: calc(100vmin / var(--visible-tile-count));
    --visible-tile-count: 5;

    position: absolute;
    inset: 0;
    overflow: hidden;

    user-select: none;

    background-color: #0f0f0f;
  }

  .pannable_board {
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
</style>
