<script>
  import { onDestroy, onMount } from "svelte";

  import { getOpponentIdFromJoinLink, resetUrl } from "./connection/join_link";
  import { store } from "./store";

  import Board from "./components/Board.svelte";
  import Fog from "./components/Fog.svelte";
  import MainModal from "./components/MainModal.svelte";

  /**
   * @type {Board}
   */
  let board;

  /**
   * @type {Fog}
   */
  let fog;

  let showMainModal = false;

  onMount(() => {
    $store.gameServer.once("connection_ready", handleConnectionReady);

    $store.gameServer.once("game_start", handleGameStart);
    $store.gameServer.on("game_update", handleGameUpdate);
    $store.gameServer.on("next_turn", handleNextTurn);
    $store.gameServer.on("uncovered_tile_place", handleUncoveredTilePlace);
    $store.gameServer.on("covered_tile_place", handleCoveredTilePlace);
    $store.gameServer.once("game_end", handleGameEnd);
  });

  onDestroy(() => {
    $store.gameServer.off("game_update", handleGameUpdate);
    $store.gameServer.off("next_turn", handleNextTurn);
    $store.gameServer.off("uncovered_tile_place", handleUncoveredTilePlace);
    $store.gameServer.off("covered_tile_place", handleCoveredTilePlace);
  });

  function handleConnectionReady() {
    const opponentId = getOpponentIdFromJoinLink();

    if (opponentId) {
      resetUrl();
      $store.gameServer.startGame(opponentId);
    } else {
      fog.retract();
      showMainModal = true;
    }
  }

  function handleGameStart() {
    fog.coverAll();
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
    fog.coverAll();

    if ($store.gameServer.selfId === currPlayerId) {
      board.setPanOffset(currPanXOffset, currPanYOffset);
      fog.coverPart();
    }
  }

  /**
   * @param {number} tileX
   * @param {number} tileY
   */
  function handleTileClick(tileX, tileY) {
    $store.gameServer.sendCommand({
      name: "placeOnTile",
      args: [tileX, tileY],
    });
  }

  /**
   * @param {number} tileX
   * @param {number} tileY
   * @param {object} type
   */
  function handleUncoveredTilePlace(tileX, tileY, type) {
    board.placeOnTile(tileX, tileY, type);
    // $store.gameServer.nextTurn();
  }

  /**
   * @param {number} tileX
   * @param {number} tileY
   * @param {object} type
   */
  function handleCoveredTilePlace(tileX, tileY, type) {
    if (type !== null) {
      board.placeOnTile(tileX, tileY, type);
    }

    board.uncoverTile(tileX, tileY);
    // $store.gameServer.nextTurn();
  }

  /**
   * @param {boolean[][]} winningTiles
   */
  function handleGameEnd(winningTiles) {
    fog.retract();
    board.zoomOut();
    board.highlightTiles(winningTiles);

    $store.gameServer.endConnection();
    showMainModal = true;
  }
</script>

<div class="app">
  <Board
    bind:this={board}
    on:tile_click={({ detail: [tileX, tileY] }) =>
      handleTileClick(tileX, tileY)}
  />

  {#if showMainModal}
    <MainModal joinLink={$store.gameServer.joinLink} />
  {/if}

  <Fog bind:this={fog} />
</div>

<style>
  .app {
    position: fixed;
    inset: 0;

    background-color: black;
  }
</style>
