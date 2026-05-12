<script>
  import { loadCSV, saveCSV } from '../lib/storage.js';
  import { parseCSV, findColumns } from '../lib/csv.js';

  let { onLoad } = $props();
  let hasRestore = $state(false);

  $effect(() => { hasRestore = !!loadCSV(); });

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => parseAndEmit(file.name, reader.result);
    reader.readAsText(file);
  }

  function restore() {
    const saved = loadCSV();
    if (saved) parseAndEmit(saved.n, saved.d);
  }

  function parseAndEmit(name, text) {
    const rows = parseCSV(text);
    if (rows.length < 2) return;
    const cols = findColumns(rows[0]);
    if (!cols) return;
    const cards = rows.slice(1)
      .filter(r => r[cols.qi] && r[cols.ai])
      .map(r => ({ question: r[cols.qi], answer: r[cols.ai], streak: 0, level: 1 }));
if (cards.length < 4) return;

    saveCSV(name, text);
    onLoad(cards);
  }
</script>

<div class="upload">
  <h1>Crammit</h1>
  <p class="sub">Upload a CSV with <strong>question</strong> and <strong>answer</strong> columns.<br>Needs at least 4 rows.</p>
  <label class="btn">
    <input type="file" accept=".csv" onchange={handleFile} />
    <span>Choose CSV file</span>
  </label>
  {#if hasRestore}
    <button class="ghost" onclick={restore}>Restore last session</button>
  {/if}
</div>

<style>
  .upload { text-align: center; padding: 3rem 1rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  .upload h1 { font-size: 2rem; }
  .sub { color: #888; font-size: 0.9rem; line-height: 1.6; }
  .btn { display: inline-block; padding: 1rem 2rem; border: 2px dashed #555; border-radius: 12px; cursor: pointer; transition: border-color 0.2s; }
  .btn:hover { border-color: #fff; }
  .btn input { display: none; }
  .ghost { background: transparent; color: #888; font-size: 0.85rem; border: 1px solid #333; border-radius: 10px; padding: 0.6rem 1.2rem; cursor: pointer; }
  .ghost:hover { color: #fff; border-color: #fff; }
</style>