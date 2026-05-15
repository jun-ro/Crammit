<script>
  import LatexText from './LatexText.svelte';
  let { question, latex = false } = $props();
</script>

<div class="card">
  <p class="q">
    {#if latex}
      <LatexText text={question} display={true} />
    {:else}
      {question}
    {/if}
  </p>
</div>

<style>
  .card { background: #111; border: 1px solid #333; border-radius: 14px; padding: 2rem; text-align: center; min-height: 120px; display: flex; align-items: center; justify-content: center; }
  .q { font-size: 1.2rem; line-height: 1.5; width: 100%; }
</style>
