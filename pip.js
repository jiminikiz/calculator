/** Document Picture-in-Picture: an always-on-top window holding live DOM. */

export const canFloat = 'documentPictureInPicture' in window;

/**
 * Moves `nodes` into a new always-on-top window, with this page's styles, and
 * puts them back where they were when it closes. Needs a user gesture.
 */
export async function openFloating(nodes, size) {
  const pip = await window.documentPictureInPicture.requestWindow(size);
  for (const sheet of document.styleSheets) {
    const style = pip.document.createElement('style');
    style.textContent = [...sheet.cssRules].map((r) => r.cssText).join('\n');
    pip.document.head.append(style);
  }
  const homes = nodes.map((n) => [n, n.parentNode, n.nextSibling]);
  pip.document.body.append(...nodes);
  pip.addEventListener('pagehide', () => {
    homes.forEach(([node, parent, next]) => parent.insertBefore(node, next));
  });
  return pip;
}
