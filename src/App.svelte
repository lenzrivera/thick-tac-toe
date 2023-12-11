<script>
  import { onDestroy, onMount } from 'svelte';

  import { Howl } from 'howler';

  import { getOpponentIdFromJoinLink, resetUrl } from './connection/join_link';
  import { BOARD_SIZE } from './lib/Game';
  import { store } from './store';

  import Board from './components/Board.svelte';
  import FogScreen from './components/FogScreen.svelte';
  import MainModal from './components/MainModal.svelte';
  import { timeout } from './components/util';

  // @ts-ignore
  import coverAllSndPath from './assets/audio/cover_all.mp3';
  // @ts-ignore
  import revealPartSndPath from './assets/audio/reveal_part.mp3';
  // @ts-ignore
  import firstMoveSndPath from './assets/audio/first_move.mp3';

  // TODO: There's probably a better way to do this.
  const audio = {
    coverAllSnd: null,
    revealPartSnd: null,
    firstMoveSnd: null,
  };

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
    audio.coverAllSnd = new Howl({ src: [coverAllSndPath] });
    audio.revealPartSnd = new Howl({ src: [revealPartSndPath] });
    audio.firstMoveSnd = new Howl({ src: [firstMoveSndPath] });

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
    audio.coverAllSnd.play();

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

      audio.revealPartSnd.play();
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
      audio.firstMoveSnd.play();
      await timeout(2000);

      fogScreen.coverAllImmediately();
      audio.coverAllSnd.play();

      ownFirstMoveDone = true;
    } else {
      fogScreen.coverAllImmediately();
      audio.coverAllSnd.play();

      board.placeOnTile(tileX, tileY, type);
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

    // We cannot place on this tile.
    if (type !== null) {
      if (!ownFirstMoveDone) {
        audio.firstMoveSnd.play();

        // Let the player know if they're an X or O on their first move.
        board.placeOnTile(tileX, tileY, type);
        await timeout(500);

        fogScreen.coverAllImmediately();
        audio.coverAllSnd.play();

        ownFirstMoveDone = true;
      } else {
        fogScreen.coverAllImmediately();
        audio.coverAllSnd.play();

        board.placeOnTile(tileX, tileY, type);
      }
    } else {
      fogScreen.coverAllImmediately();
      audio.coverAllSnd.play();
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
