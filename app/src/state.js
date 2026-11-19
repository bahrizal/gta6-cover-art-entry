// Vice City Cover Studio — shared editor state, layouts and colour grades.
// Every value here is the app's own design: no Rockstar artwork, logo or font.

export const EXPORT_SIZES = [
  { id: "1080x1080", label: "Square · 1080 × 1080", width: 1080, height: 1080 },
  { id: "1080x1350", label: "Portrait · 1080 × 1350", width: 1080, height: 1350 },
  { id: "1920x1080", label: "Wide · 1920 × 1080", width: 1920, height: 1080 },
];

export const LAYOUTS = [
  {
    id: "hero-grid",
    name: "Hero Grid",
    blurb: "One big hero shot over three panels",
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.56 },
      { x: 0.0, y: 0.58, w: 0.32, h: 0.42 },
      { x: 0.34, y: 0.58, w: 0.32, h: 0.42 },
      { x: 0.68, y: 0.58, w: 0.32, h: 0.42 },
    ],
  },
  {
    id: "nine-panel",
    name: "Nine Panel",
    blurb: "The classic poster grid, three by three",
    panels: [
      { x: 0.0, y: 0.0, w: 0.32, h: 0.32 },
      { x: 0.34, y: 0.0, w: 0.32, h: 0.32 },
      { x: 0.68, y: 0.0, w: 0.32, h: 0.32 },
      { x: 0.0, y: 0.34, w: 0.32, h: 0.32 },
      { x: 0.34, y: 0.34, w: 0.32, h: 0.32 },
      { x: 0.68, y: 0.34, w: 0.32, h: 0.32 },
      { x: 0.0, y: 0.68, w: 0.32, h: 0.32 },
      { x: 0.34, y: 0.68, w: 0.32, h: 0.32 },
      { x: 0.68, y: 0.68, w: 0.32, h: 0.32 },
    ],
  },
  {
    id: "duo-split",
    name: "Duo Split",
    blurb: "Two tall halves side by side",
    panels: [
      { x: 0.0, y: 0.0, w: 0.49, h: 1.0 },
      { x: 0.51, y: 0.0, w: 0.49, h: 1.0 },
    ],
  },
  {
    id: "full-bleed",
    name: "Full Bleed",
    blurb: "One photo edge to edge, strip below",
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.74 },
      { x: 0.0, y: 0.76, w: 0.32, h: 0.24 },
      { x: 0.34, y: 0.76, w: 0.32, h: 0.24 },
      { x: 0.68, y: 0.76, w: 0.32, h: 0.24 },
    ],
  },
  {
    id: "tilted-snaps",
    name: "Tilted Snaps",
    blurb: "Three snapshots tossed on a sunset",
    panels: [
      { x: 0.05, y: 0.08, w: 0.42, h: 0.56, tilt: -4 },
      { x: 0.52, y: 0.05, w: 0.42, h: 0.56, tilt: 3 },
      { x: 0.28, y: 0.5, w: 0.44, h: 0.42, tilt: -1.5 },
    ],
  },
  {
    id: "poster-trio",
    name: "Poster Trio",
    blurb: "Tall feature panel, two stacked beside it",
    panels: [
      { x: 0.0, y: 0.0, w: 0.62, h: 1.0 },
      { x: 0.64, y: 0.0, w: 0.36, h: 0.49 },
      { x: 0.64, y: 0.51, w: 0.36, h: 0.49 },
    ],
  },
];

// A grade is a gradient map: shadows, midtones and highlights each get a colour.
// The renderer blends the map over the photo so faces keep their shape.
export const GRADES = [
  {
    id: "sunset",
    name: "Vice Sunset",
    stops: [
      [0.0, [16, 8, 48]],
      [0.25, [94, 28, 96]],
      [0.5, [214, 72, 110]],
      [0.75, [255, 140, 66]],
      [1.0, [255, 226, 138]],
    ],
  },
  {
    id: "neon",
    name: "Neon Nights",
    stops: [
      [0.0, [6, 6, 32]],
      [0.25, [32, 12, 84]],
      [0.5, [148, 32, 158]],
      [0.75, [255, 64, 140]],
      [1.0, [120, 240, 255]],
    ],
  },
  {
    id: "teal-pink",
    name: "Teal / Pink",
    stops: [
      [0.0, [4, 26, 38]],
      [0.25, [10, 84, 96]],
      [0.5, [210, 90, 130]],
      [0.75, [255, 150, 170]],
      [1.0, [255, 244, 214]],
    ],
  },
  {
    id: "golden",
    name: "Golden Hour",
    stops: [
      [0.0, [24, 14, 8]],
      [0.25, [92, 48, 22]],
      [0.5, [196, 110, 44]],
      [0.75, [255, 184, 92]],
      [1.0, [255, 246, 200]],
    ],
  },
  {
    id: "noir",
    name: "Noir Pop",
    stops: [
      [0.0, [2, 2, 6]],
      [0.25, [28, 28, 44]],
      [0.5, [120, 120, 140]],
      [0.75, [235, 220, 235]],
      [1.0, [255, 250, 240]],
    ],
  },
];

export const SAMPLE_PHOTOS = [
  { id: "pier", src: "samples/pier.jpg", label: "Pier" },
  { id: "boulevard", src: "samples/boulevard.jpg", label: "Boulevard" },
];

export function freshCoverState() {
  return {
    layoutId: "hero-grid",
    gradeId: "sunset",
    sizeId: "1920x1080",
    title: "NEON SHORE",
    subtitle: "a vice city story",
    badge: "VICE CITY · 2026",
    heat: 4,
    grain: true,
    vignette: true,
    halftone: true,
    inkBorders: true,
    titleStyle: "sunset",
    // One slot per panel of the busiest layout (nine). Each slot holds the
    // photo index it shows plus its crop: centre point (0..1) and zoom.
    panels: Array.from({ length: 9 }, (_, i) => ({
      photo: i % 2,
      cx: 0.5,
      cy: 0.32,
      zoom: 1.1,
    })),
    selectedPanel: 0,
  };
}

export function activeLayout(state) {
  return LAYOUTS.find((entry) => entry.id === state.layoutId) || LAYOUTS[0];
}

export function activeGrade(state) {
  return GRADES.find((entry) => entry.id === state.gradeId) || GRADES[0];
}

export function activeSize(state) {
  return EXPORT_SIZES.find((entry) => entry.id === state.sizeId) || EXPORT_SIZES[2];
}
