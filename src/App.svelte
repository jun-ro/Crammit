<script>
  import Uploader from './components/Uploader.svelte';
  import Setup from './components/Setup.svelte';
  import Quiz from './components/Quiz.svelte';
  import Results from './components/Results.svelte';
  import { clearSession } from './lib/storage.js';

  let mode = $state('upload');
  let cards = $state([]);
  let partitionSize = $state(10);
  let finalScore = $state(0);
  let finalTotal = $state(0);
  let partitionsDone = $state(0);
  let totalPartitions = $state(0);

  function handleLoad(loaded) {
    cards = loaded;
    mode = 'setup';
  }

  function handleStart(size) {
    partitionSize = size;
    totalPartitions = Math.ceil(cards.length / size);
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
{:else if mode === 'setup'}
  <Setup count={cards.length} onStart={handleStart} />
{:else if mode === 'quiz' && cards.length}
  <div class="quiz">
    <Quiz {cards} {partitionSize} onDone={handleDone} />
  </div>
{:else if mode === 'done'}
  <Results score={finalScore} total={finalTotal} {partitionsDone} {totalPartitions} onRestart={handleRestart} />
{/if}

<style>
  .quiz { display: flex; flex-direction: column; gap: 1rem; }
</style>