// Sakura Vice — studio UI wiring.
// Owns the editor state, panel picking, drag-to-pan / wheel zoom, uploads,
// PNG export and the ?shot= screenshot mode.

import { GRADES, LAYOUTS, panelCount, renderCover } from './cover.js';
import { PHOTO_SOURCES, defaultSlots, loadSample } from './samples.js';
import { SHOT_SEED, readShotParams, markShotReady } from './shots.js';

const $ = (sel) => document.querySelector(sel);

const state = {
  layout: 'grid',
  grade: 'cotton',
  title: 'SUNSET HEIST',
  tagline: 'LEONIDA HEAT',
  seed: SHOT_SEED,
  slots: defaultSlots('grid'),
  selected: 0,
  bare: false,
};

const stage = $('#stage');
const stageCtx = stage.getContext('2d');

const EXPORT_SIZES = [
  { id: '1080x1080', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: '1920 × 1080', w: 1920, h: 1080 },
];

function fitCanvas() {
  if (state.bare) {
    // Bare shot mode: the cover fills the frame at the viewport's own
    // aspect, so the screenshot is the cover itself, undistorted.
    stage.width = Math.max(320, window.innerWidth);
    stage.height = Math.max(320, window.innerHeight);
    return;
  }
  // The preview canvas keeps a square internal buffer; CSS scales it.
  stage.width = 1080;
  stage.height = 1080;
}

function render() {
  fitCanvas();
  renderCover(stage, {
    layout: state.layout,
    slots: state.slots,
    title: state.title,
    tagline: state.tagline,
    grade: state.grade,
    seed: state.seed,
  });
  drawSelection();
}

// Same geometry as cover.js panelRects, for pointer hit-testing.
function panelRects(w, h) {
  const gap = Math.max(6, Math.round(Math.min(w, h) * 0.012));
  const titleH = Math.round(h * 0.24);
  const bodyH = h - titleH;
  if (state.layout === 'hero') return [{ x: 0, y: 0, w, h: bodyH }];
  if (state.layout === 'split') {
    const pw = (w - gap) / 2;
    return [
      { x: 0, y: 0, w: pw, h: bodyH },
      { x: pw + gap, y: 0, w: pw, h: bodyH },
    ];
  }
  if (state.layout === 'strip') {
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

function drawSelection() {
  if (state.bare) return;
  const rects = panelRects(stage.width, stage.height);
  const r = rects[state.selected];
  if (!r) return;
  stageCtx.save();
  stageCtx.strokeStyle = '#ff7ad9';
  stageCtx.lineWidth = 5;
  stageCtx.setLineDash([18, 10]);
  stageCtx.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
  stageCtx.restore();
}

function pickPanel(clientX, clientY) {
  const box = stage.getBoundingClientRect();
  const x = ((clientX - box.left) / box.width) * stage.width;
  const y = ((clientY - box.top) / box.height) * stage.height;
  const rects = panelRects(stage.width, stage.height);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

function setLayout(layout) {
  if (!LAYOUTS.includes(layout)) return;
  state.layout = layout;
  state.slots = defaultSlots(layout);
  state.selected = 0;
  hydrateSlots().then(render);
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === layout);
  });
  $('#layoutName').textContent = layout;
}

function setGrade(grade) {
  if (!GRADES[grade]) return;
  state.grade = grade;
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === grade);
  });
  $('#gradeName').textContent = GRADES[grade].label;
  render();
}

async function hydrateSlots() {
  for (const slot of state.slots) {
    if (slot.kind === 'photo' && slot.photoId && !slot.image) {
      try {
        slot.image = await loadSample(slot.photoId);
      } catch {
        slot.image = null;
      }
    }
  }
}

function assignSource(sourceId) {
  const src = PHOTO_SOURCES.find((s) => s.id === sourceId);
  if (!src) return;
  const slot = state.slots[state.selected];
  if (!slot) return;
  if (src.kind === 'photo') {
    slot.kind = 'photo';
    slot.photoId = src.id;
    slot.image = null;
    loadSample(src.id)
      .then((img) => {
        slot.image = img;
        render();
      })
      .catch(() => render());
  } else {
    slot.kind = 'scene';
    slot.scene = src.id;
    slot.image = null;
  }
  slot.zoom = 1;
  slot.panX = 0;
  slot.panY = 0;
  render();
}

function exportPng(size) {
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  renderCover(off, {
    layout: state.layout,
    slots: state.slots,
    title: state.title,
    tagline: state.tagline,
    grade: state.grade,
    seed: state.seed,
  });
  off.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sakura-vice-${state.layout}-${size.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    $('#exportNote').textContent = `Exported ${size.label} PNG — check your downloads.`;
  }, 'image/png');
}

function buildControls() {
  const layoutRow = $('#layoutRow');
  for (const layout of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = layout;
    b.textContent = layout[0].toUpperCase() + layout.slice(1);
    b.classList.toggle('active', layout === state.layout);
    b.addEventListener('click', () => setLayout(layout));
    layoutRow.appendChild(b);
  }
  const gradeRow = $('#gradeRow');
  for (const [id, g] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = id;
    b.textContent = g.label;
    b.classList.toggle('active', id === state.grade);
    b.addEventListener('click', () => setGrade(id));
    gradeRow.appendChild(b);
  }
  const sourceRow = $('#sourceRow');
  for (const src of PHOTO_SOURCES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.source = src.id;
    b.textContent = src.label;
    b.addEventListener('click', () => assignSource(src.id));
    sourceRow.appendChild(b);
  }
  const sizeRow = $('#sizeRow');
  for (const size of EXPORT_SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.size = size.id;
    b.textContent = size.label;
    b.addEventListener('click', () => exportPng(size));
    sizeRow.appendChild(b);
  }
}

function bindPointer() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  stage.addEventListener('pointerdown', (ev) => {
    const idx = pickPanel(ev.clientX, ev.clientY);
    if (idx < 0) return;
    state.selected = idx;
    dragging = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
    stage.setPointerCapture(ev.pointerId);
    render();
  });
  stage.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const box = stage.getBoundingClientRect();
    const slot = state.slots[state.selected];
    if (!slot) return;
    slot.panX += (ev.clientX - lastX) / box.width;
    slot.panY += (ev.clientY - lastY) / box.height;
    lastX = ev.clientX;
    lastY = ev.clientY;
    render();
  });
  const stop = () => {
    dragging = false;
  };
  stage.addEventListener('pointerup', stop);
  stage.addEventListener('pointercancel', stop);
  stage.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const idx = pickPanel(ev.clientX, ev.clientY);
    if (idx < 0) return;
    state.selected = idx;
    const slot = state.slots[idx];
    const next = (slot.zoom || 1) * (ev.deltaY < 0 ? 1.1 : 0.9);
    slot.zoom = Math.min(3, Math.max(0.6, next));
    render();
  }, { passive: false });
}

function bindInputs() {
  $('#titleInput').addEventListener('input', (ev) => {
    state.title = ev.target.value || 'SUNSET HEIST';
    render();
  });
  $('#taglineInput').addEventListener('input', (ev) => {
    state.tagline = ev.target.value || 'LEONIDA HEAT';
    render();
  });
  $('#shuffleBtn').addEventListener('click', () => {
    state.seed = (state.seed + 977) % 100000;
    render();
  });
  $('#resetBtn').addEventListener('click', () => {
    state.seed = SHOT_SEED;
    state.slots = defaultSlots(state.layout);
    state.selected = 0;
    hydrateSlots().then(render);
  });
  $('#uploadInput').addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const slot = state.slots[state.selected];
      if (slot) {
        slot.kind = 'upload';
        slot.image = img;
        slot.zoom = 1;
        slot.panX = 0;
        slot.panY = 0;
      }
      render();
    };
    img.src = url;
    ev.target.value = '';
  });
}

async function boot() {
  buildControls();
  bindPointer();
  bindInputs();
  const { preset, bare } = readShotParams();
  state.bare = bare;
  if (preset) {
    state.layout = preset.layout;
    state.grade = preset.grade;
    state.title = preset.title;
    state.tagline = preset.tagline;
    state.slots = defaultSlots(preset.layout);
    document.querySelectorAll('[data-layout]').forEach((b) => {
      b.classList.toggle('active', b.dataset.layout === preset.layout);
    });
    document.querySelectorAll('[data-grade]').forEach((b) => {
      b.classList.toggle('active', b.dataset.grade === preset.grade);
    });
    $('#titleInput').value = preset.title;
    $('#taglineInput').value = preset.tagline;
    $('#layoutName').textContent = preset.layout;
    $('#gradeName').textContent = GRADES[preset.grade].label;
  }
  if (bare) document.body.classList.add('bare');
  await hydrateSlots();
  render();
  if (preset) markShotReady(preset.label);
}

boot();
