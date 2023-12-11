<script>
  import { setContext, tick } from 'svelte';
  import { readable } from 'svelte/store';

  import anime from 'animejs';

  export let debugView = false;

  let animProps = {
    visibleRadius: '0vmin',
  };

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

  export function coverAllImmediately() {
    animProps = { ...animProps, visibleRadius: '0vmin' };
  }

  export function coverPart() {
    return new Promise(resolve => {
      // TODO: Ideally, this won't be created again and again, but the completion
      // callback can't be set if that were the case.
      anime({
        targets: animProps,
        visibleRadius: '90vmin',
        duration: 1500,
        easing: 'easeOutExpo',
        update() {
          // Seems like a manual update is required for this to work.
          animProps = animProps;
        },
        complete: resolve,
      });
    });
  }

  export function retract() {
    return new Promise(resolve => {
      // TODO: Ideally, this won't be created again and again, but the completion
      // callback can't be set if that were the case.
      anime({
        targets: animProps,
        visibleRadius: '100vmax',
        duration: 1500,
        easing: 'easeOutExpo',
        update() {
          // Seems like a manual update is required for this to work.
          animProps = animProps;
        },
        complete: resolve,
      });
    });
  }
</script>

<div class="fog_screen">
  <slot />

  <div
    class="fog"
    class:debug_view={debugView}
    style="--visible-radius: {animProps.visibleRadius}"
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
    box-shadow: 0px 0px 0px 100vmax #000000;

    pointer-events: none;
  }

  .fog.debug_view {
    box-shadow: 0px 0px 0px 100vmax #0000ff50;
  }
</style>
