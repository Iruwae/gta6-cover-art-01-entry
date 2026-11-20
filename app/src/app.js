// Sunset Circuit Cover Studio — studio wiring.
// State lives here; drawing lives in poster.js. The preview canvas and
// the exported PNGs call the same renderPoster, so the preview is honest.
import { GRADES, GRADE_ORDER, SLOT_ROLES, DEFAULT_FACES, BARCODE_NUMBER, renderPoster, layoutGeometry } from './poster.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');

export const EXPORT_SIZES = {
  '1:1': { w: 1080, h: 1080 },
  '4:5': { w: 1080, h: 1350 },
  '16:9': { w: 1920, h: 1080 },
};
const PREVIEW_SIZES = {
  '1:1': { w: 720, h: 720 },
  '4:5': { w: 720, h: 900 },
  '16:9': { w: 960, h: 540 },
};

function freshSlot(i) {
  return {
    photo: i, zoom: 1, panX: 0, panY: 0, flip: false, faceLock: true,
    face: { ...DEFAULT_FACES[i] },
  };
}

const state = {
  layout: 'mosaic',
  grade: 'sunset',
  aspect: '16:9',
  selected: 0,
  showFaces: true,
  photos: Array(8).fill(null), // HTMLImageElement per cast slot, or null
  slots: SLOT_ROLES.map((_, i) => freshSlot(i)),
  texts: {
    title: 'Sundown Circuit',
    font: 'Anton',
    script: 'Chasing the last light',
    scriptFont: 'Yellowtail',
    tagline: 'Every crew needs a sunset',
    quote: 'Every light has a price',
    source: 'The Vice Beacon',
    billing: 'A Sunset Circuit Pictures production in association with Palm & Neon · A V. Marlowe film · Sundown Circuit · Music by The Night Shift Orchestra · Edited by J. Morrow · Written by M. Delacroix & T. Okafor · Directed by V. Marlowe',
    seal: 'Best Ensemble',
    sealRing: 'Vice City Film Festival',
    release: '— Coming Soon —',
    edition: 'Vol. 1',
  },
};

let lastGeo = null;
let renderQueued = false;
const undoStack = [];
const redoStack = [];

function snapshot() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, aspect: state.aspect,
    selected: state.selected, showFaces: state.showFaces,
    slots: state.slots, texts: state.texts,
    photoSrcs: state.photos.map((p) => (p ? p.dataset.src : null)),
  });
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 50) undoStack.shift();
  redoStack.length = 0;
}
function restore(snap) {
  const s = JSON.parse(snap);
  state.layout = s.layout;
  state.grade = s.grade;
  state.aspect = s.aspect;
  state.selected = s.selected;
  state.showFaces = s.showFaces;
  state.slots = s.slots;
  state.texts = s.texts;
  syncCaptionFields();
  syncPickers();
  setAspect(state.aspect, false);
  renderAll();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { img.dataset.src = src; resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSamples() {
  const jobs = [];
  for (let i = 0; i < 8; i++) {
    const src = `./samples/cast-${i + 1}.jpg`;
    jobs.push(loadImage(src).then((img) => { state.photos[i] = img; }).catch(() => {}));
  }
  await Promise.all(jobs);
  state.slots.forEach((slot, i) => { slot.photo = state.photos[i] ? i : -1; });
  buildThumbs();
  renderAll();
  setStatus('Demo cast loaded — 8 photos, face boxes on. Pick a panel and drag to pan.');
}

function buildThumbs() {
  const box = $('thumbs');
  box.innerHTML = '';
  state.photos.forEach((img, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb' + (state.selected === i ? ' on' : '') + (img ? '' : ' empty');
    b.dataset.slot = String(i);
    b.title = `${i + 1} · ${SLOT_ROLES[i]}`;
    if (img) {
      const im = document.createElement('img');
      im.src = img.src;
      im.alt = SLOT_ROLES[i];
      b.appendChild(im);
    } else {
      b.textContent = '+';
    }
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = String(i + 1);
    b.appendChild(num);
    const role = document.createElement('span');
    role.className = 'role';
    role.textContent = SLOT_ROLES[i];
    b.appendChild(role);
    b.addEventListener('click', () => {
      pushUndo();
      state.selected = i;
      buildThumbs();
      renderAll();
    });
    box.appendChild(b);
  });
  const tags = $('nameTags');
  tags.innerHTML = '';
  SLOT_ROLES.forEach((role, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1} ${role.charAt(0) + role.slice(1).toLowerCase()}`;
    tags.appendChild(li);
  });
}

function renderPreview() {
  const size = PREVIEW_SIZES[state.aspect];
  if (preview.width !== size.w || preview.height !== size.h) {
    preview.width = size.w;
    preview.height = size.h;
  }
  lastGeo = renderPoster(pctx, size.w, size.h, state, {
    showFaces: state.showFaces, badges: true, selected: state.selected,
  });
}

function renderMinis() {
  document.querySelectorAll('canvas.mini').forEach((c) => {
    const aspect = c.dataset.mini;
    const size = EXPORT_SIZES[aspect];
    const scale = Math.min(c.width / size.w, c.height / size.h);
    const ctx = c.getContext('2d');
    const off = document.createElement('canvas');
    off.width = Math.round(size.w * scale);
    off.height = Math.round(size.h * scale);
    const octx = off.getContext('2d');
    renderPoster(octx, off.width, off.height, { ...state, aspect }, {});
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(off, 0, 0, c.width, c.height);
  });
}

function renderAll() {
  renderPreview();
  if (!renderQueued) {
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      renderMinis();
      updatePanelLabel();
    });
  }
}

function updatePanelLabel() {
  const slot = state.slots[state.selected];
  $('panelLabel').textContent = `PANEL ${state.selected + 1} · ${SLOT_ROLES[state.selected]}`;
  $('zoomSlider').value = String(slot.zoom);
  $('faceLockChk').checked = slot.faceLock;
}

function setStatus(msg) {
  $('status').textContent = msg;
}

// ---- Export: the same renderPoster at full size, PNG download. ----
async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load('400 100px Anton'),
      document.fonts.load('600 40px Oswald'),
      document.fonts.load('400 60px Yellowtail'),
    ]);
    await document.fonts.ready;
  } catch (e) { /* fall back to whatever loaded */ }
}

export function renderExportCanvas(aspect) {
  const size = EXPORT_SIZES[aspect];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  renderPoster(ctx, size.w, size.h, { ...state, aspect }, {});
  return canvas;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

async function exportOne(aspect) {
  await fontsReady();
  const canvas = renderExportCanvas(aspect);
  const blob = await canvasToBlob(canvas);
  downloadBlob(blob, `sundown-circuit-${aspect.replace(':', 'x')}.png`);
  return blob;
}

async function exportAll() {
  const started = performance.now();
  const timer = $('exportTimer');
  timer.textContent = 'Exporting 3 PNGs…';
  const sizes = [];
  for (const aspect of ['1:1', '4:5', '16:9']) {
    const blob = await exportOne(aspect);
    sizes.push(`${aspect} ${blob.size} bytes`);
  }
  const secs = ((performance.now() - started) / 1000).toFixed(1);
  timer.textContent = `Exported 3 PNGs in ${secs}s — 1080×1080 · 1080×1350 · 1920×1080.`;
  setStatus(`Done: ${sizes.join(' · ')}. Barcode ${BARCODE_NUMBER} on every size.`);
  return secs;
}

// ---- Aspect / layout / grade pickers ----
function setAspect(aspect, push = true) {
  if (push) pushUndo();
  state.aspect = aspect;
  document.querySelectorAll('#aspectTabs button').forEach((b) => {
    b.classList.toggle('on', b.dataset.aspect === aspect);
  });
  renderAll();
}

function syncPickers() {
  document.querySelectorAll('#layoutPicks button').forEach((b) => {
    b.classList.toggle('on', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradePicks button').forEach((b) => {
    b.classList.toggle('on', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#aspectTabs button').forEach((b) => {
    b.classList.toggle('on', b.dataset.aspect === state.aspect);
  });
}

function buildGradePicks() {
  const box = $('gradePicks');
  GRADE_ORDER.forEach((key) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade-pick' + (state.grade === key ? ' on' : '');
    b.dataset.grade = key;
    const sw = document.createElement('span');
    sw.className = `sw sw-${key}`;
    b.appendChild(sw);
    b.appendChild(document.createTextNode(GRADES[key].label));
    b.addEventListener('click', () => {
      pushUndo();
      state.grade = key;
      syncPickers();
      renderAll();
    });
    box.appendChild(b);
  });
}

// ---- Caption fields ----
const FIELD_MAP = [
  ['titleInput', 'title'], ['fontSelect', 'font'], ['scriptInput', 'script'],
  ['scriptSelect', 'scriptFont'], ['taglineInput', 'tagline'], ['quoteInput', 'quote'],
  ['sourceInput', 'source'], ['billingInput', 'billing'], ['sealInput', 'seal'],
  ['sealRingInput', 'sealRing'], ['releaseInput', 'release'], ['editionInput', 'edition'],
];
function bindCaptionFields() {
  for (const [id, key] of FIELD_MAP) {
    $(id).addEventListener('input', () => {
      state.texts[key] = $(id).value;
      renderAll();
    });
  }
}
function syncCaptionFields() {
  for (const [id, key] of FIELD_MAP) $(id).value = state.texts[key];
}

// ---- Panel controls ----
function selectedSlot() {
  return state.slots[state.selected];
}
function cyclePhoto(dir) {
  pushUndo();
  const slot = selectedSlot();
  const used = state.photos.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
  if (!used.length) return;
  let idx = used.indexOf(slot.photo);
  idx = (idx + dir + used.length) % used.length;
  slot.photo = used[idx];
  renderAll();
}
function resetPanel() {
  pushUndo();
  state.slots[state.selected] = freshSlot(state.selected);
  renderAll();
}
function autoFill() {
  pushUndo();
  // Fill every empty slot with the first unused photo, in cast order.
  const unused = state.photos.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
  const taken = new Set(state.slots.map((s) => s.photo).filter((p) => p >= 0));
  let next = 0;
  state.slots.forEach((slot) => {
    if (slot.photo < 0) {
      while (next < unused.length && taken.has(unused[next])) next++;
      if (next < unused.length) {
        slot.photo = unused[next];
        taken.add(unused[next]);
        next++;
      }
    }
  });
  renderAll();
  setStatus('Auto-fill done — every panel has a photo.');
}
function autoCentreFace() {
  const slot = selectedSlot();
  pushUndo();
  slot.panX = 0;
  slot.panY = 0;
  slot.zoom = 1;
  renderAll();
  setStatus(`Panel ${state.selected + 1} face re-centred (face lock on).`);
}

// ---- Preview interaction: click to select, drag to pan, wheel to zoom ----
function previewPoint(evt) {
  const rect = preview.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) * (preview.width / rect.width),
    y: (evt.clientY - rect.top) * (preview.height / rect.height),
  };
}
function panelAt(x, y) {
  if (!lastGeo) return -1;
  const hit = lastGeo.panels.find((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
  return hit ? hit.slot : -1;
}
let drag = null;
preview.addEventListener('pointerdown', (evt) => {
  const pt = previewPoint(evt);
  const slotIdx = panelAt(pt.x, pt.y);
  if (slotIdx < 0) return;
  pushUndo();
  state.selected = slotIdx;
  buildThumbs();
  const slot = selectedSlot();
  drag = { x: pt.x, y: pt.y, panX: slot.panX, panY: slot.panY, moved: false };
  preview.setPointerCapture(evt.pointerId);
  renderAll();
});
preview.addEventListener('pointermove', (evt) => {
  if (!drag) return;
  const pt = previewPoint(evt);
  const dx = (pt.x - drag.x) * (preview.width / 960);
  const dy = (pt.y - drag.y) * (preview.width / 960);
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  const slot = selectedSlot();
  slot.panX = drag.panX + dx;
  slot.panY = drag.panY + dy;
  renderAll();
});
preview.addEventListener('pointerup', () => { drag = null; });
preview.addEventListener('wheel', (evt) => {
  evt.preventDefault();
  const slot = selectedSlot();
  pushUndo();
  slot.zoom = Math.min(2.5, Math.max(1, slot.zoom * (evt.deltaY < 0 ? 1.08 : 0.92)));
  renderAll();
}, { passive: false });

// ---- Photo upload: file input, drag & drop, paste. On-device only. ----
async function addFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (!images.length) return;
  for (const file of images) {
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    const img = await loadImage(dataUrl);
    // First empty photo slot wins, else replace the selected panel's photo.
    let target = state.photos.findIndex((p) => !p);
    if (target < 0) target = state.selected;
    state.photos[target] = img;
    state.slots[target].photo = target;
  }
  buildThumbs();
  renderAll();
  setStatus(`${images.length} photo(s) loaded on this device — never uploaded.`);
}

function bindUpload() {
  const input = $('fileInput');
  const zone = $('dropZone');
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', () => addFiles(input.files));
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('over');
    addFiles(e.dataTransfer.files);
  });
  document.addEventListener('paste', (e) => {
    if (e.clipboardData) addFiles(e.clipboardData.files);
  });
}

// ---- Wire everything up ----
function bindAll() {
  $('samplesBtn').addEventListener('click', loadSamples);
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  document.querySelectorAll('#aspectTabs button').forEach((b) => {
    b.addEventListener('click', () => setAspect(b.dataset.aspect));
  });
  document.querySelectorAll('#layoutPicks button').forEach((b) => {
    b.addEventListener('click', () => {
      pushUndo();
      state.layout = b.dataset.layout;
      syncPickers();
      renderAll();
    });
  });
  $('prevPhotoBtn').addEventListener('click', () => cyclePhoto(-1));
  $('nextPhotoBtn').addEventListener('click', () => cyclePhoto(1));
  $('flipBtn').addEventListener('click', () => {
    pushUndo();
    selectedSlot().flip = !selectedSlot().flip;
    renderAll();
  });
  $('zoomSlider').addEventListener('input', () => {
    selectedSlot().zoom = Number($('zoomSlider').value);
    renderAll();
  });
  $('resetPanelBtn').addEventListener('click', resetPanel);
  $('autoFillBtn').addEventListener('click', autoFill);
  $('autoFaceBtn').addEventListener('click', autoCentreFace);
  $('faceLockChk').addEventListener('change', () => {
    selectedSlot().faceLock = $('faceLockChk').checked;
    renderAll();
  });
  $('showFacesChk').addEventListener('change', () => {
    state.showFaces = $('showFacesChk').checked;
    renderAll();
  });
  $('nameTagsChk').addEventListener('change', () => {
    $('nameTags').style.display = $('nameTagsChk').checked ? '' : 'none';
  });
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', () => exportOne(b.dataset.export));
  });
  $('exportAllBtn').addEventListener('click', exportAll);
  bindCaptionFields();
  bindUpload();
}

buildGradePicks();
bindAll();
buildThumbs();
await fontsReady();
await loadSamples();

// Automation hook for screenshots + verification (same code paths as the UI).
window.sunsetCircuit = {
  state,
  exportPNG: async (aspect) => {
    await fontsReady();
    const canvas = renderExportCanvas(aspect);
    const blob = await canvasToBlob(canvas);
    const buf = new Uint8Array(await blob.arrayBuffer());
    return { aspect, width: canvas.width, height: canvas.height, bytes: buf.length, data: [...buf] };
  },
  setAspect: (aspect) => setAspect(aspect),
  setGrade: (grade) => { state.grade = grade; syncPickers(); renderAll(); },
  setLayout: (layout) => { state.layout = layout; syncPickers(); renderAll(); },
  ready: () => state.photos.every(Boolean),
};
