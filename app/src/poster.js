// Sunset Circuit — poster render engine.
// One canvas function, renderPoster, draws the whole poster at any size:
// the live preview and the exported PNGs are the same drawing, so what
// you see is exactly what you share. No network, no libraries.
export const GRADES = {
  sunset: {
    label: 'SUNSET GOLD', frame: '#2a1038', wash: '#ff7a3d', washAlpha: 0.10,
    title: ['#fff7d6', '#ffd166', '#ff7a3d', '#ff3d7e', '#a64dff'],
    stripe: '#ff2e63', script: '#ff7ab8', ribbonBg: '#160a24', ribbonText: '#ffd166',
    border: '#f5b942', skyTop: '#ff9e5e', skyBottom: '#7b2d8b', sealRing: '#f5b942',
    footerText: '#f3e6c8', quote: '#ffe9a8',
  },
  neon: {
    label: 'NEON NIGHT', frame: '#0b1030', wash: '#4fd8ff', washAlpha: 0.10,
    title: ['#eaffff', '#7df9ff', '#4fc3ff', '#ff4fd8', '#8b5cff'],
    stripe: '#ff4fd8', script: '#ff6ee7', ribbonBg: '#0b1030', ribbonText: '#7df9ff',
    border: '#4fd8ff', skyTop: '#2a1a6e', skyBottom: '#0b1030', sealRing: '#7df9ff',
    footerText: '#d8f6ff', quote: '#b8f4ff',
  },
  teal: {
    label: 'TROPIC TEAL', frame: '#07332b', wash: '#2ec4a6', washAlpha: 0.10,
    title: ['#fffbe8', '#ffe08a', '#7fd8a4', '#2ec4a6', '#0b6e5d'],
    stripe: '#ffb37a', script: '#ffd166', ribbonBg: '#052a22', ribbonText: '#ffe08a',
    border: '#ffd166', skyTop: '#ffcf7d', skyBottom: '#0b6e5d', sealRing: '#ffd166',
    footerText: '#e8fff4', quote: '#ffe9a8',
  },
  uv: {
    label: 'ULTRAVIOLET', frame: '#1d0b33', wash: '#b04dff', washAlpha: 0.12,
    title: ['#ffffff', '#e0b3ff', '#c77dff', '#ff4fd8', '#7b2ff7'],
    stripe: '#ff4fd8', script: '#ff9de2', ribbonBg: '#160626', ribbonText: '#e0b3ff',
    border: '#c77dff', skyTop: '#ff8fd8', skyBottom: '#4b1d8f', sealRing: '#e0b3ff',
    footerText: '#f0e2ff', quote: '#e8ccff',
  },
  retro: {
    label: 'RETRO PRINT', frame: '#f3e6c8', wash: '#e4572e', washAlpha: 0.08,
    title: ['#fff8e0', '#f2c14e', '#e4572e', '#c1272d', '#17615a'],
    stripe: '#17615a', script: '#c1272d', ribbonBg: '#1d2a24', ribbonText: '#f3e6c8',
    border: '#c1272d', skyTop: '#f2c14e', skyBottom: '#17615a', sealRing: '#c1272d',
    footerText: '#3a2a1a', quote: '#7a1f1f',
  },
  coral: {
    label: 'CORAL HEAT', frame: '#33102a', wash: '#ff6b4a', washAlpha: 0.10,
    title: ['#fff3e0', '#ffb37a', '#ff8a5c', '#ff6b4a', '#ff2e63'],
    stripe: '#ff2e63', script: '#ff8fb3', ribbonBg: '#240818', ribbonText: '#ffb37a',
    border: '#ff8a5c', skyTop: '#ffb37a', skyBottom: '#a3134a', sealRing: '#ffb37a',
    footerText: '#ffe8d8', quote: '#ffd9c2',
  },
};

export const GRADE_ORDER = ['sunset', 'neon', 'teal', 'uv', 'retro', 'coral'];

// The demo cast: slot index -> role. Slot 0 is the hero.
export const SLOT_ROLES = [
  'THE BOSS', 'THE DRIVER', 'THE MECHANIC', 'THE CAPTAIN',
  'THE RIDER', 'THE FIXER', 'THE LOOKOUT', 'THE QUEEN',
];
// Default face box per cast photo, as fractions of the photo. Faces sit
// roughly centred in the upper half of every portrait.
export const DEFAULT_FACES = [
  { x: 0.5, y: 0.27, w: 0.34, h: 0.30 },
  { x: 0.5, y: 0.29, w: 0.34, h: 0.30 },
  { x: 0.5, y: 0.29, w: 0.34, h: 0.30 },
  { x: 0.5, y: 0.31, w: 0.34, h: 0.30 },
  { x: 0.5, y: 0.27, w: 0.34, h: 0.30 },
  { x: 0.5, y: 0.29, w: 0.34, h: 0.30 },
  { x: 0.5, y: 0.29, w: 0.34, h: 0.30 },
  { x: 0.5, y: 0.27, w: 0.34, h: 0.30 },
];

export const BARCODE_NUMBER = '0 77021 20261 1';

function fitFont(ctx, text, fontFamily, weight, maxWidth, startPx) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${fontFamily}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${fontFamily}`;
  }
  return px;
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// The striped retro title: giant block letters filled with a vertical
// gradient, cut through by horizontal stripes, with a thick dark outline
// and a white sparkle. Drawn on an offscreen canvas so the stripes only
// touch the letters, never the poster behind them.
export function drawStripedTitle(ctx, text, cx, top, maxWidth, height, grade, fontFamily) {
  const px = fitFont(ctx, text, fontFamily, 400, maxWidth, height);
  const pad = Math.ceil(px * 0.12);
  const off = document.createElement('canvas');
  off.width = Math.ceil(ctx.measureText(text).width) + pad * 2;
  off.height = Math.ceil(px * 1.25) + pad * 2;
  const o = off.getContext('2d');
  o.font = `400 ${px}px ${fontFamily}`;
  o.textAlign = 'center';
  o.textBaseline = 'middle';
  o.fillStyle = '#ffffff';
  o.fillText(text, off.width / 2, off.height / 2);
  o.globalCompositeOperation = 'source-atop';
  const grad = o.createLinearGradient(0, 0, 0, off.height);
  grade.title.forEach((stop, i) => grad.addColorStop(i / (grade.title.length - 1), stop));
  o.fillStyle = grad;
  o.fillRect(0, 0, off.width, off.height);
  // Horizontal stripes cut through the letters.
  o.fillStyle = grade.stripe;
  const stripeH = Math.max(3, px * 0.045);
  for (let i = 1; i <= 3; i++) {
    const y = off.height * (0.22 + i * 0.17);
    o.globalAlpha = 0.9;
    o.fillRect(0, y, off.width, stripeH);
  }
  o.globalAlpha = 1;
  o.globalCompositeOperation = 'source-over';
  // Thick dark outline, drawn on the main canvas under the fill.
  ctx.save();
  ctx.font = `400 ${px}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#160a24';
  ctx.lineWidth = Math.max(4, px * 0.085);
  const cy = top + height / 2;
  ctx.strokeText(text, cx, cy);
  ctx.drawImage(off, cx - off.width / 2, cy - off.height / 2);
  // White sparkle at the title's left edge.
  const sx = cx - off.width / 2 + px * 0.08;
  const sy = cy - px * 0.42;
  const r = px * 0.16;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(sx, sy - r);
  ctx.quadraticCurveTo(sx, sy, sx + r, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy + r);
  ctx.quadraticCurveTo(sx, sy, sx - r, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy - r);
  ctx.fill();
  ctx.restore();
  return px;
}

// Face-aware cover draw: the face box stays centred in the panel, so a
// crop never decapitates anyone. Pan/zoom/flip apply on top of that.
export function drawPanelPhoto(ctx, img, rect, slot, grade, opts) {
  const face = slot.face;
  const zoom = slot.zoom || 1;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  // Target: face centre lands at the panel's horizontal centre and 38%
  // down its height (faces read best slightly above centre, clear of the
  // role tag at the foot of the panel).
  const tx = rect.x + rect.w / 2;
  const ty = rect.y + rect.h * 0.38;
  let ox = tx - face.x * dw + (slot.panX || 0);
  let oy = ty - face.y * dh + (slot.panY || 0);
  if (slot.faceLock !== false) {
    ox = Math.min(rect.x, Math.max(rect.x + rect.w - dw, ox));
    oy = Math.min(rect.y, Math.max(rect.y + rect.h - dh, oy));
  } else {
    ox = Math.min(rect.x + rect.w * 0.2, Math.max(rect.x + rect.w - dw - rect.w * 0.2, ox));
    oy = Math.min(rect.y + rect.h * 0.2, Math.max(rect.y + rect.h - dh - rect.h * 0.2, oy));
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (slot.flip) {
    ctx.translate(rect.x + rect.w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(rect.x + rect.w / 2), 0);
  }
  ctx.drawImage(img, ox, oy, dw, dh);
  // Grade wash + a dark foot so the role tag stays legible.
  ctx.globalAlpha = grade.washAlpha;
  ctx.fillStyle = grade.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = 1;
  const shade = ctx.createLinearGradient(0, rect.y + rect.h * 0.55, 0, rect.y + rect.h);
  shade.addColorStop(0, 'rgba(10,4,20,0)');
  shade.addColorStop(1, 'rgba(10,4,20,0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  return { ox, oy, dw, dh };
}

export function drawFaceBox(ctx, img, rect, slot) {
  const face = slot.face;
  const zoom = slot.zoom || 1;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const tx = rect.x + rect.w / 2;
  const ty = rect.y + rect.h * 0.38;
  let ox = tx - face.x * dw + (slot.panX || 0);
  let oy = ty - face.y * dh + (slot.panY || 0);
  ox = Math.min(rect.x, Math.max(rect.x + rect.w - dw, ox));
  oy = Math.min(rect.y, Math.max(rect.y + rect.h - dh, oy));
  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(2, rect.w * 0.006);
  ctx.strokeRect(ox + (face.x - face.w / 2) * dw, oy + (face.y - face.h / 2) * dh, face.w * dw, face.h * dh);
  ctx.setLineDash([]);
  ctx.restore();
}

export function drawRoleTag(ctx, rect, role, grade, scale) {
  // Tag height is capped by the panel's height, so on wide panels the tag
  // stays a slim strip and never covers a mouth or chin.
  const tagH = Math.max(18, Math.min(rect.w * 0.11, rect.h * 0.17));
  const tagW = Math.min(rect.w * 0.92, ctx.measureText(role).width + tagH * 2.4);
  const x = rect.x + rect.w * 0.04;
  const y = rect.y + rect.h - tagH - rect.h * 0.05;
  ctx.save();
  ctx.font = `italic 600 ${Math.round(tagH * 0.52)}px Oswald, sans-serif`;
  const tw = ctx.measureText(role).width + tagH * 2.2;
  const w = Math.min(rect.w * 0.94, tw);
  // Slanted black tag with a yellow slash.
  ctx.beginPath();
  ctx.moveTo(x + tagH * 0.5, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - tagH * 0.5, y + tagH);
  ctx.lineTo(x, y + tagH);
  ctx.closePath();
  ctx.fillStyle = '#0d0716';
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x + w - tagH * 0.42, y + 2, Math.max(3, tagH * 0.14), tagH - 4);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(role, x + tagH * 0.62, y + tagH / 2 + 1);
  ctx.restore();
  return { x, y, w: tagW, h: tagH };
}

export function drawRibbon(ctx, rect, text, grade) {
  ctx.save();
  const slant = rect.h * 0.9;
  ctx.beginPath();
  ctx.moveTo(rect.x + slant, rect.y);
  ctx.lineTo(rect.x + rect.w - slant, rect.y);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h / 2);
  ctx.lineTo(rect.x + rect.w - slant, rect.y + rect.h);
  ctx.lineTo(rect.x + slant, rect.y + rect.h);
  ctx.lineTo(rect.x, rect.y + rect.h / 2);
  ctx.closePath();
  ctx.fillStyle = grade.ribbonBg;
  ctx.fill();
  ctx.strokeStyle = grade.border;
  ctx.lineWidth = Math.max(1.5, rect.h * 0.05);
  ctx.stroke();
  const px = fitFont(ctx, text, 'Oswald, sans-serif', 600, rect.w * 0.86, rect.h * 0.52);
  ctx.fillStyle = grade.ribbonText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = `${Math.round(px * 0.08)}px`; } catch (e) { /* older canvas */ }
  ctx.fillText(text.toUpperCase(), rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  try { ctx.letterSpacing = '0px'; } catch (e) { /* ignore */ }
  ctx.restore();
}

export function drawSeal(ctx, cx, cy, r, texts, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grade.ribbonBg;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.strokeStyle = grade.sealRing;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.stroke();
  ctx.fillStyle = grade.sealRing;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(r * 0.34)}px Oswald, sans-serif`;
  ctx.fillText('★', cx, cy - r * 0.52);
  ctx.font = `${Math.round(r * 0.26)}px Oswald, sans-serif`;
  ctx.fillStyle = '#ffffff';
  const lines = texts.seal.toUpperCase().split(' ');
  const mid = Math.ceil(lines.length / 2);
  ctx.fillText(lines.slice(0, mid).join(' '), cx, cy - r * 0.08);
  ctx.fillText(lines.slice(mid).join(' '), cx, cy + r * 0.22);
  const ringPx = fitFont(ctx, texts.sealRing.toUpperCase(), 'Oswald, sans-serif', 400, r * 1.5, r * 0.15);
  ctx.font = `${ringPx}px Oswald, sans-serif`;
  ctx.fillStyle = grade.sealRing;
  ctx.fillText(texts.sealRing.toUpperCase(), cx, cy + r * 0.52);
  ctx.restore();
}

export function drawBarcode(ctx, x, y, w, h, number, color) {
  // Deterministic bars from the digits, so the barcode is identical on
  // every export size — the same number, the same bars, every time.
  ctx.save();
  ctx.fillStyle = color;
  let seed = 0;
  for (const ch of number.replace(/\s/g, '')) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  // Bars are laid out to fit exactly inside w, so the barcode never runs
  // past its column or off the poster's edge.
  const step = w / 59;
  for (let i = 0; i < 59; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    if (seed % 5 !== 0) ctx.fillRect(x + i * step, y, step * (0.5 + (seed % 3) * 0.25), h * 0.72);
  }
  const numPx = fitFont(ctx, number, 'Oswald, sans-serif', 400, w * 0.98, h * 0.2);
  ctx.font = `${numPx}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(number, x + w / 2, y + h * 0.76);
  ctx.restore();
}

export function drawSkyline(ctx, rect, grade) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  grad.addColorStop(0, grade.skyTop);
  grad.addColorStop(1, grade.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // Sun disc low on the horizon.
  ctx.fillStyle = 'rgba(255,240,200,0.9)';
  ctx.beginPath();
  ctx.arc(rect.x + rect.w * 0.5, rect.y + rect.h * 0.62, rect.h * 0.30, 0, Math.PI * 2);
  ctx.fill();
  // Black building silhouettes + palm trees.
  ctx.fillStyle = '#12081f';
  let bx = rect.x;
  let seed = 7;
  while (bx < rect.x + rect.w) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const bw = rect.w * (0.04 + (seed % 5) * 0.012);
    const bh = rect.h * (0.25 + (seed % 7) * 0.07);
    ctx.fillRect(bx, rect.y + rect.h - bh, bw, bh);
    bx += bw + rect.w * 0.008;
  }
  ctx.strokeStyle = '#12081f';
  ctx.lineWidth = Math.max(2, rect.w * 0.004);
  for (const px of [0.08, 0.92]) {
    const tx = rect.x + rect.w * px;
    const ty = rect.y + rect.h;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + rect.w * 0.012, ty - rect.h * 0.5, tx + rect.w * 0.02, ty - rect.h * 0.62);
    ctx.stroke();
    ctx.beginPath();
    for (let a = 0; a < 5; a++) {
      const ang = Math.PI * (0.15 + a * 0.18);
      ctx.moveTo(tx + rect.w * 0.02, ty - rect.h * 0.62);
      ctx.quadraticCurveTo(
        tx + rect.w * 0.02 + Math.cos(ang) * rect.w * 0.05,
        ty - rect.h * 0.62 - Math.sin(ang) * rect.h * 0.28,
        tx + rect.w * 0.02 + Math.cos(ang) * rect.w * 0.075,
        ty - rect.h * 0.62 - Math.sin(ang) * rect.h * 0.12,
      );
    }
    ctx.stroke();
  }
  ctx.restore();
}

function rowWidths(total, gaps, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const free = total - gaps * (weights.length - 1);
  return weights.map((w) => (free * w) / sum);
}

// Geometry per aspect + layout. The title always gets its OWN band
// between panel rows — it never overlaps a face or a role label.
export function layoutGeometry(W, H, layout, aspect) {
  const m = Math.round(W * 0.014);
  const gap = Math.round(W * 0.007);
  const inner = W - m * 2;
  const quoteH = Math.round(H * 0.042);
  const panels = [];
  let title = null;
  let ribbon = null;
  let skyline = null;
  let footer = null;
  const add = (slot, x, y, w, h) => panels.push({ slot, role: SLOT_ROLES[slot], x, y, w, h });
  if (layout === 'strips') {
    const top = m + quoteH + gap;
    const stripH = Math.round(H * (aspect === '16:9' ? 0.5 : 0.44));
    const order = [1, 0, 2, 3, 4, 5, 6];
    const sw = inner / order.length;
    order.forEach((slot, i) => {
      add(slot, m + i * sw, top, sw - gap * 0.4, stripH);
    });
    const ty = top + stripH + gap;
    title = { x: m, y: ty, w: inner, h: Math.round(H * 0.15) };
    ribbon = { x: m + inner * 0.06, y: ty + title.h + gap, w: inner * 0.88, h: Math.round(H * 0.042) };
    footer = { x: m, y: ribbon.y + ribbon.h + gap * 2, w: inner, h: H - m - (ribbon.y + ribbon.h + gap * 2) };
  } else if (aspect === '16:9') {
    const top = m + quoteH + gap;
    const rowH = Math.round(H * 0.345);
    if (layout === 'grid') {
      const widths = rowWidths(inner, gap, [1, 1, 1]);
      let x = m;
      [1, 0, 2].forEach((slot, i) => { add(slot, x, top, widths[i], rowH); x += widths[i] + gap; });
      ribbon = { x: m + inner * 0.08, y: top + rowH + gap, w: inner * 0.84, h: Math.round(H * 0.042) };
      title = { x: m, y: ribbon.y + ribbon.h + gap, w: inner, h: Math.round(H * 0.13) };
      const botY = title.y + title.h + gap;
      const botH = Math.round(H * 0.30);
      const bw = rowWidths(inner, gap, [1, 1, 1]);
      x = m;
      [4, 7, 5].forEach((slot, i) => { add(slot, x, botY, bw[i], botH); x += bw[i] + gap; });
      footer = { x: m, y: botY + botH + gap, w: inner, h: H - m - (botY + botH + gap) };
    } else {
      const widths = rowWidths(inner, gap, [21, 36, 21, 20]);
      let x = m;
      [1, 0, 2, 3].forEach((slot, i) => { add(slot, x, top, widths[i], rowH); x += widths[i] + gap; });
      title = { x: m, y: top + rowH + gap, w: inner, h: Math.round(H * 0.145) };
      const botY = title.y + title.h + gap;
      const botH = Math.round(H * 0.278);
      const bw = rowWidths(inner, gap, [1, 1, 1]);
      x = m;
      [4, 5, 6].forEach((slot, i) => { add(slot, x, botY, bw[i], botH); x += bw[i] + gap; });
      footer = { x: m, y: botY + botH + gap, w: inner, h: H - m - (botY + botH + gap) };
    }
  } else if (aspect === '4:5') {
    const top = m + quoteH + gap;
    const rowH = Math.round(H * 0.40);
    if (layout === 'grid') {
      const widths = rowWidths(inner, gap, [1, 1, 1]);
      let x = m;
      [1, 0, 2].forEach((slot, i) => { add(slot, x, top, widths[i], rowH); x += widths[i] + gap; });
      ribbon = { x: m + inner * 0.06, y: top + rowH + gap, w: inner * 0.88, h: Math.round(H * 0.034) };
      title = { x: m, y: ribbon.y + ribbon.h + gap, w: inner, h: Math.round(H * 0.115) };
      const botY = title.y + title.h + gap;
      const botH = Math.round(H * 0.155);
      const bw = rowWidths(inner, gap, [1, 1, 1]);
      x = m;
      [4, 7, 5].forEach((slot, i) => { add(slot, x, botY, bw[i], botH); x += bw[i] + gap; });
      footer = { x: m, y: botY + botH + gap, w: inner, h: H - m - (botY + botH + gap) };
    } else {
      const widths = rowWidths(inner, gap, [1, 1, 1, 1]);
      let x = m;
      [2, 0, 1, 3].forEach((slot, i) => { add(slot, x, top, widths[i], rowH); x += widths[i] + gap; });
      title = { x: m, y: top + rowH + gap, w: inner, h: Math.round(H * 0.115) };
      ribbon = { x: m + inner * 0.06, y: title.y + title.h + gap, w: inner * 0.88, h: Math.round(H * 0.034) };
      const skyY = ribbon.y + ribbon.h + gap;
      skyline = { x: m, y: skyY, w: inner, h: Math.round(H * 0.13) };
      footer = { x: m, y: skyY + skyline.h + gap, w: inner, h: H - m - (skyY + skyline.h + gap) };
    }
  } else {
    // 1:1 — six grid, ribbon between the rows, title in its own band.
    const top = m + quoteH + gap;
    const rowH = Math.round(H * 0.305);
    const widths = rowWidths(inner, gap, [1, 1, 1]);
    let x = m;
    const topRow = layout === 'grid' ? [1, 0, 2] : [1, 0, 2];
    topRow.forEach((slot, i) => { add(slot, x, top, widths[i], rowH); x += widths[i] + gap; });
    ribbon = { x: m + inner * 0.06, y: top + rowH + gap, w: inner * 0.88, h: Math.round(H * 0.04) };
    title = { x: m, y: ribbon.y + ribbon.h + gap, w: inner, h: Math.round(H * 0.125) };
    const botY = title.y + title.h + gap;
    const bw = rowWidths(inner, gap, [1, 1, 1]);
    x = m;
    const botRow = layout === 'grid' ? [4, 7, 5] : [4, 3, 5];
    botRow.forEach((slot, i) => { add(slot, x, botY, bw[i], rowH); x += bw[i] + gap; });
    footer = { x: m, y: botY + rowH + gap, w: inner, h: H - m - (botY + rowH + gap) };
  }
  return { panels, title, ribbon, skyline, footer, quote: { x: m, y: m * 0.7, w: inner, h: quoteH }, margin: m, gap };
}

export function renderPoster(ctx, W, H, state, opts = {}) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const geo = layoutGeometry(W, H, state.layout, state.aspect);
  const t = state.texts;
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = grade.frame;
  ctx.fillRect(0, 0, W, H);
  // Outer gold frame.
  ctx.strokeStyle = grade.border;
  ctx.lineWidth = Math.max(2, W * 0.003);
  ctx.strokeRect(geo.margin / 2, geo.margin / 2, W - geo.margin, H - geo.margin);
  // Top quote bar: five gold stars + press quote + source, VOL. 1 boxed.
  ctx.fillStyle = grade.quote;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const qPx = fitFont(ctx, `★★★★★  "${t.quote}" — ${t.source}`, 'Oswald, sans-serif', 600, geo.quote.w * 0.78, geo.quote.h * 0.52);
  ctx.font = `600 ${qPx}px Oswald, sans-serif`;
  ctx.fillText(`★★★★★  "${t.quote}" — ${t.source}`, geo.quote.x, geo.quote.y + geo.quote.h / 2);
  ctx.textAlign = 'right';
  ctx.font = `600 ${Math.round(geo.quote.h * 0.5)}px Oswald, sans-serif`;
  const edW = ctx.measureText(t.edition) + geo.quote.h * 0.9;
  ctx.strokeStyle = grade.border;
  ctx.lineWidth = Math.max(1.5, W * 0.0015);
  ctx.strokeRect(geo.quote.x + geo.quote.w - edW, geo.quote.y + geo.quote.h * 0.12, edW, geo.quote.h * 0.76);
  ctx.fillStyle = grade.quote;
  ctx.fillText(t.edition, geo.quote.x + geo.quote.w - geo.quote.h * 0.45, geo.quote.y + geo.quote.h / 2);
  // Panels.
  const photos = state.photos;
  for (const p of geo.panels) {
    const slot = state.slots[p.slot];
    const img = photos[slot.photo];
    if (img) {
      drawPanelPhoto(ctx, img, p, slot, grade, opts);
    } else {
      ctx.fillStyle = '#1c0f2e';
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    ctx.strokeStyle = grade.border;
    ctx.lineWidth = Math.max(2, W * 0.002);
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    if (img && opts.showFaces) drawFaceBox(ctx, img, p, slot);
    drawRoleTag(ctx, p, p.role, grade, W);
    if (opts.badges) {
      const r = Math.max(11, W * 0.011);
      ctx.beginPath();
      ctx.arc(p.x + r + 6, p.y + r + 6, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd166';
      ctx.fill();
      ctx.fillStyle = '#160a24';
      ctx.font = `700 ${Math.round(r * 1.05)}px Oswald, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(p.slot + 1), p.x + r + 6, p.y + r + 7);
    }
    if (opts.selected === p.slot) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(3, W * 0.003);
      ctx.setLineDash([10, 6]);
      ctx.strokeRect(p.x - 3, p.y - 3, p.w + 6, p.h + 6);
      ctx.setLineDash([]);
    }
  }
  // Tagline ribbon.
  if (geo.ribbon) drawRibbon(ctx, geo.ribbon, t.tagline, grade);
  // Title band: striped title + script subtitle, nothing else in it.
  const titleH = geo.title.h * 0.68;
  drawStripedTitle(ctx, t.title.toUpperCase(), geo.title.x + geo.title.w / 2, geo.title.y, geo.title.w, titleH, grade, t.font === 'Oswald' ? 'Oswald, sans-serif' : 'Anton, sans-serif');
  ctx.fillStyle = grade.script;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const sPx = fitFont(ctx, t.script, 'Yellowtail, cursive', 400, geo.title.w * 0.7, geo.title.h * 0.26);
  ctx.font = `${sPx}px Yellowtail, cursive`;
  ctx.fillText(t.script, geo.title.x + geo.title.w / 2, geo.title.y + geo.title.h * 0.86);
  // Skyline band (4:5 mosaic).
  if (geo.skyline) drawSkyline(ctx, geo.skyline, grade);
  // Footer: release line + barcode left, billing centre, seal right.
  const f = geo.footer;
  if (f && f.h > 40) {
    const sealR = Math.min(f.h * 0.42, W * 0.055);
    drawSeal(ctx, f.x + f.w - sealR - 6, f.y + f.h / 2, sealR, t, grade);
    const leftW = Math.min(f.w * 0.22, W * 0.16);
    ctx.fillStyle = grade.footerText;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const relPx = fitFont(ctx, t.release, 'Oswald, sans-serif', 600, leftW, f.h * 0.16);
    ctx.font = `600 ${relPx}px Oswald, sans-serif`;
    ctx.fillText(t.release, f.x, f.y + f.h * 0.06);
    drawBarcode(ctx, f.x, f.y + f.h * 0.28, leftW, Math.min(f.h * 0.6, leftW * 0.75), BARCODE_NUMBER, grade.footerText);
    // Billing block, centred.
    ctx.fillStyle = grade.footerText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const billPx = Math.max(7, Math.round(W * 0.0072));
    ctx.font = `500 ${billPx}px Oswald, sans-serif`;
    try { ctx.letterSpacing = '0.5px'; } catch (e) { /* ignore */ }
    const lines = wrapLines(ctx, t.billing.toUpperCase(), f.w * 0.52);
    const lineH = billPx * 1.45;
    let by = f.y + (f.h - lines.length * lineH) / 2;
    for (const line of lines.slice(0, 4)) {
      ctx.fillText(line, f.x + f.w / 2, by);
      by += lineH;
    }
    try { ctx.letterSpacing = '0px'; } catch (e) { /* ignore */ }
  }
  ctx.restore();
  return geo;
}
