// The cover renderer: draws the whole poster onto any 2D canvas at any size.
// Photos live on an offscreen layer so the gradient-map grade can be applied
// to them alone; lettering, borders and effects are drawn on top.

import { activeLayout, activeGrade } from "./state.js";
import { buildGradeLookup, applyGradeToImageData, drawHalftoneBand } from "./grades.js";

const TITLE_FILLS = {
  sunset: ["#ffe259", "#ffa751", "#ff2975", "#8c1eff"],
  neon: ["#7df9ff", "#ff71ce", "#ff2975", "#b967ff"],
  white: ["#ffffff", "#ffffff", "#ffe9f3", "#ffd319"],
};

function coverFitRect(img, rect, crop) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * crop.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  // Centre on the crop point, then clamp so the photo always covers the
  // whole panel — a wide crop point must never open a gap at an edge.
  const dx = Math.min(
    rect.x,
    Math.max(rect.x + rect.w - dw, rect.x + rect.w / 2 - dw * crop.cx),
  );
  const dy = Math.min(
    rect.y,
    Math.max(rect.y + rect.h - dh, rect.y + rect.h / 2 - dh * crop.cy),
  );
  return { dx, dy, dw, dh };
}

function drawPanelPhoto(ctx, img, rect, crop, tilt) {
  ctx.save();
  // Rotate the whole panel — clip, backing and photo together — so a tilted
  // snapshot stays full-bleed inside its own tilted frame.
  if (tilt) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
  }
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  // Back the panel so a tilted photo's corners never show the panel beneath.
  ctx.fillStyle = "#241a3d";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const fit = coverFitRect(img, rect, crop);
  ctx.drawImage(img, fit.dx, fit.dy, fit.dw, fit.dh);
  ctx.restore();
}

function drawPanelFrames(ctx, layout, width, height, state, selected) {
  const gutter = Math.max(3, Math.round(width * 0.006));
  ctx.save();
  layout.panels.forEach((panel, index) => {
    const rect = {
      x: panel.x * width,
      y: panel.y * height,
      w: panel.w * width,
      h: panel.h * height,
    };
    if (state.inkBorders) {
      ctx.save();
      if (panel.tilt) {
        ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
        ctx.rotate((panel.tilt * Math.PI) / 180);
        ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
      }
      ctx.lineWidth = gutter;
      ctx.strokeStyle = "#ffffff";
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.lineWidth = Math.max(1.5, width * 0.0016);
      ctx.strokeStyle = "rgba(10, 6, 24, 0.9)";
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
    if (selected === index) {
      ctx.lineWidth = Math.max(3, width * 0.004);
      ctx.strokeStyle = "#ffd319";
      ctx.setLineDash([Math.round(width * 0.012), Math.round(width * 0.008)]);
      ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.setLineDash([]);
    }
  });
  ctx.restore();
}

function drawStar(ctx, cx, cy, radius, filled) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? "#ffd319" : "rgba(255,255,255,0.25)";
  ctx.strokeStyle = "rgba(10,6,24,0.85)";
  ctx.lineWidth = Math.max(1, radius * 0.12);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawTitleBlock(ctx, width, height, state) {
  const margin = width * 0.035;
  const titleSize = Math.round(width * (state.title.length > 12 ? 0.085 : 0.105));
  const subSize = Math.round(width * 0.038);
  const bandH = titleSize * 1.15 + subSize * 1.6;
  const bandY = height - bandH - height * 0.03;

  ctx.save();
  // Soft dark shelf so the lettering reads over any photo.
  const shelf = ctx.createLinearGradient(0, bandY - titleSize * 0.4, 0, height);
  shelf.addColorStop(0, "rgba(8,4,22,0)");
  shelf.addColorStop(0.45, "rgba(8,4,22,0.55)");
  shelf.addColorStop(1, "rgba(8,4,22,0.82)");
  ctx.fillStyle = shelf;
  ctx.fillRect(0, bandY - titleSize * 0.4, width, height - bandY + titleSize * 0.4);

  ctx.translate(margin, bandY + titleSize);
  ctx.rotate((-1.4 * Math.PI) / 180);

  const fillStops = TITLE_FILLS[state.titleStyle] || TITLE_FILLS.sunset;
  const gradient = ctx.createLinearGradient(0, -titleSize, 0, titleSize * 0.25);
  fillStops.forEach((colour, i) => gradient.addColorStop(i / (fillStops.length - 1), colour));
  ctx.font = `${titleSize}px "ViceCondensedBlack", "ViceCondensed", sans-serif`;
  ctx.textBaseline = "alphabetic";
  try {
    ctx.letterSpacing = `${Math.round(titleSize * 0.02)}px`;
  } catch (err) {
    /* older canvas: no letter spacing, the title still draws */
  }
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(8,4,22,0.95)";
  ctx.lineWidth = Math.max(4, titleSize * 0.09);
  ctx.strokeText(state.title.toUpperCase(), 0, 0);
  ctx.fillStyle = gradient;
  ctx.fillText(state.title.toUpperCase(), 0, 0);
  try {
    ctx.letterSpacing = "0px";
  } catch (err) {
    /* ignore */
  }

  // Script subtitle tucked under the title, pink with a white edge.
  ctx.font = `${subSize}px "ViceScript", cursive`;
  ctx.lineWidth = Math.max(2, subSize * 0.14);
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.strokeText(state.subtitle, subSize * 0.25, subSize * 1.25);
  ctx.fillStyle = "#ff71ce";
  ctx.fillText(state.subtitle, subSize * 0.25, subSize * 1.25);
  ctx.restore();
}

function drawBadgeAndHeat(ctx, width, height, state) {
  const pad = width * 0.028;
  ctx.save();
  ctx.font = `${Math.round(width * 0.021)}px "ViceCondensed", sans-serif`;
  const textW = ctx.measureText(state.badge).width;
  const pillW = textW + pad * 1.6;
  const pillH = Math.round(width * 0.042);
  const pillX = width - pillW - pad;
  const pillY = pad;
  ctx.fillStyle = "rgba(8,4,22,0.78)";
  ctx.strokeStyle = "#ffd319";
  ctx.lineWidth = Math.max(2, width * 0.002);
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffd319";
  ctx.textBaseline = "middle";
  ctx.fillText(state.badge, pillX + pad * 0.8, pillY + pillH / 2 + 1);

  // Heat meter: five stars, top left.
  const starR = Math.round(width * 0.016);
  const gap = starR * 2.5;
  ctx.font = `${Math.round(width * 0.018)}px "ViceCondensed", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText("HEAT", pad, pillY + pillH / 2 + 1);
  const labelW = ctx.measureText("HEAT").width;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, pad + labelW + pad * 0.7 + starR + i * gap, pillY + pillH / 2, starR, i < state.heat);
  }
  ctx.restore();
}

export function drawCover(ctx, width, height, state, photos, assets, options = {}) {
  const layout = activeLayout(state);
  const grade = activeGrade(state);

  // Sunset sky behind everything (shows through gutters and tilted gaps).
  const sky = ctx.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, "#1b0b3b");
  sky.addColorStop(0.45, "#7b1e6e");
  sky.addColorStop(0.75, "#ff5e62");
  sky.addColorStop(1, "#ffb347");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Photo layer on its own canvas, graded, then stamped in.
  const layer = document.createElement("canvas");
  layer.width = width;
  layer.height = height;
  const layerCtx = layer.getContext("2d");
  layerCtx.fillStyle = "#1b0b3b";
  layerCtx.fillRect(0, 0, width, height);
  layout.panels.forEach((panel, index) => {
    const slot = state.panels[index] || state.panels[0];
    const img = photos[slot.photo];
    if (!img) return;
    const rect = {
      x: panel.x * width,
      y: panel.y * height,
      w: panel.w * width,
      h: panel.h * height,
    };
    drawPanelPhoto(layerCtx, img, rect, slot, panel.tilt || 0);
  });
  const graded = layerCtx.getImageData(0, 0, width, height);
  applyGradeToImageData(graded, buildGradeLookup(grade));
  layerCtx.putImageData(graded, 0, 0);
  ctx.drawImage(layer, 0, 0);

  // Halftone print texture across the top strip.
  if (state.halftone) {
    drawHalftoneBand(ctx, 0, 0, width, Math.round(height * 0.06));
  }

  drawPanelFrames(ctx, layout, width, height, state, options.showSelection ? state.selectedPanel : -1);
  drawBadgeAndHeat(ctx, width, height, state);
  drawTitleBlock(ctx, width, height, state);

  if (state.grain && assets.grainTile) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    const pattern = ctx.createPattern(assets.grainTile, "repeat");
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
  if (state.vignette) {
    const vig = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.42,
      width / 2, height / 2, Math.max(width, height) * 0.75,
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(5,2,16,0.42)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }
}

// Which panel, if any, sits under a point inside the preview canvas.
export function panelAtPoint(state, width, height, px, py) {
  const layout = activeLayout(state);
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (
      px >= p.x * width && px <= (p.x + p.w) * width &&
      py >= p.y * height && py <= (p.y + p.h) * height
    ) {
      return i;
    }
  }
  return -1;
}
