<script>
  import Heading from "./components/Heading.svelte";
  import Button from "./components/Button.svelte";
  import ButtonGroup from "./components/ButtonGroup.svelte";
  import Examples from "./pageTemplates/Examples.svelte";
  import Card from "./components/Card.svelte";
  import Code from "./components/Code.svelte";
</script>

<style>
  :global(.cardEsc) > *:last-child {
    margin: 0;
  }

  :global(.codeEsc) {
    width: calc(100% + (var(--spacing-x-medium) * 2));
    transform: translate(calc(-1 * var(--spacing-x-medium)), 0);
    border-bottom-right-radius: var(--radius-card);
    border-bottom-left-radius: var(--radius-card);
  }
</style>

<Examples
  title="Headings"
  introduction="MUI provides base-level styling for Native HTML elements through
  the optional mui-base.css . It doesn't supply the consumer with modifier
  classes to customise the user interface. However, consumers are able to modify
  MUI web components by assigning defined attributes, which can be found within
  the Web component documentation.">
  <Card cardEsc hasFooter>
    <Heading size="1">Title</Heading>
    <Heading size="2">Title</Heading>
    <Heading size="3">Title</Heading>
    <Heading size="4">Title</Heading>
    <Heading size="5">Title</Heading>
    <Heading size="6">Title</Heading>
    <Code codeEsc>
      &lt;Heading size="1"&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="2"&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="3"&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="4"&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="5"&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="6"&gt;Title&lt;/Heading&gt;
    </Code>
  </Card>
  <Card cardEsc hasFooter>
    <Heading size="1" noMargin>Title</Heading>
    <Heading size="2" noMargin>Title</Heading>
    <Heading size="3" noMargin>Title</Heading>
    <Heading size="4" noMargin>Title</Heading>
    <Heading size="5" noMargin>Title</Heading>
    <Heading size="6" noMargin>Title</Heading>
    <Code codeEsc>
      &lt;Heading size="1" noMargin&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="2" noMargin&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="3" noMargin&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="4" noMargin&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="5" noMargin&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="6" noMargin&gt;Title&lt;/Heading&gt;
    </Code>
  </Card>
  <Card cardEsc hasFooter>
    <Heading size="1" noMargin lineHeightReset>Title</Heading>
    <Heading size="2" noMargin lineHeightReset>Title</Heading>
    <Heading size="3" noMargin lineHeightReset>Title</Heading>
    <Heading size="4" noMargin lineHeightReset>Title</Heading>
    <Heading size="5" noMargin lineHeightReset>Title</Heading>
    <Heading size="6" noMargin lineHeightReset>Title</Heading>
    <Code codeEsc>
      &lt;Heading size="1" noMargin lineHeightReset&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="2" noMargin lineHeightReset&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="3" noMargin lineHeightReset&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="4" noMargin lineHeightReset&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="5" noMargin lineHeightReset&gt;Title&lt;/Heading&gt;
      <br />
      &lt;Heading size="6" noMargin lineHeightReset&gt;Title&lt;/Heading&gt;
    </Code>
  </Card>
</Examples>

<Examples
  title="Buttons"
  introduction="MUI provides base-level styling for Native HTML elements through
  the optional mui-base.css . It doesn't supply the consumer with modifier
  classes to customise the user interface. However, consumers are able to modify
  MUI web components by assigning defined attributes, which can be found within
  the Web component documentation.">
  <Card cardEsc hasFooter>
    <h3>Square</h3>
    <ButtonGroup col="3">
      <Button primary>Save</Button>
      <Button secondary>Cancel</Button>
      <Button warning>Delete</Button>
    </ButtonGroup>
    <Code codeEsc>
      &lt;ButtonGroup col="3"&gt;
      <br />
      &nbsp;&nbsp;&lt;Button primary&gt;Hello&lt;/Button&gt;
      <br />
      &nbsp;&nbsp;&lt;Button secondary&gt;Hello&lt;/Button&gt;
      <br />
      &nbsp;&nbsp;&lt;Button warning&gt;Hello&lt;/Button&gt;
      <br />
      &lt;/ButtonGroup&gt;
    </Code>
  </Card>
  <Card cardEsc hasFooter>
    <h3>Rounded</h3>
    <ButtonGroup col="3">
      <Button rounded primary>Save</Button>
      <Button rounded secondary>Cancel</Button>
      <Button rounded warning>Delete</Button>
    </ButtonGroup>
    <Code codeEsc>
      &lt;ButtonGroup col="3"&gt;
      <br />
      &nbsp;&nbsp;&lt;Button rounded primary&gt;Hello&lt;/Button&gt;
      <br />
      &nbsp;&nbsp;&lt;Button rounded secondary&gt;Hello&lt;/Button&gt;
      <br />
      &nbsp;&nbsp;&lt;Button rounded warning&gt;Hello&lt;/Button&gt;
      <br />
      &lt;/ButtonGroup&gt;
    </Code>
  </Card>
  <Card cardEsc hasFooter>
    <h3>Square</h3>
    <ButtonGroup col="3" isRightAligned>
      <Button primary>Save</Button>
      <Button secondary>Cancel</Button>
      <Button warning>Delete</Button>
    </ButtonGroup>
    <Code codeEsc>
      &lt;ButtonGroup col="3" isRightAligned&gt;
      <br />
      &nbsp;&nbsp;&lt;Button primary&gt;Hello&lt;/Button&gt;
      <br />
      &nbsp;&nbsp;&lt;Button secondary&gt;Hello&lt;/Button&gt;
      <br />
      &nbsp;&nbsp;&lt;Button warning&gt;Hello&lt;/Button&gt;
      <br />
      &lt;/ButtonGroup&gt;
    </Code>
  </Card>
  <Card cardEsc hasFooter>
    <h3>Rounded</h3>
    <ButtonGroup col="3" isRightAligned>
      <Button rounded primary>Save</Button>
      <Button rounded secondary>Cancel</Button>
      <Button rounded warning>Delete</Button>
    </ButtonGroup>
    <Code codeEsc>
      &lt;ButtonGroup col="3" isRightAligned&gt;
      <br />
      &nbsp;&nbsp;&lt;Button rounded primary&gt;Hello&lt;/Button&gt;
      <br />
      &nbsp;&nbsp;&lt;Button rounded secondary&gt;Hello&lt;/Button&gt;
      <br />
      &nbsp;&nbsp;&lt;Button rounded warning&gt;Hello&lt;/Button&gt;
      <br />
      &lt;/ButtonGroup&gt;
    </Code>
  </Card>
</Examples>
