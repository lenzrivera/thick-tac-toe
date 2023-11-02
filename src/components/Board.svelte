<script>
</script>

<div class="board">
  <div class="pannable_board">
    <div class="tile x"></div>
    <div class="tile o"></div>
    <div class="tile covered"></div>

    {#each [...Array(31 * 31 - 3)] as _}
      <div class="tile"></div>
    {/each}
  </div>
</div>

<style>
  .board {
    --grid-count: 31;
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

  .tile {
    /* Without transforms, the whole board should fit the screen. */
    --tile-size: calc(100vmin / var(--grid-count));

    position: relative;

    width: var(--tile-size);
    height: var(--tile-size);

    background: lightgray;
    border: 1px solid black;
  }

  .tile.x::before,
  .tile.o::before {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;

    font-size: calc(0.6 * var(--tile-size));
  }

  .tile.x::before {
    content: "X";
  }

  .tile.o::before {
    content: "O";
  }

  .tile.covered::after {
    content: "";

    position: absolute;
    inset: 0;

    background-color: gray;
  }
</style>
