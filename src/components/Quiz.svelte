<script>
  import { onMount } from 'svelte';
  import { normalizeCompare } from '../lib/normalize.js';
  import { getSession, updateSession } from '../lib/storage.js';
  import Progress from './Progress.svelte';
  import Card from './Card.svelte';
  import McqMode from './McqMode.svelte';
  import TextMode from './TextMode.svelte';

  let { sessionId, onDone } = $props();

  let session = $state(null);
  let partitionIdx = $state(0);
  let pool = $state([]);
  let retroPool = $state([]);
  let current = $state(null);
  let answerShown = $state(false);
  let result = $state(null);
  let isMcq = $state(true);
  let mcqOptions = $state([]);
  let partScore = $state(0);
  let partTotal = $state(0);
  let retroUpdates = new Map();

  function isMastered(c) {
    return (c.mcqCorrect + c.textCorrect) >= 3 && c.mcqCorrect >= 1 && c.textCorrect >= 1;
  }

  function isFormatPoor(c, fmt) {
    const total = fmt === 'mcq' ? c.mcqTotal : c.textTotal;
    const correct = fmt === 'mcq' ? c.mcqCorrect : c.textCorrect;
    return total >= 3 && correct / total < 0.3;
  }

  onMount(() => {
    session = getSession(sessionId);
    if (session) startPartition(session.partitionIdx || 0);
  });

  function startPartition(idx) {
    if (!session) return;
    const p = [];
    for (let i = 0; i < session.cards.length; i += session.partitionSize)
      p.push(session.cards.slice(i, i + session.partitionSize));
    if (idx >= p.length) {
      onDone({ allScore: (session.allScore || 0) + partScore, allTotal: (session.allTotal || 0) + partTotal });
      return;
    }
    partitionIdx = idx;
    pool = p[idx].map(c => ({ ...c }));
    partScore = 0;
    partTotal = 0;
    retroUpdates = new Map();

    const poorCards = [];
    const prevEnd = idx * session.partitionSize;
    for (let i = 0; i < prevEnd && i < session.cards.length; i++) {
      const c = session.cards[i];
      if (isMastered(c)) continue;
      const mcqPoor = isFormatPoor(c, 'mcq');
      const textPoor = isFormatPoor(c, 'text');
      if (mcqPoor || textPoor) {
        const fmt = !mcqPoor ? 'text' : !textPoor ? 'mcq' : textPoor && c.textTotal > 0 && c.textCorrect / c.textTotal <= (mcqPoor && c.mcqTotal > 0 ? c.mcqCorrect / c.mcqTotal : 1) ? 'text' : 'mcq';
        poorCards.push({ ...c, _origIdx: i, _retroFormat: fmt });
      }
    }
    retroPool = shuffle(poorCards).slice(0, Math.ceil(session.partitionSize * 0.3));

    persist();
    nextCard();
  }

  function persist() {
    const all = [];
    for (let i = 0; i < session.cards.length; i += session.partitionSize) {
      if (i === partitionIdx * session.partitionSize) all.push(...pool);
      else all.push(...session.cards.slice(i, i + session.partitionSize).map(c => ({ ...c })));
    }
    for (const [origIdx, card] of retroUpdates) {
      const clean = { ...card };
      delete clean._origIdx;
      delete clean._retroFormat;
      all[origIdx] = clean;
    }
    updateSession(sessionId, {
      cards: all,
      partitionIdx,
      partScore,
      partTotal,
      allScore: (session.allScore || 0) + partScore,
      allTotal: (session.allTotal || 0) + partTotal,
    });
  }

  function pickUnmastered() {
    const u = pool.filter(c => !isMastered(c));
    if (!u.length) return -1;
    const w = u.map(c => 1 / ((c.mcqCorrect + c.textCorrect) + 1));
    const tw = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * tw;
    for (let i = 0; i < u.length; i++) {
      r -= w[i];
      if (r <= 0) return pool.indexOf(u[i]);
    }
    return pool.indexOf(u[u.length - 1]);
  }

  function pickRetroCard() {
    retroPool = retroPool.filter(c => !isMastered(c));
    if (!retroPool.length) return null;
    return retroPool.splice(Math.floor(Math.random() * retroPool.length), 1)[0];
  }

  function nextCard() {
    if (retroPool.length > 0 && Math.random() < 0.3) {
      const retro = pickRetroCard();
      if (retro) {
        current = retro;
        answerShown = false;
        result = null;
        isMcq = retro._retroFormat === 'mcq';
        if (isMcq) generateOptions();
        return;
      }
    }
    const idx = pickUnmastered();
    if (idx === -1) { advance(); return; }
    current = { ...pool[idx], _idx: idx };
    answerShown = false;
    result = null;
    isMcq = Math.random() > 0.4;
    if (isMcq) generateOptions();
  }

  function generateOptions() {
    const correct = current.answer;
    const others = session.cards.filter(c => c.answer !== correct).map(c => c.answer);
    const wrong = shuffle(others).slice(0, 3);
    mcqOptions = shuffle([correct, ...wrong]);
  }

  function submitAnswer(answer) {
    if (!current || answerShown) return;
    const correct = normalizeCompare(answer, current.answer);
    const isRetro = current._origIdx !== undefined;
    if (isRetro) {
      const origIdx = current._origIdx;
      if (correct) {
        if (isMcq) { session.cards[origIdx].mcqCorrect++; session.cards[origIdx].mcqTotal++; }
        else { session.cards[origIdx].textCorrect++; session.cards[origIdx].textTotal++; }
        session.cards[origIdx].level = Math.min(session.cards[origIdx].level + 1, 15);
      } else {
        if (isMcq) session.cards[origIdx].mcqTotal++;
        else session.cards[origIdx].textTotal++;
        session.cards[origIdx].level = Math.max(session.cards[origIdx].level - 1, 1);
      }
      retroUpdates.set(origIdx, { ...session.cards[origIdx] });
      partScore += correct ? 1 : 0;
      partTotal++;
      result = correct;
      answerShown = true;
      persist();
      return;
    }
    const idx = current._idx;
    if (correct) {
      if (isMcq) { pool[idx].mcqCorrect++; pool[idx].mcqTotal++; }
      else { pool[idx].textCorrect++; pool[idx].textTotal++; }
      pool[idx].level = Math.min(pool[idx].level + 1, 15);
      partScore++;
    } else {
      if (isMcq) pool[idx].mcqTotal++;
      else pool[idx].textTotal++;
      pool[idx].level = Math.max(pool[idx].level - 1, 1);
    }
    partTotal++;
    result = correct;
    answerShown = true;
    persist();
  }

  function skipCard() {
    if (!current || answerShown) return;
    const isRetro = current._origIdx !== undefined;
    if (isRetro) {
      const origIdx = current._origIdx;
      if (isMcq) session.cards[origIdx].mcqTotal++;
      else session.cards[origIdx].textTotal++;
      session.cards[origIdx].level = Math.max(session.cards[origIdx].level - 1, 1);
      retroUpdates.set(origIdx, { ...session.cards[origIdx] });
      partTotal++;
      result = false;
      answerShown = true;
      persist();
      return;
    }
    const idx = current._idx;
    if (isMcq) pool[idx].mcqTotal++;
    else pool[idx].textTotal++;
    pool[idx].level = Math.max(pool[idx].level - 1, 1);
    partTotal++;
    result = false;
    answerShown = true;
    persist();
  }

  function advance() {
    session.allScore = (session.allScore || 0) + partScore;
    session.allTotal = (session.allTotal || 0) + partTotal;
    startPartition(partitionIdx + 1);
  }

  function shuffle(a) { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }
  function remaining() { return pool.filter(c => !isMastered(c)).length + retroPool.filter(c => !isMastered(c)).length; }
</script>

{#if session && current}
  <Progress score={partScore} total={partTotal} remaining={remaining()} partitionLabel={'P' + (partitionIdx + 1)} totalPartitions={Math.ceil(session.cards.length / session.partitionSize)} />
  <Card question={current.question} />
  {#if isMcq}
    <McqMode options={mcqOptions} disabled={answerShown} onAnswer={submitAnswer} />
  {:else}
    <TextMode disabled={answerShown} onAnswer={submitAnswer} onSkip={skipCard} />
  {/if}
  {#if isMcq}
    {#if !answerShown}
      <button class="skip-bar" onclick={skipCard}>I don't know</button>
    {/if}
  {/if}
  {#if answerShown}
    <div class="fb" class:fb-ok={result} class:fb-ko={result === false}>
      {#if result}Correct{:else}Wrong — <strong>{current.answer}</strong>{/if}
    </div>
    {#if remaining() === 0}
      <button class="next" onclick={advance}>Next partition</button>
    {:else}
      <button class="next" onclick={nextCard}>Next</button>
    {/if}
  {/if}
{/if}

<style>
  .fb { text-align: center; padding: 0.8rem; border-radius: 10px; font-size: 0.95rem; }
  .fb-ok { background: #1a3a1a; border: 1px solid #2a6a2a; }
  .fb-ko { background: #3a1a1a; border: 1px solid #6a2a2a; }
  .next { padding: 0.8rem; border: none; border-radius: 10px; background: #fff; color: #000; font-weight: 600; font-size: 1rem; cursor: pointer; text-align: center; }
  .next:hover { background: #ddd; }
  .skip-bar { text-align: center; padding: 0.6rem; border: 1px solid #555; border-radius: 10px; background: transparent; color: #888; font-size: 0.85rem; cursor: pointer; width: 100%; }
  .skip-bar:hover { color: #fff; border-color: #fff; }
</style>