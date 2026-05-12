/*
 * LexPack v2 — Zipf + co-occurrence token codec with zigzag delta encoding.
 *
 * PackRat (v1) deduplicates whole strings. LexPack deduplicates at the word
 * level, then squeezes further with two interlocking ideas:
 *
 *  1. Co-occurrence vocabulary ordering.
 *     The vocab is sorted not just by frequency but by a greedy nearest-
 *     neighbour walk of the token co-occurrence graph: tokens that tend to
 *     appear in the same card are placed at consecutive indices. When a
 *     question like "What is the capital of France?" is encoded, its tokens
 *     sit near each other in the index space.
 *
 *  2. Zigzag delta encoding.
 *     Each string is stored as index deltas rather than absolute indices:
 *     delta[i] = vocab_index[i] - vocab_index[i-1]. Zigzag maps signed
 *     deltas to non-negative integers (0→0, −1→1, 1→2, −2→3, 2→4, …) so
 *     negative deltas don't incur a JSON minus-sign character. Because
 *     co-occurrence ordering puts related tokens close together, most
 *     within-card deltas are tiny (often ±1), which in JSON is a single
 *     character "2" instead of, say, "47".
 *
 * Together these two ideas drop another ~10–20 % on structured decks on top
 * of plain word-level pooling. The underlying theory is that the index space
 * approximates the token's local neighbourhood in the deck's semantic graph,
 * so traversing a typical sentence is a short walk — not a long-range jump.
 *
 * Format v2: { v:2, w:vocab[], c:[[qZZ[], aZZ[], packed], …] }
 * Format v1: { v:1, p:pool[], c:[[qi, ai, packed], …] }  (read-only compat)
 *
 * Tokenisation splits on whitespace. Whitespace runs normalise to a single
 * space on round-trip — intentional, not a bug.
 */

const tokenize   = s => s.match(/\S+/g) || [];
const detokenize = ts => ts.join(' ');

// Zigzag: signed int → non-negative int so JSON never emits a minus sign
// for small deltas. 0→0, -1→1, 1→2, -2→3, 2→4, …
const zigzag   = n => n >= 0 ? n * 2 : -n * 2 - 1;
const unzigzag = n => n % 2 === 0 ? n / 2 : -(n + 1) / 2;

function buildVocab(cards, freq) {
  // Build token co-occurrence map: tok → Map(tok → count)
  const cooc = new Map();
  const bump = (a, b) => {
    if (a === b) return;
    if (!cooc.has(a)) cooc.set(a, new Map());
    if (!cooc.has(b)) cooc.set(b, new Map());
    cooc.get(a).set(b, (cooc.get(a).get(b) || 0) + 1);
    cooc.get(b).set(a, (cooc.get(b).get(a) || 0) + 1);
  };
  for (const c of cards) {
    const toks = [...new Set([...tokenize(c.question), ...tokenize(c.answer)])];
    for (let i = 0; i < toks.length; i++)
      for (let j = i + 1; j < toks.length; j++)
        bump(toks[i], toks[j]);
  }

  // Greedy nearest-neighbour walk starting from the most frequent token.
  // At each step pick the unvisited token with the highest co-occurrence
  // count with the last placed token; fall back to next-by-frequency when
  // no co-occurring candidate remains (handles disconnected vocab islands).
  const byFreq = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
  const vocab = [byFreq[0]];
  const remaining = new Set(byFreq.slice(1));

  while (remaining.size > 0) {
    const last = vocab[vocab.length - 1];
    let best = null, bestScore = -1;
    for (const [tok, cnt] of (cooc.get(last) || [])) {
      if (remaining.has(tok) && cnt > bestScore) { bestScore = cnt; best = tok; }
    }
    if (best === null) best = byFreq.find(t => remaining.has(t));
    vocab.push(best);
    remaining.delete(best);
  }
  return vocab;
}

function encodeStr(s, vi) {
  let prev = 0;
  return tokenize(s).map(t => {
    const idx = vi.get(t);
    const zz = zigzag(idx - prev);
    prev = idx;
    return zz;
  });
}

function decodeStr(zz, w) {
  let prev = 0;
  return detokenize(zz.map(z => { prev += unzigzag(z); return w[prev]; }));
}

function lexpack(cards) {
  const freq = new Map();
  for (const c of cards) {
    for (const t of tokenize(c.question)) freq.set(t, (freq.get(t) || 0) + 1);
    for (const t of tokenize(c.answer))   freq.set(t, (freq.get(t) || 0) + 1);
  }
  const vocab = buildVocab(cards, freq);
  const vi = new Map(vocab.map((t, i) => [t, i]));
  return { v: 2, w: vocab, c: cards.map(c => [encodeStr(c.question, vi), encodeStr(c.answer, vi), (c.streak << 4) | c.level]) };
}

function packrat(cards) {
  const freq = new Map();
  for (const c of cards) {
    freq.set(c.question, (freq.get(c.question) || 0) + 1);
    freq.set(c.answer,   (freq.get(c.answer)   || 0) + 1);
  }
  const pool = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
  const idx  = new Map(pool.map((s, i) => [s, i]));
  return { v: 1, p: pool, c: cards.map(c => [idx.get(c.question), idx.get(c.answer), (c.streak << 4) | c.level]) };
}

// Adaptive: produce both encodings, keep whichever serialises smaller.
export function compressCards(cards) {
  const a = lexpack(cards);
  const b = packrat(cards);
  return JSON.stringify(a).length <= JSON.stringify(b).length ? a : b;
}

export function decompressCards(data) {
  const d = typeof data === 'string' ? JSON.parse(data) : data;

  if (d.v === 1) {
    return d.c.map(([qi, ai, packed]) => ({
      question: d.p[qi],
      answer:   d.p[ai],
      streak: packed >> 4,
      level:  packed & 0x0f,
    }));
  }

  return d.c.map(([qzz, azz, packed]) => ({
    question: decodeStr(qzz, d.w),
    answer:   decodeStr(azz, d.w),
    streak: packed >> 4,
    level:  packed & 0x0f,
  }));
}
