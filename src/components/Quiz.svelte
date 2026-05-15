<script>
  import { onMount } from 'svelte';
  import { normalizeCompare } from '../lib/normalize.js';
  import { getSession, updateSession } from '../lib/storage.js';
  import Progress from './Progress.svelte';
  import Card from './Card.svelte';
  import McqMode from './McqMode.svelte';
  import TextMode from './TextMode.svelte';
  import LatexText from './LatexText.svelte';

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

  // Calculator overlay state
  let calcOpen = $state(false);
  let calcX = $state(0);
  let calcY = $state(0);
  let isDragging = $state(false);
  let ox = 0, oy = 0;

  const calcUrl = import.meta.env.BASE_URL + 'calculator.html#popup';

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

    calcX = Math.max(0, window.innerWidth / 2 - 132);
    calcY = Math.max(10, window.innerHeight / 2 - 260);

    function mm(e) {
      if (!isDragging) return;
      calcX = e.clientX - ox;
      calcY = e.clientY - oy;
    }
    function mu() { isDragging = false; }
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    return () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
  });

  function dragStart(e) {
    if (e.target.closest('.calc-close')) return;
    isDragging = true;
    ox = e.clientX - calcX;
    oy = e.clientY - calcY;
    e.preventDefault();
  }

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

  function isCorrectAnswer(submitted, expected, latex) {
    if (latex) return submitted.trim() === expected.trim();
    return normalizeCompare(submitted, expected);
  }

  function submitAnswer(answer) {
    if (!current || answerShown) return;
    const correct = isCorrectAnswer(answer, current.answer, current.latex);
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
  <Card question={current.question} latex={current.latex} />
  {#if isMcq}
    <McqMode options={mcqOptions} disabled={answerShown} onAnswer={submitAnswer} latex={current.latex} />
  {:else}
    <TextMode disabled={answerShown} onAnswer={submitAnswer} onSkip={skipCard} latex={current.latex} />
  {/if}
  {#if isMcq}
    {#if !answerShown}
      <button class="skip-bar" onclick={skipCard}>I don't know</button>
    {/if}
  {/if}
  {#if answerShown}
    <div class="fb" class:fb-ok={result} class:fb-ko={result === false}>
      {#if result}
        Correct
      {:else}
        Wrong —
        {#if current.latex}
          <strong><LatexText text={current.answer} /></strong>
        {:else}
          <strong>{current.answer}</strong>
        {/if}
      {/if}
    </div>
    {#if remaining() === 0}
      <button class="next" onclick={advance}>Next partition</button>
    {:else}
      <button class="next" onclick={nextCard}>Next</button>
    {/if}
  {/if}
{/if}

<!-- Utilities widget -->
<div class="utilities">
  <button
    class="util-btn"
    class:active={calcOpen}
    title="TI-84 Calculator"
    onclick={() => calcOpen = !calcOpen}
    aria-label="Toggle calculator"
  >
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <rect x="2.5" y="1.5" width="15" height="17" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <rect x="4.5" y="3.5" width="11" height="4" rx="1"/>
      <rect x="4.5" y="9.5" width="3" height="2.5" rx="0.5"/>
      <rect x="8.5" y="9.5" width="3" height="2.5" rx="0.5"/>
      <rect x="12.5" y="9.5" width="3" height="2.5" rx="0.5"/>
      <rect x="4.5" y="13.5" width="3" height="2.5" rx="0.5"/>
      <rect x="8.5" y="13.5" width="3" height="2.5" rx="0.5"/>
      <rect x="12.5" y="13" width="3" height="3" rx="0.5"/>
    </svg>
  </button>
</div>

<!-- Draggable TI-84 overlay -->
{#if calcOpen}
  <div
    class="calc-overlay"
    class:dragging={isDragging}
    style="left:{calcX}px; top:{calcY}px"
    onmousedown={dragStart}
    role="dialog"
    tabindex="-1"
    aria-label="TI-84 Calculator"
  >
    <div class="calc-header">
      <span class="calc-title">TI-84 Plus CE</span>
      <button class="calc-close" onclick={() => calcOpen = false} aria-label="Close calculator">✕</button>
    </div>
    <iframe class="calc-frame" src={calcUrl} title="TI-84 Calculator" sandbox="allow-scripts"></iframe>
  </div>
{/if}

<style>
  .fb { text-align: center; padding: 0.8rem; border-radius: 10px; font-size: 0.95rem; }
  .fb-ok { background: #1a3a1a; border: 1px solid #2a6a2a; }
  .fb-ko { background: #3a1a1a; border: 1px solid #6a2a2a; }
  .next { padding: 0.8rem; border: none; border-radius: 10px; background: #fff; color: #000; font-weight: 600; font-size: 1rem; cursor: pointer; text-align: center; }
  .next:hover { background: #ddd; }
  .skip-bar { text-align: center; padding: 0.6rem; border: 1px solid #555; border-radius: 10px; background: transparent; color: #888; font-size: 0.85rem; cursor: pointer; width: 100%; }
  .skip-bar:hover { color: #fff; border-color: #fff; }

  /* Utilities widget */
  .utilities {
    position: fixed;
    bottom: 1.5rem;
    left: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 100;
  }
  .util-btn {
    width: 44px; height: 44px;
    border-radius: 12px;
    border: 1px solid #444;
    background: #111;
    color: #ccc;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .util-btn:hover { background: #1e1e1e; border-color: #666; color: #fff; }
  .util-btn.active { background: #0a2a0a; border-color: #3a7a3a; color: #7afa7a; }

  /* Calculator overlay */
  .calc-overlay {
    position: fixed;
    z-index: 200;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(0,0,0,0.85);
    cursor: default;
  }
  .calc-overlay.dragging .calc-frame { pointer-events: none; }
  .calc-header {
    background: #161620;
    padding: 6px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: grab;
    user-select: none;
    border-bottom: 1px solid #2a2a3a;
  }
  .calc-header:active { cursor: grabbing; }
  .calc-title { font-size: 0.7rem; color: #888; font-family: monospace; }
  .calc-close {
    background: none; border: none;
    color: #666; font-size: 0.85rem;
    cursor: pointer; padding: 0 2px; line-height: 1;
  }
  .calc-close:hover { color: #fff; }
  .calc-frame {
    width: 284px; height: 582px;
    border: none; display: block;
    background: #282930;
  }
</style>
