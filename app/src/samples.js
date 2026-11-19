// Sakura Vice — photo sources: the two bundled sample photos plus the
// procedural vector scenes drawn by cover.js. Nothing here is fetched
// from the network; samples live under app/samples/.

import { SCENES } from './cover.js';

export const SAMPLE_PHOTOS = [
  { id: 'boulevard', label: 'Boulevard', file: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'Pier', file: 'samples/pier.jpg' },
];

export const PHOTO_SOURCES = [
  ...SAMPLE_PHOTOS.map((p) => ({ kind: 'photo', id: p.id, label: p.label })),
  ...SCENES.map((s) => ({ kind: 'scene', id: s.id, label: s.label })),
];

const cache = new Map();

// Load a sample photo once and keep it in memory.
export function loadSample(id) {
  if (cache.has(id)) return cache.get(id);
  const entry = SAMPLE_PHOTOS.find((p) => p.id === id);
  const promise = new Promise((resolve, reject) => {
    if (!entry) {
      reject(new Error(`unknown sample ${id}`));
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${entry.file}`));
    img.src = entry.file;
  });
  cache.set(id, promise);
  return promise;
}

// A fresh default slot set for a layout: photos and scenes alternate and
// cycle, so every panel shows something different before the user picks.
export function defaultSlots(layout) {
  const count = layout === 'hero' ? 1 : layout === 'split' ? 2 : layout === 'strip' ? 3 : 4;
  const slots = [];
  for (let i = 0; i < count; i++) {
    if (i % 2 === 0) {
      slots.push({
        kind: 'photo',
        photoId: SAMPLE_PHOTOS[(i / 2) % SAMPLE_PHOTOS.length].id,
        image: null,
        zoom: 1,
        panX: 0,
        panY: 0,
      });
    } else {
      slots.push({
        kind: 'scene',
        scene: SCENES[((i - 1) / 2) % SCENES.length].id,
        zoom: 1,
        panX: 0,
        panY: 0,
      });
    }
  }
  return slots;
}
