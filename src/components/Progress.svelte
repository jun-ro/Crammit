<script>
  let { score, total, remaining, partitionLabel, totalPartitions } = $props();
</script>

<div class="bar"><div class="fill" style="width:{Math.round((score / Math.max(total, 1)) * 100)}%"></div></div>
<div class="stats">
  <span>{score}/{total}</span>
  <span>{remaining} left</span>
  {#if partitionLabel}<span>{partitionLabel}/{totalPartitions}</span>{/if}
</div>

<style>
  .bar { height: 6px; background: #222; border-radius: 3px; overflow: hidden; }
  .fill { height: 100%; background: #fff; border-radius: 3px; transition: width 0.3s; }
  .stats { display: flex; gap: 0.5rem; font-size: 0.8rem; color: #888; }
  .stats span { background: #111; padding: 0.3rem 0.6rem; border-radius: 6px; }
</style>