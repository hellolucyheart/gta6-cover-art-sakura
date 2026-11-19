/* Sakura Vice — editor wiring.
 * Loads the photos, wires every control, renders the live preview,
 * and handles drag-to-pan, scroll-to-zoom, upload and PNG export. */
(function () {
  'use strict';

  var Samples = window.SakuraViceSamples;
  var Cover = window.SakuraViceCover;
  var Shots = window.SakuraViceShots;

  var canvas = document.getElementById('coverCanvas');
  var ctx = canvas.getContext('2d');

  var state = {
    layout: 'grid',
    grade: 'cotton',
    title: 'SUNSET HEIST',
    tagline: 'LEONIDA HEAT',
    panels: Samples.SLOT_DEFAULTS.map(function (source) {
      return { source: source, dx: 0, dy: 0, zoom: 1.1 };
    })
  };

  var selectedPanel = 0;
  var images = {}; /* source id -> loaded image or scene canvas */
  var uploadedImage = null;
  var shuffleStep = 0;

  function loadPhotos() {
    var jobs = Samples.PHOTOS.map(function (photo) {
      if (photo.kind === 'scene') {
        images[photo.id] = Cover.sceneCanvas(photo, 900);
        return Promise.resolve();
      }
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () {
          images[photo.id] = img;
          resolve();
        };
        img.onerror = function () { resolve(); };
        img.src = photo.src;
      });
    });
    return Promise.all(jobs);
  }

  function render() {
    var w = canvas.width;
    var h = canvas.height;
    Cover.renderCover(ctx, state, w, h, images);
  }

  function syncControls() {
    document.querySelectorAll('#layoutRow button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.layout === state.layout);
    });
    document.querySelectorAll('#gradeRow button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.grade === state.grade);
    });
    document.getElementById('titleInput').value = state.title;
    document.getElementById('taglineInput').value = state.tagline;
    document.querySelectorAll('.slot-row').forEach(function (row, i) {
      row.classList.toggle('selected', i === selectedPanel);
      var select = row.querySelector('select');
      if (select) select.value = state.panels[i].source;
    });
  }

  function setStatus(text) {
    var line = document.getElementById('statusLine');
    if (line) line.textContent = text;
  }

  function buildSlotRows() {
    var list = document.getElementById('slotList');
    list.innerHTML = '';
    var names = ['Panel A', 'Panel B', 'Panel C', 'Panel D'];
    state.panels.forEach(function (panel, i) {
      var row = document.createElement('div');
      row.className = 'slot-row';
      var name = document.createElement('span');
      name.className = 'slot-name';
      name.textContent = names[i];
      var select = document.createElement('select');
      select.setAttribute('aria-label', names[i] + ' photo');
      var options = Samples.PHOTOS.map(function (photo) {
        return { value: photo.id, label: photo.label };
      });
      options.push({ value: 'upload', label: 'Your upload' });
      options.forEach(function (opt) {
        var el = document.createElement('option');
        el.value = opt.value;
        el.textContent = opt.label;
        select.appendChild(el);
      });
      select.value = panel.source;
      select.addEventListener('change', function () {
        state.panels[i].source = select.value;
        selectedPanel = i;
        if (select.value === 'upload' && !uploadedImage) {
          setStatus('Pick a file to upload first — using the boulevard photo meanwhile.');
          state.panels[i].source = 'boulevard';
          select.value = 'boulevard';
        }
        render();
        syncControls();
      });
      row.appendChild(name);
      row.appendChild(select);
      row.addEventListener('click', function () {
        selectedPanel = i;
        syncControls();
      });
      list.appendChild(row);
    });
  }

  /* --- pointer: click selects a panel, drag pans it, wheel zooms it --- */

  function panelAt(clientX, clientY) {
    var box = canvas.getBoundingClientRect();
    var px = (clientX - box.left) / box.width;
    var py = (clientY - box.top) / box.height;
    var rects = Cover.panelRects(state.layout);
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return i;
    }
    return 0;
  }

  var drag = null;

  canvas.addEventListener('pointerdown', function (ev) {
    selectedPanel = panelAt(ev.clientX, ev.clientY);
    drag = { x: ev.clientX, y: ev.clientY, moved: false };
    canvas.setPointerCapture(ev.pointerId);
    syncControls();
  });

  canvas.addEventListener('pointermove', function (ev) {
    if (!drag) return;
    var box = canvas.getBoundingClientRect();
    var panel = state.panels[selectedPanel];
    panel.dx += (ev.clientX - drag.x) / box.width;
    panel.dy += (ev.clientY - drag.y) / box.height;
    panel.dx = Math.max(-0.6, Math.min(0.6, panel.dx));
    panel.dy = Math.max(-0.6, Math.min(0.6, panel.dy));
    drag.x = ev.clientX;
    drag.y = ev.clientY;
    drag.moved = true;
    render();
  });

  canvas.addEventListener('pointerup', function () {
    drag = null;
  });

  canvas.addEventListener('wheel', function (ev) {
    ev.preventDefault();
    selectedPanel = panelAt(ev.clientX, ev.clientY);
    var panel = state.panels[selectedPanel];
    var factor = ev.deltaY < 0 ? 1.08 : 1 / 1.08;
    panel.zoom = Math.max(1, Math.min(3, (panel.zoom || 1) * factor));
    render();
    syncControls();
  }, { passive: false });

  /* --- controls ---------------------------------------------------------- */

  document.getElementById('layoutRow').addEventListener('click', function (ev) {
    var layout = ev.target.dataset && ev.target.dataset.layout;
    if (!layout) return;
    state.layout = layout;
    render();
    syncControls();
  });

  document.getElementById('gradeRow').addEventListener('click', function (ev) {
    var grade = ev.target.dataset && ev.target.dataset.grade;
    if (!grade) return;
    state.grade = grade;
    render();
    syncControls();
  });

  document.getElementById('titleInput').addEventListener('input', function (ev) {
    state.title = ev.target.value;
    render();
  });

  document.getElementById('taglineInput').addEventListener('input', function (ev) {
    state.tagline = ev.target.value;
    render();
  });

  document.getElementById('uploadInput').addEventListener('change', function (ev) {
    var file = ev.target.files && ev.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        uploadedImage = img;
        images.upload = img;
        state.panels[selectedPanel].source = 'upload';
        setStatus('Upload loaded into panel ' + 'ABCD'[selectedPanel] + '.');
        render();
        syncControls();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('exportRow').addEventListener('click', function (ev) {
    var size = ev.target.dataset && ev.target.dataset.export;
    if (!size) return;
    var parts = size.split('x');
    var w = parseInt(parts[0], 10);
    var h = parseInt(parts[1], 10);
    var out = Cover.exportCover(state, w, h, images);
    out.toBlob(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sakura-vice-' + size + '.png';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      setStatus('Exported ' + size + ' PNG.');
    }, 'image/png');
  });

  /* Shuffle: seeded, so the same tap order always gives the same cover. */
  document.getElementById('shuffleButton').addEventListener('click', function () {
    shuffleStep += 1;
    var rnd = Samples.makeRandom(Shots.SEED + shuffleStep * 31);
    var layouts = ['hero', 'split', 'strip', 'grid'];
    var grades = Object.keys(Cover.GRADES);
    state.layout = layouts[Math.floor(rnd() * layouts.length)];
    state.grade = grades[Math.floor(rnd() * grades.length)];
    var titles = [
      ['SUNSET HEIST', 'LEONIDA HEAT'],
      ['NEON HARBOR', 'MIDNIGHT DRIVE'],
      ['BOULEVARD QUEEN', 'GOLDEN HOUR']
    ];
    var pick = titles[Math.floor(rnd() * titles.length)];
    state.title = pick[0];
    state.tagline = pick[1];
    state.panels.forEach(function (panel) {
      panel.dx = (rnd() - 0.5) * 0.3;
      panel.dy = (rnd() - 0.5) * 0.3;
      panel.zoom = 1 + rnd() * 0.5;
    });
    setStatus('Shuffled with seed ' + (Shots.SEED + shuffleStep * 31) + '.');
    render();
    syncControls();
  });

  /* --- screenshot mode ---------------------------------------------------- */

  function applyShotMode() {
    var shot = Shots.shotFromUrl();
    if (!shot) return false;
    var preset = Shots.presetFor(shot);
    if (!preset) return false;
    state.layout = preset.layout;
    state.grade = preset.grade;
    state.title = preset.title;
    state.tagline = preset.tagline;
    state.panels = preset.panels;
    if (preset.mode === 'cover') {
      document.body.classList.add('shot-cover');
    }
    return true;
  }

  /* --- boot ---------------------------------------------------------------- */

  function resizePreview() {
    /* In a cover screenshot the canvas takes the viewport's exact
     * size, so the cover fills the frame with no letterbox bars. */
    if (document.body.classList.contains('shot-cover')) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      return;
    }
    /* The preview canvas keeps the cover's own aspect for its layout. */
    var ratio = state.layout === 'split' ? 4 / 5 : 1;
    if (state.layout === 'strip') ratio = 4 / 5;
    canvas.width = 1080;
    canvas.height = Math.round(1080 / ratio);
  }

  function boot() {
    buildSlotRows();
    var inShot = applyShotMode();
    resizePreview();
    loadPhotos().then(function () {
      render();
      syncControls();
      if (inShot) setStatus('Screenshot preset: ' + Shots.shotFromUrl() + '.');
      window.__sakuraViceReady = true;
    });
  }

  boot();
})();
