import { initial, press, recall, exprText } from './calc.js';
import { canFloat, openFloating } from './pip.js';
import { lockWindowSize } from './window-lock.js';

/** Outer sizes of the installed app window. M is a quarter of 1920×1080. */
const SIZES = {
  S: { width: 640, height: 360 },
  M: { width: 960, height: 540 },
  L: { width: 1280, height: 720 },
};
const DEFAULT_SIZE = 'M';
const SIZE_KEY = 'calc-size';
const STORE_KEY = 'calc-history';
const isInstalled = matchMedia('(display-mode: standalone)').matches;

const $ = (id) => document.getElementById(id);
const currentEl = $('current');
const lastEl = $('last');
const historyEl = $('history');
const keysEl = document.querySelector('.keys');
const floatBtn = $('float');

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
  const btn = keysEl.querySelector(`[data-key="${CSS.escape(key)}"]`);
  if (!btn) return;
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 90);
}

const KEYMAP = {
  Enter: '=', '=': '=', Backspace: 'back', Escape: 'clear', Delete: 'clear',
  x: '*', X: '*', ',': '.',
};

function onKey(e) {
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
}

document.addEventListener('keydown', onKey);

keysEl.addEventListener('click', (e) => {
  const key = e.target.closest('button')?.dataset.key;
  if (key) dispatch(key);
  e.target.blur();
});

$('clear-history').addEventListener('click', () => {
  state = { ...state, history: [] };
  saveHistory();
  renderHistory();
});

const FLOAT_SIZE = { width: 340, height: 440 };
let floating = null;

async function toggleFloat() {
  if (floating) {
    floating.close();
    return;
  }
  try {
    floating = await openFloating([document.querySelector('.calc'), document.querySelector('.history')], FLOAT_SIZE);
  } catch {
    return;
  }
  floating.document.addEventListener('keydown', onKey);
  document.body.classList.add('floating');
  floatBtn.title = 'Stop floating';
  render();
  floating.addEventListener('pagehide', () => {
    floating = null;
    document.body.classList.remove('floating');
    floatBtn.title = 'Float on top';
    requestAnimationFrame(render);
  });
}

// The installed app would leave an empty window behind; the OS's own
// "Always on Top" suits it better.
const canFloatHere = canFloat && !isInstalled;
floatBtn.hidden = !canFloatHere;
floatBtn.addEventListener('click', toggleFloat);
$('unfloat').addEventListener('click', toggleFloat);

function loadSize() {
  try {
    const saved = localStorage.getItem(SIZE_KEY);
    return saved in SIZES ? saved : DEFAULT_SIZE;
  } catch {
    return DEFAULT_SIZE;
  }
}

function showSize(name) {
  for (const btn of $('sizes').children) {
    btn.classList.toggle('active', btn.dataset.size === name);
  }
}

if (isInstalled) {
  const sizeName = loadSize();
  const lock = lockWindowSize(window, SIZES[sizeName]);
  showSize(sizeName);
  $('sizes').hidden = false;
  $('sizes').addEventListener('click', (e) => {
    const name = e.target.closest('button')?.dataset.size;
    if (!name) return;
    try {
      localStorage.setItem(SIZE_KEY, name);
    } catch {}
    showSize(name);
    lock.setSize(SIZES[name]);
  });
}
render();
renderHistory();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
