<script>
  let visibleRadius = "0px";

  // Expose functions like these to make way for animations/transitions.

  export function coverAll() {
    visibleRadius = "0px";
  }

  export function coverPart() {
    visibleRadius = "90vmin";
  }

  export function retract() {
    visibleRadius = "100vmax";
  }
</script>

<div
  class="fog"
  class:retracted={visibleRadius !== "0px"}
  style="--visible-radius: {visibleRadius};"
></div>

<style>
  .fog {
    position: absolute;
    inset: 0;
  }

  .fog.retracted {
    pointer-events: none;
  }

  .fog::after {
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
