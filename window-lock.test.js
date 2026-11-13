import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { lockWindowSize } from './window-lock.js';

const SIZE = { width: 960, height: 540 };

/** Steps the fake clock so timers set by timers also run. */
const run = (ms) => {
  for (let t = 0; t < ms; t += 10) mock.timers.tick(10);
};

/** A window whose desktop rounds every requested size up by a pixel. */
function roundingWindow(width, height) {
  const listeners = [];
  const win = {
    outerWidth: width,
    outerHeight: height,
    resizes: 0,
    addEventListener: (_, fn) => listeners.push(fn),
    resizeTo(w, h) {
      win.resizes += 1;
      win.drag(w + 1, h + 1);
    },
    drag(w, h) {
      win.outerWidth = w;
      win.outerHeight = h;
      setTimeout(() => listeners.forEach((fn) => fn()), 10);
    },
  };
  return win;
}

test('settles when the desktop gives a slightly different size', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const win = roundingWindow(1280, 720);
  lockWindowSize(win, SIZE);
  run(10_000);
  assert.equal(win.resizes, 1);
  mock.timers.reset();
});

test('snaps back once after the user resizes', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const win = roundingWindow(1280, 720);
  lockWindowSize(win, SIZE);
  run(10_000);
  win.drag(700, 400);
  run(10_000);
  assert.equal(win.resizes, 2);
  assert.deepEqual([win.outerWidth, win.outerHeight], [961, 541]);
  mock.timers.reset();
});

test('changing the size locks to the new one', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const win = roundingWindow(1280, 720);
  const lock = lockWindowSize(win, SIZE);
  run(10_000);
  lock.setSize({ width: 640, height: 360 });
  run(10_000);
  win.drag(700, 400);
  run(10_000);
  assert.equal(win.resizes, 3);
  assert.deepEqual([win.outerWidth, win.outerHeight], [641, 361]);
  mock.timers.reset();
});
