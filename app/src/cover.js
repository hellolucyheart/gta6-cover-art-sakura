// Sakura Vice — cover rendering engine.
// Draws GTA 6-style multi-panel cover art onto a canvas: seeded procedural
// scenes, photo panels with pan/zoom, colour grades and a title block.
// Pure canvas code, no dependencies.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const GRADES = {
  cotton: {
    label: 'Cotton Candy',
    top: '#ff7ad9',
    bottom: '#4fc3ff',
    tint: 'rgba(255, 122, 217, 0.16)',
    scrim: 'rgba(24, 8, 44, 0.72)',
  },
  sunset: {
    label: 'Sunset Heat',
    top: '#ff9a3d',
    bottom: '#7b2ff7',
    tint: 'rgba(255, 140, 60, 0.14)',
    scrim: 'rgba(30, 6, 20, 0.72)',
  },
  neon: {
    label: 'Neon Nights',
    top: '#ff2e88',
    bottom: '#00e5ff',
    tint: 'rgba(0, 229, 255, 0.12)',
    scrim: 'rgba(4, 8, 28, 0.74)',
  },
  noir: {
    label: 'Vice Noir',
    top: '#8a8a8a',
    bottom: '#111111',
    tint: 'rgba(0, 0, 0, 0.22)',
    scrim: 'rgba(0, 0, 0, 0.78)',
  },
};

export const LAYOUTS = ['hero', 'split', 'strip', 'grid'];

export const SCENES = [
  { id: 'vice-boulevard', label: 'Vice Boulevard' },
  { id: 'neon-pier', label: 'Neon Pier' },
];

function skyGradient(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawPalm(ctx, x, y, s, lean, rng) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = '#1d0b26';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -52, 16, -96);
  ctx.stroke();
  ctx.fillStyle = '#1d0b26';
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.13) + (rng() - 0.5) * 0.12;
    ctx.save();
    ctx.translate(16, -96);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(26, -8, 52, 4);
    ctx.quadraticCurveTo(26, 8, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawBoulevard(ctx, w, h, seed) {
  const rng = mulberry32(seed);
  skyGradient(ctx, w, h, [
    [0, '#2b1055'],
    [0.42, '#ff5e8a'],
    [0.68, '#ff9a3d'],
    [1, '#ffd166'],
  ]);
  // Low sun with glow.
  const sx = w * (0.3 + rng() * 0.4);
  const sy = h * 0.52;
  const glow = ctx.createRadialGradient(sx, sy, 4, sx, sy, w * 0.34);
  glow.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
  glow.addColorStop(0.25, 'rgba(255, 190, 90, 0.55)');
  glow.addColorStop(1, 'rgba(255, 120, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(sx, sy, w * 0.075, 0, Math.PI * 2);
  ctx.fill();
  // Distant skyline.
  ctx.fillStyle = '#3a1160';
  let bx = 0;
  while (bx < w) {
    const bw = w * (0.06 + rng() * 0.09);
    const bh = h * (0.12 + rng() * 0.22);
    ctx.fillRect(bx, h * 0.62 - bh, bw, bh);
    bx += bw + w * 0.015;
  }
  // Road.
  ctx.fillStyle = '#221033';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.36, h * 0.62);
  ctx.lineTo(w * 0.64, h * 0.62);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
  ctx.lineWidth = Math.max(2, w * 0.006);
  ctx.setLineDash([w * 0.05, w * 0.04]);
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.62);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  ctx.setLineDash([]);
  // Palms along both verges.
  drawPalm(ctx, w * 0.08, h * 0.98, h / 260, -0.12, rng);
  drawPalm(ctx, w * 0.2, h * 0.9, h / 320, 0.1, rng);
  drawPalm(ctx, w * 0.92, h * 0.98, h / 260, 0.14, rng);
  drawPalm(ctx, w * 0.8, h * 0.88, h / 340, -0.08, rng);
  // Birds.
  ctx.strokeStyle = 'rgba(40, 10, 50, 0.8)';
  ctx.lineWidth = Math.max(2, w * 0.004);
  for (let i = 0; i < 5; i++) {
    const bx2 = w * (0.12 + rng() * 0.7);
    const by2 = h * (0.14 + rng() * 0.2);
    const s2 = w * 0.02;
    ctx.beginPath();
    ctx.moveTo(bx2 - s2, by2);
    ctx.quadraticCurveTo(bx2 - s2 / 2, by2 - s2 / 2, bx2, by2);
    ctx.quadraticCurveTo(bx2 + s2 / 2, by2 - s2 / 2, bx2 + s2, by2);
    ctx.stroke();
  }
}

function drawPier(ctx, w, h, seed) {
  const rng = mulberry32(seed + 101);
  skyGradient(ctx, w, h, [
    [0, '#050914'],
    [0.45, '#12083a'],
    [0.62, '#3d0f63'],
    [1, '#0a1030'],
  ]);
  // Stars.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let i = 0; i < 70; i++) {
    const r = rng();
    ctx.globalAlpha = 0.25 + r * 0.75;
    ctx.fillRect(rng() * w, rng() * h * 0.4, 2, 2);
  }
  ctx.globalAlpha = 1;
  // Moon.
  const mx = w * 0.78;
  const my = h * 0.2;
  const mg = ctx.createRadialGradient(mx, my, 2, mx, my, w * 0.22);
  mg.addColorStop(0, 'rgba(190, 240, 255, 0.9)');
  mg.addColorStop(0.3, 'rgba(140, 200, 255, 0.35)');
  mg.addColorStop(1, 'rgba(140, 200, 255, 0)');
  ctx.fillStyle = mg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#dff4ff';
  ctx.beginPath();
  ctx.arc(mx, my, w * 0.05, 0, Math.PI * 2);
  ctx.fill();
  // Ferris wheel silhouette with neon bulbs.
  const fx = w * 0.24;
  const fy = h * 0.52;
  const fr = h * 0.3;
  ctx.strokeStyle = '#1a0b2e';
  ctx.lineWidth = Math.max(3, w * 0.008);
  ctx.beginPath();
  ctx.arc(fx, fy, fr, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr);
    ctx.stroke();
  }
  const bulbs = ['#ff2e88', '#00e5ff', '#ffd166', '#7bff9e'];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.fillStyle = bulbs[i % bulbs.length];
    ctx.beginPath();
    ctx.arc(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr, Math.max(3, w * 0.008), 0, Math.PI * 2);
    ctx.fill();
  }
  // Sea.
  const sea = ctx.createLinearGradient(0, h * 0.62, 0, h);
  sea.addColorStop(0, '#0d2b52');
  sea.addColorStop(1, '#04101f');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  // Neon reflections.
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = bulbs[Math.floor(rng() * bulbs.length)];
    ctx.globalAlpha = 0.25 + rng() * 0.45;
    const rw = w * (0.02 + rng() * 0.06);
    ctx.fillRect(rng() * w, h * (0.64 + rng() * 0.32), rw, 3 + rng() * 4);
  }
  ctx.globalAlpha = 1;
  // Pier deck.
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, h * 0.58, w, h * 0.06);
  ctx.fillStyle = '#241338';
  for (let x = 0; x < w; x += w * 0.045) {
    ctx.fillRect(x, h * 0.58, 2, h * 0.06);
  }
  // Lamp posts.
  for (const lx of [0.12, 0.42, 0.72, 0.94]) {
    const px = w * lx;
    ctx.strokeStyle = '#0c0618';
    ctx.lineWidth = Math.max(3, w * 0.006);
    ctx.beginPath();
    ctx.moveTo(px, h * 0.58);
    ctx.lineTo(px, h * 0.4);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(px, h * 0.39, Math.max(4, w * 0.01), 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawScene(ctx, sceneId, w, h, seed) {
  if (sceneId === 'neon-pier') drawPier(ctx, w, h, seed);
  else drawBoulevard(ctx, w, h, seed);
}

// Render one source (image or procedural scene) into a panel rect,
// cover-fitting it and applying the slot's pan/zoom.
function drawPanel(ctx, slot, x, y, w, h, seed) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  let source = null;
  if (slot.kind === 'scene') {
    const off = document.createElement('canvas');
    off.width = Math.max(320, Math.round(w));
    off.height = Math.max(320, Math.round(h));
    drawScene(off.getContext('2d'), slot.scene, off.width, off.height, seed + slot.index * 7);
    source = off;
  } else if (slot.image) {
    source = slot.image;
  }
  if (source) {
    const sw = source.width;
    const sh = source.height;
    const base = Math.max(w / sw, h / sh);
    const scale = base * (slot.zoom || 1);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = x + (w - dw) / 2 + (slot.panX || 0) * w;
    const dy = y + (h - dh) / 2 + (slot.panY || 0) * h;
    ctx.drawImage(source, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = '#2a1145';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 ${Math.round(Math.min(w, h) * 0.05)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Drop a photo here', x + w / 2, y + h / 2);
  }
  ctx.restore();
}

function panelRects(layout, w, h) {
  const gap = Math.max(6, Math.round(Math.min(w, h) * 0.012));
  const titleH = Math.round(h * 0.24);
  const bodyH = h - titleH;
  if (layout === 'hero') return [{ x: 0, y: 0, w, h: bodyH }];
  if (layout === 'split') {
    const pw = (w - gap) / 2;
    return [
      { x: 0, y: 0, w: pw, h: bodyH },
      { x: pw + gap, y: 0, w: pw, h: bodyH },
    ];
  }
  if (layout === 'strip') {
    const pw = (w - gap * 2) / 3;
    return [0, 1, 2].map((i) => ({ x: i * (pw + gap), y: 0, w: pw, h: bodyH }));
  }
  const pw = (w - gap) / 2;
  const ph = (bodyH - gap) / 2;
  return [
    { x: 0, y: 0, w: pw, h: ph },
    { x: pw + gap, y: 0, w: pw, h: ph },
    { x: 0, y: ph + gap, w: pw, h: ph },
    { x: pw + gap, y: ph + gap, w: pw, h: ph },
  ];
}

export function panelCount(layout) {
  return layout === 'hero' ? 1 : layout === 'split' ? 2 : layout === 'strip' ? 3 : 4;
}

export function renderCover(canvas, opts) {
  const { layout, slots, title, tagline, grade, seed } = opts;
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  const g = GRADES[grade] || GRADES.cotton;
  const rects = panelRects(layout, w, h);
  const count = panelCount(layout);
  for (let i = 0; i < count; i++) {
    const r = rects[i];
    const slot = slots[i] || { kind: 'scene', scene: SCENES[i % SCENES.length].id, index: i, zoom: 1, panX: 0, panY: 0 };
    drawPanel(ctx, { ...slot, index: i }, r.x, r.y, r.w, r.h, seed);
  }
  // Grade wash over the panels.
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, g.top);
  wash.addColorStop(1, g.bottom);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h - Math.round(h * 0.24));
  ctx.restore();
  ctx.fillStyle = g.tint;
  ctx.fillRect(0, 0, w, h - Math.round(h * 0.24));
  // Title band.
  const titleH = Math.round(h * 0.24);
  const ty = h - titleH;
  const scrim = ctx.createLinearGradient(0, ty - h * 0.06, 0, h);
  scrim.addColorStop(0, 'rgba(10, 4, 24, 0)');
  scrim.addColorStop(0.35, g.scrim);
  scrim.addColorStop(1, g.scrim);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, ty - h * 0.06, w, titleH + h * 0.06);
  // Kicker rule.
  const pad = Math.round(w * 0.05);
  const ruleY = ty + Math.round(titleH * 0.16);
  ctx.fillStyle = g.top;
  ctx.fillRect(pad, ruleY, Math.round(w * 0.12), Math.max(3, Math.round(h * 0.006)));
  // Title.
  const titleSize = Math.min(
    Math.round(w * 0.085),
    Math.round(titleH * 0.34),
  );
  ctx.font = `900 ${titleSize}px "Arial Black", "Archivo Black", system-ui, sans-serif`;
  try {
    ctx.letterSpacing = `${Math.round(titleSize * 0.02)}px`;
  } catch {
    // letterSpacing is optional; ignore when unsupported.
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = Math.max(2, Math.round(titleSize * 0.07));
  ctx.strokeStyle = 'rgba(10, 4, 24, 0.9)';
  ctx.fillStyle = '#ffffff';
  const titleText = (title || 'SUNSET HEIST').toUpperCase();
  const titleY = ruleY + titleSize + Math.round(titleH * 0.08);
  ctx.strokeText(titleText, pad, titleY);
  ctx.fillText(titleText, pad, titleY);
  // Tagline.
  const tagSize = Math.round(titleSize * 0.34);
  ctx.font = `700 ${tagSize}px system-ui, sans-serif`;
  try {
    ctx.letterSpacing = `${Math.round(tagSize * 0.32)}px`;
  } catch {
    // ignore
  }
  ctx.fillStyle = g.bottom === '#4fc3ff' ? '#bfe9ff' : '#ffd9ef';
  const tagText = (tagline || 'LEONIDA HEAT').toUpperCase();
  ctx.fillText(tagText, pad, titleY + Math.round(titleH * 0.24));
  // Vignette.
  const vg = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}
