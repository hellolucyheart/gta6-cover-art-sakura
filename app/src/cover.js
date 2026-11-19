// Sakura Vice cover renderer (round 2): paints a GTA 6-style multi-panel
// poster cover from photos, a caption and a colour grade onto any canvas.
// Pure canvas 2D, no network, no fonts beyond the system stack, and fully
// deterministic for a fixed seed — the same state always paints the same cover.

/** Deterministic PRNG (mulberry32) so screenshots and exports never wobble. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Colour grades: a top and bottom wash drawn in overlay mode, plus a glow tint. */
export const COLOR_GRADES = {
  sunset: { label: 'Vice Sunset', top: 'rgba(255, 94, 120, 0.55)', bottom: 'rgba(255, 170, 60, 0.55)', glow: 'rgba(255, 120, 80, 0.25)' },
  neon: { label: 'Neon Nights', top: 'rgba(255, 0, 160, 0.55)', bottom: 'rgba(0, 220, 255, 0.55)', glow: 'rgba(190, 0, 255, 0.25)' },
  gold: { label: 'Golden Hour', top: 'rgba(255, 190, 60, 0.5)', bottom: 'rgba(255, 110, 30, 0.5)', glow: 'rgba(255, 200, 90, 0.22)' },
  noir: { label: 'Teal Noir', top: 'rgba(0, 90, 110, 0.5)', bottom: 'rgba(10, 10, 30, 0.55)', glow: 'rgba(0, 200, 220, 0.18)' },
  pastel: { label: 'Miami Pastel', top: 'rgba(255, 170, 210, 0.5)', bottom: 'rgba(140, 220, 255, 0.5)', glow: 'rgba(255, 220, 240, 0.22)' },
  cotton: { label: 'Cotton Candy', top: 'rgba(255, 120, 200, 0.55)', bottom: 'rgba(90, 180, 255, 0.55)', glow: 'rgba(255, 170, 230, 0.25)' },
};

/** Layouts: each returns the panel rects (and diagonal seams) for a W x H cover. */
export function computePanels(layout, w, h) {
  const gutter = Math.max(4, Math.round(Math.min(w, h) * 0.008)); // white gutter
  if (layout === 'split') {
    return [
      { x: 0, y: 0, w: w * 0.56, h, seam: [[w * 0.56, 0], [w * 0.44, h]] },
      { x: w * 0.44, y: 0, w: w * 0.56, h, seam: [[w * 0.56, 0], [w * 0.44, h]] },
    ];
  }
  if (layout === 'strip') {
    return [
      { x: 0, y: 0, w, h: h * 0.40, seam: [[0, h * 0.40], [w, h * 0.34]] },
      { x: 0, y: h * 0.34, w, h: h * 0.32, seam: [[0, h * 0.40], [w, h * 0.34], [0, h * 0.66], [w, h * 0.60]] },
      { x: 0, y: h * 0.60, w, h: h * 0.40, seam: [[0, h * 0.66], [w, h * 0.60]] },
    ];
  }
  if (layout === 'grid') {
    const cellW = (w - gutter * 3) / 2;
    const cellH = (h - gutter * 3) / 2;
    return [
      { x: gutter, y: gutter, w: cellW, h: cellH },
      { x: gutter * 2 + cellW, y: gutter, w: cellW, h: cellH },
      { x: gutter, y: gutter * 2 + cellH, w: cellW, h: cellH },
      { x: gutter * 2 + cellW, y: gutter * 2 + cellH, w: cellW, h: cellH },
    ];
  }
  return [{ x: 0, y: 0, w, h }]; // hero
}

/** Draws one photo cover-fit into a rect, with zoom and pan (fractions of overflow). */
export function paintPhotoInto(ctx, img, rect, zoom = 1, panX = 0, panY = 0) {
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const drawW = iw * scale;
  const drawH = ih * scale;
  const dx = rect.x + (rect.w - drawW) / 2 + panX * Math.max(0, drawW - rect.w);
  const dy = rect.y + (rect.h - drawH) / 2 + panY * Math.max(0, drawH - rect.h);
  ctx.drawImage(img, dx, dy, drawW, drawH);
}

/** Clips to a polygon (array of [x, y]) and runs draw inside it. */
export function clipToPolygon(ctx, points, draw) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.clip();
  draw();
  ctx.restore();
}

/** A palm silhouette: curved trunk plus seven drooping fronds, all vector. */
export function paintPalm(ctx, x, y, size, lean, seed) {
  const rnd = seededRandom(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(size, size);
  ctx.fillStyle = '#12081f';
  ctx.strokeStyle = '#12081f';
  // trunk
  ctx.beginPath();
  ctx.moveTo(-0.03, 0);
  ctx.quadraticCurveTo(0.02, -0.5, 0.08, -0.95);
  ctx.lineTo(0.13, -0.95);
  ctx.quadraticCurveTo(0.08, -0.5, 0.05, 0);
  ctx.closePath();
  ctx.fill();
  // fronds
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI * (0.08 + (i / 6) * 0.84) + (rnd() - 0.5) * 0.12;
    const len = 0.55 + rnd() * 0.3;
    const tipX = 0.1 + Math.cos(angle) * len;
    const tipY = -0.95 + Math.sin(angle) * len * 0.7;
    ctx.beginPath();
    ctx.moveTo(0.1, -0.95);
    ctx.quadraticCurveTo(0.1 + Math.cos(angle) * len * 0.5, -0.95 + Math.sin(angle) * len * 0.5 - 0.18, tipX, tipY);
    ctx.quadraticCurveTo(0.1 + Math.cos(angle) * len * 0.55, -0.95 + Math.sin(angle) * len * 0.55 - 0.05, 0.1, -0.95);
    ctx.closePath();
    ctx.fill();
  }
  // coconuts
  ctx.beginPath(); ctx.arc(0.06, -0.9, 0.045, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0.14, -0.88, 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/** A low city skyline silhouette with a few lit windows. */
export function paintSkyline(ctx, x, y, w, h, seed) {
  const rnd = seededRandom(seed);
  ctx.save();
  ctx.fillStyle = '#12081f';
  let cursorX = x;
  while (cursorX < x + w) {
    const bw = w * (0.05 + rnd() * 0.09);
    const bh = h * (0.35 + rnd() * 0.65);
    ctx.fillRect(cursorX, y + h - bh, bw, bh);
    // antenna on some towers
    if (rnd() > 0.7) ctx.fillRect(cursorX + bw / 2 - 1, y + h - bh - h * 0.22, 2, h * 0.22);
    // lit windows
    ctx.fillStyle = 'rgba(255, 214, 130, 0.85)';
    const rows = Math.floor(bh / (h * 0.09));
    const cols = Math.floor(bw / (w * 0.02));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rnd() > 0.72) ctx.fillRect(cursorX + 3 + c * w * 0.02, y + h - bh + 4 + r * h * 0.09, 2.5, 3.5);
      }
    }
    ctx.fillStyle = '#12081f';
    cursorX += bw + w * 0.012;
  }
  ctx.restore();
}

/** A glowing sun disc with a soft halo. */
export function paintSun(ctx, x, y, r, color) {
  ctx.save();
  const halo = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.6);
  halo.addColorStop(0, color);
  halo.addColorStop(1, 'rgba(255, 120, 80, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/** Three tiny birds, the classic "v" strokes. */
export function paintBirds(ctx, x, y, scale, seed) {
  const rnd = seededRandom(seed);
  ctx.save();
  ctx.strokeStyle = 'rgba(18, 8, 31, 0.8)';
  ctx.lineWidth = Math.max(1.5, scale * 0.02);
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const bx = x + rnd() * scale * 2.2;
    const by = y + rnd() * scale * 0.7;
    const s = scale * (0.12 + rnd() * 0.1);
    ctx.beginPath();
    ctx.moveTo(bx - s, by);
    ctx.quadraticCurveTo(bx - s * 0.4, by - s * 0.7, bx, by);
    ctx.quadraticCurveTo(bx + s * 0.4, by - s * 0.7, bx + s, by);
    ctx.stroke();
  }
  ctx.restore();
}

/** The grade wash: overlay gradient + bottom vignette + glow, over rect x,y,w,h. */
export function applyColorGrade(ctx, x, y, w, h, gradeKey) {
  const grade = COLOR_GRADES[gradeKey] || COLOR_GRADES.sunset;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const wash = ctx.createLinearGradient(0, y, 0, y + h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  const vignette = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(10, 4, 24, 0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = grade.glow;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Film grain: seeded dots, subtle, deterministic. */
export function sprinkleGrain(ctx, w, h, seed) {
  const rnd = seededRandom(seed);
  ctx.save();
  const count = Math.floor((w * h) / 900);
  for (let i = 0; i < count; i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},0.05)`;
    ctx.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
  }
  ctx.restore();
}

/** Bold poster lettering: condensed caps, black outline, white fill, pink echo. */
export function paintTitleBlock(ctx, w, h, title, tagline) {
  const text = (title || '').trim().toUpperCase();
  const tag = (tagline || '').trim().toUpperCase();
  if (!text && !tag) return;
  const bandH = h * 0.26;
  const bandY = h - bandH;
  // dark legibility band
  const band = ctx.createLinearGradient(0, bandY - h * 0.06, 0, h);
  band.addColorStop(0, 'rgba(10, 4, 24, 0)');
  band.addColorStop(0.35, 'rgba(10, 4, 24, 0.55)');
  band.addColorStop(1, 'rgba(10, 4, 24, 0.82)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY - h * 0.06, w, bandH + h * 0.06);
  // pink rule above the title
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(w * 0.06, bandY + h * 0.015, w * 0.14, Math.max(3, h * 0.006));

  if (tag) {
    ctx.save();
    ctx.font = `700 ${Math.round(h * 0.028)}px "Arial Black", Impact, sans-serif`;
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const tracking = h * 0.012;
    // letter-spaced tagline, drawn letter by letter
    let tx = w * 0.06;
    const ty = bandY + h * 0.075;
    for (const ch of tag) {
      ctx.fillText(ch, tx, ty);
      tx += ctx.measureText(ch).width + tracking;
      if (tx > w * 0.94) break;
    }
    ctx.restore();
  }
  if (!text) return;
  let size = h * 0.115;
  const measure = (s) => {
    ctx.font = `900 ${s}px "Arial Black", Impact, sans-serif`;
    return ctx.measureText(text).width * 0.84; // condensed scaleX below
  };
  while (measure(size) > w * 0.92 && size > 10) size -= 2;
  ctx.save();
  ctx.translate(w / 2, h - h * 0.055);
  ctx.scale(0.84, 1);
  ctx.font = `900 ${size}px "Arial Black", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  // pink echo, then black outline, then white fill
  ctx.fillStyle = '#ff2e88';
  ctx.fillText(text, size * 0.045, size * 0.045);
  ctx.strokeStyle = '#0d0518';
  ctx.lineWidth = size * 0.11;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** The slanted quad for one strip band (index 0..2) on a W x H cover. */
export function stripQuad(index, w, h) {
  if (index === 0) return [[0, 0], [w, 0], [w, h * 0.34], [0, h * 0.40]];
  if (index === 1) return [[0, h * 0.40], [w, h * 0.34], [w, h * 0.60], [0, h * 0.66]];
  return [[0, h * 0.66], [w, h * 0.60], [w, h], [0, h]];
}

/**
 * Draws the whole cover. state:
 * { photos: [{img, zoom, panX, panY}...], layout, grade, title, tagline, seed,
 *   decorations: true }
 */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const seed = state.seed ?? 13;
  ctx.fillStyle = '#f5f0f6';
  ctx.fillRect(0, 0, w, h);

  const panels = computePanels(state.layout || 'hero', w, h);
  const photos = state.photos || [];
  panels.forEach((panel, i) => {
    const photo = photos[i] || photos[0] || null;
    const paintPanel = () => {
      if (photo && photo.img) {
        paintPhotoInto(ctx, photo.img, panel, photo.zoom ?? 1, photo.panX ?? 0, photo.panY ?? 0);
      } else {
        // empty panel: dusk gradient placeholder so the layout still reads
        const placeholder = ctx.createLinearGradient(panel.x, panel.y, panel.x, panel.y + panel.h);
        placeholder.addColorStop(0, '#3b1155');
        placeholder.addColorStop(1, '#ff7a59');
        ctx.fillStyle = placeholder;
        ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
      }
      applyColorGrade(ctx, panel.x, panel.y, panel.w, panel.h, state.grade || 'sunset');
    };
    if (panel.seam && state.layout === 'split') {
      // diagonal panels: clip to the polygon the seam implies
      const points = i === 0
        ? [[panel.x, panel.y], [panel.seam[0][0], panel.seam[0][1]], [panel.seam[1][0], panel.seam[1][1]], [panel.x, panel.y + panel.h]]
        : [[panel.seam[0][0], panel.seam[0][1]], [panel.x + panel.w, panel.y], [panel.x + panel.w, panel.y + panel.h], [panel.seam[1][0], panel.seam[1][1]]];
      clipToPolygon(ctx, points, paintPanel);
    } else if (panel.seam && state.layout === 'strip') {
      clipToPolygon(ctx, stripQuad(i, w, h), paintPanel);
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.rect(panel.x, panel.y, panel.w, panel.h);
      ctx.clip();
      paintPanel();
      ctx.restore();
    }
  });

  // white seams on the diagonal layouts
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.007);
  if (state.layout === 'split') {
    ctx.beginPath();
    ctx.moveTo(w * 0.56, 0);
    ctx.lineTo(w * 0.44, h);
    ctx.stroke();
  } else if (state.layout === 'strip') {
    ctx.beginPath(); ctx.moveTo(0, h * 0.40); ctx.lineTo(w, h * 0.34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h * 0.66); ctx.lineTo(w, h * 0.60); ctx.stroke();
  }
  ctx.restore();

  // decorations: sun, palms, skyline and birds, kept subtle under the title
  if (state.decorations !== false) {
    if (state.layout === 'hero' || state.layout === 'split') {
      paintSun(ctx, w * 0.82, h * 0.16, Math.min(w, h) * 0.055, 'rgba(255, 214, 130, 0.95)');
      paintBirds(ctx, w * 0.1, h * 0.1, Math.min(w, h) * 0.09, seed + 5);
      paintPalm(ctx, w * 0.03, h * 0.99, h * 0.34, -0.08, seed + 21);
      paintPalm(ctx, w * 0.97, h * 0.99, h * 0.28, 0.10, seed + 33);
    } else if (state.layout === 'strip') {
      paintSun(ctx, w * 0.85, h * 0.10, Math.min(w, h) * 0.05, 'rgba(255, 214, 130, 0.95)');
      paintSkyline(ctx, w * 0.04, h * 0.30, w * 0.92, h * 0.10, seed + 3);
      paintPalm(ctx, w * 0.02, h * 0.99, h * 0.30, -0.08, seed + 21);
    } else {
      // grid: no sun disc here — it would land on a photo's face. Palms only.
      paintBirds(ctx, w * 0.06, h * 0.06, Math.min(w, h) * 0.07, seed + 5);
      paintPalm(ctx, w * 0.02, h * 0.99, h * 0.26, -0.08, seed + 21);
    }
  }

  sprinkleGrain(ctx, w, h, seed + 99);
  paintTitleBlock(ctx, w, h, state.title, state.tagline);

  // poster frame: white border + thin inner keyline
  const frameW = Math.max(4, Math.round(Math.min(w, h) * 0.012));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = frameW;
  ctx.strokeRect(frameW / 2, frameW / 2, w - frameW, h - frameW);
  ctx.strokeStyle = 'rgba(13, 5, 24, 0.55)';
  ctx.lineWidth = Math.max(1, frameW * 0.18);
  ctx.strokeRect(frameW + 2, frameW + 2, w - frameW * 2 - 4, h - frameW * 2 - 4);
}
