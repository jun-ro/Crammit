<script>
  let { score, total, partitionsDone, totalPartitions, onRestart } = $props();
</script>

<div class="done">
  <h1>Done</h1>
  <p class="big">{score}/{total} ({Math.round((score / total) * 100)}%)</p>
  <p class="sub">{partitionsDone} / {totalPartitions} partitions completed</p>
  <button class="next" onclick={onRestart}>Start Over</button>
</div>

<style>
  .done { text-align: center; padding: 3rem 1rem; }
  .done h1 { font-size: 2rem; margin-bottom: 1rem; }
  .big { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .sub { color: #888; margin-bottom: 2rem; }
  .next { padding: 0.8rem 2rem; border: none; border-radius: 10px; background: #fff; color: #000; font-weight: 600; font-size: 1rem; cursor: pointer; }
  .next:hover { background: #ddd; }
</style>