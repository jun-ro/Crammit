const DIACRITICS_RE = /[\u0300-\u036f]/g;
const PUNCTUATION_RE = /[^a-z0-9\s]/g;
const WHITESPACE_RE = /\s+/g;

export function normalize(str) {
  return str
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase()
    .trim()
    .replace(PUNCTUATION_RE, '')
    .replace(WHITESPACE_RE, ' ');
}

export function normalizeCompare(a, b) {
  return normalize(a) === normalize(b);
}