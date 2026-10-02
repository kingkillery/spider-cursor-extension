# Neon Spider Cursor

A tiny Chrome/Edge extension that turns your pointer into a neon spider. Its eight legs anchor to nearby links while a colorful glitch overlay follows the interaction — without rewriting the page.

## Demo

https://github.com/user-attachments/assets/ca13965e-79f7-4b08-b9cd-f8f9d0ff822a

> **Your links just grew legs.**

## What it does

- Eight animated neon legs follow the pointer
- Nearby links become temporary anchor points
- Click anywhere on the page for a glitch pulse
- Adjustable glitch intensity
- Pause/resume from the overlay or with `Alt + Shift + S`
- Respects `prefers-reduced-motion`
- Links remain clickable and their content stays intact

## Install

1. Clone or download this repository.
2. Open `edge://extensions` or `chrome://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select this repository folder.
6. Open a normal webpage and click the extension icon.

Click the icon again to pause/resume the existing spider.

## Permissions & privacy

The extension requests only:

- `activeTab`
- `scripting`

There are **no blanket host permissions, analytics, telemetry, external dependencies, or network calls**. The effect is injected only after you click the extension action on the active tab.

Browser-protected pages such as extension settings and browser stores cannot be injected. Reloading a page removes the effect.

## Playground

Open `index.html` directly to try the effect without installing the extension.

## Test

```bash
python test_spider.py
```

The integration test uses Python Playwright with Microsoft Edge. It covers drawing, link preservation, pointer hit-testing, pause/resume, keyboard control, resizing, reinjection, cleanup, reduced-motion behavior, and browser runtime errors.

## Demo files

The GitHub-native player above uses a media attachment so it renders inline. The committed source files remain available as [`media/brag.mp4`](media/brag.mp4) and [`media/brag.jpg`](media/brag.jpg).

## License

MIT — see [LICENSE](LICENSE).
