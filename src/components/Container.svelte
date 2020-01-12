<script>
  export let containerEsc = false;
  export let center = false;
  export let fluid = false;
  export let small = false;
  export let medium = false;
  export let large = false;
</script>

<style>
  div {
    display: block;
    width: 95%;
    width: calc(100% - 4.8rem);
    max-width: 118rem;
    padding-top: 2.4rem;
    min-width: 30rem;
    margin: 0 4.8rem;
  }

  .center {
    margin: 0 auto;
  }

  .fluid {
    max-width: 100%;
  }

  .small {
    max-width: 54rem;
  }

  .medium {
    max-width: 70rem;
  }

  .large {
    max-width: 118rem;
  }
</style>

<div
  class:containerEsc
  class:center
  class:fluid
  class:small
  class:medium
  class:large>
  <slot />
</div>
