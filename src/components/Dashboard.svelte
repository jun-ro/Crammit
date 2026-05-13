<script>
  import { listSessions } from '../lib/storage.js';

  let { onSessionClick, onUpload } = $props();
  let list = $state([]);

  function refresh() { list = listSessions(); }
  $effect(refresh);
</script>

<div class="dash">
<div class="logo-row">
    <img src="/Crammit/catread.png" alt="Crammit mascot reading" />
  </div>
  <div class="head">
    <h1>Crammit</h1>
    <button class="btn" onclick={onUpload}>+ Upload CSV</button>
  </div>

  {#if list.length === 0}
    <div class="empty"><p>No sessions yet. Upload a CSV to get started.</p></div>
  {:else}
    <div class="grid">
      {#each list as s (s.id)}
        <button class="card" onclick={() => onSessionClick(s.id)}>
          <div class="top">
            <span class="name">{s.csvName}</span>
            {#if s.done}
              <span class="badge done">Done</span>
            {:else if s.partitionSize}
              <span class="badge progress">In progress</span>
            {:else}
              <span class="badge new">New</span>
            {/if}
          </div>
          <div class="mid">{s.cards?.length || '?'} cards{s.partitionSize ? ` · P${s.partitionSize}` : ''}</div>
          <div class="bot">
            {#if s.allTotal > 0}
              <span class="pct">{Math.round((s.allScore / s.allTotal) * 100)}%</span>
              <span class="sep">·</span>
              <span>{s.allScore}/{s.allTotal}</span>
            {:else}
              <span class="dim">Not started</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dash { padding: 1.5rem 0; display: flex; flex-direction: column; gap: 1.25rem; }
  .logo-row { display: flex; justify-content: flex-start; }
  .logo-row img { width: 80px; height: auto; border-radius: 8px; }
  .head { display: flex; justify-content: space-between; align-items: center; }
  .head h1 { font-size: 1.8rem; }
  .btn { padding: 0.7rem 1.4rem; border: none; border-radius: 10px; background: #fff; color: #000; font-weight: 600; font-size: 0.9rem; cursor: pointer; white-space: nowrap; }
  .btn:hover { background: #ddd; }
  .empty { text-align: center; padding: 3rem 1rem; color: #555; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
  .card { display: flex; flex-direction: column; gap: 0.3rem; padding: 1rem; background: #111; border: 1px solid #222; border-radius: 12px; cursor: pointer; text-align: left; color: #fff; font-family: inherit; font-size: 0.85rem; transition: border-color 0.15s; }
  .card:hover { border-color: #555; }
  .top { display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; }
  .name { font-weight: 600; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .badge { font-size: 0.65rem; padding: 0.15rem 0.45rem; border-radius: 5px; white-space: nowrap; }
  .badge.done { background: #1a3a1a; color: #4aff4a; }
  .badge.progress { background: #3a3a1a; color: #ffdd4a; }
  .badge.new { background: #1a1a3a; color: #4aafff; }
  .mid { font-size: 0.75rem; color: #888; }
  .bot { font-size: 0.8rem; display: flex; gap: 0.3rem; align-items: center; }
  .pct { font-weight: 600; color: #fff; }
  .sep { color: #444; }
  .dim { color: #555; }
</style>