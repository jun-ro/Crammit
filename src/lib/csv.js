export function parseCSV(text) {
  const rows = [];
  let cur = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { cur.push(field.trim()); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++;
      if (field.trim() || cur.length) cur.push(field.trim());
      if (cur.some(f => f)) rows.push(cur);
      cur = []; field = '';
    } else field += ch;
  }
  if (field.trim() || cur.length) cur.push(field.trim());
  if (cur.some(f => f)) rows.push(cur);
  return rows;
}

export function findColumns(header) {
  const h = header.map(c => c.toLowerCase().replace(/[^a-z]/g, ''));
  const qi = h.findIndex(c => /question|front|term/.test(c));
  const ai = h.findIndex(c => /answer|back|definition/.test(c));
  if (qi !== -1 && ai !== -1) return { qi, ai };
  return header.length >= 2 ? { qi: 0, ai: 1 } : null;
}