import { compressCards, decompressCards } from './compress.js';

const KEY = 'crammit_sessions';

export function sessions() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAll(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function listSessions() {
  const list = sessions();
  list.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
  return list;
}

export function getSession(id) {
  const list = sessions();
  const s = list.find(s => s.id === id);
  if (!s) return null;
  if (!Array.isArray(s.cards)) {
    s.cards = decompressCards(s.cards);
  }
  return s;
}

export function putSession(session) {
  const list = sessions();
  const copy = { ...session };
  if (Array.isArray(copy.cards)) {
    copy.cards = compressCards(copy.cards);
  }
  copy.updatedAt = Date.now();
  const idx = list.findIndex(s => s.id === copy.id);
  if (idx >= 0) list[idx] = copy;
  else list.push(copy);
  saveAll(list);
}

export function deleteSession(id) {
  const list = sessions().filter(s => s.id !== id);
  saveAll(list);
}

export function createSession(csvName, cards) {
  const session = {
    id: Date.now(),
    csvName,
    cards,
    partitionSize: 0,
    partitionIdx: 0,
    partScore: 0,
    partTotal: 0,
    allScore: 0,
    allTotal: 0,
    done: false,
    updatedAt: Date.now(),
  };
  putSession(session);
  return session;
}

export function updateSession(id, fields) {
  const list = sessions();
  const idx = list.findIndex(s => s.id === id);
  if (idx === -1) return;
  const copy = { ...list[idx], ...fields };
  if (Array.isArray(copy.cards)) {
    copy.cards = compressCards(copy.cards);
  }
  copy.updatedAt = Date.now();
  list[idx] = copy;
  saveAll(list);
}