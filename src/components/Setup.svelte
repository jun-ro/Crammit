<script>
  let { count, onStart, onBack } = $props();
  let size = $state(10);
  let custom = $state('');
  let partitions = $derived(Math.ceil(count / size));

  function pick(n) { size = n; custom = ''; }
  function useCustom() {
    const v = parseInt(custom);
    if (v > 0 && v <= count) size = v;
  }
</script>

<div class="setup">
  <h1>Crammit</h1>
  <p class="sub">{count} cards loaded — pick a partition size</p>
  <div class="chips">
    {#each [5, 10, 15, 20, 25] as n}
      <button class="chip" class:active={size === n} onclick={() => pick(n)}>{n}</button>
    {/each}
    <input type="number" min="1" max={count} bind:value={custom} placeholder="custom" class="chip-input" class:active={!!custom} oninput={useCustom} />
  </div>
  <p class="sub">{partitions} partition{partitions !== 1 ? 's' : ''} of ≈{size}</p>
  <button class="go" onclick={() => onStart(size)}>Start</button>
  <button class="ghost" onclick={onBack}>Back</button>
</div>

<style>
  .setup { text-align: center; padding: 3rem 1rem; display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }
  .setup h1 { font-size: 2rem; }
  .sub { color: #888; font-size: 0.9rem; }
  .chips { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
  .chip, .chip-input { padding: 0.5rem 1rem; border: 1px solid #333; border-radius: 10px; background: #111; color: #fff; font-size: 0.9rem; cursor: pointer; min-width: 3rem; text-align: center; transition: 0.15s; }
  .chip:hover, .chip-input:hover { border-color: #888; }
  .chip.active, .chip-input.active { border-color: #fff; background: #fff; color: #000; }
  .chip-input { appearance: textfield; width: 5rem; outline: none; }
  .chip-input::-webkit-inner-spin-button { -webkit-appearance: none; }
  .go { padding: 0.8rem 2.5rem; border: none; border-radius: 10px; background: #fff; color: #000; font-weight: 600; font-size: 1rem; cursor: pointer; }
  .go:hover { background: #ddd; }
  .ghost { background: transparent; color: #888; font-size: 0.85rem; border: 1px solid #333; border-radius: 10px; padding: 0.6rem 1.2rem; cursor: pointer; }
  .ghost:hover { color: #fff; border-color: #fff; }
</style>