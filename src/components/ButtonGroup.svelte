<script>
  export let buttonGroupEsc = false;
  export let isRightAligned = false;
  export let col = 1;
</script>

<style>
  div {
    display: grid;
    margin-bottom: var(--spacing-medium);
    grid-template-columns: repeat(var(--column-count), auto);
    justify-content: start;
    grid-gap: var(--spacing-tiny);
  }
  .isRightAligned {
    justify-content: end;
  }
</style>

<div style="--column-count: {col}" class:buttonGroupEsc class:isRightAligned>
  <slot />
</div>
