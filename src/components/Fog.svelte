<script>
  let visibleRadius = "100vmax";

  export function coverAll() {}

  export function coverPart() {}

  export function hide() {}
</script>

<div class="fog" style="--visible-radius: {visibleRadius};"></div>

<style>
  .fog {
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
    box-shadow: 0px 0px 0px 100vmax #111111;
  }
</style>
