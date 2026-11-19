/* Sakura Vice — cover renderer.
 * Draws multi-panel GTA-style covers on a canvas: photos or seeded
 * vector scenes, per-panel pan and zoom, colour grades, bold caption. */
(function (global) {
  'use strict';

  var GUTTER = 10; /* white gap between panels, in cover pixels at 1080 wide */

  var GRADES = {
    sunset: {
      label: 'Sunset',
      top: 'rgba(255, 93, 130, 0.34)',
      bottom: 'rgba(255, 138, 92, 0.30)',
      blend: 'overlay'
    },
    neon: {
      label: 'Neon',
      top: 'rgba(123, 92, 255, 0.38)',
      bottom: 'rgba(55, 214, 224, 0.30)',
      blend: 'overlay'
    },
    cotton: {
      label: 'Cotton Candy',
      top: 'rgba(255, 93, 162, 0.30)',
      bottom: 'rgba(88, 140, 255, 0.34)',
      blend: 'soft-light'
    },
    noir: {
      label: 'Noir',
      top: 'rgba(0, 0, 0, 0.22)',
      bottom: 'rgba(255, 255, 255, 0.10)',
      blend: 'overlay'
    }
  };

  /* Panel rectangles for each layout, in fractions of the cover. */
  function panelRects(layout) {
    if (layout === 'hero') {
      return [{ x: 0, y: 0, w: 1, h: 1 }];
    }
    if (layout === 'split') {
      return [
        { x: 0, y: 0, w: 0.5, h: 1 },
        { x: 0.5, y: 0, w: 0.5, h: 1 }
      ];
    }
    if (layout === 'strip') {
      return [
        { x: 0, y: 0, w: 1, h: 1 / 3 },
        { x: 0, y: 1 / 3, w: 1, h: 1 / 3 },
        { x: 0, y: 2 / 3, w: 1, h: 1 / 3 }
      ];
    }
    /* grid: 2 by 2 */
    return [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
    ];
  }

  /* --- procedural vector scenes -------------------------------------- */

  var sceneCache = {};

  function sceneCanvas(scene, size) {
    var key = scene.id + '@' + size;
    if (sceneCache[key]) return sceneCache[key];
    var cv = document.createElement('canvas');
    cv.width = size;
    cv.height = size;
    var ctx = cv.getContext('2d');
    drawScene(ctx, scene, size, size);
    sceneCache[key] = cv;
    return cv;
  }

  function drawScene(ctx, scene, w, h) {
    /* sky */
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, scene.sky[0]);
    sky.addColorStop(1, scene.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    /* stars */
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (var s = 0; s < scene.stars.length; s++) {
      var st = scene.stars[s];
      ctx.globalAlpha = 0.35 + 0.65 * st.twinkle;
      ctx.beginPath();
      ctx.arc(st.x * w, st.y * h, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* sun with halo */
    var sun = scene.sun;
    var halo = ctx.createRadialGradient(
      sun.x * w, sun.y * h, sun.r * w * 0.2,
      sun.x * w, sun.y * h, sun.r * w * 2.1
    );
    halo.addColorStop(0, sun.halo);
    halo.addColorStop(1, 'rgba(255,93,162,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = sun.core;
    ctx.beginPath();
    ctx.arc(sun.x * w, sun.y * h, sun.r * w, 0, Math.PI * 2);
    ctx.fill();
    /* sun slats, poster style */
    ctx.fillStyle = scene.sky[1];
    for (var i = 0; i < 3; i++) {
      var sy = (sun.y + sun.r * (0.1 + i * 0.28)) * h;
      ctx.fillRect((sun.x - sun.r) * w, sy, sun.r * 2 * w, h * 0.012);
    }

    /* towers */
    var horizon = h * 0.62;
    for (var t = 0; t < scene.towers.length; t++) {
      var tw = scene.towers[t];
      var tx = tw.x * w;
      var twd = tw.w * w;
      var th = tw.h * h;
      ctx.fillStyle = '#160a24';
      ctx.fillRect(tx, horizon - th, twd, th);
      ctx.fillStyle = '#ffd166';
      for (var r = 0; r < tw.windows.length; r++) {
        if (!tw.windows[r]) continue;
        ctx.fillRect(tx + twd * 0.18, horizon - th + 8 + r * 14, twd * 0.22, 7);
        ctx.fillRect(tx + twd * 0.6, horizon - th + 8 + r * 14, twd * 0.22, 7);
      }
    }

    if (scene.road) {
      /* road with a pink centre line */
      ctx.fillStyle = '#1c0f26';
      ctx.fillRect(0, horizon, w, h - horizon);
      ctx.strokeStyle = '#ff5da2';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, horizon);
      ctx.lineTo(w * 0.42, h);
      ctx.moveTo(w * 0.5, horizon);
      ctx.lineTo(w * 0.58, h);
      ctx.stroke();
      ctx.fillStyle = '#ffd166';
      for (var d = 0; d < 4; d++) {
        var dy = horizon + (h - horizon) * (0.12 + d * 0.22);
        ctx.fillRect(w * 0.485, dy, w * 0.03, 6 + d * 5);
      }
    } else {
      /* water with neon reflections */
      var sea = ctx.createLinearGradient(0, horizon, 0, h);
      sea.addColorStop(0, '#123a6b');
      sea.addColorStop(1, '#0b1035');
      ctx.fillStyle = sea;
      ctx.fillRect(0, horizon, w, h - horizon);
      ctx.strokeStyle = 'rgba(142,246,255,0.7)';
      ctx.lineWidth = 3;
      for (var k = 0; k < 5; k++) {
        var wy = horizon + 12 + k * 16;
        ctx.beginPath();
        ctx.moveTo(w * (0.15 + k * 0.03), wy);
        ctx.lineTo(w * (0.55 + k * 0.02), wy);
        ctx.stroke();
      }
    }

    /* palms */
    ctx.strokeStyle = '#0e1a12';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    for (var p = 0; p < scene.palms.length; p++) {
      var px = scene.palms[p] * w;
      var py = horizon + 4;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + 14, py - h * 0.12, px + 30, py - h * 0.17);
      ctx.stroke();
      ctx.lineWidth = 4;
      for (var f = 0; f < 5; f++) {
        var ang = -Math.PI * (0.15 + f * 0.16);
        ctx.beginPath();
        ctx.moveTo(px + 30, py - h * 0.17);
        ctx.lineTo(
          px + 30 + Math.cos(ang) * 34,
          py - h * 0.17 + Math.sin(ang) * 26
        );
        ctx.stroke();
      }
      ctx.lineWidth = 7;
    }
  }

  /* --- photo drawing --------------------------------------------------- */

  /* Cover-fit draw of an image into a panel, with pan (dx, dy as
   * fractions of the panel) and zoom. */
  function drawPhotoInto(ctx, img, rect, panel) {
    var iw = img.width;
    var ih = img.height;
    if (!iw || !ih) return;
    var base = Math.max(rect.w / iw, rect.h / ih) * (panel.zoom || 1);
    var dw = iw * base;
    var dh = ih * base;
    var dx = rect.x + (rect.w - dw) / 2 + (panel.dx || 0) * rect.w;
    var dy = rect.y + (rect.h - dh) / 2 + (panel.dy || 0) * rect.h;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function applyGrade(ctx, rect, gradeId) {
    var g = GRADES[gradeId] || GRADES.sunset;
    var grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    grad.addColorStop(0, g.top);
    grad.addColorStop(1, g.bottom);
    ctx.save();
    ctx.globalCompositeOperation = g.blend;
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    /* vignette */
    var vg = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.32,
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.72
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(10,0,10,0.32)');
    ctx.fillStyle = vg;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    if (gradeId === 'noir') {
      ctx.save();
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = 'rgba(128,128,128,1)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
  }

  /* --- caption ---------------------------------------------------------- */

  function drawCaption(ctx, W, H, title, tagline) {
    var pad = W * 0.045;
    var titleSize = Math.min(W * 0.115, 150);
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = W * 0.012;
    ctx.shadowOffsetY = W * 0.006;
    var titleFont = '900 ' + Math.round(titleSize) + 'px "Arial Black", Arial, sans-serif';
    ctx.font = titleFont;
    try { ctx.letterSpacing = '2px'; } catch (e) { /* older canvas */ }
    var titleText = (title || '').toUpperCase();
    var tw = ctx.measureText(titleText).width;
    if (tw > W - pad * 2) {
      var shrink = (W - pad * 2) / tw;
      titleSize = Math.floor(titleSize * shrink);
      ctx.font = '900 ' + titleSize + 'px "Arial Black", Arial, sans-serif';
    }
    var titleY = H - pad - Math.round(titleSize * 0.42);
    ctx.lineWidth = Math.max(4, titleSize * 0.09);
    ctx.strokeStyle = '#14060f';
    ctx.strokeText(titleText, pad, titleY);
    var fill = ctx.createLinearGradient(0, titleY - titleSize, 0, titleY);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(1, '#ffd166');
    ctx.fillStyle = fill;
    ctx.fillText(titleText, pad, titleY);

    var tag = (tagline || '').toUpperCase();
    if (tag) {
      var tagSize = Math.round(Math.min(W * 0.038, 46));
      ctx.font = '700 ' + tagSize + 'px Arial, sans-serif';
      try { ctx.letterSpacing = '6px'; } catch (e) { /* older canvas */ }
      var tagW = ctx.measureText(tag).width + tagSize * 1.2;
      var tagH = tagSize * 1.9;
      /* The pill sits above the title, right aligned, so it never
       * covers the title's last word. */
      var tagY = titleY - titleSize - Math.round(pad * 0.6) - tagH;
      var tagX = W - pad - tagW;
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#ff5da2';
      roundRect(ctx, tagX, tagY, tagW, tagH, tagH / 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(tag, tagX + tagSize * 0.6, tagY + tagH / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    }

    /* studio mark, top left */
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    var markSize = Math.round(Math.min(W * 0.032, 38));
    ctx.font = '800 ' + markSize + 'px Arial, sans-serif';
    try { ctx.letterSpacing = '4px'; } catch (e) { /* older canvas */ }
    ctx.lineWidth = Math.max(3, markSize * 0.14);
    ctx.strokeStyle = '#14060f';
    ctx.strokeText('SAKURA VICE', pad, pad + markSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SAKURA VICE', pad, pad + markSize);
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* --- main render ------------------------------------------------------- */

  /* state: { layout, grade, title, tagline,
   *          panels: [{ source, dx, dy, zoom }] }
   * images: { sourceId: HTMLImageElement | HTMLCanvasElement } */
  function renderCover(ctx, state, W, H, images) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#14060f';
    ctx.fillRect(0, 0, W, H);
    var rects = panelRects(state.layout);
    var gutter = GUTTER * (W / 1080);
    for (var i = 0; i < rects.length; i++) {
      var f = rects[i];
      var rect = {
        x: f.x * W + (f.x > 0 ? gutter / 2 : 0),
        y: f.y * H + (f.y > 0 ? gutter / 2 : 0),
        w: f.w * W - (f.x > 0 ? gutter / 2 : 0) - (f.x + f.w < 1 ? gutter / 2 : 0),
        h: f.h * H - (f.y > 0 ? gutter / 2 : 0) - (f.y + f.h < 1 ? gutter / 2 : 0)
      };
      var panel = state.panels[i] || { source: 'boulevard', dx: 0, dy: 0, zoom: 1 };
      var img = images[panel.source];
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      if (img) {
        drawPhotoInto(ctx, img, rect, panel);
      } else {
        ctx.fillStyle = '#2b1055';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      }
      applyGrade(ctx, rect, state.grade);
      ctx.restore();
    }
    drawCaption(ctx, W, H, state.title, state.tagline);
  }

  /* Render an export-size PNG and trigger a download. */
  function exportCover(state, width, height, images) {
    var cv = document.createElement('canvas');
    cv.width = width;
    cv.height = height;
    var ctx = cv.getContext('2d');
    renderCover(ctx, state, width, height, images);
    return cv;
  }

  global.SakuraViceCover = {
    GRADES: GRADES,
    panelRects: panelRects,
    sceneCanvas: sceneCanvas,
    renderCover: renderCover,
    exportCover: exportCover
  };
})(window);
