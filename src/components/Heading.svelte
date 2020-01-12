<script>
  export let size;
  export let noMargin;
  export let lineHeightReset;
</script>

<style>
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    box-sizing: border-box;
    width: 100%;
    margin-bottom: var(--spacing-medium);
  }
  h1 {
    font-size: var(--font-size-heading-x-large);
    line-height: 1.25;
  }

  h2 {
    font-size: var(--font-size-heading-large);
    line-height: 1.33333333333333;
  }
  h3 {
    font-size: var(--font-size-heading-medium);
    line-height: 1.5;
  }
  h4 {
    font-size: var(--font-size-heading-small);
    line-height: 1.14285714285714;
  }
  h5 {
    font-size: var(--font-size-heading-x-small);
    line-height: 1.33333333333333;
    font-weight: bold;
  }
  h6 {
    font-size: var(--font-size-heading-tiny);
    line-height: 1.5;
    font-weight: bold;
  }
  .noMargin {
    margin-bottom: var(--spacing-clear);
  }
  .lineHeightReset {
    line-height: var(--line-height-reset);
  }
</style>

{#if size === '1'}
  <h1 class:lineHeightReset class:noMargin>
    <slot />
  </h1>
{:else if size === '2'}
  <h2 class:lineHeightReset class:noMargin>
    <slot />
  </h2>
{:else if size === '3'}
  <h3 class:lineHeightReset class:noMargin>
    <slot />
  </h3>
{:else if size === '4'}
  <h4 class:lineHeightReset class:noMargin>
    <slot />
  </h4>
{:else if size === '5'}
  <h5 class:lineHeightReset class:noMargin>
    <slot />
  </h5>
{:else if size === '6'}
  <h6 class:lineHeightReset class:noMargin>
    <slot />
  </h6>
{/if}
