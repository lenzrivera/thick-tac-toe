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

<div class="main_modal">
  <h1>thick-tac-toe</h1>

  <div class="join_info">
    <p>join link:</p>
    <input value={location.href} readonly />
    <button><span class="material-symbols-outlined">content_copy</span></button>
  </div>

  <div class="description">
    <p>
      lorem ipsum dolor sit amet consectetur adipisicing elit. Eveniet, nesciunt
      mollitia fugit explicabo, aperiam quidem officia, reiciendis distinctio
      doloribus vitae sint perspiciatis? Vitae exercitationem quaerat eligendi
      dolor eius cupiditate sed.
    </p>
    <p>
      lorem ipsum dolor, sit amet consectetur adipisicing elit. Nostrum, maiores
      omnis. Itaque consectetur quasi dolorem qui assumenda inventore nihil
      aspernatur beatae repellat in debitis, porro modi laudantium eos,
      exercitationem laborum?
    </p>
  </div>
</div>

<div class="fog hidden"></div>

<style>
  .board {
    --grid-count: 31;
    --visible-tile-count: 5;
    --pan-x: 0;
    --pan-y: 0;
    --zoom-scale: 0;

    position: fixed;
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

  .fog {
    --visible-radius: 500px;

    position: fixed;
    inset: 0;

    pointer-events: none;
  }

  .fog:not(.hidden)::after {
    content: "";

    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;

    width: var(--visible-radius);
    height: var(--visible-radius);

    border-radius: 100%;
    box-shadow: 0px 0px 0px 100vmax black;
  }

  .main_modal {
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;

    width: min(75ch, 90vw);
    padding: 1.5rem;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    background-color: rgba(0 0 0 / 0.3);
    border-radius: 0.75vmin;
  }

  .join_info {
    display: grid;
    grid-template-columns: auto minmax(0, 40ch) auto;
    align-items: center;
    gap: 1rem;
  }

  .description {
    max-width: 70ch;

    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
