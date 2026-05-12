<script>
  let { disabled, onAnswer, onSkip } = $props();

  let value = $state('');

  function submit() { if (value.trim()) { onAnswer(value.trim()); value = ''; } }
  function keydown(e) { if (e.key === 'Enter') submit(); }
</script>

<div class="row">
  <input type="text" bind:value={value} placeholder="Type your answer…" onkeydown={keydown} disabled={disabled} />
  <button onclick={submit} disabled={disabled || !value.trim()}>Submit</button>
  <button class="skip" onclick={onSkip} disabled={disabled}>Skip</button>
</div>

<style>
  .row { display: flex; gap: 0.5rem; }
  .row input { flex: 1; padding: 0.8rem; border: 1px solid #333; border-radius: 10px; background: #111; color: #fff; font-size: 0.95rem; outline: none; }
  .row input:focus { border-color: #fff; }
  .row button { padding: 0.8rem 1.2rem; border: 1px solid #333; border-radius: 10px; background: #111; color: #fff; font-size: 0.9rem; cursor: pointer; }
  .row button:hover:not(:disabled) { background: #222; }
  .row button:disabled { opacity: 0.4; cursor: default; }
  .skip { border-color: #555 !important; color: #888 !important; }
</style>