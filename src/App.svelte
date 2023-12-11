<script>
  import { onDestroy, onMount } from 'svelte';

  import { getOpponentIdFromJoinLink, resetUrl } from './connection/join_link';
  import { BOARD_SIZE } from './lib/Game';
  import { store } from './store';

  import Board from './components/Board.svelte';
  import FogScreen from './components/FogScreen.svelte';
  import MainModal from './components/MainModal.svelte';
  import { timeout } from './components/util';

  /**
   * @type {Board}
   */
  let board;

  /**
   * @type {FogScreen}
   */
  let fogScreen;

  let ownFirstMoveDone = false;

  /**
   * To prevent additional tile placements (e.g. during animations) when a tile
   * placement has already been made in the first place.
   */
  let tilePlaceComplete = false;

  let showMainModal = false;

  onMount(() => {
    $store.gameServer.once('connection_ready', handleConnectionReady);
    $store.gameServer.on('connection_close', handleGameClose);

    $store.gameServer.on('game_start', handleGameStart);
    $store.gameServer.on('game_update', handleGameUpdate);
    $store.gameServer.on('next_turn', handleNextTurn);
    $store.gameServer.on('uncovered_tile_place', handleUncoveredTilePlace);
    $store.gameServer.on('covered_tile_place', handleCoveredTilePlace);
    $store.gameServer.on('game_end_win', handleGameEndWin);
    $store.gameServer.on('game_end_draw', handleGameEndDraw);

    fogScreen.retract();
  });

  onDestroy(() => {
    $store.gameServer.off('game_start', handleGameStart);
    $store.gameServer.off('game_update', handleGameUpdate);
    $store.gameServer.off('next_turn', handleNextTurn);
    $store.gameServer.off('uncovered_tile_place', handleUncoveredTilePlace);
    $store.gameServer.off('covered_tile_place', handleCoveredTilePlace);
    $store.gameServer.off('game_end_win', handleGameEndWin);
    $store.gameServer.off('game_end_draw', handleGameEndDraw);
  });

  async function handleConnectionReady() {
    const opponentId = getOpponentIdFromJoinLink();

    if (opponentId) {
      resetUrl();
      $store.gameServer.startGame(opponentId);
    } else {
      fogScreen.retract();
      showMainModal = true;
    }
  }

  function handleGameStart() {
    fogScreen.coverAllImmediately();
    // TODO? Play bassy sound effect

    // Reset state from the previous game (if any).
    ownFirstMoveDone = false;
    board.resetToInitialView();

    showMainModal = false;
  }

  /**
   * For discreetly updating (i.e. no animations, or for state syncing) the
   * board data.
   * @param {object} tileData
   */
  function handleGameUpdate(tileData) {
    board.updateTileDataImmediately(tileData);
  }

  /**
   * @param {string} currPlayerId
   * @param {number} currPanXOffset
   * @param {number} currPanYOffset
   */
  async function handleNextTurn(currPlayerId, currPanXOffset, currPanYOffset) {
    await timeout(1000);

    if ($store.gameServer.selfId === currPlayerId) {
      board.setPanOffsetImmediately(currPanXOffset, currPanYOffset);
      await fogScreen.coverPart();

      tilePlaceComplete = false;
    }
  }

  function handleTileClick(tileX, tileY) {
    if (tilePlaceComplete) {
      return;
    }

    $store.gameServer.sendCommand({
      name: 'placeOnTile',
      args: [tileX, tileY],
    });
  }

  /**
   * @param {number} tileX
   * @param {number} tileY
   * @param {object} type
   */
  async function handleUncoveredTilePlace(tileX, tileY, type) {
    tilePlaceComplete = true;

    if (!ownFirstMoveDone) {
      // Let the player know if they're an X or O on their first move.
      board.placeOnTile(tileX, tileY, type);
      await timeout(2000);

      fogScreen.coverAllImmediately();

      ownFirstMoveDone = true;
    } else {
      fogScreen.coverAllImmediately();
      board.placeOnTile(tileX, tileY, type);

      // TODO? Play bassy sound effect
    }

    $store.gameServer.sendCommand({ name: 'nextTurn', args: [tileX, tileY] });
  }

  /**
   * @param {number} tileX
   * @param {number} tileY
   * @param {object} type
   */
  async function handleCoveredTilePlace(tileX, tileY, type) {
    tilePlaceComplete = true;

    await board.uncoverTile(tileX, tileY);
    // TODO? Play wooshy sound effect

    // We cannot place on this tile.
    if (type !== null) {
      if (!ownFirstMoveDone) {
        // Let the player know if they're an X or O on their first move.
        board.placeOnTile(tileX, tileY, type);
        await timeout(500);

        fogScreen.coverAllImmediately();

        ownFirstMoveDone = true;
      } else {
        fogScreen.coverAllImmediately();
        board.placeOnTile(tileX, tileY, type);

        // TODO? Play bassy sound effect
      }
    }

    $store.gameServer.sendCommand({ name: 'nextTurn', args: [tileX, tileY] });
  }

  /**
   * @param {[number, number][]} winningTiles
   */
  async function handleGameEndWin(winningTiles) {
    // The way winningTiles is computed somewhat ensures tile ordering.
    const centerTile = winningTiles[Math.floor(winningTiles.length / 2)];

    fogScreen.retract();
    await board.focusOnTile(...centerTile);
    await board.uncoverAllTiles();
    await board.highlightTiles(winningTiles);

    $store.gameServer.endConnection();
    showMainModal = true;
  }

  async function handleGameEndDraw() {
    const midpoint = (BOARD_SIZE - 1) / 2;

    fogScreen.retract();
    await board.focusOnTile(midpoint, midpoint);
    await board.uncoverAllTiles();

    $store.gameServer.endConnection();
    showMainModal = true;
  }

  function handleGameClose() {
    alert('Connection with opponent was unexpectedly closed!');

    fogScreen.retract();
    showMainModal = true;
  }
</script>

<FogScreen bind:this={fogScreen}>
  <Board
    bind:this={board}
    pannable={!tilePlaceComplete}
    on:tile_click={({ detail }) => handleTileClick(...detail)}
  />

  {#if showMainModal}
    <MainModal joinLink={$store.gameServer.joinLink} />
  {/if}
</FogScreen>
