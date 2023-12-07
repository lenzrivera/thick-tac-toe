<script>
  import { setContext, tick } from 'svelte';
  import { readable } from 'svelte/store';

  /**
   * @type {string}
   */
  let visibleRadius = '0px';

  /**
   * @type {HTMLDivElement}
   */
  let fogElem;

  setContext('fog_screen', {
    fogRadius: readable(0, function start(set) {
      const ro = new ResizeObserver(() => set(fogElem.offsetWidth / 2));

      // Can't use an async function since start can't return a promise.
      tick().then(() => {
        ro.observe(fogElem);
      });

      return function stop() {
        ro.disconnect();
      };
    }),
  });

  export function coverAll() {
    visibleRadius = '0px';
  }

  export function coverPart() {
    visibleRadius = '90vmin';
  }

  export function retract() {
    visibleRadius = '100vmax';
  }
</script>

<div class="fog_screen">
  <slot />

  <div
    class="fog"
    style="--visible-radius: {visibleRadius};"
    bind:this={fogElem}
  ></div>
</div>

<style>
  .fog_screen {
    position: fixed;
    inset: 0;

    background-color: black;
  }

  .fog {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;

    width: var(--visible-radius);
    height: var(--visible-radius);

    border-radius: 100%;
    /* box-shadow: 0px 0px 0px 100vmax #11111150; */
    box-shadow: 0px 0px 0px 100vmax #0000ff50;

    pointer-events: none;
  }
</style>
