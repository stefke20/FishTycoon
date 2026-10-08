'use strict';
/* ===== Procedural voxel / pixel-art sprites (generated on canvas, cached) ===== */

const GW = 32, GH = 24; // sprite grid
/* Shapes in grid units. body: e=[cx,cy,rx,ry] ellipse or p=polygon. fins are polygons. */
const SHAPES = {
  round: { body: { e: [18, 12, 9, 7.5] }, tail: [[9, 12], [2, 5], [5, 12], [2, 19]], dorsal: [[12, 6], [16, 1.5], [23, 6]], vent: [[14, 18], [18, 22], [22, 18]], eye: [23, 9] },
  slender: { body: { e: [17, 12, 12.5, 5] }, tail: [[6, 12], [1, 6], [4, 12], [1, 18]], dorsal: [[12, 8], [17, 4], [22, 8]], vent: [[14, 16], [18, 19], [21, 16]], eye: [26, 10] },
  tall: { body: { e: [17, 12, 7.5, 9.5] }, tail: [[10, 12], [3, 6], [6, 12], [3, 18]], dorsal: [[12, 4], [15, 0], [23, 5]], vent: [[12, 20], [15, 24], [23, 19]], eye: [22, 9] },
  eel: { body: { e: [18, 12, 13.5, 3.8] }, tail: [[6, 12], [1, 8], [3, 12], [1, 16]], dorsal: [[10, 9], [18, 6], [27, 9]], vent: [[13, 15], [19, 18], [25, 15]], eye: [28, 11] },
  puffer: { body: { e: [17, 12, 10, 9] }, tail: [[8, 12], [3, 9], [5, 12], [3, 15]], dorsal: [[13, 4], [17, 1], [21, 4]], vent: [[13, 20], [17, 23], [21, 20]], eye: [22, 9] },
  ray: { body: { p: [[7, 12], [13, 3], [22, 8], [30, 12], [22, 16], [13, 21]] }, tail: [[8, 11], [0, 12], [8, 13]], dorsal: [], vent: [], eye: [24, 10] },
};

const _spriteCache = new Map();
const _hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const _mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const _shade = (c, f) => f >= 0 ? _mix(c, [255, 255, 255], f) : _mix(c, [0, 0, 0], -f);

function _inPoly(x, y, p) {
  let r = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) r = !r;
  }
  return r;
}
const _inBody = (b, x, y) => b.e ? (((x - b.e[0]) / b.e[2]) ** 2 + ((y - b.e[1]) / b.e[3]) ** 2 <= 1) : _inPoly(x, y, b.p);

function _pattern(pt, u, v, x, y) { // returns true where the secondary colour is painted
  switch (pt) {
    case 'belly': return v > 0.66;
    case 'stripes': return (u > 0.28 && u < 0.37) || (u > 0.5 && u < 0.59) || (u > 0.72 && u < 0.8);
    case 'spots': return (x * 5 + y * 3) % 13 === 0 || (x * 3 + y * 7) % 17 === 0;
    case 'band': return (u > 0.2 && u < 0.34) || (u > 0.6 && u < 0.73);
    case 'patch': return ((u - 0.3) / 0.2) ** 2 + ((v - 0.35) / 0.3) ** 2 < 1 || ((u - 0.62) / 0.2) ** 2 + ((v - 0.68) / 0.3) ** 2 < 1 || ((u - 0.78) / 0.12) ** 2 + ((v - 0.3) / 0.2) ** 2 < 1;
  }
  return false;
}

function _modColor(m, c, u, v, x, y) {
  switch (m) {
    case 'pearl': return _mix(c, [[255, 214, 245], [201, 244, 255], [255, 255, 255]][(x + y) % 3], 0.5);
    case 'spotted': return (x * 3 + y * 7) % 9 === 0 ? [255, 255, 255] : c;
    case 'striped': return y % 4 === 0 ? _shade(c, -0.45) : c;
    case 'dappled': return ((x >> 1) * 3 + (y >> 1) * 5) % 7 === 0 ? _mix(c, [255, 227, 241], 0.7) : c;
    case 'fiery': return _mix(c, v < 0.35 ? [255, 224, 102] : v < 0.7 ? [255, 123, 0] : [193, 18, 31], 0.7);
    case 'frosty': return (x * 7 + y * 3) % 11 === 0 ? [255, 255, 255] : _mix(c, v < 0.5 ? [235, 250, 255] : [111, 211, 255], 0.62);
    case 'golden': return _mix(c, v < 0.4 ? [255, 243, 176] : v < 0.75 ? [255, 195, 0] : [184, 134, 11], 0.7);
    case 'glowing': return _mix(c, ((u - 0.5) ** 2 + (v - 0.5) ** 2) < 0.12 ? [234, 255, 201] : [75, 224, 75], 0.65);
    case 'cosmic': return (x * 11 + y * 5) % 13 === 0 ? [255, 255, 255] : (x * 7 + y * 9) % 19 === 0 ? [154, 209, 255] : _mix(c, [43, 10, 92], 0.72);
    case 'prismatic': return _mix(c, [[255, 77, 77], [255, 210, 63], [77, 255, 136], [77, 201, 255], [143, 77, 255], [255, 77, 210]][Math.min(5, Math.floor(u * 6))], 0.6);
    case 'shadow': return (x * 5 + y * 11) % 9 === 0 ? [166, 107, 255] : _mix(c, [18, 0, 31], 0.7);
  }
  return c;
}

function _canvasToURL(cv) { return cv.toDataURL('image/png'); }

function spriteURL(spId, mods) {
  const key = spId + '|' + mods.join(',');
  if (_spriteCache.has(key)) return _spriteCache.get(key);
  const s = SPECIES[spId], sh = SHAPES[s.sh];
  const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(GW, GH);
  const base = _hex(s.c), c2 = _hex(s.c2);
  const finBase = (s.pt === 'none' || s.pt === 'belly' || s.pt === 'spots') ? c2 : base;
  // bounding box of body for uv
  let bx0 = 99, bx1 = -1, by0 = 99, by1 = -1;
  const kind = new Array(GW * GH).fill(0); // 0 empty, 1 body, 2 fin
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const px = x + 0.5, py = y + 0.5;
    if (_inBody(sh.body, px, py)) { kind[y * GW + x] = 1; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
    else if (_inPoly(px, py, sh.tail) || (sh.dorsal.length && _inPoly(px, py, sh.dorsal)) || (sh.vent.length && _inPoly(px, py, sh.vent))) kind[y * GW + x] = 2;
  }
  const at = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH) ? 0 : kind[y * GW + x];
  const set = (x, y, c) => { const i = (y * GW + x) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255; };
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const k = kind[y * GW + x]; if (!k) continue;
    const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
    const u = (x - bx0) / Math.max(1, bx1 - bx0), v = (y - by0) / Math.max(1, by1 - by0);
    let c;
    if (k === 2) c = _shade(finBase, ((x + y) % 2 ? 0.04 : -0.08));
    else {
      c = _pattern(s.pt, u, v, x, y) ? c2 : base;
      mods.forEach(m => (c = _modColor(m, c, u, v, x, y)));
      c = _shade(c, v < 0.28 ? 0.16 : v > 0.78 ? -0.2 : 0); // voxel-style 3-tone lighting
    }
    if (edge) c = _shade(c, -0.55);
    set(x, y, c.map(Math.round));
  }
  // eye
  const [ex, ey] = sh.eye;
  [[0, 0, [255, 255, 255]], [1, 0, [20, 20, 30]], [0, 1, [255, 255, 255]], [1, 1, [255, 255, 255]]].forEach(([dx, dy, c]) => { if (at(ex + dx, ey + dy)) set(ex + dx, ey + dy, c); });
  ctx.putImageData(img, 0, 0);
  const url = _canvasToURL(cv);
  _spriteCache.set(key, url);
  return url;
}

/* Fish as an <img>. px = rendered width (snapped to a multiple of the 32px grid so pixels stay crisp). */
function fishSVG(spId, mods, px) {
  const sc = Math.max(1, Math.round(px / GW)), w = GW * sc;
  const glows = mods.map(m => MODS[m].glow).filter(Boolean).slice(0, 3);
  const filter = glows.length ? `filter:${glows.map(g => `drop-shadow(0 0 ${2 + sc}px ${g})`).join(' ')};` : '';
  const prism = mods.includes('prismatic') ? ' prism' : '';
  return `<span class="fw${prism}"><img class="px" src="${spriteURL(spId, mods)}" width="${w}" height="${GH * sc}" style="${filter}" alt="" draggable="false"></span>`;
}

/* Pixelated emoji (decorations/icons): drawn tiny, hard-edged and posterised */
const _emojiCache = new Map();
function pxEmoji(e, size) {
  size = size || 44;
  const key = e + size;
  if (_emojiCache.has(key)) return _emojiCache.get(key);
  const N = 16, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const ctx = cv.getContext('2d');
  ctx.font = '13px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(e, N / 2, N / 2 + 1);
  const d = ctx.getImageData(0, 0, N, N);
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i + 3] < 110) { d.data[i + 3] = 0; continue; }
    d.data[i + 3] = 255;
    for (let k = 0; k < 3; k++) d.data[i + k] = Math.round(d.data[i + k] / 48) * 48;
  }
  ctx.putImageData(d, 0, 0);
  const html = `<img class="px" src="${_canvasToURL(cv)}" width="${size}" height="${size}" alt="" draggable="false">`;
  _emojiCache.set(key, html);
  return html;
}

/* Pixel egg sprite, coloured per egg type */
const EGG_PALETTE = { 1: '#cbd5e1', 2: '#4cc9a0', 3: '#4d9fff', 4: '#b36bff', 5: '#ffb830' };
function eggArt(egg, size) { // egg: egg type object or egg item
  const et = egg.n ? egg : eggType(egg);
  const bred = egg.bred;
  const key = 'egg' + et.id + (bred ? 'b' : '') + size;
  if (_emojiCache.has(key)) return _emojiCache.get(key);
  const N = 14, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(N, N);
  const base = _hex(EGG_PALETTE[et.t]), spot = _hex(et.w === 'salt' ? '#2b9fd8' : '#7a5230');
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const ry = y < 6 ? 5.6 : 6.5, d = ((x - 6.5) / 4.8) ** 2 + ((y - 7) / ry) ** 2;
    if (d > 1) continue;
    let c = base;
    if ((x * 3 + y * 5) % 7 === 0 || (bred && (x + y) % 5 === 0)) c = _mix(c, spot, 0.55);
    c = _shade(c, y < 5 ? 0.18 : y > 9 ? -0.22 : 0);
    if (d > 0.7) c = _shade(c, -0.5);
    const i = (y * N + x) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const html = `<img class="px" src="${_canvasToURL(cv)}" width="${size}" height="${size}" alt="" draggable="false">`;
  _emojiCache.set(key, html);
  return html;
}

/* Tiled gravel texture (data URL) per colour */
const _gravelCache = {};
function gravelURL(color) {
  if (_gravelCache[color]) return _gravelCache[color];
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 8;
  const ctx = cv.getContext('2d'), c = _hex(color);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) {
    const h = hash(x + ',' + y) % 5;
    ctx.fillStyle = `rgb(${_shade(c, h === 0 ? 0.16 : h === 1 ? -0.16 : y === 0 ? -0.3 : 0).map(Math.round)})`;
    ctx.fillRect(x, y, 1, 1);
  }
  return (_gravelCache[color] = cv.toDataURL());
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
