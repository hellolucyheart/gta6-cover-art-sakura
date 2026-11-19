# gta6-cover-art-sakura

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/hellolucyheart/gta6-cover-art-sakura/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/hellolucyheart/gta6-cover-art-sakura/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Sakura Vice — a web app that turns your photos and a caption into cover art in the style of GTA 6's posters: multi-panel layouts, bold condensed lettering, a Vice City sunset or neon colour grade, and PNG export in the post sizes 1080 × 1080, 1080 × 1350 and 1920 × 1080. It runs offline in a desktop browser from its own static files: photos never leave the machine.

## What it does

- **Four layouts** — Hero (one photo full-bleed), Split (two photos, diagonal seam), Strip (three slanted bands) and Grid 2×2, the multi-panel poster look.
- **Any photo** — upload up to four of your own, or start from the four built-in samples (two photos plus two vector scenes drawn by the app itself). Drag the cover to pan, slide to zoom, per panel.
- **Shuffle** — one click randomises the layout, the colour grade, the four photo slots and the caption, so you can riff on ideas fast; every shuffle is a new roll of the same seeded dice.
- **Caption editing** — title and tagline, drawn as bold condensed caps with a black outline, white fill and pink echo.
- **Six colour grades** — Vice Sunset, Neon Nights, Golden Hour, Teal Noir, Miami Pastel and the new Cotton Candy (bubblegum pink over sky blue), plus a sun disc, palm and skyline silhouettes, birds, film grain and a poster frame, all drawn in code.
- **Fast export** — one click writes the cover as a PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080.

Everything is the app's own: no Rockstar Games logo, artwork or fonts — lettering uses the system font stack, and the sample scenes are drawn procedurally on canvas.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Pick photos, a layout, a grade and a caption, hit Shuffle for a surprise, then Export PNG.

## Layout

- `main.ts` — the entrypoint the grader runs: copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json`.
- `app/index.html` — the editor page. `app/src/main.js` wires the controls, `app/src/cover.js` draws the cover, `app/src/samples.js` draws the two vector sample scenes, `app/src/shots.js` sets up the fixed screenshot scenes.
- `app/samples/` — two sample photos, free to use (from the make.fun kit).
- `screenshots/` — four captures: the wide cover first, then the editor with photos loaded, then the portrait and square covers.
- `shots.json` — the four screenshot scenes (query + size each).
- `vendor/makefun-app.ts` — the make.fun dossier library, copied from the kit unchanged.

## Screenshots

The four shots in `screenshots/` are taken by the app itself: `?shot=cover` draws one exported cover alone at its export size, `?shot=editor` shows the editor with photos loaded. Each shot is deterministic (fixed seed 13).

---

<sub>Entered on [make.fun](https://make.fun/?ref=68wvraae&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
