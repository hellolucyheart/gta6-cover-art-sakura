// Fixed scenes for screenshots: ?shot=editor shows the page with photos loaded;
// ?shot=cover shows one exported cover alone, drawn at its export size.
// Query keys: photo (pier|boulevard|neon|palms), layout, grade, title, tagline,
// size (square|portrait|wide), seed. window.__shotReady is set once painted.

import { EXPORT_SIZES } from './main.js';

/** Applies the shot's query to the shared editor state. */
export function applyShotQuery(params, state) {
  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('title') !== null) state.title = params.get('title');
  if (params.get('tagline') !== null) state.tagline = params.get('tagline');
  if (params.get('size')) state.size = params.get('size');
  if (params.get('seed')) state.seed = Number(params.get('seed')) || 7;
  return state;
}

/** Loads the shot's photos into slots 0..n (comma list, or one photo for all). */
export async function loadShotPhotos(params, setSlotSource, count) {
  const list = (params.get('photos') || params.get('photo') || 'pier').split(',');
  for (let i = 0; i < count; i++) {
    const source = list[i % list.length].trim();
    // eslint-disable-next-line no-await-in-loop
    await setSlotSource(i, source);
  }
}

/** Runs one shot scene, then flags readiness for the screenshot. */
export async function runShot(shot, params, state, redraw, setSlotSource) {
  applyShotQuery(params, state);
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const panels = state.layout === 'grid' ? 4 : state.layout === 'strip' ? 3 : state.layout === 'split' ? 2 : 1;
  await loadShotPhotos(params, setSlotSource, panels);
  // draw at the shot's export size so the screenshot IS the cover, scaled down
  const size = EXPORT_SIZES[state.size] || EXPORT_SIZES.square;
  const canvas = document.getElementById('cover');
  canvas.width = size.w;
  canvas.height = size.h;
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
