/* Sakura Vice — photo sources.
 * Four slots, five sources: two kit sample photos, two procedural
 * vector scenes drawn from a seed, and the visitor's own upload.
 * The sample JPGs shipped in app/samples/ were made for make.fun
 * and are free to use. No network is ever touched. */
(function (global) {
  'use strict';

  var SEED = 17;

  /* Deterministic PRNG (mulberry32). Same seed, same skyline. */
  function makeRandom(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* A skyline is a row of towers: x, width, height, lit windows. */
  function buildSkyline(seed, count, baseHeight) {
    var rnd = makeRandom(seed);
    var towers = [];
    var x = 0;
    for (var i = 0; i < count; i++) {
      var w = 0.06 + rnd() * 0.09;
      var h = baseHeight * (0.45 + rnd() * 0.75);
      var windows = [];
      var rows = 3 + Math.floor(rnd() * 6);
      for (var r = 0; r < rows; r++) {
        windows.push(rnd() < 0.55);
      }
      towers.push({ x: x, w: w, h: h, windows: windows });
      x += w + 0.008 + rnd() * 0.02;
    }
    return towers;
  }

  /* Stars scattered across the upper sky, fixed by seed. */
  function buildStars(seed, count) {
    var rnd = makeRandom(seed + 101);
    var stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: rnd(),
        y: rnd() * 0.42,
        r: 0.6 + rnd() * 1.6,
        twinkle: rnd()
      });
    }
    return stars;
  }

  var SCENES = {
    'sunset-boulevard': {
      id: 'sunset-boulevard',
      label: 'Sunset Boulevard (drawn)',
      kind: 'scene',
      sky: ['#2b1055', '#7597de'],
      sun: { x: 0.68, y: 0.42, r: 0.16, core: '#ffd166', halo: '#ff5da2' },
      towers: buildSkyline(SEED, 9, 0.52),
      stars: buildStars(SEED, 46),
      road: true,
      palms: [0.12, 0.3, 0.86]
    },
    'neon-pier': {
      id: 'neon-pier',
      label: 'Neon Pier (drawn)',
      kind: 'scene',
      sky: ['#0b1035', '#123a6b'],
      sun: { x: 0.3, y: 0.34, r: 0.11, core: '#8ef6ff', halo: '#7b5cff' },
      towers: buildSkyline(SEED + 7, 7, 0.44),
      stars: buildStars(SEED + 7, 60),
      road: false,
      palms: [0.2, 0.78]
    }
  };

  var PHOTOS = [
    { id: 'boulevard', label: 'Boulevard photo', kind: 'photo', src: 'samples/boulevard.jpg' },
    { id: 'pier', label: 'Pier photo', kind: 'photo', src: 'samples/pier.jpg' },
    SCENES['sunset-boulevard'],
    SCENES['neon-pier']
  ];

  /* Slot defaults: every panel starts with a different source. */
  var SLOT_DEFAULTS = ['boulevard', 'sunset-boulevard', 'pier', 'neon-pier'];

  function findSource(id) {
    if (id === 'upload') return { id: 'upload', label: 'Your upload', kind: 'upload' };
    for (var i = 0; i < PHOTOS.length; i++) {
      if (PHOTOS[i].id === id) return PHOTOS[i];
    }
    return PHOTOS[0];
  }

  global.SakuraViceSamples = {
    SEED: SEED,
    PHOTOS: PHOTOS,
    SCENES: SCENES,
    SLOT_DEFAULTS: SLOT_DEFAULTS,
    makeRandom: makeRandom,
    findSource: findSource
  };
})(window);
