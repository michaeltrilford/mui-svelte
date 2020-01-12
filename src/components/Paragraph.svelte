<script>
  export let small = false;
  export let tiny = false;
</script>

<style>
  p {
    box-sizing: border-box;
    display: block;
    margin-bottom: var(--spacing-medium);
    width: 100%;
    font-size: var(--font-size-text);
  }
  .small {
    font-size: var(--font-size-text-small);
  }
  .tiny {
    font-size: var(--font-size-text-tiny);
  }
</style>

<p class:small class:tiny>
  <slot />
</p>
