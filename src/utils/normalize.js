const SUFFIXES = /^(jr\.?|sr\.?)$/i;

export function normalizeName(s) {
  if (!s) return '';
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/['\u2019\u2018`\u02bc]/g, '');
  s = s.toLowerCase().trim();
  return s;
}

/** Canvas CSV name format: "Last, First Middle" */
export function parseCanvasName(raw) {
  const comma = raw.indexOf(',');
  if (comma === -1) return null;
  const last = raw.slice(0, comma).trim();
  const rest = raw.slice(comma + 1).trim();
  const first = rest.split(/\s+/)[0];
  return normalizeName(first + ' ' + last);
}

/** Camu XLSX name format: "First Middle Last [Suffix]" */
export function parseCamuName(raw) {
  if (!raw) return '';
  let tokens = raw.trim().split(/\s+/).filter(Boolean);
  tokens = tokens.filter(t => !SUFFIXES.test(t));
  if (tokens.length === 0) return '';
  if (tokens.length === 1) return normalizeName(tokens[0]);
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  return normalizeName(first + ' ' + last);
}
