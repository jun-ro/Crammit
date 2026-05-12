<script>
  import Uploader from './components/Uploader.svelte';
  import Quiz from './components/Quiz.svelte';
  import Results from './components/Results.svelte';
  import { clearSession } from './lib/storage.js';

  let mode = $state('upload');
  let cards = $state([]);
  let finalScore = $state(0);
  let finalTotal = $state(0);
  let partitionsDone = $state(0);
  let totalPartitions = $state(0);

  function handleLoad(loaded) {
    cards = loaded;
    totalPartitions = Math.ceil(loaded.length / 10);
    mode = 'quiz';
  }

  function handleDone(results) {
    finalScore = results.score;
    finalTotal = results.total;
    partitionsDone = totalPartitions;
    clearSession();
    mode = 'done';
  }

  function handleRestart() {
    cards = [];
    mode = 'upload';
  }
</script>

{#if mode === 'upload'}
  <Uploader onLoad={handleLoad} />
{:else if mode === 'quiz' && cards.length}
  <div class="quiz">
    <Quiz {cards} onDone={handleDone} />
  </div>
{:else if mode === 'done'}
  <Results score={finalScore} total={finalTotal} {partitionsDone} {totalPartitions} onRestart={handleRestart} />
{/if}

<style>
  .quiz { display: flex; flex-direction: column; gap: 1rem; }
</style>