'use strict';
/* ===== Pixel-art decoration sprites (procedural, light from upper-left) ===== */

class Spr {
  constructor(w, h) { this.w = w; this.h = h; this.cv = document.createElement('canvas'); this.cv.width = w; this.cv.height = h; this.ctx = this.cv.getContext('2d'); this.img = this.ctx.createImageData(w, h); this.d = this.img.data; }
  px(x, y, c, a) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 4; this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = a == null ? 255 : a; }
  has(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.d[(y * this.w + x) * 4 + 3] > 0; }
  lit(c, l, x, y) { const q = Math.floor(l * 5 + BAYER[y & 3][x & 3] * 0.8 + 0.5) / 5; return shadeC(c, q * 0.42); }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  rectS(x, y, w, h, c, lo) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, this.lit(c, (0.45 - i / w) * 0.9 + (lo || 0) - j / h * 0.25, x + i, y + j)); }
  ell(cx, cy, rx, ry, c, flat) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) this.px(x, y, flat ? c : this.lit(c, -(dx * 0.55 + dy * 0.8) * 0.9, x, y));
    }
  }
  line(x0, y0, x1, y1, c, th) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5));
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, r = th == null ? 1 : (typeof th === 'function' ? th(t) : th);
      for (let a = 0; a < r; a++) for (let b = 0; b < r; b++) this.px(x - r / 2 + a, y - r / 2 + b, c); }
  }
  poly(pts, c, shaded) {
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9; pts.forEach(p => { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); });
    for (let y = Math.floor(miny); y <= Math.ceil(maxy); y++) for (let x = Math.floor(minx); x <= Math.ceil(maxx); x++) {
      if (pointInPoly(x + 0.5, y + 0.5, pts)) this.px(x, y, shaded === false ? c : this.lit(c, 0.35 - ((x - minx) / (maxx - minx + 1) * 0.5 + (y - miny) / (maxy - miny + 1) * 0.5) * 0.9, x, y));
    }
  }
  /* auto outline + export */
  done(outline) {
    const w = this.w, h = this.h, src = new Uint8ClampedArray(this.d), d = this.d;
    if (outline !== false) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4; if (!src[i + 3]) continue;
        const e = (xx, yy) => xx < 0 || yy < 0 || xx >= w || yy >= h || !src[(yy * w + xx) * 4 + 3];
        if (e(x - 1, y) || e(x + 1, y) || e(x, y - 1) || e(x, y + 1)) { const c = shadeC([src[i], src[i + 1], src[i + 2]], -0.58); d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; }
      }
    }
    this.ctx.putImageData(this.img, 0, 0); return this.cv;
  }
}
function pointInPoly(x, y, p) { let r = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) r = !r; return r; }
const H_ = _hx;

/* leaf blade: curved tapered stroke */
function blade(S, x0, y0, x1, y1, bend, c, w0, w1) {
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t + bend * Math.sin(t * Math.PI) , y = y0 + (y1 - y0) * t;
    const w = w0 + (w1 - w0) * t;
    for (let k = -Math.floor(w / 2); k <= Math.floor(w / 2); k++) S.px(x + k, y, S.lit(c, 0.25 - t * 0.3 + (k < 0 ? 0.18 : -0.08), Math.round(x + k), Math.round(y)));
  }
}

const DECOR_DRAW = {
  javafern: [34, 34, S => { for (let i = 0; i < 9; i++) { const a = -1.1 + i * 0.28, len = 20 + (i % 3) * 3; blade(S, 17, 33, 17 + Math.sin(a) * len, 33 - Math.cos(a) * len, Math.sin(a) * 4, i % 2 ? H_('#2f8f4a') : H_('#3fae5a'), 4, 1); } S.ell(17, 33, 5, 2, H_('#5b4a3a')); }],
  anubias: [34, 30, S => { for (let i = 0; i < 6; i++) { const x = 6 + i * 4.4, hgt = 12 + (i * 5) % 12; S.line(17, 29, x, 29 - hgt + 4, H_('#3a7a3a'), 1); S.ell(x, 29 - hgt, 5, 4, i % 2 ? H_('#1f7a45') : H_('#2b9a55')); S.line(x - 4, 29 - hgt, x + 4, 29 - hgt, H_('#7fd69a'), 1); } S.ell(17, 29, 7, 2, H_('#5b4a3a')); }],
  sword: [40, 44, S => { for (let i = 0; i < 11; i++) { const a = -1.3 + i * 0.26, len = 26 + ((i * 7) % 10); blade(S, 20, 42, 20 + Math.sin(a) * len, 42 - Math.cos(a) * len * 1.0, Math.sin(a) * 6, i % 3 === 0 ? H_('#4ab85a') : i % 3 === 1 ? H_('#2f9a4a') : H_('#60cc6a'), 5, 1); } S.ell(20, 42, 5, 2, H_('#5b4a3a')); }],
  wisteria: [32, 52, S => { for (let i = 0; i < 5; i++) { const x = 6 + i * 5, top = 8 + (i * 9) % 14; S.line(16, 50, x, top, H_('#5da83a'), 1); for (let j = 0; j < 7; j++) { const y = top + j * 6; if (y > 46) break; blade(S, x, y, x - 5, y + 4, 0, H_('#8be04a'), 2, 1); blade(S, x, y, x + 5, y + 4, 0, H_('#a5ee60'), 2, 1); } } }],
  lotus: [40, 46, S => { S.line(12, 45, 12, 22, H_('#3f8f4a'), 1); S.line(28, 45, 28, 30, H_('#3f8f4a'), 1); S.ell(12, 22, 11, 4, H_('#2f9a55')); S.ell(28, 30, 9, 3, H_('#2b8a4f')); S.line(12, 22, 8, 21, H_('#7fd69a'), 1);
    const cx = 20, cy = 14; for (let i = 0; i < 7; i++) { const a = -Math.PI + i * Math.PI / 6; S.ell(cx + Math.cos(a) * 6, cy + Math.sin(a) * 5 + 3, 3, 5, i % 2 ? H_('#ff9ec8') : H_('#ffc2dc')); } S.ell(cx, cy + 3, 3, 3, H_('#ffe27a')); S.line(cx, 45, cx, cy + 8, H_('#3f8f4a'), 1); }],
  seagrass: [38, 42, S => { for (let i = 0; i < 14; i++) { const x = 4 + i * 2.2; blade(S, x, 41, x + (i % 2 ? 8 : -8) * (0.4 + (i % 4) / 6), 6 + (i * 7) % 18, (i % 2 ? 5 : -5), i % 3 ? H_('#a8e04a') : H_('#78c03a'), 3, 1); } }],
  kelp: [30, 62, S => { for (let k = 0; k < 3; k++) { const x0 = 8 + k * 7; for (let y = 60; y > 4; y--) { const t = (60 - y) / 56, x = x0 + Math.sin(t * 6 + k * 2) * 4; S.px(x, y, S.lit(H_('#8a6a1f'), 0.2 - t * 0.2, Math.round(x), y)); S.px(x + 1, y, S.lit(H_('#b08a2a'), 0.1, Math.round(x) + 1, y)); S.px(x + 2, y, H_('#6a4f15')); if (y % 11 === 0) S.ell(x + 4, y, 2.2, 2.6, H_('#d6a93a')); } } }],
  seafan: [40, 44, S => { const col = H_('#c2305a'); for (let r = 6; r < 40; r += 3) for (let a = -1.25; a <= 1.25; a += 0.035) { const x = 20 + Math.sin(a) * r * 0.62, y = 43 - Math.cos(a) * r; if ((Math.round(r / 3) + Math.round(a * 22)) % 2 === 0 || r % 9 === 0) S.px(x, y, S.lit(a < 0 ? H_('#e0507a') : col, 0.2 - r / 90, Math.round(x), Math.round(y))); } for (let a = -1.2; a <= 1.2; a += 0.17) S.line(20, 43, 20 + Math.sin(a) * 25, 43 - Math.cos(a) * 40, H_('#a82050'), 1); S.rect(18, 40, 5, 4, H_('#7a5a4a')); }],
  pebbles: [40, 22, S => { [[11, 16, 10, 6, '#7f8b99'], [27, 16, 11, 6, '#9aa4b0'], [18, 9, 8, 6, '#c2b79e'], [32, 8, 5, 4, '#6e7986'], [6, 8, 5, 4, '#b8aa8c'], [20, 18, 6, 3, '#58626e']].forEach(r => S.ell(r[0], r[1], r[2], r[3], H_(r[4]))); }],
  driftwood: [48, 36, S => { for (let t = 0; t <= 1; t += 0.006) { const x = 4 + t * 40, y = 30 - Math.sin(t * Math.PI) * 20 + t * 2, w = 9 - t * 3; for (let k = 0; k < w; k++) S.px(x, y - k, S.lit(H_('#8a6a46'), 0.35 - k * 0.1, Math.round(x), Math.round(y - k))); if (Math.round(t * 100) % 7 === 0) S.px(x, y - 3, H_('#5a3f26')); } S.line(18, 14, 11, 3, H_('#7a5a3a'), 3); S.line(30, 13, 38, 4, H_('#6a4a2e'), 3); S.ell(28, 20, 2, 2, H_('#4a331f'), true); S.ell(14, 24, 1.5, 1.5, H_('#4a331f'), true); S.ell(8, 32, 7, 3, H_('#6a4a2e')); }],
  cave: [48, 36, S => { S.ell(24, 26, 22, 18, H_('#8a8f9a')); S.ell(14, 20, 9, 8, H_('#a2a8b3')); S.ell(34, 22, 8, 8, H_('#767c88')); S.ell(24, 30, 9, 10, H_('#15151f'), true); S.rect(15, 30, 18, 8, H_('#15151f')); S.ell(24, 30, 6, 7, H_('#08080e'), true); for (let i = 0; i < 20; i++) S.px(6 + (i * 13) % 36, 14 + (i * 7) % 18, H_('#6c7380')); }],
  dragonstone: [36, 44, S => { S.poly([[4, 42], [8, 20], [16, 4], [22, 14], [30, 8], [34, 28], [31, 42]], H_('#5f7a74')); for (let y = 8; y < 42; y += 4) for (let x = 6 + (y % 8 ? 0 : 3); x < 32; x += 6) if (S.has(x, y)) { S.px(x, y, H_('#86a69c')); S.px(x + 1, y, H_('#86a69c')); S.px(x, y + 1, H_('#3f544f')); } S.line(14, 8, 18, 30, H_('#ff5a3c'), 1); S.px(17, 20, H_('#ffb347')); S.px(24, 30, H_('#ff5a3c')); }],
  obsidian: [30, 56, S => { S.poly([[11, 54], [9, 24], [14, 3], [20, 22], [21, 54]], H_('#2a1f4a')); S.poly([[19, 54], [19, 32], [25, 16], [28, 54]], H_('#3a2b66')); S.poly([[2, 54], [4, 38], [8, 30], [10, 54]], H_('#22183c')); S.line(14, 5, 12, 40, H_('#9a7be0'), 1); S.line(25, 18, 24, 40, H_('#a68cf0'), 1); S.px(13, 14, H_('#ffffff')); }],
  bubbles: [30, 24, S => { S.rect(6, 18, 18, 4, H_('#3a3f4a')); S.rect(7, 18, 16, 1, H_('#5a6070')); S.rect(22, 8, 2, 11, H_('#2a2e38')); S.rect(10, 17, 3, 1, H_('#d6ecff')); }],
  chest: [38, 32, S => { S.rectS(4, 14, 30, 16, H_('#8a5a2e')); S.poly([[4, 14], [6, 4], [32, 4], [34, 14]], H_('#a06a34')); S.rect(4, 14, 30, 3, H_('#d9a63a')); S.rect(16, 14, 6, 8, H_('#f0c040')); S.rect(18, 17, 2, 3, H_('#4a3010')); S.rect(8, 4, 2, 26, H_('#d9a63a')); S.rect(28, 4, 2, 26, H_('#c8942a')); for (let i = 0; i < 6; i++) S.px(10 + i * 3, 3 + (i % 2), H_('#ffe27a')); S.ell(19, 3, 3, 2, H_('#ffd54a')); }],
  neon: [30, 40, S => { S.rect(14, 26, 3, 13, H_('#3a3f4a')); S.rect(8, 37, 15, 3, H_('#2a2e38')); S.rect(2, 2, 26, 24, H_('#1a1530')); const g = H_('#ff4fd8'), b = H_('#4fe0ff'); for (let x = 4; x < 26; x++) { S.px(x, 4, g); S.px(x, 23, g); } for (let y = 4; y < 24; y++) { S.px(4, y, g); S.px(25, y, g); } S.line(9, 16, 9, 9, b, 1); S.line(9, 9, 14, 16, b, 1); S.line(14, 16, 14, 9, b, 1); S.line(19, 9, 19, 17, b, 1); S.px(19, 20, b); }],
  castle: [52, 52, S => { S.rectS(8, 20, 36, 30, H_('#9aa0ac')); S.rectS(3, 8, 12, 42, H_('#8c92a0')); S.rectS(37, 8, 12, 42, H_('#868c9a')); [[3, 12], [37, 12]].forEach(([x]) => { S.poly([[x - 1, 9], [x + 6, -1 + 0], [x + 13, 9]], H_('#c0453a')); for (let i = 0; i < 3; i++) S.rect(x + i * 5, 6, 3, 3, H_('#8c92a0')); }); S.poly([[18, 22], [26, 6], [34, 22]], H_('#c0453a')); S.line(26, 6, 26, 0, H_('#4a331f'), 1); S.poly([[26, 0], [33, 2], [26, 4]], H_('#ffd54a'), false); S.ell(26, 42, 6, 8, H_('#1a1a26'), true); S.rect(20, 42, 12, 8, H_('#1a1a26')); for (let i = 0; i < 4; i++) S.rect(7 + i * 9, 30 + (i % 2) * 6, 2, 4, H_('#3a3f55')); }],
  heart: [34, 46, S => { S.rectS(5, 38, 24, 8, H_('#d8d4e0')); S.rectS(9, 33, 16, 6, H_('#e8e4f0')); const hp = []; for (let a = 0; a < 6.3; a += 0.1) hp.push([17 + 13 * Math.pow(Math.sin(a), 3), 20 - (10.5 * Math.cos(a) - 4 * Math.cos(2 * a) - 1.5 * Math.cos(3 * a) - 0.7 * Math.cos(4 * a))]); S.poly(hp, H_('#ff5c93')); S.px(9, 11, H_('#ffd0e2')); S.px(10, 11, H_('#ffd0e2')); S.px(9, 12, H_('#ffd0e2')); S.px(11, 10, H_('#ffd0e2')); }],
  ship: [60, 56, S => { S.poly([[4, 36], [56, 30], [48, 50], [14, 54]], H_('#7a4a24')); S.poly([[4, 36], [56, 30], [55, 34], [5, 40]], H_('#a8703a')); for (let i = 0; i < 5; i++) S.ell(12 + i * 9, 44, 2, 2, H_('#2a1a10'), true); S.line(30, 33, 28, 4, H_('#5a3a1a'), 2); S.poly([[29, 6], [46, 12], [44, 28], [29, 24]], H_('#d8cfae')); S.line(31, 12, 42, 14, H_('#a89d7a'), 1); S.px(36, 18, H_('#6a604a')); S.px(39, 22, H_('#6a604a')); S.line(13, 36, 8, 20, H_('#5a3a1a'), 1); S.rect(3, 54, 12, 2, H_('#6a604a')); }],
  brain: [38, 28, S => { S.ell(19, 18, 17, 12, H_('#e8a8a0')); const d = H_('#b87a78'); for (let a = 0; a < 9; a++) { for (let t = 0; t < 1; t += 0.03) { const x = 5 + a * 3.4 + Math.sin(t * 9 + a) * 1.8, y = 8 + t * 20; if (S.has(Math.round(x), Math.round(y))) S.px(x, y, d); } } }],
  anemone: [40, 40, S => { S.ell(20, 34, 8, 5, H_('#7a3a8a')); for (let i = 0; i < 16; i++) { const a = -2.6 + i * 0.35, len = 18 + (i % 3) * 3; blade(S, 20 + Math.cos(a + 1.57) * 3, 33, 20 + Math.sin(a) * len * 0.8, 33 - Math.abs(Math.cos(a)) * len, Math.sin(a) * 3, i % 2 ? H_('#ff7ab8') : H_('#e65aa0'), 3, 1); S.px(20 + Math.sin(a) * len * 0.8, 33 - Math.abs(Math.cos(a)) * len, H_('#ffe0ef')); } }],
};
const DECOR_SWAY = { javafern: 2.2, anubias: 1, sword: 2.4, wisteria: 3, lotus: 1, seagrass: 3, kelp: 3.5, anemone: 2, seafan: 1 };
const _decorCache = {};
function decorSprite(id) {
  if (_decorCache[id]) return _decorCache[id];
  const [w, h, fn] = DECOR_DRAW[id], S = new Spr(w, h);
  fn(S);
  return (_decorCache[id] = S.done());
}
function decorIcon(id, size) {
  const key = 'ico' + id + size;
  if (_decorCache[key]) return _decorCache[key];
  const cv = decorSprite(id), sc = Math.max(1, Math.floor(size / Math.max(cv.width, cv.height)));
  return (_decorCache[key] = `<img class="px" src="${cv.toDataURL()}" style="width:${cv.width * sc}px;height:${cv.height * sc}px" alt="" draggable="false">`);
}
