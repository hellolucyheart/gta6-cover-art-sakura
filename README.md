# gta6-cover-art-sakura

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/hellolucyheart/gta6-cover-art-sakura/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/hellolucyheart/gta6-cover-art-sakura/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Sakura Vice is a browser cover-art studio in the style of GTA 6 posters: pick a layout (hero, split, strip or 2×2 grid), drop in a photo or a drawn vector scene, pan and zoom each panel, pick a colour grade — including a pink-and-blue cotton-candy grade — add a bold title and tagline, and export the cover as a PNG in 1080×1080, 1080×1350 or 1920×1080.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Everything runs offline from static files; photos never leave the machine. The two sample photos in `app/samples/` were made for make.fun and are free to use, and the two drawn scenes are generated in the browser from seed 17.

## How it works

- `app/index.html` + `app/style.css` — the workbench: layout and grade pickers, caption fields, photo slots, export buttons.
- `app/src/samples.js` — the photo catalogue: two sample photos, two seeded vector scenes, and the upload slot.
- `app/src/cover.js` — the renderer: panel layouts, cover-fit pan/zoom, colour grades, caption lettering, PNG export.
- `app/src/shots.js` — the four seeded screenshot presets (`?shot=grid|editor|split|hero`).
- `app/src/main.js` — the editor wiring: drag to pan, scroll to zoom, upload, shuffle, export.
- `main.ts` — the program entrypoint: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit library.

## Screenshots

1. `1-cover-grid.jpg` — grid cover, cotton-candy grade, SUNSET HEIST.
2. `2-editor.jpg` — the editor with a photo loaded.
3. `3-cover-split.jpg` — split cover, neon grade, NEON HARBOR.
4. `4-cover-hero.jpg` — hero cover, sunset grade, BOULEVARD QUEEN.

Fan-made cover maker. No Rockstar Games artwork, logos or fonts.

---

<sub>Entered on [make.fun](https://make.fun/?ref=68wvraae&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
