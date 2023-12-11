<script>
  import anime from 'animejs';

  /**
   * @type {import('../lib/Game').TileContent}
   */
  export let content;

  /**
   * @type {boolean}
   */
  export let covered;

  let animProps = {
    coverOpacity: 0,
    symbolColor: '#000000',
  };

  const FLASH_SYMBOL_ANIM = anime({
    targets: animProps,
    symbolColor: '#e89c0f',
    duration: 1500,
    loop: 3,
    direction: 'alternate',
    easing: 'easeInExpo',
    autoplay: false,
    update: () => (animProps = animProps),
  });

  $: animProps.coverOpacity = covered ? 1 : 0;

  export function uncover() {
    return new Promise(resolve => {
      // TODO: Ideally, this won't be created again and again, but the completion
      // callback can't be set if that were the case.
      anime({
        targets: animProps,
        coverOpacity: 0,
        duration: 3000,
        easing: 'easeOutExpo',
        update: () => (animProps = animProps),
        complete: resolve,
      });
    });
  }

  export async function flashSymbol() {
    FLASH_SYMBOL_ANIM.play();
    await FLASH_SYMBOL_ANIM.finished;
  }

  export function unflashSymbol() {
    animProps = { ...animProps, symbolColor: '#000000' };
  }
</script>

<div
  class="tile"
  class:x={content === 'X'}
  class:o={content === 'O'}
  style="--cover-opacity: {animProps.coverOpacity}; --symbol-color: {animProps.symbolColor};"
  on:pointerup
></div>

<style>
  /* TODO: --tile-size could be passed more explcitly. */

  .tile {
    position: relative;

    width: var(--tile-size);
    height: var(--tile-size);

    background: #474747;
    border: 3.5px solid #0f0f0f;

    /* TODO: random border radii per tile to add a bit of flair */
  }

  .tile.x::before,
  .tile.o::before {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;

    color: var(--symbol-color);
    font-family: 'Kalnia', serif;
    font-size: calc(0.6 * var(--tile-size));
  }

  .tile.x::before {
    content: 'X';
  }

  .tile.o::before {
    content: 'O';
  }

  .tile::after {
    content: '';

    position: absolute;
    inset: 0;

    background-color: #212121;
    opacity: var(--cover-opacity);
  }
</style>
