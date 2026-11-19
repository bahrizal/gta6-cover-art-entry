// Vice City Cover Studio — editor wiring: photos, panels, lettering, export.
// The cover itself is drawn by render.js; this file only connects the UI.

import {
  LAYOUTS, GRADES, EXPORT_SIZES, SAMPLE_PHOTOS,
  freshCoverState, activeLayout, activeSize,
} from "./state.js";
import { drawCover, panelAtPoint } from "./render.js";
import { makeGrainTile } from "./grades.js";
import { exportCoverPng } from "./export.js";

const state = freshCoverState();
const photos = [];
const assets = { grainTile: makeGrainTile() };
let previewQueued = false;
let dragging = null;

const $ = (id) => document.getElementById(id);

function queuePreview() {
  if (previewQueued) return;
  previewQueued = true;
  requestAnimationFrame(() => {
    previewQueued = false;
    renderPreview();
  });
}

function previewCanvasSize() {
  const size = activeSize(state);
  const maxW = 980;
  const scale = Math.min(1, maxW / size.width);
  return { w: Math.round(size.width * scale), h: Math.round(size.height * scale) };
}

function renderPreview() {
  const canvas = $("previewCanvas");
  if (!canvas) return;
  const { w, h } = previewCanvasSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  drawCover(ctx, w, h, state, photos, assets, { showSelection: true });
  updatePanelLabel();
}

function updatePanelLabel() {
  const label = $("panelLabel");
  if (!label) return;
  const layout = activeLayout(state);
  label.textContent = `Panel ${state.selectedPanel + 1} of ${layout.panels.length} · ${layout.name}`;
  const zoom = $("zoomRange");
  if (zoom) {
    zoom.value = String(Math.round((state.panels[state.selectedPanel].zoom - 0.6) / 0.014));
  }
}

function loadPhotoImage(src, label) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      photos.push(img);
      addPhotoThumb(photos.length - 1, src, label);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Could not load photo: ${label}`));
    img.src = src;
  });
}

function addPhotoThumb(index, src, label) {
  const tray = $("photoTray");
  if (!tray) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "thumb";
  button.dataset.photo = String(index);
  button.title = `${label} — click to put it in the selected panel`;
  const img = document.createElement("img");
  img.src = src;
  img.alt = label;
  button.appendChild(img);
  button.addEventListener("click", () => {
    state.panels[state.selectedPanel].photo = index;
    queuePreview();
    refreshTraySelection();
  });
  tray.appendChild(button);
  refreshTraySelection();
}

function refreshTraySelection() {
  document.querySelectorAll("#photoTray .thumb").forEach((thumb) => {
    const isCurrent = Number(thumb.dataset.photo) === state.panels[state.selectedPanel].photo;
    thumb.classList.toggle("active", isCurrent);
  });
}

async function loadSamplePhotos() {
  // Sequential on purpose: the tray and the panel slots must always see the
  // samples in the same order (pier first, boulevard second).
  for (const sample of SAMPLE_PHOTOS) {
    await loadPhotoImage(sample.src, sample.label);
  }
}

function addUploadedPhotos(fileList) {
  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      loadPhotoImage(String(reader.result), file.name).then(() => queuePreview());
    };
    reader.readAsDataURL(file);
  });
}

function buildPicker(containerId, items, currentId, onPick) {
  const container = $(containerId);
  if (!container) return;
  container.innerHTML = "";
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = item.name || item.label;
    button.dataset.id = item.id;
    if (item.id === currentId) button.classList.add("active");
    button.addEventListener("click", () => {
      onPick(item.id);
      container.querySelectorAll(".chip").forEach((chip) => {
        chip.classList.toggle("active", chip.dataset.id === item.id);
      });
    });
    container.appendChild(button);
  });
}

function buildLayoutPicker() {
  buildPicker("layoutRow", LAYOUTS, state.layoutId, (id) => {
    state.layoutId = id;
    if (state.selectedPanel >= activeLayout(state).panels.length) state.selectedPanel = 0;
    queuePreview();
  });
}

function buildGradePicker() {
  buildPicker("gradeRow", GRADES, state.gradeId, (id) => {
    state.gradeId = id;
    queuePreview();
  });
}

function buildSizePicker() {
  buildPicker("sizeRow", EXPORT_SIZES, state.sizeId, (id) => {
    state.sizeId = id;
    queuePreview();
  });
}

function buildTitleStylePicker() {
  const styles = [
    { id: "sunset", name: "Sunset gradient" },
    { id: "neon", name: "Neon gradient" },
    { id: "white", name: "Clean white" },
  ];
  buildPicker("titleStyleRow", styles, state.titleStyle, (id) => {
    state.titleStyle = id;
    queuePreview();
  });
}

function buildHeatPicker() {
  const row = $("heatRow");
  if (!row) return;
  row.innerHTML = "";
  for (let stars = 1; stars <= 5; stars++) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip heat-chip";
    button.textContent = "★".repeat(stars);
    button.dataset.stars = String(stars);
    if (stars === state.heat) button.classList.add("active");
    button.addEventListener("click", () => {
      state.heat = stars;
      row.querySelectorAll(".chip").forEach((chip) => {
        chip.classList.toggle("active", Number(chip.dataset.stars) === stars);
      });
      queuePreview();
    });
    row.appendChild(button);
  }
}

function bindCaptionInputs() {
  const title = $("titleInput");
  const subtitle = $("subtitleInput");
  const badge = $("badgeInput");
  if (title) title.addEventListener("input", () => { state.title = title.value; queuePreview(); });
  if (subtitle) subtitle.addEventListener("input", () => { state.subtitle = subtitle.value; queuePreview(); });
  if (badge) badge.addEventListener("input", () => { state.badge = badge.value; queuePreview(); });
}

function bindEffectToggles() {
  const mapping = [
    ["grainToggle", "grain"],
    ["vignetteToggle", "vignette"],
    ["halftoneToggle", "halftone"],
    ["inkToggle", "inkBorders"],
  ];
  mapping.forEach(([id, key]) => {
    const box = $(id);
    if (!box) return;
    box.checked = Boolean(state[key]);
    box.addEventListener("change", () => {
      state[key] = box.checked;
      queuePreview();
    });
  });
}

function bindPanelCanvas() {
  const canvas = $("previewCanvas");
  if (!canvas) return;
  const toCoverPoint = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };
  canvas.addEventListener("pointerdown", (event) => {
    const point = toCoverPoint(event);
    const hit = panelAtPoint(state, canvas.width, canvas.height, point.x, point.y);
    if (hit < 0) return;
    state.selectedPanel = hit;
    dragging = { lastX: point.x, lastY: point.y };
    canvas.setPointerCapture(event.pointerId);
    refreshTraySelection();
    queuePreview();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const point = toCoverPoint(event);
    const layout = activeLayout(state);
    const panel = layout.panels[state.selectedPanel];
    const slot = state.panels[state.selectedPanel];
    const rectW = panel.w * canvas.width;
    const rectH = panel.h * canvas.height;
    slot.cx -= (point.x - dragging.lastX) / rectW;
    slot.cy -= (point.y - dragging.lastY) / rectH;
    slot.cx = Math.min(1.4, Math.max(-0.4, slot.cx));
    slot.cy = Math.min(1.4, Math.max(-0.4, slot.cy));
    dragging.lastX = point.x;
    dragging.lastY = point.y;
    queuePreview();
  });
  const endDrag = () => { dragging = null; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const slot = state.panels[state.selectedPanel];
    slot.zoom = Math.min(3, Math.max(0.6, slot.zoom * (event.deltaY < 0 ? 1.08 : 0.92)));
    queuePreview();
  }, { passive: false });
}

function bindControls() {
  const zoom = $("zoomRange");
  if (zoom) {
    zoom.addEventListener("input", () => {
      state.panels[state.selectedPanel].zoom = 0.6 + (Number(zoom.value) / 100) * 1.4;
      queuePreview();
    });
  }
  const fillAll = $("fillAllBtn");
  if (fillAll) {
    fillAll.addEventListener("click", () => {
      const photo = state.panels[state.selectedPanel].photo;
      state.panels.forEach((slot) => { slot.photo = photo; });
      queuePreview();
    });
  }
  const nextPhoto = $("nextPhotoBtn");
  if (nextPhoto) {
    nextPhoto.addEventListener("click", () => {
      if (!photos.length) return;
      const slot = state.panels[state.selectedPanel];
      slot.photo = (slot.photo + 1) % photos.length;
      refreshTraySelection();
      queuePreview();
    });
  }
  const fileInput = $("fileInput");
  const addBtn = $("addPhotosBtn");
  if (addBtn && fileInput) {
    addBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      addUploadedPhotos(fileInput.files);
      fileInput.value = "";
    });
  }
  const samplesBtn = $("loadSamplesBtn");
  if (samplesBtn) {
    samplesBtn.addEventListener("click", () => {
      loadSamplePhotos().then(() => queuePreview());
    });
  }
  const exportBtn = $("exportBtn");
  const status = $("exportStatus");
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      exportBtn.disabled = true;
      if (status) status.textContent = "Rendering your cover…";
      try {
        const result = await exportCoverPng(state, photos, assets);
        if (status) {
          status.textContent = `Saved ${result.name} — ${result.width} × ${result.height} PNG (${Math.round(result.bytes / 1024)} KB).`;
        }
      } catch (err) {
        if (status) status.textContent = `Export failed: ${err.message}`;
      } finally {
        exportBtn.disabled = false;
      }
    });
  }
  const dropZone = $("dropZone");
  if (dropZone) {
    dropZone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropZone.classList.add("dragging");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));
    dropZone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropZone.classList.remove("dragging");
      addUploadedPhotos(event.dataTransfer.files);
    });
  }
}

async function loadCoverFonts() {
  const loads = [
    document.fonts.load('700 40px "ViceCondensed"'),
    document.fonts.load('900 40px "ViceCondensedBlack"'),
    document.fonts.load('40px "ViceScript"'),
  ];
  await Promise.allSettled(loads);
  await document.fonts.ready;
}

function readShotParams() {
  const params = new URLSearchParams(window.location.search);
  return { shot: params.get("shot") || "", size: params.get("size") || "", title: params.get("title") || "" };
}

async function runShotCover() {
  const { size, title } = readShotParams();
  if (title) state.title = title;
  if (size) {
    const match = EXPORT_SIZES.find((entry) => entry.id === size);
    if (match) state.sizeId = match.id;
  }
  document.body.classList.add("shot-cover");
  await loadSamplePhotos();
  await loadCoverFonts();
  const canvas = $("coverCanvas");
  const dims = activeSize(state);
  canvas.width = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext("2d");
  drawCover(ctx, dims.width, dims.height, state, photos, assets, {});
  window.__shotReady = true;
}

async function runEditor() {
  buildLayoutPicker();
  buildGradePicker();
  buildSizePicker();
  buildTitleStylePicker();
  buildHeatPicker();
  bindCaptionInputs();
  bindEffectToggles();
  bindPanelCanvas();
  bindControls();
  await loadSamplePhotos();
  await loadCoverFonts();
  queuePreview();
  window.__shotReady = true;
}

async function boot() {
  const { shot } = readShotParams();
  if (shot === "cover") {
    await runShotCover();
  } else {
    await runEditor();
  }
}

boot();
