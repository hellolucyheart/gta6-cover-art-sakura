// Fixed scenes for screenshots: ?shot=editor shows the page with photos loaded;
// ?shot=cover shows one exported cover alone, drawn at its export size.
// Query keys: photos (pier|boulevard|neon|palms, comma list), layout, grade,
// title, tagline, size (square|portrait|wide), seed. window.__shotReady is
// set once painted.

import { POST_SIZES } from './main.js';

/** Applies the shot's query to the shared editor state. */
export function applySceneQuery(params, state) {
  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('title') !== null) state.title = params.get('title');
  if (params.get('tagline') !== null) state.tagline = params.get('tagline');
  if (params.get('size')) state.size = params.get('size');
  if (params.get('seed')) state.seed = Number(params.get('seed')) || 13;
  return state;
}

/** How many panels the current layout needs. */
export function panelCountFor(layout) {
  if (layout === 'grid') return 4;
  if (layout === 'strip') return 3;
  if (layout === 'split') return 2;
  return 1;
}

/** Loads the shot's photos into slots 0..n (comma list, or one photo for all). */
export async function loadScenePhotos(params, assignSlot, count) {
  const list = (params.get('photos') || params.get('photo') || 'pier').split(',');
  for (let i = 0; i < count; i++) {
    const source = list[i % list.length].trim();
    // eslint-disable-next-line no-await-in-loop
    await assignSlot(i, source);
  }
}

/** Runs one shot scene, then flags readiness for the screenshot. */
export async function runShot(shot, params, state, repaint, assignSlot) {
  applySceneQuery(params, state);
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await loadScenePhotos(params, assignSlot, panelCountFor(state.layout));
  // draw at the shot's export size so the screenshot IS the cover, scaled down
  const size = POST_SIZES[state.size] || POST_SIZES.square;
  const canvas = document.getElementById('cover');
  canvas.width = size.w;
  canvas.height = size.h;
  repaint();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
