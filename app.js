import { initial, press, recall, exprText } from './calc.js';

const WINDOW = { width: 600, height: 340 };
const STORE_KEY = 'calc-history';

const $ = (id) => document.getElementById(id);
const currentEl = $('current');
const lastEl = $('last');
const historyEl = $('history');

let state = { ...initial(), history: loadHistory() };

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state.history));
  } catch {}
}

const pretty = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 12 });

function fitText(el, max) {
  el.style.fontSize = max + 'px';
  let size = max;
  while (el.scrollWidth > el.clientWidth && size > 12) {
    size -= 1;
    el.style.fontSize = size + 'px';
  }
}

function render() {
  const pending = state.tokens.length ? exprText(state.tokens, state.entry) : '';
  const text = state.error ? 'Error' : pending || state.entry || '0';
  currentEl.textContent = text;
  currentEl.classList.toggle('error', Boolean(state.error));
  lastEl.textContent = state.lastExpr;
  fitText(currentEl, 34);
}

function renderHistory() {
  historyEl.replaceChildren(
    ...state.history.map(({ expr, result }) => {
      const li = document.createElement('li');
      li.innerHTML = '<div class="expr"></div><div class="result"></div>';
      li.firstChild.textContent = expr;
      li.lastChild.textContent = pretty(result);
      li.addEventListener('click', () => {
        state = recall(state, result);
        render();
      });
      return li;
    }),
  );
}

function dispatch(key) {
  const before = state.history;
  state = press(state, key);
  render();
  if (state.history !== before) {
    saveHistory();
    renderHistory();
  }
}

function flash(key) {
  const btn = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
  if (!btn) return;
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 90);
}

const KEYMAP = {
  Enter: '=', '=': '=', Backspace: 'back', Escape: 'clear', Delete: 'clear',
  x: '*', X: '*', ',': '.',
};

document.addEventListener('keydown', (e) => {
  const isCopy = (e.ctrlKey || e.metaKey) && e.key === 'c';
  if (isCopy) {
    navigator.clipboard?.writeText(state.entry || '0');
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const key = KEYMAP[e.key] ?? e.key;
  const isCalcKey = /^[0-9.+\-*/%=]$/.test(key) || key === 'back' || key === 'clear';
  if (!isCalcKey) return;
  e.preventDefault();
  dispatch(key);
  flash(key === 'back' ? 'clear' : key);
});

document.querySelector('.keys').addEventListener('click', (e) => {
  const key = e.target.closest('button')?.dataset.key;
  if (key) dispatch(key);
  e.target.blur();
});

$('clear-history').addEventListener('click', () => {
  state = { ...state, history: [] };
  saveHistory();
  renderHistory();
});

/** Snaps the installed app window to the calculator's size. */
function sizeWindow() {
  const isInstalled = matchMedia('(display-mode: standalone)').matches;
  if (!isInstalled) return;
  const chromeW = window.outerWidth - window.innerWidth;
  const chromeH = window.outerHeight - window.innerHeight;
  window.resizeTo(WINDOW.width + chromeW, WINDOW.height + chromeH);
}

sizeWindow();
render();
renderHistory();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
