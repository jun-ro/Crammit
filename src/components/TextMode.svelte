<script>
  import LatexText from './LatexText.svelte';
  let { disabled, onAnswer, onSkip, latex = false } = $props();

  let value = $state('');

  function submit() { if (value.trim()) { onAnswer(value.trim()); value = ''; } }
  function keydown(e) { if (e.key === 'Enter' && !e.shiftKey) submit(); }
</script>

<div class="wrap">
  <div class="row">
    <input type="text" bind:value={value}
      placeholder={latex ? 'Type LaTeX, e.g. \\frac{1}{2}' : 'Type your answer…'}
      onkeydown={keydown} disabled={disabled} />
    <button onclick={submit} disabled={disabled || !value.trim()}>Submit</button>
    <button class="skip" onclick={onSkip} disabled={disabled}>Skip</button>
  </div>
  {#if latex && value.trim() && !disabled}
    <div class="preview">
      <LatexText text={value} display={true} />
    </div>
  {/if}
</div>

<style>
  .wrap { display: flex; flex-direction: column; gap: 0.5rem; }
  .row { display: flex; gap: 0.5rem; }
  .row input { flex: 1; padding: 0.8rem; border: 1px solid #333; border-radius: 10px; background: #111; color: #fff; font-size: 0.95rem; outline: none; font-family: 'Courier New', monospace; }
  .row input:focus { border-color: #fff; }
  .row button { padding: 0.8rem 1.2rem; border: 1px solid #333; border-radius: 10px; background: #111; color: #fff; font-size: 0.9rem; cursor: pointer; }
  .row button:hover:not(:disabled) { background: #222; }
  .row button:disabled { opacity: 0.4; cursor: default; }
  .skip { border-color: #555 !important; color: #888 !important; }
  .preview { background: #111; border: 1px solid #2a2a2a; border-radius: 10px; padding: 0.8rem; min-height: 2.5rem; display: flex; align-items: center; justify-content: center; color: #fff; }
</style>
