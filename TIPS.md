Override a component
Use a concept of esc

<!-- Container component -->

<script>
  export let container = false;
</script>

<div
  class:container
  ...
  <slot />
</div>

<!-- App usage -->

<script>
  import Container from "./components/Container.svelte";
</script>

<style>
  :global(.container) {
    background: red;
  }
</style>

<Container container>
...
</Container>
