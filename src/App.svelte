<script>
  import Dashboard from './components/Dashboard.svelte';
  import Uploader from './components/Uploader.svelte';
  import Setup from './components/Setup.svelte';
  import Quiz from './components/Quiz.svelte';
  import Results from './components/Results.svelte';
  import { createSession, getSession, updateSession } from './lib/storage.js';

  let mode = $state('dashboard');
  let activeId = $state(null);

  function handleSessionClick(id) {
    const s = getSession(id);
    if (!s) return;
    activeId = s.id;
    if (s.done) { mode = 'done'; return; }
    if (!s.partitionSize) { mode = 'setup'; return; }
    mode = 'quiz';
  }

  function handleUpload(cards, csvName) {
    const s = createSession(csvName, cards);
    activeId = s.id;
    mode = 'setup';
  }

  function handleStart(size) {
    updateSession(activeId, { partitionSize: size, partitionIdx: 0 });
    mode = 'quiz';
  }

  function handleDone(results) {
    updateSession(activeId, {
      done: true,
      allScore: results.allScore,
      allTotal: results.allTotal,
    });
    mode = 'done';
  }

  function handleRestart() {
    activeId = null;
    mode = 'dashboard';
  }
</script>

{#if mode === 'dashboard'}
  <Dashboard onSessionClick={handleSessionClick} onUpload={() => mode = 'upload'} />
{:else if mode === 'upload'}
  <Uploader onLoad={handleUpload} onBack={() => mode = 'dashboard'} />
{:else if mode === 'setup'}
  <Setup count={getSession(activeId)?.cards?.length || 0} onStart={handleStart} onBack={() => mode = 'dashboard'} />
{:else if mode === 'quiz'}
  {#if activeId}
    <div class="quiz">
      <Quiz sessionId={activeId} onDone={handleDone} />
    </div>
  {/if}
{:else if mode === 'done'}
  {#if activeId}
    <Results sessionId={activeId} onRestart={handleRestart} />
  {/if}
{/if}

<style>
  .quiz { display: flex; flex-direction: column; gap: 1rem; }
</style>