# klokk

A cozy, neobrutalist clock and pomodoro timer for focused work — flip-card clock, task tracking, streak heatmap, and warm parchment vibes.

**Live:** https://klokk.netlify.app/

## Features

- **Flip clock** with 12/24-hour toggle and optional seconds
- **Pomodoro timer** with configurable work / short break / long break durations and round structure
- **Task list** linked to focus sessions — pomos earned per task
- **Stats** — daily heatmap, bar chart, streak, daily goal progress
- **Themes** — multiple curated palettes
- **Tweaks panel** — font style, background pattern, ambient pixels, sound chime, ticking
- **Real weather** via approximate IP geolocation (no permission prompt) — click to toggle °C/°F
- **Browser notifications** when a session ends and the tab is in the background
- **Offline-ready** via service worker
- **Persists state** across refreshes — including the running timer (anchored to wall-clock)

## Tech

No build step. React 18 and Babel run in-browser via CDN, JSX is loaded as separate `.jsx` modules.

```
index.html        entry point
themes.js         palette map
tweaks-panel.jsx  reusable tweaks shell
clock.jsx         flip clock components
pomodoro.jsx      timer + tasks
stats.jsx         heatmap + charts
extras.jsx        sticky note, ambient pixels, theme switcher, weather
settings.jsx      settings modal
app.jsx           root, state, persistence
styles.css        single stylesheet
sw.js             service worker
```

## Local development

The Babel-in-browser transformer fetches `.jsx` files via XHR, which browsers block on `file://`. You need a local HTTP server:

```bash
# Python
python -m http.server 8000

# or Node
npx serve
```

Then open `http://localhost:8000/`.

## Deploy

Static site — drop the folder on any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages). No build configuration needed.

## License

MIT
