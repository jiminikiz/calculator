import { initial, press, recall, exprText } from './calc.js';
import { canFloat, openFloating } from './pip.js';

/** Outer size of the installed app window: a quarter of 1920×1080. */
const WINDOW = { width: 960, height: 540 };
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

/**
 * Holds the installed app window at WINDOW: sizes it on open, and snaps it back
 * after any resize. The web can't make a window non-resizable, so this is the
 * closest it gets.
 */
function lockWindow() {
  if (!isInstalled) return;
  const snap = () => {
    const isLockedSize = window.outerWidth === WINDOW.width && window.outerHeight === WINDOW.height;
    if (!isLockedSize) window.resizeTo(WINDOW.width, WINDOW.height);
  };
  snap();
  let timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(snap, 150);
  });
}

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

lockWindow();
render();
renderHistory();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
