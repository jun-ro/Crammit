<script>
  let { question } = $props();
</script>

<div class="card"><p class="q">{question}</p></div>

<style>
  .card { background: #111; border: 1px solid #333; border-radius: 14px; padding: 2rem; text-align: center; min-height: 120px; display: flex; align-items: center; justify-content: center; }
  .q { font-size: 1.2rem; line-height: 1.5; }
</style>