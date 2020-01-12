<script>
  export let cardEsc = false;
  export let hasFooter = false;
  export let isTransparent = false;
</script>

<style>
  div {
    display: block;
    border-radius: var(--radius-card);
    padding: var(--spacing-medium) var(--spacing-x-medium)
      var(--spacing-x-medium) var(--spacing-x-medium);
    margin-bottom: var(--spacing-medium);
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.05),
      inset 0 0 0 1px rgba(0, 0, 0, 0.1);
    background: var(--white-palette);
  }
  .hasFooter {
    padding-bottom: var(--spacing-clear);
  }
  .isTransparent {
    background: transparent;
  }
  ::slotted(*:last-child) {
    margin-bottom: 0;
  }
  ::slotted(mui-card-footer) {
    width: calc(100% + (var(--spacing-x-medium) * 2));
    transform: translate(calc(-1 * var(--spacing-x-medium)), 0);
    border-bottom-right-radius: var(--radius-card);
    border-bottom-left-radius: var(--radius-card);
  }
</style>

<div class:cardEsc class:hasFooter class:isTransparent>
  <slot name="header" />
  <slot />
  <slot name="footer" />
</div>
