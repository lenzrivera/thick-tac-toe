<div class="app">
  <div class="fog hidden"></div>
</div>

<style>
  .app {
    position: fixed;
    inset: 0;

    background-color: black;
  }

  .fog {
    --visible-radius: 500px;

    position: absolute;
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
</style>
