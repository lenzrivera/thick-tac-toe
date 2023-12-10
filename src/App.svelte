<script>
  import { onDestroy, onMount } from 'svelte';

  import { getOpponentIdFromJoinLink, resetUrl } from './connection/join_link';
  import { store } from './store';

  import Board from './components/Board.svelte';
  import FogScreen from './components/FogScreen.svelte';
  import MainModal from './components/MainModal.svelte';

  /**
   * @type {Board}
   */
  let board;

  /**
   * @type {FogScreen}
   */
  let fogScreen;

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
    $store.gameServer.on('game_end', handleGameEnd);

    fogScreen.retract();
  });

  onDestroy(() => {
    $store.gameServer.off('game_start', handleGameStart);
    $store.gameServer.off('game_update', handleGameUpdate);
    $store.gameServer.off('next_turn', handleNextTurn);
    $store.gameServer.off('uncovered_tile_place', handleUncoveredTilePlace);
    $store.gameServer.off('covered_tile_place', handleCoveredTilePlace);
    $store.gameServer.off('game_end', handleGameEnd);
  });

  function handleConnectionReady() {
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
    fogScreen.coverAll();
    board.setCoverShow(true);
    board.resetZoom();
    showMainModal = false;
  }

  /**
   * For discreetly updating (i.e. no animations, or for state syncing) the
   * board data.
   * @param {object} tileData
   */
  function handleGameUpdate(tileData) {
    board.updateTileData(tileData);
  }

  /**
   * @param {string} currPlayerId
   * @param {number} currPanXOffset
   * @param {number} currPanYOffset
   */
  function handleNextTurn(currPlayerId, currPanXOffset, currPanYOffset) {
    tilePlaceComplete = false;
    fogScreen.coverAll();

    if ($store.gameServer.selfId === currPlayerId) {
      board.setPanOffset(currPanXOffset, currPanYOffset);
      fogScreen.coverPart();
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

    tilePlaceComplete = true;
  }

  /**
   * @param {number} tileX
   * @param {number} tileY
   * @param {object} type
   */
  function handleUncoveredTilePlace(tileX, tileY, type) {
    board.placeOnTile(tileX, tileY, type);
    $store.gameServer.sendCommand({ name: 'nextTurn', args: [tileX, tileY] });
  }

  /**
   * @param {number} tileX
   * @param {number} tileY
   * @param {object} type
   */
  async function handleCoveredTilePlace(tileX, tileY, type) {
    if (type !== null) {
      board.placeOnTile(tileX, tileY, type);
    }

    await board.uncoverTile(tileX, tileY);
    $store.gameServer.sendCommand({ name: 'nextTurn', args: [tileX, tileY] });
  }

  /**
   * @param {boolean[][]} winningTiles
   */
  function handleGameEnd(winningTiles) {
    fogScreen.retract();
    board.setCoverShow(false);
    board.zoomOut(winningTiles);
    // board.highlightTiles(winningTiles);

    // TODO: Relying on a fixed timeout like this is probably a bad idea.
    setTimeout(() => {
      $store.gameServer.endConnection();
      showMainModal = true;
    }, 5000);
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
