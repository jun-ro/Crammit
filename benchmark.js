// benchmark.js — run with: node benchmark.js
import { compressCards, decompressCards } from './src/lib/compress.js';
import { gzipSync } from 'zlib';

function packratCompress(cards) {
  const freq = new Map();
  for (const c of cards) {
    freq.set(c.question, (freq.get(c.question) || 0) + 1);
    freq.set(c.answer,   (freq.get(c.answer)   || 0) + 1);
  }
  const pool = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
  const idx  = new Map(pool.map((s, i) => [s, i]));
  return { v: 1, p: pool, c: cards.map(c => [idx.get(c.question), idx.get(c.answer), (c.streak << 4) | c.level]) };
}

// ── Deck generators ───────────────────────────────────────────────────────────

function geographyDeck(n = 40) {
  const data = [
    ['France','Paris'],['Germany','Berlin'],['Japan','Tokyo'],['Brazil','Brasília'],
    ['Australia','Canberra'],['Canada','Ottawa'],['India','New Delhi'],['China','Beijing'],
    ['Russia','Moscow'],['Mexico','Mexico City'],['Italy','Rome'],['Spain','Madrid'],
    ['Argentina','Buenos Aires'],['Egypt','Cairo'],['Nigeria','Abuja'],['South Korea','Seoul'],
    ['Saudi Arabia','Riyadh'],['Turkey','Ankara'],['Poland','Warsaw'],['Netherlands','Amsterdam'],
    ['Sweden','Stockholm'],['Norway','Oslo'],['Denmark','Copenhagen'],['Finland','Helsinki'],
    ['Portugal','Lisbon'],['Greece','Athens'],['Hungary','Budapest'],['Czech Republic','Prague'],
    ['Romania','Bucharest'],['Austria','Vienna'],['Switzerland','Bern'],['Belgium','Brussels'],
    ['Ukraine','Kyiv'],['Vietnam','Hanoi'],['Thailand','Bangkok'],['Indonesia','Jakarta'],
    ['Philippines','Manila'],['Pakistan','Islamabad'],['Iran','Tehran'],['Iraq','Baghdad'],
  ].slice(0, n);
  return data.map(([country, capital], i) => ({
    question: `What is the capital of ${country}?`, answer: capital, streak: i % 6, level: i % 4,
  }));
}

function historyDeck(n = 40) {
  const facts = [
    ['In what year did World War II end?','1945'],
    ['Who was the first President of the United States?','George Washington'],
    ['In what year did the French Revolution begin?','1789'],
    ['Who wrote the Declaration of Independence?','Thomas Jefferson'],
    ['In what year did World War I begin?','1914'],
    ['Who was the first person to walk on the Moon?','Neil Armstrong'],
    ['In what year did the Berlin Wall fall?','1989'],
    ['Who invented the printing press?','Johannes Gutenberg'],
    ['In what year was the United States founded?','1776'],
    ['Who was the leader of Nazi Germany?','Adolf Hitler'],
    ['In what year did the Roman Empire fall?','476 AD'],
    ['Who was the first Emperor of China?','Qin Shi Huang'],
    ['In what year did Columbus reach the Americas?','1492'],
    ['Who led the Soviet Union during World War II?','Joseph Stalin'],
    ['In what year was the Magna Carta signed?','1215'],
    ['Who was the first woman to win a Nobel Prize?','Marie Curie'],
    ['In what year did the American Civil War end?','1865'],
    ['Who assassinated Archduke Franz Ferdinand?','Gavrilo Princip'],
    ['In what year did India gain independence?','1947'],
    ['Who wrote the Communist Manifesto?','Karl Marx and Friedrich Engels'],
    ['In what year did the First Crusade begin?','1096'],
    ['Who was the last Pharaoh of Egypt?','Cleopatra VII'],
    ['In what year did Napoleon become Emperor of France?','1804'],
    ['Who commanded the Allied forces on D-Day?','Dwight D. Eisenhower'],
    ['In what year did the Soviet Union collapse?','1991'],
    ['Who was known as the Iron Chancellor of Germany?','Otto von Bismarck'],
    ['In what year was the Eiffel Tower built?','1889'],
    ['Who was the first female Prime Minister of the UK?','Margaret Thatcher'],
    ['In what year did the Great Fire of London occur?','1666'],
    ['Who discovered penicillin?','Alexander Fleming'],
    ['In what year was the United Nations founded?','1945'],
    ['Who wrote the Iliad and the Odyssey?','Homer'],
    ['In what year did Gutenberg print the Bible?','1455'],
    ['Who was the first Prime Minister of Australia?','Edmund Barton'],
    ['In what year was the Titanic built?','1909'],
    ['Who was the longest-reigning British monarch?','Queen Elizabeth II'],
    ['In what year did the Black Death reach Europe?','1347'],
    ['Who founded the Mongol Empire?','Genghis Khan'],
    ['In what year did Magellan begin circumnavigating the globe?','1519'],
    ['Who led the Cuban Revolution?','Fidel Castro'],
  ].slice(0, n);
  return facts.map(([question, answer], i) => ({ question, answer, streak: i % 5, level: i % 4 }));
}

function scienceDeck(n = 40) {
  const facts = [
    ['What organelle produces ATP?','Mitochondria'],
    ['What is the powerhouse of the cell?','Mitochondria'],
    ['What is the basic unit of life?','Cell'],
    ['What molecule carries genetic information?','DNA'],
    ['What is the process plants use to make food?','Photosynthesis'],
    ['What carries oxygen in red blood cells?','Hemoglobin'],
    ['What is the most abundant gas in the atmosphere?','Nitrogen'],
    ['What is the chemical symbol for gold?','Au'],
    ['What is the speed of light in a vacuum?','299,792,458 m/s'],
    ['What is the atomic number of carbon?','6'],
    ['What force keeps planets in orbit?','Gravity'],
    ['What is the formula for water?','H₂O'],
    ['What enzyme digests proteins in the stomach?','Pepsin'],
    ['What is the smallest particle of an element?','Atom'],
    ['What type of bond shares electrons?','Covalent bond'],
    ["What is Newton's second law of motion?",'F = ma'],
    ['What is the unit of electrical resistance?','Ohm'],
    ['What planet is closest to the Sun?','Mercury'],
    ['What is the most electronegative element?','Fluorine'],
    ['What is the function of ribosomes?','Protein synthesis'],
    ['What is osmosis?','Movement of water across a semipermeable membrane'],
    ['What is the Krebs cycle?','A series of reactions in cellular respiration'],
    ['What is the charge of a proton?','Positive'],
    ['What is the half-life of Carbon-14?','5,730 years'],
    ["What is Avogadro's number?",'6.022 × 10²³'],
    ['What is the process of cell division called?','Mitosis'],
    ['What is the pH of pure water?','7'],
    ['What is the second law of thermodynamics?','Entropy always increases in a closed system'],
    ['What carries signals between neurons?','Neurotransmitters'],
    ['What is the function of the nucleus?','Controls cell activity and stores DNA'],
    ['What is the Doppler effect?','Change in frequency due to relative motion'],
    ['What is a catalyst?','A substance that speeds up a reaction without being consumed'],
    ['What is the SI unit of force?','Newton'],
    ['What is electronegativity?','Tendency of an atom to attract electrons'],
    ['What is the function of chlorophyll?','Absorb light for photosynthesis'],
    ['What is the law of conservation of energy?','Energy cannot be created or destroyed'],
    ['What are isotopes?','Atoms of the same element with different numbers of neutrons'],
    ['What is a gene?','A sequence of DNA that codes for a protein'],
    ['What is the structure of DNA?','Double helix'],
    ['What is the function of white blood cells?','Fight infection and disease'],
  ].slice(0, n);
  return facts.map(([question, answer], i) => ({ question, answer, streak: i % 5, level: i % 4 }));
}

// ── Rendering ─────────────────────────────────────────────────────────────────

const BAR_WIDTH = 36;

function bar(size, max, winner) {
  const filled = Math.round((size / max) * BAR_WIDTH);
  const b = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
  return winner ? `\x1b[32m${b}\x1b[0m` : b;
}

function bench(label, cards) {
  const rawStr      = JSON.stringify(cards);
  const v1obj       = packratCompress(cards);
  const v1str       = JSON.stringify(v1obj);
  const adaptiveObj = compressCards(cards);
  const adaptiveStr = JSON.stringify(adaptiveObj);
  const gzRaw       = gzipSync(rawStr).length;
  const gzAdaptive  = gzipSync(adaptiveStr).length;

  const rt = decompressCards(adaptiveObj);
  const ok = rt.every((c, i) =>
    c.question === cards[i].question && c.answer === cards[i].answer &&
    c.streak   === cards[i].streak   && c.level  === cards[i].level
  );

  const sizes = {
    'Raw JSON':        rawStr.length,
    'PackRat':         v1str.length,
    [`Adaptive (${adaptiveObj.v === 2 ? 'LexPack' : 'PackRat'})`]: adaptiveStr.length,
    'gzip(raw)':       gzRaw,
    'gzip(adaptive)':  gzAdaptive,
  };

  const max     = Math.max(...Object.values(sizes));
  const minSize = Math.min(...Object.values(sizes));
  const pct     = (n) => `${((1 - n / rawStr.length) * 100).toFixed(1)}%`.padStart(7);

  console.log(`\n── ${label} (${cards.length} cards)  round-trip: ${ok ? 'PASS ✓' : 'FAIL ✗'} ──`);
  for (const [name, size] of Object.entries(sizes)) {
    const isWinner = size === minSize;
    const tag      = isWinner ? ' ★' : '  ';
    console.log(
      `  ${name.padEnd(22)} ${bar(size, max, isWinner)}  ${String(size).padStart(5)} chars  ${pct(size)} vs raw${tag}`
    );
  }
}

console.log('\nLexPack v2 Benchmark');
console.log('====================');
bench('Geography  (highly structured)', geographyDeck(40));
bench('History    (mixed structure)',   historyDeck(40));
bench('Science    (sparse vocab)',      scienceDeck(40));
