// Sakura Vice wiring: photo slots, layout and grade controls, caption editing,
// drag-to-pan cropping, and PNG export in the three post sizes.
// Photos never leave the machine: uploads are read with FileReader only.

import { drawCover, layoutPanels, GRADES } from './cover.js';
import { makeSampleScene } from './samples.js';
import { runShot } from './shots.js';

/** The three post sizes the bounty asks for. */
export const EXPORT_SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

/** One photo slot: an image (or canvas scene) plus its crop. */
function emptySlot() {
  return { img: null, zoom: 1, panX: 0, panY: 0, source: 'none' };
}

export const state = {
  photos: [emptySlot(), emptySlot(), emptySlot(), emptySlot()],
  layout: 'grid',
  grade: 'sunset',
  title: 'SUNSET HEIST',
  tagline: 'LEONIDA HEAT',
  size: 'square',
  seed: 7,
};

const canvas = document.getElementById('cover');
const status = document.getElementById('status');

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** The sample photo behind a slot source key. */
async function sampleFor(source) {
  if (source === 'boulevard') return loadImage('samples/boulevard.jpg');
  if (source === 'pier') return loadImage('samples/pier.jpg');
  if (source === 'neon') return makeSampleScene('neon', state.seed);
  if (source === 'palms') return makeSampleScene('palms', state.seed);
  return null;
}

/** Redraws the preview canvas at the chosen export size. */
export function redraw() {
  const size = EXPORT_SIZES[state.size] || EXPORT_SIZES.square;
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(canvas, state);
  const used = state.photos.filter((p) => p.img).length;
  status.textContent = used === 0
    ? 'Pick a sample photo or upload your own to start.'
    : `${used} photo${used > 1 ? 's' : ''} loaded · ${EXPORT_SIZES[state.size].label} · ${GRADES[state.grade].label}`;
}

/** Sets one slot's source (sample, scene or upload) and redraws. */
export async function setSlotSource(index, source, file) {
  const slot = state.photos[index];
  slot.source = source;
  if (source === 'upload' && file) {
    slot.img = await loadImage(URL.createObjectURL(file));
  } else {
    slot.img = await sampleFor(source);
  }
  slot.zoom = 1;
  slot.panX = 0;
  slot.panY = 0;
  const zoomInput = document.getElementById(`zoom-${index}`);
  if (zoomInput) zoomInput.value = '100';
  redraw();
}

/** Which panel (if any) holds a point of the preview canvas. */
export function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

// --- controls ---------------------------------------------------------------

for (let i = 0; i < 4; i++) {
  const source = document.getElementById(`source-${i}`);
  const file = document.getElementById(`file-${i}`);
  const zoom = document.getElementById(`zoom-${i}`);
  if (!source || !file || !zoom) continue;
  source.addEventListener('change', () => {
    if (source.value === 'upload') file.click();
    else setSlotSource(i, source.value).catch(() => { status.textContent = 'That photo could not be loaded.'; });
  });
  file.addEventListener('change', () => {
    if (file.files[0]) setSlotSource(i, 'upload', file.files[0]).catch(() => { status.textContent = 'That photo could not be loaded.'; });
  });
  zoom.addEventListener('input', () => {
    state.photos[i].zoom = Number(zoom.value) / 100;
    redraw();
  });
}

document.querySelectorAll('input[name="layout"]').forEach((radio) => {
  radio.addEventListener('change', () => { state.layout = radio.value; redraw(); });
});
document.querySelectorAll('input[name="grade"]').forEach((radio) => {
  radio.addEventListener('change', () => { state.grade = radio.value; redraw(); });
});
document.querySelectorAll('input[name="size"]').forEach((radio) => {
  radio.addEventListener('change', () => { state.size = radio.value; redraw(); });
});
document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; redraw(); });

// drag on the preview to pan the photo under the pointer
let dragPanel = -1;
let dragLast = null;
canvas.addEventListener('pointerdown', (e) => {
  dragPanel = panelAt(e.clientX, e.clientY);
  dragLast = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (dragPanel < 0 || !dragLast) return;
  const rect = canvas.getBoundingClientRect();
  const slot = state.photos[dragPanel] || state.photos[0];
  if (!slot || !slot.img) return;
  slot.panX += ((e.clientX - dragLast.x) / rect.width) * 1.6;
  slot.panY += ((e.clientY - dragLast.y) / rect.height) * 1.6;
  slot.panX = Math.max(-0.5, Math.min(0.5, slot.panX));
  slot.panY = Math.max(-0.5, Math.min(0.5, slot.panY));
  dragLast = { x: e.clientX, y: e.clientY };
  redraw();
});
canvas.addEventListener('pointerup', () => { dragPanel = -1; dragLast = null; });

// --- export -----------------------------------------------------------------

document.getElementById('export').addEventListener('click', () => {
  const size = EXPORT_SIZES[state.size];
  const out = document.createElement('canvas');
  out.width = size.w;
  out.height = size.h;
  drawCover(out, state);
  out.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed in this browser.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sakura-vice-cover-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved sakura-vice-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
});

// --- shots ------------------------------------------------------------------

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, state, redraw, setSlotSource);
} else {
  // first run: two sample photos already loaded, so the app shows a cover at once
  Promise.all([setSlotSource(0, 'pier'), setSlotSource(1, 'boulevard'), setSlotSource(2, 'neon'), setSlotSource(3, 'palms')])
    .catch(() => { status.textContent = 'Sample photos could not be loaded.'; });
}
