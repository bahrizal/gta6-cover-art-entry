// Gradient-map colour grades: build a 256-step lookup from a grade's stops,
// then recolour a photo layer by its luminance so the grade feels like a
// sunset or neon print rather than a flat tint.

function mixChannel(a, b, t) {
  return Math.round(a + (b - a) * t);
}

export function buildGradeLookup(grade) {
  const table = new Uint8Array(256 * 3);
  const stops = grade.stops;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let lower = stops[0];
    let upper = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) {
        lower = stops[s];
        upper = stops[s + 1];
        break;
      }
    }
    const span = upper[0] - lower[0] || 1;
    const k = Math.min(1, Math.max(0, (t - lower[0]) / span));
    table[i * 3] = mixChannel(lower[1][0], upper[1][0], k);
    table[i * 3 + 1] = mixChannel(lower[1][1], upper[1][1], k);
    table[i * 3 + 2] = mixChannel(lower[1][2], upper[1][2], k);
  }
  return table;
}

// Blend the gradient map over the pixels: 82% map, 18% original keeps skin
// and detail readable while the grade dominates the mood.
export function applyGradeToImageData(imageData, lookup) {
  const data = imageData.data;
  for (let p = 0; p < data.length; p += 4) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    const base = lum * 3;
    data[p] = Math.round(r * 0.18 + lookup[base] * 0.82);
    data[p + 1] = Math.round(g * 0.18 + lookup[base + 1] * 0.82);
    data[p + 2] = Math.round(b * 0.18 + lookup[base + 2] * 0.82);
  }
  return imageData;
}

// A tiny deterministic noise tile for the film-grain overlay.
export function makeGrainTile(size = 140) {
  const tile = document.createElement("canvas");
  tile.width = size;
  tile.height = size;
  const ctx = tile.getContext("2d");
  const image = ctx.createImageData(size, size);
  let seed = 20261120;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let p = 0; p < image.data.length; p += 4) {
    const value = Math.floor(random() * 255);
    image.data[p] = value;
    image.data[p + 1] = value;
    image.data[p + 2] = value;
    image.data[p + 3] = 26;
  }
  ctx.putImageData(image, 0, 0);
  return tile;
}

// Halftone dots along a band: classic print-poster texture.
export function drawHalftoneBand(ctx, x, y, w, h, colour = "rgba(0,0,0,0.22)") {
  const step = Math.max(9, Math.round(w / 90));
  ctx.save();
  ctx.fillStyle = colour;
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const radius = (1.1 + 1.9 * (col / Math.max(1, Math.floor(w / step)))) * (step / 9);
      ctx.beginPath();
      ctx.arc(x + col * step + step / 2, y + row * step + step / 2, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
