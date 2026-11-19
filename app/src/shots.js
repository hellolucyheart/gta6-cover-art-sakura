// Sakura Vice — screenshot shot mode.
// ?shot=<name> puts the studio into a fixed, seeded state for screenshots
// and ?bare=1 hides the editor chrome so a cover fills the frame.
// The page sets window.__shotReady = true once the shot has rendered.

export const SHOT_SEED = 17;

export const SHOTS = {
  grid: {
    label: 'Cover grid',
    layout: 'grid',
    grade: 'cotton',
    title: 'SUNSET HEIST',
    tagline: 'LEONIDA HEAT',
    bare: true,
  },
  editor: {
    label: 'Editor with photo',
    layout: 'split',
    grade: 'sunset',
    title: 'NEON HARBOR',
    tagline: 'MIDNIGHT DRIVE',
    bare: false,
  },
  split: {
    label: 'Cover split',
    layout: 'split',
    grade: 'neon',
    title: 'NEON HARBOR',
    tagline: 'MIDNIGHT DRIVE',
    bare: true,
  },
  hero: {
    label: 'Cover hero',
    layout: 'hero',
    grade: 'cotton',
    title: 'BOULEVARD QUEEN',
    tagline: 'GOLDEN HOUR',
    bare: true,
  },
};

export function readShotParams() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('shot') || '';
  const preset = SHOTS[name] || null;
  const bare = params.get('bare') === '1' || (preset ? preset.bare : false);
  return { name, preset, bare };
}

export function markShotReady(label) {
  window.__shotReady = true;
  document.documentElement.dataset.shot = label;
  document.title = `Sakura Vice — ${label}`;
}
