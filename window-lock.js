/**
 * Holds a window at `size`: resizes it now, and snaps it back after any resize.
 * The web can't make a window non-resizable, so this is the closest it gets.
 */
export function lockWindowSize(win, size) {
  const snap = () => {
    const isLockedSize = win.outerWidth === size.width && win.outerHeight === size.height;
    if (!isLockedSize) win.resizeTo(size.width, size.height);
  };
  snap();
  let timer;
  win.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(snap, 150);
  });
}
