/**
 * Calculator state machine, DDG "Basic" behavior: the expression builds up on
 * one line, `=` evaluates it with normal precedence, and the result becomes the
 * next entry, so an operator continues from it and a digit starts over.
 */

export const OPS = { '+': '+', '-': '−', '*': '×', '/': '÷' };

export function initial() {
  return { tokens: [], entry: '', evaluated: false, lastExpr: '', history: [] };
}

const isOp = (t) => t in OPS;

function toNumber(entry) {
  const isPercent = entry.endsWith('%');
  const n = parseFloat(isPercent ? entry.slice(0, -1) : entry);
  return isPercent ? n / 100 : n;
}

/** Rounds away float noise: 0.1 + 0.2 → 0.3. */
function tidy(n) {
  return parseFloat(n.toPrecision(12));
}

export function evaluate(tokens) {
  const terms = [toNumber(tokens[0])];
  const addOps = [];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const n = toNumber(tokens[i + 1]);
    const isMulDiv = op === '*' || op === '/';
    if (isMulDiv) {
      const prev = terms.pop();
      terms.push(op === '*' ? prev * n : prev / n);
    } else {
      addOps.push(op);
      terms.push(n);
    }
  }
  let result = terms[0];
  addOps.forEach((op, i) => {
    result = op === '+' ? result + terms[i + 1] : result - terms[i + 1];
  });
  return tidy(result);
}

export function exprText(tokens, entry = '') {
  const parts = tokens.map((t) => OPS[t] ?? t);
  if (entry) parts.push(entry);
  return parts.join(' ');
}

function startFresh(s) {
  return { ...s, tokens: [], entry: '', evaluated: false };
}

export function press(s, key) {
  if (/^[0-9.]$/.test(key)) return digit(s, key);
  if (isOp(key)) return operator(s, key);
  switch (key) {
    case '%': return percent(s);
    case '=': return equals(s);
    case 'back': return back(s);
    case 'clear': return { ...startFresh(s), lastExpr: '' };
    default: return s;
  }
}

function digit(s, d) {
  const base = s.evaluated ? startFresh(s) : s;
  let { entry } = base;
  const hasDot = entry.includes('.');
  const isPercent = entry.endsWith('%');
  if (isPercent || (d === '.' && hasDot)) return base;
  if (entry === '0' && d !== '.') entry = d;
  else if (entry === '-0' && d !== '.') entry = '-' + d;
  else entry += d;
  if (entry === '.') entry = '0.';
  if (entry === '-.') entry = '-0.';
  return { ...base, entry };
}

function operator(s, op) {
  const isEmpty = s.entry === '' || s.entry === '-';
  if (isEmpty && s.tokens.length === 0) {
    return op === '-' ? { ...s, entry: '-' } : s;
  }
  if (isEmpty) {
    const tokens = [...s.tokens.slice(0, -1), op];
    return { ...s, tokens, entry: '' };
  }
  const entry = s.entry.endsWith('.') ? s.entry.slice(0, -1) : s.entry;
  return { ...s, tokens: [...s.tokens, entry, op], entry: '', evaluated: false };
}

function percent(s) {
  const canPercent = s.entry !== '' && s.entry !== '-' && !s.entry.endsWith('%');
  if (!canPercent) return s;
  return { ...s, entry: s.entry + '%', evaluated: false };
}

function equals(s) {
  if (s.evaluated) return s;
  const hasEntry = s.entry !== '' && s.entry !== '-';
  const tokens = hasEntry ? [...s.tokens, s.entry] : s.tokens.slice(0, -1);
  if (tokens.length === 0) return s;
  const result = evaluate(tokens);
  const expr = exprText(tokens);
  if (!Number.isFinite(result)) {
    return { ...s, tokens: [], entry: '', evaluated: true, lastExpr: expr, error: true };
  }
  const value = String(result);
  return {
    ...s,
    tokens: [],
    entry: value,
    evaluated: true,
    lastExpr: expr,
    error: false,
    history: [{ expr, result: value }, ...s.history].slice(0, 200),
  };
}

function back(s) {
  if (s.evaluated) return startFresh(s);
  if (s.entry) return { ...s, entry: s.entry.slice(0, -1) };
  if (s.tokens.length) {
    const tokens = s.tokens.slice(0, -2);
    return { ...s, tokens, entry: s.tokens[s.tokens.length - 2] };
  }
  return s;
}

/** Loads a history result as the current entry, as if just evaluated. */
export function recall(s, value) {
  return { ...s, tokens: [], entry: value, evaluated: true, error: false };
}
