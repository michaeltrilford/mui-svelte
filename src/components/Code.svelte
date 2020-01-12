<script>
  export let codeEsc = false;
</script>

<style>
  code {
    display: block;
    font-family: monospace;
    font-size: var(--font-size-text);
    color: var(--code-text-color);
    background: var(--code-bg);
    padding: var(--spacing-small) var(--spacing-x-medium) var(--spacing-small)
      var(--spacing-x-medium);
  }
</style>

<code class:codeEsc>
  <slot />
</code>
