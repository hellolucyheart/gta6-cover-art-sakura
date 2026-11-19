// Procedural sample photos: two vector scenes drawn on canvas at runtime,
// so the app always has photos to play with even before the user uploads one.
// Both are the app's own art: gradient skies, a sun, a skyline, palms, birds.

import { paintPalm, paintSkyline, paintSun, paintBirds, seededRandom } from './cover.js';

/** "Neon Dusk": a boulevard at blue hour, towers, lit windows, wet street. */
export function paintNeonBoulevard(canvas, seed = 13) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const rnd = seededRandom(seed);
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, '#160b33');
  sky.addColorStop(0.45, '#7b1e6e');
  sky.addColorStop(0.75, '#ff2e88');
  sky.addColorStop(1, '#ff9a3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.62);
  paintSun(ctx, w * 0.68, h * 0.42, h * 0.075, 'rgba(255, 214, 130, 0.95)');
  paintBirds(ctx, w * 0.08, h * 0.10, h * 0.11, seed + 4);
  // far towers
  ctx.fillStyle = '#241040';
  for (let i = 0; i < 9; i++) {
    const bw = w * (0.06 + rnd() * 0.06);
    const bh = h * (0.12 + rnd() * 0.2);
    const bx = (i / 9) * w + rnd() * w * 0.02;
    ctx.fillRect(bx, h * 0.62 - bh, bw, bh);
  }
  paintSkyline(ctx, 0, h * 0.34, w, h * 0.28, seed + 8);
  // street: dark asphalt with a warm reflection
  const street = ctx.createLinearGradient(0, h * 0.62, 0, h);
  street.addColorStop(0, '#1c0f30');
  street.addColorStop(0.25, '#3d1450');
  street.addColorStop(1, '#12081f');
  ctx.fillStyle = street;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  // neon streaks on the wet street
  for (let i = 0; i < 14; i++) {
    const sx = rnd() * w;
    const sw = 3 + rnd() * 10;
    const sh = h * (0.05 + rnd() * 0.16);
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255, 46, 136, 0.5)' : 'rgba(0, 220, 255, 0.45)';
    ctx.fillRect(sx, h * 0.64, sw, sh);
  }
  // palms framing the street
  paintPalm(ctx, w * 0.06, h * 0.98, h * 0.42, -0.07, seed + 15);
  paintPalm(ctx, w * 0.94, h * 0.98, h * 0.36, 0.09, seed + 23);
  return canvas;
}

/** "Palm Sunset": sun over the sea, sand, two palms, gulls. */
export function paintPalmSunset(canvas, seed = 13) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const rnd = seededRandom(seed);
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.58);
  sky.addColorStop(0, '#ff7e5f');
  sky.addColorStop(0.55, '#feb47b');
  sky.addColorStop(1, '#ffd89e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.58);
  paintSun(ctx, w * 0.5, h * 0.52, h * 0.11, 'rgba(255, 236, 180, 1)');
  // sun path on the water
  ctx.fillStyle = 'rgba(255, 220, 150, 0.55)';
  for (let i = 0; i < 12; i++) {
    const sw = w * (0.1 + rnd() * 0.22);
    ctx.fillRect(w / 2 - sw / 2, h * (0.58 + i * 0.012), sw, 2);
  }
  // sea
  const sea = ctx.createLinearGradient(0, h * 0.58, 0, h * 0.8);
  sea.addColorStop(0, '#7b2f8b');
  sea.addColorStop(1, '#2a1a5e');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.58, w, h * 0.22);
  // sand
  const sand = ctx.createLinearGradient(0, h * 0.8, 0, h);
  sand.addColorStop(0, '#e8b07e');
  sand.addColorStop(1, '#c98a56');
  ctx.fillStyle = sand;
  ctx.fillRect(0, h * 0.8, w, h * 0.2);
  paintBirds(ctx, w * 0.12, h * 0.08, h * 0.1, seed + 6);
  paintPalm(ctx, w * 0.08, h * 0.97, h * 0.4, -0.09, seed + 31);
  paintPalm(ctx, w * 0.9, h * 0.97, h * 0.33, 0.08, seed + 47);
  void rnd;
  return canvas;
}

/** Builds a sample scene canvas by key: 'neon' or 'palms'. */
export function buildSampleScene(kind, seed = 13) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  if (kind === 'palms') return paintPalmSunset(canvas, seed);
  return paintNeonBoulevard(canvas, seed);
}
