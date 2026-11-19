/* Sakura Vice — screenshot presets.
 * ?shot=<name> drives the app into a fixed, seeded state so the four
 * screenshots are reproducible: seed 17 everywhere, no randomness
 * beyond the seeded shuffle. */
(function (global) {
  'use strict';

  var SEED = 17;

  /* name -> the state the screenshot shows. The first shot by file
   * name is the cover: a landscape grid cover. */
  var SHOT_PRESETS = {
    grid: {
      label: 'Cover, grid layout',
      mode: 'cover',
      layout: 'grid',
      grade: 'cotton',
      title: 'SUNSET HEIST',
      tagline: 'LEONIDA HEAT',
      panels: [
        { source: 'boulevard', dx: 0, dy: 0, zoom: 1.15 },
        { source: 'sunset-boulevard', dx: 0, dy: 0, zoom: 1 },
        { source: 'pier', dx: 0, dy: 0, zoom: 1.15 },
        { source: 'neon-pier', dx: 0, dy: 0, zoom: 1 }
      ]
    },
    editor: {
      label: 'Editor with a photo loaded',
      mode: 'editor',
      layout: 'grid',
      grade: 'cotton',
      title: 'SUNSET HEIST',
      tagline: 'LEONIDA HEAT',
      panels: [
        { source: 'boulevard', dx: 0, dy: 0, zoom: 1.15 },
        { source: 'sunset-boulevard', dx: 0, dy: 0, zoom: 1 },
        { source: 'pier', dx: 0, dy: 0, zoom: 1.15 },
        { source: 'neon-pier', dx: 0, dy: 0, zoom: 1 }
      ]
    },
    split: {
      label: 'Cover, split layout',
      mode: 'cover',
      layout: 'split',
      grade: 'neon',
      title: 'NEON HARBOR',
      tagline: 'MIDNIGHT DRIVE',
      panels: [
        { source: 'pier', dx: 0, dy: 0, zoom: 1.2 },
        { source: 'neon-pier', dx: 0, dy: 0, zoom: 1 },
        { source: 'boulevard', dx: 0, dy: 0, zoom: 1.1 },
        { source: 'sunset-boulevard', dx: 0, dy: 0, zoom: 1 }
      ]
    },
    hero: {
      label: 'Cover, hero layout',
      mode: 'cover',
      layout: 'hero',
      grade: 'sunset',
      title: 'BOULEVARD QUEEN',
      tagline: 'GOLDEN HOUR',
      panels: [
        { source: 'boulevard', dx: 0, dy: -0.06, zoom: 1.25 },
        { source: 'sunset-boulevard', dx: 0, dy: 0, zoom: 1 },
        { source: 'pier', dx: 0, dy: 0, zoom: 1.1 },
        { source: 'neon-pier', dx: 0, dy: 0, zoom: 1 }
      ]
    }
  };

  /* The four screenshots the entry ships, in file order. */
  var SHOT_FILES = [
    { file: '1-cover-grid.jpg', shot: 'grid', width: 1280, height: 720 },
    { file: '2-editor.jpg', shot: 'editor', width: 1280, height: 1024 },
    { file: '3-cover-split.jpg', shot: 'split', width: 1024, height: 1280 },
    { file: '4-cover-hero.jpg', shot: 'hero', width: 1024, height: 1024 }
  ];

  function shotFromUrl() {
    var match = /[?&]shot=([a-z]+)/.exec(window.location.search || '');
    if (match && SHOT_PRESETS[match[1]]) return match[1];
    return null;
  }

  function presetFor(name) {
    var preset = SHOT_PRESETS[name];
    if (!preset) return null;
    /* Deep copy so the app can mutate its own state freely. */
    return JSON.parse(JSON.stringify(preset));
  }

  global.SakuraViceShots = {
    SEED: SEED,
    SHOT_PRESETS: SHOT_PRESETS,
    SHOT_FILES: SHOT_FILES,
    shotFromUrl: shotFromUrl,
    presetFor: presetFor
  };
})(window);
