<script>
  /**
   * @type {import('../lib/Game').TileContent}
   */
  export let content;

  /**
   * @type {boolean}
   */
  export let covered;
</script>

<div
  class="tile"
  class:x={content === "X"}
  class:o={content === "O"}
  class:covered
  on:pointerup
></div>

<style>
  .tile {
    --tile-size: calc(100vmin / var(--visible-tile-count));

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
