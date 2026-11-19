// PNG export: re-render the cover at full post size on an offscreen canvas
// and hand the browser a real PNG file to download.

import { activeSize } from "./state.js";
import { drawCover } from "./render.js";

export function exportSizeList(state) {
  return activeSize(state);
}

export function renderExportCanvas(state, photos, assets) {
  const size = activeSize(state);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  drawCover(ctx, size.width, size.height, state, photos, assets, {});
  return canvas;
}

export function exportCoverPng(state, photos, assets) {
  return new Promise((resolve, reject) => {
    const canvas = renderExportCanvas(state, photos, assets);
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("The browser could not encode the cover as a PNG."));
        return;
      }
      const size = activeSize(state);
      const safeTitle = (state.title || "cover")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "cover";
      const name = `vice-city-cover-${safeTitle}-${size.id}.png`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve({ name, bytes: blob.size, width: size.width, height: size.height });
    }, "image/png");
  });
}
