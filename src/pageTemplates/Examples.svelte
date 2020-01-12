<script>
  import Container from "../components/Container.svelte";
  import Heading from "../components/Heading.svelte";
  import Paragraph from "../components/Paragraph.svelte";
  export let title;
  export let introduction;
</script>

<style>

</style>

<Container center small>
  <Heading size="1">{title}</Heading>
  <Paragraph small>{introduction}</Paragraph>
  <slot />
</Container>
