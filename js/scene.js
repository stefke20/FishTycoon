'use strict';
/* ===== Isometric pixel-art aquarium (canvas) ===== */

const TANK_DIM = { starter: [4, 3, 70], medium: [5, 4, 82], large: [6, 5, 94], huge: [8, 6, 104], reef_s: [5, 4, 82], reef_m: [6, 5, 94], reef_l: [8, 6, 104], reef_g: [10, 7, 112] };
const DECOR_POS = [[0.24, 0.3], [0.72, 0.22], [0.3, 0.74], [0.74, 0.7]];
const TW2 = 16, TH2 = 8;
const WATER_COL = { fresh: ['#58c0e8', '#2a8fc4', '#176a9e', '#0d4a78', '#082f55'], salt: ['#4fe0e0', '#26b5d0', '#1288b0', '#0a5f8c', '#073f66'] };

function bandGradient(w, h, cols, fn) { // dithered vertical gradient canvas
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), pal = cols.map(_hx);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = fn ? fn(x, y, w, h) : y / h, f = Math.max(0, Math.min(0.999, t)) * (pal.length - 1) + BAYER[y & 3][x & 3] * 0.8;
    const i0 = Math.max(0, Math.min(pal.length - 1, Math.round(f))), c = pal[i0], o = (y * w + x) * 4;
    img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); return cv;
}
function wallArt(bg, w, h, salt) {
  const base = bandGradient(w, h, WATER_COL[salt ? 'salt' : 'fresh'], (x, y) => y / h * 0.9 + 0.05);
  const ctx = base.getContext('2d');
  const rect = (x, y, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh)); };
  const blob = (cx, cy, r, c) => { ctx.fillStyle = c; for (let y = -r; y <= r; y++) { const hw = Math.floor(Math.sqrt(r * r - y * y)); ctx.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1); } };
  if (!bg) { // soft light shafts
    for (let i = 0; i < 6; i++) { const x0 = i * w / 6 + 6; for (let y = 0; y < h; y++) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(Math.round(x0 + y * 0.35), y, 7, 1); } }
    return base;
  }
  if (bg === 'bg_blue') {
    const g = bandGradient(w, h, ['#1b6fb0', '#12508c', '#0b3a6c', '#06264d', '#041a36']); ctx.drawImage(g, 0, 0);
    for (let i = 0; i < 5; i++) { const x = (i * 53 + 11) % w; blob(x, h - 6, 14 + (i * 7) % 10, '#05203d'); }
    for (let i = 0; i < 5; i++) for (let y = 0; y < h; y++) { ctx.fillStyle = 'rgba(160,220,255,0.07)'; ctx.fillRect(Math.round(i * w / 5 + y * 0.3), y, 6, 1); }
  } else if (bg === 'bg_forest') {
    const g = bandGradient(w, h, ['#6fcf97', '#2fa070', '#1d7a58', '#0f5440', '#093b2e']); ctx.drawImage(g, 0, 0);
    for (let layer = 0; layer < 2; layer++) for (let i = 0; i < 7; i++) { const x = (i * 41 + layer * 19) % w, c = layer ? '#0d4a38' : '#145f45'; rect(x, 18 + layer * 12, 4 + layer, h, c); for (let k = 0; k < 4; k++) blob(x + 2 + ((k * 11) % 9) - 4, 14 + layer * 10 + k * 6, 9 - layer * 2, layer ? '#0a3d2f' : '#1a7a55'); }
  } else if (bg === 'bg_reef') {
    const g = bandGradient(w, h, ['#4fd6e8', '#2a9ec8', '#2a6ea8', '#27487f', '#1d2b5c']); ctx.drawImage(g, 0, 0);
    const cc = ['#e8587a', '#f08a5d', '#b8408a', '#ff9eb0'];
    for (let i = 0; i < 9; i++) { const x = (i * 29 + 7) % w, hh = 14 + (i * 13) % 26; ctx.fillStyle = cc[i % 4]; for (let y = 0; y < hh; y++) { const wv = Math.sin(y * 0.4 + i) * 2; ctx.fillRect(Math.round(x + wv), h - y, 3, 1); if (y > hh * 0.4 && y % 6 < 2) { ctx.fillRect(Math.round(x + wv - 5), h - y, 5, 1); ctx.fillRect(Math.round(x + wv + 3), h - y, 5, 1); } } }
  } else if (bg === 'bg_sunset') {
    const g = bandGradient(w, h, ['#ffd27a', '#ff9a5c', '#e5607a', '#9a4a9a', '#3a3a8a', '#1f2060']); ctx.drawImage(g, 0, 0);
    blob(w * 0.62, h * 0.42, 15, '#fff0b0'); blob(w * 0.62, h * 0.42, 11, '#ffe08a');
    for (let y = Math.floor(h * 0.5); y < h; y += 4) { ctx.fillStyle = 'rgba(255,230,180,0.25)'; ctx.fillRect(Math.round(w * 0.62 - (24 - (y - h * 0.5) * 0.2)), y, Math.round(48 - (y - h * 0.5) * 0.4), 1); }
  } else if (bg === 'bg_space') {
    const g = bandGradient(w, h, ['#2a1060', '#1a0a45', '#0d0524', '#05020f'], (x, y) => y / h * 0.8 + Math.sin(x * 0.05) * 0.1); ctx.drawImage(g, 0, 0);
    for (let i = 0; i < 70; i++) { const hh = hash('star' + i); ctx.fillStyle = hh % 5 === 0 ? '#9ad1ff' : '#ffffff'; ctx.fillRect(hh % w, (hh >> 8) % h, 1, 1); }
    blob(w * 0.7, h * 0.35, 12, '#6a3fb5'); blob(w * 0.68, h * 0.33, 8, '#8f63d6'); ctx.fillStyle = '#c9a8ff'; ctx.fillRect(Math.round(w * 0.64), Math.round(h * 0.28), 3, 2);
  }
  return base;
}

function pxLine(ctx, x0, y0, x1, y1, color, th) {
  ctx.fillStyle = color; th = th || 1;
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
  for (let i = 0; i <= n; i++) { const t = n ? i / n : 0; ctx.fillRect(Math.round(x0 + (x1 - x0) * t - (th - 1) / 2), Math.round(y0 + (y1 - y0) * t - (th - 1) / 2), th, th); }
}
function polyFill(ctx, pts, color) { ctx.fillStyle = color; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill(); }

class TankScene {
  constructor(canvas, tank, mini, onFish) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.tank = tank; this.mini = mini; this.onFish = onFish;
    this.hits = []; this.bubbles = []; this.t0 = performance.now() / 1000; this.key = '';
    this.layout();
    if (!mini && onFish) {
      canvas.addEventListener('click', e => { const f = this.pick(e); if (f) onFish(f); });
      canvas.addEventListener('mousemove', e => { const f = this.pick(e); canvas.style.cursor = f ? 'pointer' : 'default'; canvas.title = f ? fishName(getFish(f)) : ''; });
    }
  }
  pick(e) {
    const r = this.cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * this.natW, y = (e.clientY - r.top) / r.height * this.natH;
    for (let i = this.hits.length - 1; i >= 0; i--) { const h = this.hits[i]; if (x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1) return h.id; }
    return null;
  }
  layout() {
    const tt = TANK_TYPE[this.tank.type], [N, M, WH] = TANK_DIM[tank_type_key(this.tank)];
    this.N = N; this.M = M; this.WH = WH; this.WTR = WH - 8; this.salt = tt.w === 'salt';
    const pad = 10; this.pad = pad;
    this.cx = pad + M * TW2; this.cy = pad + WH + 6;
    this.natW = (N + M) * TW2 + pad * 2; this.natH = this.cy + (N + M) * TH2 + 16 + pad;
    this.cv.width = this.natW; this.cv.height = this.natH;
    const sc = this.mini ? 1 : Math.max(1, Math.min(5, Math.floor(920 / this.natW), Math.floor(780 / this.natH)));
    this.cv.style.width = (this.mini ? '100%' : this.natW * sc + 'px');
    this.cv.style.maxWidth = this.natW * (this.mini ? 1.4 : sc) + 'px';
    this.cv.style.imageRendering = 'pixelated';
    this.ctx.imageSmoothingEnabled = false;
  }
  P(x, z, h) { return [this.cx + (x - z) * TW2, this.cy + (x + z) * TH2 - (h || 0)]; }
  build() {
    const tk = this.tank, N = this.N, M = this.M, WH = this.WH, skin = SKIN[tk.skin], W = this.natW, H = this.natH;
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
    const [back, b] = mk(), [front, f] = mk();
    const T = this.P(0, 0), R = this.P(N, 0), Lf = this.P(0, M), B = this.P(N, M);
    const up = p => [p[0], p[1] - WH];
    // ---- backdrop wall art
    const wr = wallArt(tk.bg, N * TW2, WH, this.salt), wl = wallArt(tk.bg, M * TW2, WH, this.salt);
    b.save(); b.setTransform(1, 0.5, 0, 1, T[0], T[1] - WH); b.drawImage(wr, 0, 0); b.restore();
    b.save(); b.setTransform(-1, 0.5, 0, 1, T[0], T[1] - WH); b.drawImage(wl, 0, 0); b.restore();
    // wall shading: right wall slightly darker
    polyFill(b, [T, R, up(R), up(T)], 'rgba(0,10,30,0.18)');
    polyFill(b, [T, Lf, up(Lf), up(T)], 'rgba(255,255,255,0.04)');
    // ---- floor
    const fl = b.getImageData(0, 0, W, H), D = fl.data, gc = _hx(skin.gravel);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const sx = (x + 0.5 - this.cx) / TW2, sy = (y + 0.5 - this.cy) / TH2, wx = (sx + sy) / 2, wz = (sy - sx) / 2;
      if (wx < 0 || wz < 0 || wx >= N || wz >= M) continue;
      const hh = hash(x + ',' + y), n = hh % 9;
      let sh = n === 0 ? 0.16 : n === 1 ? -0.16 : n === 2 ? 0.07 : 0;
      sh -= 0.22 * Math.max(0, 1 - Math.min(wx, wz) / 0.9);
      sh += 0.06 * Math.sin((wx * 2.2 + wz * 1.4) * 2.0);
      const c = shadeC(gc, Math.round(sh * 8) / 8), o = (y * W + x) * 4;
      D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; D[o + 3] = 255;
      if (hh % 53 === 0) { D[o] = 235; D[o + 1] = 235; D[o + 2] = 225; }
    }
    b.putImageData(fl, 0, 0);
    // substrate + frame (front faces)
    const sub = 7, fh = 8, drop = (p, d) => [p[0], p[1] + d];
    const faceL = [Lf, B, drop(B, sub), drop(Lf, sub)], faceR = [B, R, drop(R, sub), drop(B, sub)];
    polyFill(b, faceL, shadeCss(skin.gravel, -0.15)); polyFill(b, faceR, shadeCss(skin.gravel, -0.32));
    for (let i = 0; i < 160; i++) { const hh = hash('sb' + i), u = (hh % 1000) / 1000, onL = hh & 1, p0 = onL ? Lf : B, p1 = onL ? B : R; const x = Math.round(p0[0] + (p1[0] - p0[0]) * u), y = Math.round(p0[1] + (p1[1] - p0[1]) * u + ((hh >> 10) % sub)); b.fillStyle = (hh >> 4) & 1 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.22)'; b.fillRect(x, y, 1, 1); }
    const fcol = skin.frame;
    const fL = [drop(Lf, sub), drop(B, sub), drop(B, sub + fh), drop(Lf, sub + fh)], fR = [drop(B, sub), drop(R, sub), drop(R, sub + fh), drop(B, sub + fh)];
    polyFill(b, fL, shadeCss(fcol, 0.0)); polyFill(b, fR, shadeCss(fcol, -0.3));
    pxLine(b, Lf[0], Lf[1] + sub, B[0], B[1] + sub, shadeCss(fcol, 0.35), 1); pxLine(b, B[0], B[1] + sub, R[0], R[1] + sub, shadeCss(fcol, 0.12), 1);
    pxLine(b, Lf[0], Lf[1] + sub + fh, B[0], B[1] + sub + fh, shadeCss(fcol, -0.55), 1); pxLine(b, B[0], B[1] + sub + fh, R[0], R[1] + sub + fh, shadeCss(fcol, -0.6), 1);
    // back rim + back glass edges
    const rim = shadeCss(fcol, 0.1), rimHi = shadeCss(fcol, 0.45);
    [[T, R], [T, Lf]].forEach(([p, q]) => { pxLine(b, p[0], p[1] - WH, q[0], q[1] - WH, rim, 2); pxLine(b, p[0], p[1] - WH - 1, q[0], q[1] - WH - 1, rimHi, 1); });
    pxLine(b, T[0], T[1], T[0], T[1] - WH, rim, 2); pxLine(b, R[0], R[1], R[0], R[1] - WH, rim, 1); pxLine(b, Lf[0], Lf[1], Lf[0], Lf[1] - WH, rim, 1);
    this.back = back;
    // ---- front overlay: water tint + posts + front rim + glass glare
    const wt = this.WTR, hexa = [Lf, B, R, [R[0], R[1] - wt], [T[0], T[1] - wt], [Lf[0], Lf[1] - wt]];
    f.save(); f.beginPath(); hexa.forEach((p, i) => (i ? f.lineTo(p[0], p[1]) : f.moveTo(p[0], p[1]))); f.closePath(); f.clip();
    const g = f.createLinearGradient(0, T[1] - wt, 0, B[1]); g.addColorStop(0, this.salt ? 'rgba(120,240,255,0.10)' : 'rgba(110,200,255,0.10)'); g.addColorStop(1, this.salt ? 'rgba(0,70,120,0.34)' : 'rgba(0,50,110,0.36)');
    f.fillStyle = g; f.fillRect(0, 0, W, H); f.restore();
    // water surface diamond
    polyFill(f, [[T[0], T[1] - wt], [R[0], R[1] - wt], [B[0], B[1] - wt], [Lf[0], Lf[1] - wt]], 'rgba(220,250,255,0.16)');
    [[[T[0], T[1] - wt], [R[0], R[1] - wt]], [[T[0], T[1] - wt], [Lf[0], Lf[1] - wt]], [[Lf[0], Lf[1] - wt], [B[0], B[1] - wt]], [[B[0], B[1] - wt], [R[0], R[1] - wt]]].forEach(([p, q]) => pxLine(f, p[0], p[1], q[0], q[1], 'rgba(235,252,255,0.55)', 1));
    // glare streaks on the front glass
    polyFill(f, [[Lf[0] + 5, Lf[1] - 6], [Lf[0] + 11, Lf[1] - 3], [Lf[0] + 11, Lf[1] - WH + 16], [Lf[0] + 5, Lf[1] - WH + 13]], 'rgba(255,255,255,0.07)');
    polyFill(f, [[B[0] + 6, B[1] - 6], [B[0] + 11, B[1] - 9], [B[0] + 11, B[1] - WH + 10], [B[0] + 6, B[1] - WH + 13]], 'rgba(255,255,255,0.06)');
    // front rim + posts
    [[Lf, B], [B, R]].forEach(([p, q]) => { pxLine(f, p[0], p[1] - WH, q[0], q[1] - WH, rim, 2); pxLine(f, p[0], p[1] - WH - 1, q[0], q[1] - WH - 1, rimHi, 1); pxLine(f, p[0], p[1] - WH + 2, q[0], q[1] - WH + 2, 'rgba(255,255,255,0.18)', 1); });
    [[Lf, 3], [B, 4], [R, 3]].forEach(([p, w]) => { f.fillStyle = shadeCss(fcol, -0.1); f.fillRect(p[0] - Math.floor(w / 2), p[1] - WH, w, WH + 1); f.fillStyle = rimHi; f.fillRect(p[0] - Math.floor(w / 2), p[1] - WH, 1, WH + 1); });
    this.front = front; this.wt = wt;
    this.key = tk.type + '|' + tk.bg + '|' + tk.skin;
  }
  decorList() { return this.tank.slots.map((id, i) => id ? { id, i } : null).filter(Boolean); }
  fishState(f) {
    const key = f.id + ':' + this.tank.id + (this.mini ? 'm' : '');
    let s = TankScene.states.get(key);
    if (!s) {
      const hs = hash(key), N = this.N, M = this.M;
      s = { x: 0.8 + (hs % 1000) / 1000 * (N - 1.6), z: 0.8 + ((hs >>> 10) % 1000) / 1000 * (M - 1.6), h: 12 + ((hs >>> 5) % 1000) / 1000 * (this.WTR - 40), vx: 0, vz: 0, vh: 0, tx: 0, tz: 0, th: 0, face: hs & 1 ? 1 : -1, ph: (hs % 100) / 10, spd: 0.35 + (hs % 40) / 100, wait: 0 };
      s.tx = s.x; s.tz = s.z; s.th = s.h; this.retarget(s);
      TankScene.states.set(key, s);
    }
    return s;
  }
  retarget(s) {
    const N = this.N, M = this.M, near = Math.random() < 0.6;
    const lo = 0.6;
    s.tx = near ? Math.max(lo, Math.min(N - lo, s.x + (Math.random() - 0.5) * 3)) : lo + Math.random() * (N - 2 * lo);
    s.tz = near ? Math.max(lo, Math.min(M - lo, s.z + (Math.random() - 0.5) * 3)) : lo + Math.random() * (M - 2 * lo);
    s.th = 10 + Math.random() * (this.WTR - 34);
    s.burst = 0.6 + Math.random() * 0.8;
    s.wait = Math.random() < 0.18 ? 0.5 + Math.random() * 1.6 : 0;
  }
  step(s, dt) {
    const dx = s.tx - s.x, dz = s.tz - s.z, dh = (s.th - s.h) / 16, d = Math.hypot(dx, dz, dh);
    let vx = 0, vz = 0, vh = 0;
    if (s.wait > 0) s.wait -= dt;
    else if (d < 0.25) this.retarget(s);
    else { const sp = s.spd * s.burst; vx = dx / d * sp; vz = dz / d * sp; vh = dh / d * sp * 16 * 0.6; }
    const k = 1 - Math.exp(-dt * 1.7);
    s.vx += (vx - s.vx) * k; s.vz += (vz - s.vz) * k; s.vh += (vh - s.vh) * k;
    s.x = Math.max(0.5, Math.min(this.N - 0.5, s.x + s.vx * dt)); s.z = Math.max(0.5, Math.min(this.M - 0.5, s.z + s.vz * dt)); s.h = Math.max(6, Math.min(this.WTR - 22, s.h + s.vh * dt));
    const svx = (s.vx - s.vz);
    const tf = svx > 0.05 ? 1 : svx < -0.05 ? -1 : (s.face >= 0 ? 1 : -1);
    s.face += (tf - s.face) * (1 - Math.exp(-dt * 7));
    s.sp = Math.hypot(s.vx, s.vz) + Math.abs(s.vh) / 40;
    s.ph += dt * (2.2 + s.sp * 9);
  }
  frame(now) {
    const ctx = this.ctx, tk = this.tank, t = now / 1000, dt = Math.min(0.05, this.last ? t - this.last : 0.016); this.last = t;
    const k = tk.type + '|' + tk.bg + '|' + tk.skin;
    if (k !== this.key || !this.back) this.build();
    ctx.clearRect(0, 0, this.natW, this.natH);
    ctx.drawImage(this.back, 0, 0);
    const items = [], fs = fishIn(tk.id);
    // decor
    for (const d of this.decorList()) {
      const [fx, fz] = DECOR_POS[d.i], x = this.N * fx, z = this.M * fz, sp = this.P(x, z, 0), cv = decorSprite(d.id);
      items.push({ k: x + z, draw: () => this.drawDecor(d.id, cv, sp, t, d.i) });
      if (d.id === 'bubbles' && Math.random() < dt * 8) this.bubbles.push({ x: sp[0] + (Math.random() - 0.5) * 6 + 4, y: sp[1] - 20, vy: 22 + Math.random() * 14, ph: Math.random() * 6, r: Math.random() < 0.3 ? 2 : 1 });
    }
    this.hits = [];
    for (const f of fs) {
      const s = this.fishState(f); this.step(s, dt);
      const A = SPECIES[f.sp], base = (this.mini ? 18 : 22) + (this.mini ? 3.5 : 5) * A.t;
      const L = Math.max(14, Math.round(base * (0.55 + 0.45 * Math.min(1, f.g)) / 4) * 4);
      const frameIdx = Math.floor(s.ph) & 3, spr = fishCanvas(f.sp, f.mods, L, frameIdx);
      const sp = this.P(s.x, s.z, s.h), fl = this.P(s.x, s.z, 0);
      items.push({ k: s.x + s.z + 0.0001, draw: () => this.drawFish(f, s, spr, sp, fl) });
    }
    // gentle separation so fish don't stack on each other
    const sts = fs.map(f => this.fishState(f));
    for (let i = 0; i < sts.length; i++) for (let j = i + 1; j < sts.length; j++) {
      const a = sts[i], b = sts[j], dx = a.x - b.x, dz = a.z - b.z, dh = (a.h - b.h) / 22, d = Math.hypot(dx, dz, dh);
      if (d < 1.1 && d > 0.001) { const push = (1.1 - d) * 0.9 * dt / d; a.x += dx * push; a.z += dz * push; b.x -= dx * push; b.z -= dz * push; a.h += dh * 22 * push * 0.5; b.h -= dh * 22 * push * 0.5; }
    }
    items.sort((a, b) => a.k - b.k).forEach(i => i.draw());
    // light shafts (clipped to water)
    const T = this.P(0, 0), R = this.P(this.N, 0), Lf = this.P(0, this.M), B = this.P(this.N, this.M), wt = this.wt;
    ctx.save(); ctx.beginPath(); [Lf, B, R, [R[0], R[1] - wt], [T[0], T[1] - wt], [Lf[0], Lf[1] - wt]].forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    for (let i = 0; i < 5; i++) { const x0 = ((i * 61 + t * 3) % (this.natW + 80)) - 40; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + 14, 0); ctx.lineTo(x0 - 40 + 14, this.natH); ctx.lineTo(x0 - 40, this.natH); ctx.fill(); }
    // bubbles
    if (!this.mini || Math.random() < dt * 0.6) if (Math.random() < dt * (this.mini ? 0.6 : 1.6)) { const bx = 0.6 + Math.random() * (this.N - 1.2), bz = 0.6 + Math.random() * (this.M - 1.2), p = this.P(bx, bz, 2); this.bubbles.push({ x: p[0], y: p[1], vy: 14 + Math.random() * 10, ph: Math.random() * 6, r: Math.random() < 0.25 ? 2 : 1 }); }
    this.bubbles = this.bubbles.filter(b => { b.y -= b.vy * dt; b.x += Math.sin(t * 3 + b.ph) * 0.12; return b.y > T[1] - wt + 2 + (b.x - this.cx) * 0; });
    ctx.fillStyle = 'rgba(235,252,255,0.75)';
    this.bubbles.forEach(b => { const x = Math.round(b.x), y = Math.round(b.y); if (b.r === 1) ctx.fillRect(x, y, 2, 2); else { ctx.fillRect(x, y - 1, 2, 1); ctx.fillRect(x - 1, y, 1, 2); ctx.fillRect(x + 2, y, 1, 2); ctx.fillRect(x, y + 2, 2, 1); } });
    // surface ripples
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    for (let i = 0; i < 7; i++) { const u = (i * 0.173 + t * 0.03) % 1, v = (i * 0.37) % 1, p = this.P(u * this.N, v * this.M, wt); ctx.fillRect(Math.round(p[0]) - 3, Math.round(p[1]), 6 + (i % 3) * 2, 1); }
    ctx.restore();
    ctx.drawImage(this.front, 0, 0);
  }
  drawDecor(id, cv, sp, t, slot) {
    const ctx = this.ctx, w = cv.width, h = cv.height, x0 = Math.round(sp[0] - w / 2), y0 = Math.round(sp[1] - h + 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let r = 0; r < 4; r++) { const hw = Math.round(w * 0.36 * Math.sqrt(1 - (r / 4 - 0.4) ** 2)); ctx.fillRect(Math.round(sp[0]) - hw, Math.round(sp[1]) - 2 + r, hw * 2, 1); }
    const amp = DECOR_SWAY[id];
    if (!amp) { ctx.drawImage(cv, x0, y0); return; }
    for (let y = 0; y < h; y++) { const rel = Math.pow(1 - y / h, 1.6), off = Math.round(Math.sin(t * 1.3 + y * 0.12 + slot * 1.7) * amp * rel); ctx.drawImage(cv, 0, y, w, 1, x0 + off, y0 + y, w, 1); }
  }
  drawFish(f, s, spr, sp, fl) {
    const ctx = this.ctx, w = spr.width, h = spr.height, bob = Math.round(Math.sin(s.ph * 0.5) * 0.8);
    const cx = Math.round(sp[0]), cy = Math.round(sp[1]) + bob;
    // floor shadow
    const sw = Math.round(w * 0.32), shAlpha = Math.max(0.08, 0.3 - s.h / 260);
    ctx.fillStyle = `rgba(0,0,0,${shAlpha})`; for (let r = 0; r < 3; r++) { const hw = Math.round(sw * (r === 1 ? 1 : 0.7)); ctx.fillRect(Math.round(fl[0]) - hw, Math.round(fl[1]) + r - 1, hw * 2, 1); }
    ctx.save(); ctx.translate(cx, cy);
    const fc = Math.abs(s.face) < 0.15 ? (s.face < 0 ? -0.15 : 0.15) : s.face;
    ctx.scale(fc, 1);
    const glow = f.mods.map(m => MODS[m].glow).find(Boolean);
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 5; }
    if (f.mods.includes('prismatic') && 'filter' in ctx) ctx.filter = `hue-rotate(${Math.floor(performance.now() / 20) % 360}deg)`;
    ctx.drawImage(spr, -Math.round(w * 0.52), -Math.round(h / 2));
    ctx.restore();
    const hw = Math.round(w * 0.5 * Math.abs(fc));
    this.hits.push({ id: f.id, x0: cx - hw, x1: cx + hw, y0: cy - h / 2, y1: cy + h / 2 });
  }
}
TankScene.states = new Map();
const tank_type_key = t => t.type;
function shadeCss(hex, f) { const c = shadeC(_hx(hex), f).map(Math.round); return `rgb(${c[0]},${c[1]},${c[2]})`; }

/* Manager: (re)attaches scenes to the canvases present in the DOM after each render */
const Scenes = {
  list: [], running: false,
  bind(onFish) {
    this.list = [...document.querySelectorAll('canvas.tankscene')].map(cv => {
      const t = getTank(cv.dataset.tank); if (!t) return null;
      return new TankScene(cv, t, cv.dataset.mini === '1', onFish);
    }).filter(Boolean);
    if (TankScene.states.size > 600) { const keep = new Set(S.fish.map(f => f.id)); for (const k of TankScene.states.keys()) if (!keep.has(k.split(':')[0])) TankScene.states.delete(k); }
    if (!this.running) { this.running = true; requestAnimationFrame(this.loop); }
  },
  loop(now) { for (const s of Scenes.list) { if (s.cv.isConnected) s.frame(now); } requestAnimationFrame(Scenes.loop); },
};

/* small static picture of an empty tank (shop icon) */
const _tankIcons = {};
function tankIcon(typeId, w) {
  const key = typeId + w; if (_tankIcons[key]) return _tankIcons[key];
  const fake = { id: 'icon', type: typeId, bg: null, skin: 'classic', slots: [null, null, null, null], up: {} };
  const cv = document.createElement('canvas'), sc = new TankScene(cv, fake, true, null);
  sc.build(); const ctx = cv.getContext('2d'); ctx.drawImage(sc.back, 0, 0); ctx.drawImage(sc.front, 0, 0);
  return (_tankIcons[key] = `<img class="px" src="${cv.toDataURL()}" style="width:${w}px" alt="" draggable="false">`);
}
