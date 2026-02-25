# Hillfred Golf App — Developer Journal

> **Handover document for Claude AI sessions.**
> Start every new chat with: *"Here is my golf app repo: https://github.com/andyhill000-debug/Hillfred_Golf — please read JOURNAL.md and the current index.html before making changes."*

---

## App Overview

A single-page web app for live golf scoring, matchplay tracking and tournament leaderboards. Built as a PWA (Progressive Web App) hosted on GitHub Pages with Firebase Realtime Database for live sync.

**Live URL:** `https://andyhill000-debug.github.io/Hillfred_Golf/`
**GitHub Repo:** `https://github.com/andyhill000-debug/Hillfred_Golf`
**Firebase Project:** `hillfred-golf-default-rtdb.asia-southeast1.firebasedatabase.app`

---

## File Structure

```
/ (repo root)
├── index.html          — Main scorecard app (~5,900 lines, single file)
├── leaderboard.html    — Live tournament leaderboard (~2,100 lines)
├── match-graph.html    — Live match worm graph (~600 lines)
├── sw.js               — Service worker (PWA offline cache)
├── manifest.json       — PWA manifest
├── JOURNAL.md          — This file
└── icons/
    ├── icon-32.png     — Favicon
    ├── icon-76.png
    ├── icon-120.png
    ├── icon-152.png
    ├── icon-180.png    — iOS home screen icon
    ├── icon-192.png    — Android home screen icon
    └── icon-512.png    — Play Store / splash screen
```

---

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS, single file per page, no build system
- **Database:** Firebase Realtime Database (asia-southeast1 region)
- **Hosting:** GitHub Pages (free, HTTPS)
- **Fonts:** Playfair Display + DM Sans (Google Fonts)
- **PWA:** Service worker with cache-first strategy, manifest.json

---

## Brand

**Hillfred brand** — always apply to all UI:
- Primary black: `#1a1a1a`
- Teal accent: `#00d4aa` (CSS var `--teal`)
- Gold: `#c9a961` (CSS var `--gold`)
- App background: `#0f0f0f`
- Red (losing): `#ef4444` (CSS var `--red`)
- Fonts: Playfair Display (headings), DM Sans (body)
- Logo: geometric 3x3 grid rotated 45°, teal squares at positions (0,1) and (2,2)
- Dark bg version: white squares + teal accents on `#0d1117` background

---

## Version Control

Format: `YYYY.MM.DD.increment` in `<meta name="app-version">` tag.
Current version: **2026.02.25.7**

All 3 HTML files + sw.js carry the same version.
Service worker cache name = `hillfred-golf-{version}` — bumping version auto-busts cache.

**To verify deployed version in browser console:**
```javascript
document.querySelector('meta[name="app-version"]')?.content
```

---

## Game Modes

| Mode | Description |
|------|-------------|
| Matchplay | Hole-by-hole win/lose/halve. Supports 1v1 and 4BBB teams |
| Stableford | Points per hole based on handicap |
| Stroke Play | Net stroke total |
| + Skins | Optional add-on to any mode |

**Player configurations:**
- 2 player: standard 1v1
- 3 player: 2 singles matches (p1vp2, p1vp3 or custom)
- 4 player non-team: dual independent singles (p1vp2 + p3vp4)
- 4 player team (4BBB): p1+p3 vs p2+p4, best ball stableford points comparison

---

## SGG International 2026 Tournament

Pre-loaded tournament preset. Two days:

**Day 1 — Bonnie Doon Golf Club (4BBB Matchplay, 7 matches)**
- ROW (Rest of World) vs AUS
- 4BBB format with SGG house rules: `scratchBase: true`
- This means: full handicaps used (not matchplay index), stableford points compared, P = 0pts not concession

**Day 2 — Stonecutters Ridge Golf Club (Singles Matchplay, 15 matches)**
- ROW vs AUS
- Standard matchplay index

**Combined scoreboard** shows Day 1 + Day 2 totals with ROW/AUS points tally.

**Tournament key in Firebase:** `sgg2026`
**Team names:** `ROW` and `AUS`

---

## Key Architecture Decisions

### localStorage Keys
```
hf_game_autosave    — current in-progress game state
hf_golf_history     — completed games array
hf_device_id        — persistent device ID (also in cookie hf_did for cache-clear survival)
hf_tournaments      — tournament config/results
hf_admin_pin_hash   — hashed admin PIN
hf_tutorial_done    — tutorial completion flag
hf_return_to_play   — flag set before navigating to leaderboard/graph, cleared on return
```

### Navigation Flow
- Leaderboard/graph open in **same tab** (not new tab) — `window.location.href`
- Before navigating away: `localStorage.setItem('hf_return_to_play', '1')`
- On return to index.html: flag detected → silent game restore → `showTab('play')`
- No `#play` hash needed — pure localStorage flag approach
- Resume modal shows on fresh page load (no flag), never when returning from leaderboard

### Firebase Data Structure
```
tournaments/
  {tournamentKey}/
    games/
      {gameId}/
        _meta: { team1name, team2name, mode, status, playerCount, team }
        {playerName}/
          teamName, holesPlayed, mpStatus, mpLeading, grossTotal, netTotal, stabTotal
          h1..h18: { gross, net, stab, mpStatus, mpLeading, teamName }
    results/
      { label, t1pts, t2pts, halved, winner, updatedAt }
```

### Matchplay Status Labels
- Live: `"2 UP"`, `"1 DOWN"`, `"All Square"`
- Closed (won before 18): `"W 3&2"`, `"L 2 UP"`, `"W 1UP"`
- The `W ` / `L ` prefix is stripped for display — colour coding conveys winner
- `mpLeading`: 0=AS, 1=Team1/P1 side, 2=Team2/P2 side

### Posterity Holes
When matchplay closes early (e.g. 3&2 on hole 16), players can continue for posterity:
- UI shows **"💾 Save & Close"** (locks result) or **"▶ Play for Posterity"** (continue)
- Firebase sync is SKIPPED for holes beyond `closingHole` — live leaderboard/graph not affected
- History records true closing result, not posterity scores

### 4BBB Specific
- p1 + p3 = Team 1, p2 + p4 = Team 2
- `_mpSt` (not `_mpSt2`) is used for ALL 4 players in team games
- `scratchBase: true` = use full handicap + course SI (not matchplay index)
- Pickup (P) = 0 stableford points, not a concession

---

## Nav Bar

5 buttons: Match | Tournament | History | 📡 Leaderboard | 📈 Match Graph

When a game is active, the **Match** button mutates to **🎯 Scorecard** (amber colour).
Function: `setNavScorecard(active)` — call this on every game restore/start path.

Called at:
- `startGame()`
- `resumeGame()`
- `checkForSavedGame()` silent restore
- `_returnToPlay` flag restore
- `setTimeout(() => { if (game) setNavScorecard(true); }, 100)` safety net

---

## PWA / Service Worker

- `sw.js` uses cache-first strategy for app shell
- Firebase URLs always bypass cache (network-only)
- Cache name = `hillfred-golf-{version}` — old caches deleted on activate
- Registered in index.html: `/Hillfred_Golf/sw.js`
- App shell: index.html, leaderboard.html, match-graph.html, manifest.json, all icons

**Offline behaviour:**
- App loads from cache ✅
- Scores save to localStorage ✅
- Firebase sync fails silently ❌ (no offline queue yet — future work)
- Live leaderboard/graph stale when offline ❌

---

## Known Issues / Future Work

| Priority | Item |
|----------|------|
| Medium | Offline sync queue — store failed Firebase writes in localStorage, drain when reconnected |
| Low | Play Store TWA submission (needs `assetlinks.json` + APK build) |
| Low | App Store submission (needs Capacitor + Xcode + $149/yr Apple Developer account) |
| Low | Firebase security rules tightening (currently open read/write) |
| Low | `favicon.ico` not present — browser requests it and gets 404 (cosmetic only) |

---

## Recent Bug Fixes (Current Session)

1. **`hasMode is not defined`** — `checkCanStart()` used undefined variable. Fixed: `const hasMode = !!gameMode`
2. **Resume modal never showing** — `hf_resume_ts` timestamp refreshed on every page load making `sessionActive` always true. Fixed: removed timestamp logic entirely, always show modal on fresh load
3. **Back navigation** — replaced URL hash `#play` approach with localStorage flag `hf_return_to_play`. Simpler, no browser quirks
4. **Match graph no data (4BBB)** — p3/p4 players got `mpStatus: null` because `_mpSt2` is null for team games. Fixed: team games use `_mpSt` for all 4 players
5. **History showing wrong team names** — `mode: null` in older games caused wrong branch. Fixed: detect team games with `g.team && !g.mode`
6. **W/L prefix on leaderboard** — stripped at display time, colour coding conveys winner
7. **Match graph auto-select** — now sorts by `holesPlayed` descending (closest to finishing first). Only switches away from user's manual selection when their chosen match finishes
8. **Posterity holes in Firebase** — sync now returns early for holes beyond `closingHole`
9. **Scorecard nav button** — consolidated into `setNavScorecard(active)` helper called from all restore paths
10. **Device ID lost after cache clear** — device ID now stored in both localStorage AND a 1-year cookie (`hf_did`)

---

## How to Start a New Claude Session

Paste this at the start:

```
I'm continuing development of my Hillfred Golf PWA.
Repo: https://github.com/andyhill000-debug/Hillfred_Golf
Live: https://andyhill000-debug.github.io/Hillfred_Golf/
Current version: 2026.02.25.7

Please read JOURNAL.md from the repo for full context, then read the current index.html before making any changes. Always use Hillfred branding, always bump the version number on every change, always validate JS before delivering files.
```

---

## Claude Working Instructions

When making changes:
1. Always read the current file before editing (use `view` tool or `bash cat`)
2. Use `str_replace` for targeted edits, never rewrite entire files unless necessary
3. Validate JS with `node --check` after every change
4. Bump version in ALL 3 HTML files + sw.js on every session
5. Always `present_files` at the end so files can be downloaded
6. Version format: `YYYY.MM.DD.increment` (e.g. `2026.02.25.8`)
7. Apply Hillfred brand colours/fonts to any new UI elements
