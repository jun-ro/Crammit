<script>
  import { getSession } from '../lib/storage.js';

  let { sessionId, onRestart } = $props();
  let s = $state(null);

  $effect(() => { s = getSession(sessionId); });
</script>

<div class="done">
  <h1>Done</h1>
  {#if s}
    <p class="big">{s.allScore}/{s.allTotal} ({Math.round((s.allScore / s.allTotal) * 100)}%)</p>
    <p class="sub">{Math.ceil(s.cards.length / s.partitionSize)} partitions · {s.cards.length} cards</p>
  {/if}
  <button class="next" onclick={onRestart}>Back to dashboard</button>
</div>

<style>
  .done { text-align: center; padding: 3rem 1rem; }
  .done h1 { font-size: 2rem; margin-bottom: 1rem; }
  .big { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .sub { color: #888; margin-bottom: 2rem; }
  .next { padding: 0.8rem 2rem; border: none; border-radius: 10px; background: #fff; color: #000; font-weight: 600; font-size: 1rem; cursor: pointer; }
  .next:hover { background: #ddd; }
</style>