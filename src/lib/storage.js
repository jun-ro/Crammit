import { compressSession, decompressSession } from './compress.js';

const KEY_SESSION = 'learnbetter_session';
const KEY_CSV = 'learnbetter_csv';

export function saveSession(cards, partition) {
  try {
    const packed = compressSession(cards, partition);
    localStorage.setItem(KEY_SESSION, packed);
    return true;
  } catch { return false; }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY_SESSION);
    if (!raw) return null;
    return decompressSession(raw);
  } catch { return null; }
}

export function clearSession() {
  localStorage.removeItem(KEY_SESSION);
}

export function saveCSV(filename, text) {
  try {
    localStorage.setItem(KEY_CSV, JSON.stringify({ n: filename, d: text }));
    return true;
  } catch { return false; }
}

export function loadCSV() {
  try {
    const raw = localStorage.getItem(KEY_CSV);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}