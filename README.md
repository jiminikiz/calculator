# Calculator

A basic arithmetic calculator, installable as a PWA. Inspired by DuckDuckGo's
calculator and GNOME Calculator.

**Live:** https://jiminikiz.github.io/calculator/

## Features

- `+ − × ÷` and `%`, with normal operator precedence
- The result of `=` becomes the next input, like a physical calculator
- History, kept between launches; click an entry to reuse its result
- Opens at 960×540 and snaps back to that size when installed
- ⧉ floats the calculator in an always-on-top window (Chromium browsers)
- Works offline once installed

## Install

1. Open https://jiminikiz.github.io/calculator/ in a Chromium browser (Chrome, Brave, Edge).
2. Click the install icon in the address bar, or ⋮ → Install.

Updates arrive on their own: an installed copy picks up a new version the
second time it opens after a push.

## Keyboard

| Key                 | Does                   |
| ------------------- | ---------------------- |
| `0`–`9`, `.`        | Enter a number         |
| `+ - * /` (or `x`)  | Operator               |
| `%`                 | Percent                |
| `Enter` or `=`      | Evaluate               |
| `Backspace`         | Delete last character  |
| `Esc`               | Clear                  |
| `Ctrl+C`            | Copy the current value |

## Development

No build step. Serve the folder and open it:

```bash
python3 -m http.server 8787
```

Run the tests (Node 22+):

```bash
pnpm test
```

| File                    | Holds                                       |
| ----------------------- | ------------------------------------------- |
| `calc.js`               | The calculator's state machine (tested)     |
| `app.js`                | DOM, keyboard, history, window size         |
| `pip.js`                | The always-on-top floating window           |
| `sw.js`                 | Service worker for offline use              |
| `scripts/make-icons.py` | Regenerates `icons/`                        |

Pushing to `main` deploys to GitHub Pages.
