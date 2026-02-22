# Hillfred Golf Scorecard ⛳

A fully-featured mobile golf scoring app with matchplay, stableford and stroke play modes, tournament management, skins, handicaps and full scoring history.

## Features

- **Game Modes** — Matchplay, Stableford, Stroke Play
- **Formats** — 2-player, 3-player, 4-player individual, 4BBB Teams
- **Tournaments** — Singles and Teams tournament management with results consolidation
- **Skins** — Overlay skins game on any format
- **Handicaps** — Full stroke index allocation per hole
- **Courses** — 7 preset courses + custom course builder
- **History** — Full hole-by-hole scorecard history with countback tie-breaking
- **Offline** — Works entirely in the browser, no internet required after loading

## Deployment

This app is deployed via **GitHub Pages** as a single `index.html` file.

**Live URL:** `https://[your-username].github.io/[your-repo-name]/`

## How to Deploy

1. Create a new repository on GitHub (e.g. `hillfred-golf`)
2. Upload `index.html` and `README.md` to the repository
3. Go to **Settings → Pages**
4. Under **Source**, select `Deploy from a branch`
5. Select branch: `main` · folder: `/ (root)`
6. Click **Save**
7. Your app will be live at `https://[your-username].github.io/[your-repo-name]/` within a minute or two

## Data Storage

All game data is stored in the browser's `localStorage` on the device. Data is private to the device and browser it was created on.

## Notes

- Best experienced on mobile (iPhone/Android) — add to home screen for a native app feel
- On iPhone: Safari → Share → **Add to Home Screen**
- On Android: Chrome → Menu → **Add to Home Screen**
