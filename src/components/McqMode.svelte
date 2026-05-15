<script>
  import LatexText from './LatexText.svelte';
  let { options, disabled, onAnswer, latex = false } = $props();
</script>

<div class="opts">
  {#each options as opt}
    <button class="opt" onclick={() => onAnswer(opt)} disabled={disabled}>
      {#if latex}
        <LatexText text={opt} />
      {:else}
        {opt}
      {/if}
    </button>
  {/each}
</div>

<style>
  .opts { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
  .opt { padding: 0.8rem; border: 1px solid #333; border-radius: 10px; background: #111; color: #fff; font-size: 0.9rem; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: center; min-height: 52px; }
  .opt:hover:not(:disabled) { background: #222; }
  .opt:disabled { opacity: 0.6; cursor: default; }
</style>
