// Sakura Vice wiring (round 2): photo slots, layout and grade controls,
// caption editing, drag-to-pan cropping, Shuffle, and PNG export in the
// three post sizes. Photos never leave the machine: uploads are read with
// FileReader only.

import { renderCover, computePanels, COLOR_GRADES, seededRandom } from './cover.js';
import { buildSampleScene } from './samples.js';
import { runShot } from './shots.js';

/** The three post sizes the bounty asks for. */
export const POST_SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

/** Caption ideas the Shuffle button can roll. */
export const SHUFFLE_CAPTIONS = [
  { title: 'SUNSET HEIST', tagline: 'LEONIDA HEAT' },
  { title: 'NEON HARBOR', tagline: 'MIDNIGHT DRIVE' },
  { title: 'BOULEVARD QUEEN', tagline: 'GOLDEN HOUR' },
  { title: 'VICE CITY BLUES', tagline: 'COTTON CANDY SKIES' },
  { title: 'PALM TREE HUSTLE', tagline: 'NO SLEEP IN LEONIDA' },
  { title: 'TWO LANES OUT', tagline: 'LAST LIGHT, FIRST GEAR' },
];

/** One photo slot: an image (or canvas scene) plus its crop. */
function freshSlot() {
  return { img: null, zoom: 1, panX: 0, panY: 0, source: 'none' };
}

export const studioState = {
  photos: [freshSlot(), freshSlot(), freshSlot(), freshSlot()],
  layout: 'grid',
  grade: 'sunset',
  title: 'SUNSET HEIST',
  tagline: 'LEONIDA HEAT',
  size: 'square',
  seed: 13,
};

const preview = document.getElementById('cover');
const statusLine = document.getElementById('status');

/** Loads an image from a URL, resolving once it can be drawn. */
export function fetchImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** The sample photo behind a slot source key. */
async function sampleImageFor(source) {
  if (source === 'boulevard') return fetchImage('samples/boulevard.jpg');
  if (source === 'pier') return fetchImage('samples/pier.jpg');
  if (source === 'neon') return buildSampleScene('neon', studioState.seed);
  if (source === 'palms') return buildSampleScene('palms', studioState.seed);
  return null;
}

/** Redraws the preview canvas at the chosen export size. */
export function repaint() {
  const size = POST_SIZES[studioState.size] || POST_SIZES.square;
  if (preview.width !== size.w || preview.height !== size.h) {
    preview.width = size.w;
    preview.height = size.h;
  }
  renderCover(preview, studioState);
  const used = studioState.photos.filter((p) => p.img).length;
  statusLine.textContent = used === 0
    ? 'Pick a sample photo or upload your own to start.'
    : `${used} photo${used > 1 ? 's' : ''} loaded · ${POST_SIZES[studioState.size].label} · ${COLOR_GRADES[studioState.grade].label}`;
}

/** Sets one slot's source (sample, scene or upload) and redraws. */
export async function assignSlot(index, source, file) {
  const slot = studioState.photos[index];
  slot.source = source;
  if (source === 'upload' && file) {
    slot.img = await fetchImage(URL.createObjectURL(file));
  } else {
    slot.img = await sampleImageFor(source);
  }
  slot.zoom = 1;
  slot.panX = 0;
  slot.panY = 0;
  const zoomInput = document.getElementById(`zoom-${index}`);
  if (zoomInput) zoomInput.value = '100';
  repaint();
}

/** Which panel (if any) holds a point of the preview canvas. */
export function panelAtPoint(clientX, clientY) {
  const rect = preview.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * preview.width;
  const y = ((clientY - rect.top) / rect.height) * preview.height;
  const panels = computePanels(studioState.layout, preview.width, preview.height);
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

/** Syncs every control (radios, selects, text) with the current state. */
export function syncControls() {
  document.querySelectorAll('input[name="layout"]').forEach((r) => { r.checked = r.value === studioState.layout; });
  document.querySelectorAll('input[name="grade"]').forEach((r) => { r.checked = r.value === studioState.grade; });
  document.querySelectorAll('input[name="size"]').forEach((r) => { r.checked = r.value === studioState.size; });
  for (let i = 0; i < 4; i++) {
    const sel = document.getElementById(`source-${i}`);
    if (sel) sel.value = studioState.photos[i].source;
  }
  document.getElementById('title').value = studioState.title;
  document.getElementById('tagline').value = studioState.tagline;
}

/** Shuffle: rolls a fresh layout, grade, photo set and caption, then redraws. */
let lastCaptionIndex = 0;
export async function shuffleCover() {
  const roll = seededRandom((Date.now() % 100000) + 13);
  const layouts = ['hero', 'split', 'strip', 'grid'];
  const grades = Object.keys(COLOR_GRADES);
  const samples = ['pier', 'boulevard', 'neon', 'palms'];
  let captionIndex = Math.floor(roll() * SHUFFLE_CAPTIONS.length);
  if (captionIndex === lastCaptionIndex) captionIndex = (captionIndex + 1) % SHUFFLE_CAPTIONS.length;
  lastCaptionIndex = captionIndex;
  const caption = SHUFFLE_CAPTIONS[captionIndex];
  studioState.layout = layouts[Math.floor(roll() * layouts.length)];
  studioState.grade = grades[Math.floor(roll() * grades.length)];
  studioState.title = caption.title;
  studioState.tagline = caption.tagline;
  studioState.seed = 13 + Math.floor(roll() * 90);
  const picks = [0, 1, 2, 3].map(() => samples[Math.floor(roll() * samples.length)]);
  for (let i = 0; i < 4; i++) {
    // eslint-disable-next-line no-await-in-loop
    await assignSlot(i, picks[i]);
  }
  syncControls();
  repaint();
  statusLine.textContent = `Shuffled: ${studioState.layout} · ${COLOR_GRADES[studioState.grade].label} · ${studioState.title}`;
}

// --- controls ---------------------------------------------------------------

for (let i = 0; i < 4; i++) {
  const source = document.getElementById(`source-${i}`);
  const file = document.getElementById(`file-${i}`);
  const zoom = document.getElementById(`zoom-${i}`);
  if (!source || !file || !zoom) continue;
  source.addEventListener('change', () => {
    if (source.value === 'upload') file.click();
    else assignSlot(i, source.value).catch(() => { statusLine.textContent = 'That photo could not be loaded.'; });
  });
  file.addEventListener('change', () => {
    if (file.files[0]) assignSlot(i, 'upload', file.files[0]).catch(() => { statusLine.textContent = 'That photo could not be loaded.'; });
  });
  zoom.addEventListener('input', () => {
    studioState.photos[i].zoom = Number(zoom.value) / 100;
    repaint();
  });
}

document.querySelectorAll('input[name="layout"]').forEach((radio) => {
  radio.addEventListener('change', () => { studioState.layout = radio.value; repaint(); });
});
document.querySelectorAll('input[name="grade"]').forEach((radio) => {
  radio.addEventListener('change', () => { studioState.grade = radio.value; repaint(); });
});
document.querySelectorAll('input[name="size"]').forEach((radio) => {
  radio.addEventListener('change', () => { studioState.size = radio.value; repaint(); });
});
document.getElementById('title').addEventListener('input', (e) => { studioState.title = e.target.value; repaint(); });
document.getElementById('tagline').addEventListener('input', (e) => { studioState.tagline = e.target.value; repaint(); });
document.getElementById('shuffle').addEventListener('click', () => {
  shuffleCover().catch(() => { statusLine.textContent = 'Shuffle failed — try again.'; });
});

// drag on the preview to pan the photo under the pointer
let dragPanel = -1;
let dragLast = null;
preview.addEventListener('pointerdown', (e) => {
  dragPanel = panelAtPoint(e.clientX, e.clientY);
  dragLast = { x: e.clientX, y: e.clientY };
  preview.setPointerCapture(e.pointerId);
});
preview.addEventListener('pointermove', (e) => {
  if (dragPanel < 0 || !dragLast) return;
  const rect = preview.getBoundingClientRect();
  const slot = studioState.photos[dragPanel] || studioState.photos[0];
  if (!slot || !slot.img) return;
  slot.panX += ((e.clientX - dragLast.x) / rect.width) * 1.6;
  slot.panY += ((e.clientY - dragLast.y) / rect.height) * 1.6;
  slot.panX = Math.max(-0.5, Math.min(0.5, slot.panX));
  slot.panY = Math.max(-0.5, Math.min(0.5, slot.panY));
  dragLast = { x: e.clientX, y: e.clientY };
  repaint();
});
preview.addEventListener('pointerup', () => { dragPanel = -1; dragLast = null; });

// --- export -----------------------------------------------------------------

document.getElementById('export').addEventListener('click', () => {
  const size = POST_SIZES[studioState.size];
  const out = document.createElement('canvas');
  out.width = size.w;
  out.height = size.h;
  renderCover(out, studioState);
  out.toBlob((blob) => {
    if (!blob) { statusLine.textContent = 'Export failed in this browser.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sakura-vice-cover-${size.w}x${size.h}.png`;
    a.click();
    statusLine.textContent = `Saved sakura-vice-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
});

// --- shots ------------------------------------------------------------------

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, studioState, repaint, assignSlot);
} else {
  // first run: four sample photos already loaded, so the app shows a cover at once
  Promise.all([assignSlot(0, 'pier'), assignSlot(1, 'boulevard'), assignSlot(2, 'neon'), assignSlot(3, 'palms')])
    .catch(() => { statusLine.textContent = 'Sample photos could not be loaded.'; });
}
