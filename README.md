# gta6-cover-art-sakura

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/hellolucyheart/gta6-cover-art-sakura/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/hellolucyheart/gta6-cover-art-sakura/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Sakura Vice is a browser-based GTA 6-style cover art studio: pick a layout (hero, split, strip, grid), drop in a photo or a seeded procedural vector scene, pan and zoom each panel, choose a colour grade — including the pink-blue Cotton Candy grade — add a title and tagline, then export the cover as a PNG at 1080×1080, 1080×1350 or 1920×1080.

## Run it

```sh
node serve.ts
```

Then open the printed local URL. No build step and no network calls: the two sample photos ship in `app/samples/`, and the vector scenes are drawn on canvas from a seeded generator.

## Screenshots

Seed 17, taken with headless Chromium (see `shots.json` for the shot list):

1. `1-cover-grid.jpg` — grid cover, Cotton Candy grade
2. `2-editor.jpg` — the editor with a photo loaded
3. `3-cover-split.jpg` — split cover, Neon Nights grade
4. `4-cover-hero.jpg` — hero cover, Cotton Candy grade

Screenshot mode: open the app with `?shot=grid|editor|split|hero` for a fixed seeded state; add `&bare=1` to hide the editor chrome so a cover fills the frame.

## Grader

`main.ts` is the entrypoint the grader runs with Node 22. It copies `app/` and `screenshots/` into `MAKEFUN_OUTPUT_DIR` (or a local `out/` directory) and writes `dossier.json` there with the kit's vendored dossier builder. Running it twice produces identical dossier bytes.

---

<sub>Entered on [make.fun](https://make.fun/?ref=68wvraae&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
