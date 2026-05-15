<script>
  import katex from 'katex';

  let { text = '', display = false } = $props();

  let rendered = $derived((() => {
    try {
      return katex.renderToString(text, { throwOnError: false, displayMode: display });
    } catch {
      return text;
    }
  })());
</script>

<span class:display>{@html rendered}</span>

<style>
  span { word-break: break-word; }
  span.display { display: block; text-align: center; }
</style>
