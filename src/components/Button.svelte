<script>
  export let buttonEsc = false;
  export let primary = false;
  export let secondary = false;
  export let warning = false;
  export let rounded = false;
</script>

<style>
  button {
    border: none;
    cursor: pointer;
    width: auto;
    padding: 0 var(--spacing-medium);
    text-decoration: none;
    line-height: var(--line-height-text);
    height: var(--spacing-x-medium);
    display: inline-block;
  }
  button:hover,
  button:focus {
    opacity: 0.8;
  }

  .rounded {
    border-radius: 6rem;
  }

  .primary {
    background-color: #333333;
    color: white;
  }
  .primary:focus {
    color: white;
  }

  .secondary {
    background-color: white;
    color: #333333;
    box-shadow: inset 0 0 0 1px #333333;
  }

  .secondary:focus {
    color: #333333;
  }

  .warning {
    background-color: var(--button-warning-background);
    color: white;
  }

  .warning:focus {
    color: #333333;
  }
</style>

<!-- https://css-tricks.com/what-i-like-about-writing-styles-with-svelte/ -->
<button
  class:buttonEsc
  class:primary
  class:secondary
  class:warning
  class:rounded>
  <slot />
</button>
