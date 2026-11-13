const DEBOUNCE_MS = 150;
const SETTLE_MS = 500;

/**
 * Holds a window at `initial`: resizes it now, and snaps it back after any resize.
 * The web can't make a window non-resizable, so this is the closest it gets.
 *
 * The desktop may not grant the exact size (fractional scaling rounds it), so
 * the lock is whatever size it settles on after our own resize. Locking to the
 * requested size instead makes the window fight the desktop forever.
 */
export function lockWindowSize(win, initial) {
  let size = initial;
  let locked = size;
  let isSnapping = false;
  let timer;
  const isAt = (s) => win.outerWidth === s.width && win.outerHeight === s.height;

  const snap = () => {
    isSnapping = true;
    win.resizeTo(size.width, size.height);
    setTimeout(() => {
      isSnapping = false;
      locked = { width: win.outerWidth, height: win.outerHeight };
    }, SETTLE_MS);
  };

  if (!isAt(size)) snap();
  win.addEventListener('resize', () => {
    if (isSnapping) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!isAt(locked)) snap();
    }, DEBOUNCE_MS);
  });

  return {
    setSize(next) {
      size = next;
      snap();
    },
  };
}
