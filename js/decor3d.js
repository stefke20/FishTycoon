'use strict';
/* ===== 3D voxel decorations ===== */

const rng = seed => { let s = hash(String(seed)) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; }; };
const HX = _hx;

/* flat curved blade: starts at p, heads out at azimuth a with elevation e, curling downward by 'droop' */
function blade(g, p, a, e, len, w0, droop, col, o) {
  o = o || {};
  const ca = Math.cos(a), sa = Math.sin(a), n = Math.ceil(len * 1.4);
  for (let i = 0; i <= n; i++) {
    const t = i / n, h = Math.cos(e) * len * t, y = Math.sin(e) * len * t - droop * len * t * t;
    const cx = p[0] + ca * h, cz = p[2] + sa * h, cy = p[1] + y;
    const w = w0 * (o.wprof ? o.wprof(t) : Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + 0.88 * t)), 0.6) * (1 - 0.35 * t));
    const px = -sa, pz = ca, m = Math.max(0, Math.round(w));
    for (let k = -m; k <= m; k++) {
      const c = typeof col === 'function' ? col(t, k / Math.max(1, m)) : col;
      g.set(cx + px * k, cy, cz + pz * k, c);
    }
    if (o.thick) g.set(cx, cy + 1, cz, typeof col === 'function' ? col(t, 0) : col);
  }
}
/* oriented elliptical disc spanned by unit vectors u,v */
function disc(g, c, u, v, ru, rv, col) {
  for (let a = -ru; a <= ru; a += 0.6) for (let b = -rv; b <= rv; b += 0.6) {
    if ((a / ru) ** 2 + (b / rv) ** 2 > 1) continue;
    const cc = typeof col === 'function' ? col(a / ru, b / rv) : col; if (!cc) continue;
    g.set(c[0] + u[0] * a + v[0] * b, c[1] + u[1] * a + v[1] * b, c[2] + u[2] * a + v[2] * b, cc);
  }
}
function rockBlob(g, cx, cy, cz, rx, ry, rz, base, seed, o) {
  o = o || {};
  for (let x = Math.floor(cx - rx * 1.3); x <= Math.ceil(cx + rx * 1.3); x++) for (let y = Math.floor(cy - ry * 1.3); y <= Math.ceil(cy + ry * 1.3); y++) for (let z = Math.floor(cz - rz * 1.3); z <= Math.ceil(cz + rz * 1.3); z++) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry, dz = (z - cz) / rz, nz = vnoise(x * 0.22 + 4, y * 0.22 + z * 0.17, seed) - 0.5;
    if (dx * dx + dy * dy + dz * dz <= 1 + nz * 0.7) {
      let c = base; const st = Math.floor((y + vnoise(x * 0.1, z * 0.1, seed + 's') * 4) / 3) % 2;
      c = shadeC(c, st ? 0.05 : -0.06);
      if (hash(x + ',' + y + ',' + z + seed) % 17 === 0) c = shadeC(c, 0.14);
      if (o.moss && dy > 0.35 && vnoise(x * 0.3, z * 0.3, seed + 'm') > 0.45) c = mixC([60, 120, 50], [90, 160, 60], vnoise(x, z, 'mm'));
      g.set(x, y, z, c);
    }
  }
}
const GREENS = ['#2f8f4a', '#3fae5a', '#52c86a', '#2a7a40'].map(HX);

const DECOR_BUILD = {
  javafern(g) {
    const r = rng('jf'); g.ell(0, 1, 0, 4, 2, 4, HX('#5b4a3a'));
    for (let i = 0; i < 16; i++) { const a = i * 2.399, e = 0.9 + r() * 0.5, len = 18 + r() * 12, c = GREENS[i % 3]; blade(g, [Math.cos(a) * 2, 2, Math.sin(a) * 2], a, e, len, 2.6, 0.55 + r() * 0.3, (t, k) => Math.abs(k) < 0.2 ? shadeC(c, 0.2) : shadeC(c, -0.05 - t * 0.1)); }
  },
  anubias(g) {
    const r = rng('an'); g.ell(0, 1, 0, 5, 2, 5, HX('#5b4a3a'));
    for (let i = 0; i < 9; i++) { const a = i * 2.399, d = 5 + r() * 6, h = 8 + r() * 12, tx = Math.cos(a) * d, tz = Math.sin(a) * d; g.line([0, 2, 0], [tx, h, tz], HX('#3d7a3a'), 0.6); const nx = Math.cos(a), nz = Math.sin(a), c = i % 2 ? HX('#1f7a45') : HX('#2b9a55'); disc(g, [tx, h + 1, tz], [-nz, 0, nx], [nx * 0.8, 0.6, nz * 0.8], 4.2, 5.5, (a1, b1) => Math.abs(a1) < 0.12 ? HX('#8ae6a8') : shadeC(c, -b1 * 0.1)); }
  },
  sword(g) {
    const r = rng('sw'); g.ell(0, 1, 0, 4, 2, 4, HX('#5b4a3a'));
    for (let i = 0; i < 20; i++) { const a = i * 2.399, e = 1.0 + r() * 0.45, len = 26 + r() * 16, c = [HX('#4ab85a'), HX('#2f9a4a'), HX('#60cc6a')][i % 3]; blade(g, [0, 2, 0], a, e, len, 2.8, 0.35 + r() * 0.35, (t, k) => Math.abs(k) < 0.15 ? shadeC(c, 0.22) : shadeC(c, -t * 0.12)); }
  },
  wisteria(g) {
    const r = rng('ws');
    for (let i = 0; i < 6; i++) { const a = i * 1.1, d = 3 + r() * 3, top = 34 + r() * 14, tx = Math.cos(a) * d, tz = Math.sin(a) * d; g.line([0, 0, 0], [tx, top, tz], HX('#5da83a'), 0.5);
      for (let y = 8; y < top; y += 4) for (let k = 0; k < 3; k++) { const ba = a + k * 2.1 + y; blade(g, [tx * y / top, y, tz * y / top], ba, 0.5, 6 + r() * 3, 1, 0.2, (t) => shadeC(HX('#8be04a'), t * 0.2 - 0.05)); } }
  },
  lotus(g) {
    const r = rng('lo');
    [[-10, 12, 4, 9], [8, 18, -6, 8], [6, 9, 10, 7]].forEach(([x, h, z, rad], i) => { g.line([x * 0.3, 0, z * 0.3], [x, h, z], HX('#3f8f4a'), 0.6); disc(g, [x, h, z], [1, 0, 0], [0, 0, 1], rad, rad, (a, b) => (a > 0.9 && Math.abs(b) < 0.15 ? null : shadeC(HX('#2f9a55'), -Math.hypot(a, b) * 0.1))); });
    g.line([0, 0, 0], [0, 26, 0], HX('#3f8f4a'), 0.7);
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + ring * 0.4; blade(g, [0, 26 + ring * 2, 0], a, 0.6 + ring * 0.5, 6 - ring, 1.6, 0.3, (t) => mixC(HX('#ff7eb8'), HX('#ffe0ef'), t)); }
    g.ell(0, 27, 0, 2, 2, 2, HX('#ffd54a'));
  },
  seagrass(g) {
    const r = rng('sg');
    for (let i = 0; i < 46; i++) { const a = r() * 6.28, d = r() * 8; blade(g, [Math.cos(a) * d, 0, Math.sin(a) * d], r() * 6.28, 1.3 + r() * 0.2, 22 + r() * 22, 1, 0.3 + r() * 0.3, (t) => mixC(HX('#78c03a'), HX('#c6ec5a'), t)); }
  },
  kelp(g) {
    const r = rng('kp');
    for (let k = 0; k < 4; k++) { const ox = (k - 1.5) * 5, oz = (k % 2) * 4 - 2, H = 44 + r() * 20; let px = ox, pz = oz;
      for (let y = 0; y < H; y++) { px = ox + Math.sin(y * 0.14 + k) * 3.5; pz = oz + Math.cos(y * 0.11 + k * 2) * 2.5; g.ell(px, y, pz, 1.1, 0.8, 1.1, HX(k % 2 ? '#8a6a1f' : '#9a7a24'));
        if (y % 7 === 3) { blade(g, [px, y, pz], y * 0.9 + k, 0.35, 9, 2, 0.4, t => mixC(HX('#c09a30'), HX('#8a6a1f'), t)); g.ell(px + 2, y + 2, pz, 1.6, 1.6, 1.6, HX('#e0b84a')); } } }
  },
  seafan(g) {
    g.cyl(0, 0, 1.6, 0, 6, HX('#7a5a4a'));
    for (let a = -1.15; a <= 1.15; a += 0.085) for (let rr = 5; rr < 38; rr += 0.8) { const rib = Math.round(a * 11) % 2 === 0, ring = Math.round(rr / 3.2) % 2 === 0 && Math.abs(rr % 3.2) < 1.2; if (!(rib || ring) && !(rr < 8)) continue; const x = Math.sin(a) * rr * 0.9, y = 6 + Math.cos(a) * rr, c = mixC(HX('#e05888'), HX('#a82050'), rr / 38); g.set(x, y, Math.sin(rr * 0.3) * 0.9, c); g.set(x, y, 1 + Math.round(Math.sin(rr * 0.3)), shadeC(c, -0.12)); }
  },
  pebbles(g) {
    [[-9, 5, 3, 9, 6, 7, '#7f8b99'], [6, 4, -3, 8, 5, 7, '#9aa4b0'], [-1, 7, -9, 7, 6, 6, '#c2b79e'], [12, 4, 8, 6, 4, 5, '#6e7986'], [-14, 3, -4, 5, 3, 4, '#b8aa8c'], [2, 3, 10, 5, 3, 5, '#58626e'], [-6, 3, 12, 4, 3, 4, '#a89a82']].forEach((p, i) => rockBlob(g, p[0], p[1], p[2], p[3], p[4], p[5], HX(p[6]), 'pb' + i));
  },
  driftwood(g) {
    const pts = [[-26, 4, 2], [-16, 7, -2], [-6, 14, 1], [6, 22, 3], [16, 24, 1], [26, 18, -2]];
    const path = t => { const f = t * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), u = f - i; return pts[i].map((v, k) => v + (pts[i + 1][k] - v) * u); };
    for (let i = 0; i <= 120; i++) { const t = i / 120, p = path(t), rad = 4.2 - t * 1.9; g.ell(p[0], p[1], p[2], rad, rad * 0.85, rad, (x, y, z, dx, dy, dz) => shadeC(HX('#8a6a46'), (Math.round(t * 40) % 3 === 0 ? -0.1 : 0.04) - dy * 0.12 + (hash(x + ',' + y + ',' + z) % 7 === 0 ? -0.1 : 0))); }
    g.line(path(0.45), [path(0.45)[0] - 6, path(0.45)[1] + 12, path(0.45)[2] + 4], HX('#7a5a3a'), 2.2, 1);
    g.line(path(0.72), [path(0.72)[0] + 6, path(0.72)[1] + 9, path(0.72)[2] - 5], HX('#6a4a2e'), 2, 0.8);
    g.ell(-26, 2, 2, 6, 3, 6, HX('#6a4a2e'));
  },
  cave(g) {
    const C = HX('#8a8f9a'); rockBlob(g, 0, 8, 0, 24, 20, 20, C, 'cv', { moss: true });
    for (let x = -10; x <= 10; x++) for (let y = 0; y <= 14; y++) for (let z = -24; z <= 24; z++) if ((x / 8.5) ** 2 + (y / 12) ** 2 < 1) g.del(x, y, z);
    rockBlob(g, -17, 4, 14, 9, 6, 7, HX('#767c88'), 'cv2'); rockBlob(g, 19, 3, -13, 8, 5, 7, HX('#a2a8b3'), 'cv3');
    for (let i = 0; i < 6; i++) blade(g, [-20 + i * 2, 12, 12], i, 1.2, 8, 0.8, 0.2, t => mixC(HX('#3f9f4a'), HX('#8ad06a'), t));
  },
  dragonstone(g) {
    [[0, 0, 0, 9, 34, 0.1, 0.0], [-9, 0, 5, 6, 22, -0.3, 0.2], [8, 0, -4, 6, 26, 0.35, -0.2], [11, 0, 8, 4, 14, 0.2, 0.3]].forEach(([x, y, z, r, h, lx, lz], i) => { for (let yy = 0; yy <= h; yy++) { const t = yy / h, rad = r * (1 - t * 0.92); g.ell(x + lx * yy, yy, z + lz * yy, rad, 0.8, rad * 0.9, (px, py, pz) => { const sc = (Math.floor(yy / 2) + Math.floor((px + pz) / 2)) % 2; return shadeC(mixC(HX('#4a6b66'), HX('#7da89c'), t * 0.6), sc ? 0.06 : -0.08); }); } });
    for (let i = 0; i < 4; i++) g.line([-2 + i, 4, 2], [-4 + i * 3, 24 + i * 2, 4 + i], HX('#ff6a3a'), 0.5);
    g.set(1, 18, 5, HX('#ffe08a')); g.set(-3, 9, 6, HX('#ffb347'));
  },
  obsidian(g) {
    [[0, 0, 0, 8, 56, 0.05, 0.1], [-9, 0, 4, 6, 36, -0.2, 0.15], [9, 0, -3, 6.5, 42, 0.18, -0.1], [3, 0, 10, 4.5, 24, 0.1, 0.2], [-5, 0, -9, 4, 20, -0.15, -0.2]].forEach(([x, y, z, r, h, lx, lz], i) => { for (let yy = 0; yy <= h; yy++) { const t = yy / h, rad = r * (1 - Math.pow(t, 1.4) * 0.95); g.ell(x + lx * yy, yy, z + lz * yy, rad, 0.8, rad, (px, py, pz, dx, dy, dz) => { const edge = Math.abs(dx) > 0.82 || Math.abs(dz) > 0.82; return edge ? HX('#8a6ee0') : shadeC(HX('#2a1f4a'), (hash(px + ',' + yy + ',' + pz) % 5 === 0 ? 0.12 : 0) - t * 0.05); }); } });
    g.set(0, 52, 0, HX('#ffffff')); g.set(-8, 32, 5, HX('#d6c2ff'));
  },
  bubbles(g) {
    g.ell(0, 1, 0, 5, 2, 3, HX('#3a3f4a')); g.ell(0, 3, 0, 3, 1, 2, HX('#566073')); g.line([0, 3, 0], [8, 8, 2], HX('#2a2e38'), 0.6); g.line([8, 8, 2], [14, 3, 6], HX('#2a2e38'), 0.6); g.box(-2, 3, -1, 2, 3, 1, HX('#d6ecff'));
  },
  chest(g) {
    const wood = (x, y, z) => shadeC(HX('#8a5a2e'), (z % 4 === 0 ? -0.12 : 0.03) + (hash(x + ',' + y + ',' + z) % 6 === 0 ? -0.06 : 0));
    g.box(-12, 0, -8, 12, 11, 8, wood); g.box(-13, 0, -8, -11, 11, 8, HX('#d9a63a')); g.box(11, 0, -8, 13, 11, 8, HX('#d9a63a')); g.box(-12, 9, -8, 12, 10, 8, HX('#c8942a'));
    g.box(-11, 11, -7, 11, 11, 7, HX('#f0c040')); // gold fill
    for (let i = 0; i < 30; i++) { const r = rng('coin' + i); g.ell(-10 + r() * 20, 12 + r() * 3, -6 + r() * 12, 1.5, 0.9, 1.5, HX(i % 5 === 0 ? '#e0405a' : i % 7 === 0 ? '#4d9fff' : '#ffd54a')); }
    // open lid hinged at back (z=-8), tilted back ~75deg
    for (let a = 0; a <= Math.PI; a += 0.07) for (let x = -12; x <= 12; x++) { const rad = 8; const yy = 11 + Math.sin(a) * rad * 0.2 + 0, zz = -8 - Math.sin(a) * rad * 0.35; g.set(x, 11 + Math.round(Math.cos(a) * 0), zz, wood(x, 0, zz)); }
    for (let t = 0; t <= 9; t++) for (let x = -12; x <= 12; x++) { const ang = 1.25, yy = 11 + t * Math.sin(ang), zz = -8 - t * Math.cos(ang) * 0.9; g.set(x, yy, zz, Math.abs(x) > 10 || t % 9 === 0 ? HX('#d9a63a') : wood(x, yy, Math.round(zz))); }
    g.box(-1, 7, 8, 1, 10, 9, HX('#f0c040')); g.set(0, 8, 9, HX('#4a3010'));
  },
  neon: null,
  castle(g) {
    const stone = (x, y, z) => shadeC(HX('#9aa0ac'), (y % 3 === 0 ? -0.1 : ((x + z + (Math.floor(y / 3) % 2) * 2) % 4 === 0 ? -0.07 : 0.03)));
    g.box(-16, 0, -10, 16, 16, 10, stone);
    for (let x = -16; x <= 16; x += 4) { g.box(x, 17, -10, x + 1, 19, -10, stone); g.box(x, 17, 10, x + 1, 19, 10, stone); }
    [[-16, -10], [16, -10], [-16, 10], [16, 10]].forEach(([x, z]) => { g.cyl(x, z, 5, 0, 26, stone); g.cyl(x, z, 6, 26, 27, HX('#8c92a0')); g.cyl(x, z, 6.5, 27, 38, (px, py, pz, t) => HX('#c0453a'), 0); for (let k = 0; k < 4; k++) g.set(x + (k % 2 ? 5 : -5) * (k > 1 ? 0 : 1), 14 + k * 3, z + (k > 1 ? (k % 2 ? 5 : -5) : 0), HX('#222a3a')); });
    g.cyl(0, 0, 8, 16, 34, stone); g.cyl(0, 0, 9, 34, 35, HX('#8c92a0')); g.cyl(0, 0, 9.5, 35, 50, (px, py, pz, t) => HX('#c0453a'), 0);
    g.line([0, 50, 0], [0, 60, 0], HX('#4a331f'), 0.6); for (let i = 0; i < 6; i++) g.box(1, 57 + (i > 2 ? 0 : 0), 0, 5 - Math.abs(i - 2), 59 - Math.floor(i / 2), 0, HX('#ffd54a'));
    for (let x = -4; x <= 4; x++) for (let y = 0; y <= 9; y++) if ((x / 4.2) ** 2 + (Math.max(0, y - 5) / 4) ** 2 <= 1) { g.del(x, y, 10); g.del(x, y, 9); g.set(x, y, 8, HX('#14141c')); }
    for (let k = 0; k < 5; k++) { g.set(-10 + k * 5, 11, 10, HX('#2c3a55')); g.set(-10 + k * 5, 12, 10, HX('#2c3a55')); }
  },
  heart(g) {
    g.cyl(0, 0, 11, 0, 3, HX('#e8e4f0')); g.cyl(0, 0, 8, 3, 9, (x, y, z) => shadeC(HX('#e0dce8'), (y % 3 === 0) ? -0.08 : 0.03)); g.cyl(0, 0, 10, 9, 11, HX('#f0ecf4'));
    const S = 12;
    for (let x = -S - 2; x <= S + 2; x++) for (let y = -S - 2; y <= S + 2; y++) for (let z = -7; z <= 7; z++) { const X = x / S, Y = y / S * 1.05, Z = z / (S * 0.55); const v = Math.pow(X * X + 2.25 * Z * Z + Y * Y - 1, 3) - X * X * Y * Y * Y - 0.1125 * Z * Z * Y * Y * Y; if (v <= 0) g.set(x, y + S + 14, z, shadeC(HX('#ff4f8b'), (y / S) * 0.22 + (hash(x + ',' + y + ',' + z) % 11 === 0 ? 0.12 : 0))); }
  },
  ship(g) {
    const plank = (x, y, z) => shadeC(HX('#7a4a24'), ((y + (Math.abs(x) % 6 === 0 ? 1 : 0)) % 3 === 0 ? -0.12 : 0.02));
    for (let x = -26; x <= 26; x++) { const t = x / 26, hw = Math.max(1, Math.round(9 * (1 - Math.pow(Math.abs(t), 2.6)) )), keel = 4 + Math.round(8 * Math.pow(Math.abs(t), 3)), lift = Math.round(Math.max(0, t) * 6 + x * 0.12);
      for (let z = -hw; z <= hw; z++) { const depth = Math.round(11 * (1 - (z / (hw + 0.5)) ** 2)); for (let y = keel; y <= keel + 6 + (t > 0.6 ? 3 : 0) + Math.round(depth * 0.2); y++) { if (y > keel + 1 && Math.abs(z) < hw - 1 && y < keel + 6) continue; g.set(x, y + lift, z, plank(x, y, z)); } } }
    g.box(-24, 11, -6, 12, 11, 6, HX('#a8703a'));
    g.line([-4, 11, 0], [-5, 52, 0], HX('#5a3a1a'), 1.4); g.line([14, 11, 0], [15, 40, 0], HX('#5a3a1a'), 1.1);
    for (let y = 22; y < 48; y++) for (let z = -9; z <= 9; z++) { const w = 9 - Math.abs(y - 36) * 0.15; if (Math.abs(z) < w && hash(z + ',' + y + 'sail') % 9 !== 0 && !(y > 40 && z > 2)) g.set(-5, y, z, shadeC(HX('#d8cfae'), -Math.abs(z) * 0.01 - (y % 6 === 0 ? 0.06 : 0))); }
    g.line([-5, 47, -9], [-5, 47, 9], HX('#5a3a1a'), 0.8); g.line([-5, 22, -9], [-5, 22, 9], HX('#5a3a1a'), 0.8);
    for (let i = 0; i < 5; i++) g.set(-14 + i * 6, 17, 7, HX('#1a120a')), g.set(-14 + i * 6, 17, -7, HX('#1a120a'));
    g.line([20, 14, 0], [26, 12, 0], HX('#5a3a1a'), 1.4); g.ell(-24, 14, 0, 2, 3, 2, HX('#4a3010'));
    g.line([-22, 12, 8], [-26, 5, 14], HX('#3a3a44'), 0.6);
  },
  brain(g) {
    const R = 15; for (let x = -R; x <= R; x++) for (let y = 0; y <= 13; y++) for (let z = -R; z <= R; z++) { const d = (x / R) ** 2 + (y / 12) ** 2 + (z / R) ** 2; if (d > 1.2) continue; const ridge = Math.sin((x + vnoise(x * .2, z * .2, 'br') * 8) * 0.9) * Math.cos((z + vnoise(z * .2, x * .2, 'bq') * 8) * 0.9) > 0.1; if (d <= (ridge ? 1.15 : 0.9)) g.set(x, y, z, shadeC(HX(ridge ? '#e8a8a0' : '#b87a78'), ridge ? 0.1 : -0.15)); }
  },
  anemone(g) {
    g.cyl(0, 0, 8, 0, 3, HX('#7a3a8a')); g.cyl(0, 0, 5, 3, 9, HX('#9a4aa8'));
    const r = rng('ae'); for (let i = 0; i < 34; i++) { const a = i * 2.399, e = 0.9 + r() * 0.5; blade(g, [Math.cos(a) * 3, 9, Math.sin(a) * 3], a, e, 14 + r() * 8, 0.8, 0.5, t => mixC(HX('#e65aa0'), HX('#ffe0ef'), t * t)); }
  },
};
/* neon sign has a separate glow grid */
DECOR_BUILD.neon = function (g, glow) {
  g.cyl(0, 0, 1, 0, 14, HX('#3a3f4a')); g.box(-6, 0, -3, 6, 1, 3, HX('#2a2e38'));
  g.box(-14, 14, -1, 14, 34, 1, HX('#1a1530'));
  const P = HX('#ff4fd8'), B = HX('#4fe0ff');
  for (let x = -14; x <= 14; x++) { glow.set(x, 14, 2, P); glow.set(x, 34, 2, P); } for (let y = 14; y <= 34; y++) { glow.set(-14, y, 2, P); glow.set(14, y, 2, P); }
  // neon fish
  for (let a = 0; a < 6.3; a += 0.18) glow.set(Math.cos(a) * 7 - 2, 24 + Math.sin(a) * 4, 2, B);
  glow.line([5, 24, 2], [11, 28, 2], B, 0.5); glow.line([5, 24, 2], [11, 20, 2], B, 0.5); glow.line([11, 28, 2], [11, 20, 2], B, 0.5); glow.set(-6, 25, 2, P);
};

/* ---- event decorations ---- */
DECOR_BUILD.dc_stpat = function (g, glow) {
  g.ell(0, 9, 0, 12, 9, 12, (x, y, z, dx, dy, dz) => shadeC(HX('#262a30'), dy * 0.12 + (hash(x + ',' + y + ',' + z) % 9 === 0 ? 0.1 : 0)));
  for (let x = -12; x <= 12; x++) for (let z = -12; z <= 12; z++) if (x * x + z * z <= 100 && x * x + z * z >= 64) for (let y = 15; y <= 17; y++) g.set(x, y, z, HX('#3a3f48'));
  g.cyl(-7, 3, 2.2, 0, 5, '#262a30'); g.cyl(7, -3, 2.2, 0, 5, '#262a30');
  for (let i = 0; i < 90; i++) { const r = rng('gp' + i), a = r() * 6.28, d = r() * 9, h = 15 + (1 - d / 9) * 6 + r() * 2; glow.ell(Math.cos(a) * d, h, Math.sin(a) * d, 1.8, 1.2, 1.8, i % 3 ? HX('#ffd23f') : HX('#ffe98a')); }
  const bands = ['#e8403a', '#f08a2a', '#f4d83a', '#4cc060', '#4a8ae0', '#8a52c8']; bands.forEach((c, i) => { for (let a = 0.12; a < Math.PI - 0.12; a += 0.03) glow.set(-16 + Math.cos(a) * (24 - i * 1.6) * 0.9 + 4, 12 + Math.sin(a) * (24 - i * 1.6), -14, HX(c)); });
  for (let k = 0; k < 3; k++) g.ell(15 + k * 2, 2, 8 - k * 3, 3, 1.1, 3, HX('#3fb860'));
};
DECOR_BUILD.dc_valentine = function (g, glow) {
  for (let a = 0.05; a < Math.PI - 0.05; a += 0.02) { const x = Math.cos(a) * 20, y = Math.sin(a) * 28; g.ell(x, y, 0, 2.6, 2.6, 2.6, HX('#3a8f4a')); }
  const r = rng('ra'); for (let i = 0; i < 18; i++) { const a = 0.15 + i * 0.16, x = Math.cos(a) * 20, y = Math.sin(a) * 28; g.ell(x, y + 2, 2.4, 3.3, 3.3, 2.2, (px, py, pz, dx, dy) => shadeC(i % 3 ? HX('#e02a5a') : HX('#ff7aa0'), dy * 0.15)); }
  g.box(-22, 0, -3, -18, 4, 3, '#6a4a30'); g.box(18, 0, -3, 22, 4, 3, '#6a4a30');
  const S = 4; for (let x = -S - 2; x <= S + 2; x++) for (let y = -S - 2; y <= S + 2; y++) { const X = x / S, Y = y / S; if (Math.pow(X * X + Y * Y - 1, 3) - X * X * Y * Y * Y <= 0) glow.set(x, y + 34, 0, HX('#ff4f8b')); }
};
DECOR_BUILD.dc_spring = function (g) {
  g.cyl(0, 0, 13, 0, 3, (x, y, z) => shadeC(HX('#b8864a'), (x + z + y) % 4 === 0 ? -0.15 : 0.05), 11);
  for (let y = 3; y <= 11; y++) g.cyl(0, 0, 13 + (y - 3) * 0.6, y, y, (x, yy, z) => shadeC(HX('#c8975a'), ((Math.round(x / 2) + Math.round(z / 2) + y) % 2) ? -0.16 : 0.06));
  const cols = ['#ff9ac8', '#9ad8ff', '#a8f0a0', '#fff08a', '#d8a8ff'], r = rng('eb');
  for (let i = 0; i < 7; i++) { const a = i * 0.9, d = 4 + r() * 7; g.ell(Math.cos(a) * d, 14, Math.sin(a) * d, 4, 5, 4, (x, y, z, dx, dy) => shadeC(HX(cols[i % 5]), dy * 0.12 + ((Math.floor(y / 2)) % 2 ? 0.1 : -0.04))); }
  for (let t = 0; t <= 1; t += 0.03) g.ell(Math.cos(Math.PI * t) * 13, 11 + Math.sin(Math.PI * t) * 14, 0, 1.4, 1.4, 1.4, HX('#a8793c'));
  for (let i = 0; i < 12; i++) blade(g, [Math.cos(i * 0.5) * 8, 11, Math.sin(i * 0.5) * 8], i, 1.0, 9, 1, 0.3, t => mixC(HX('#5bbf4a'), HX('#a8f080'), t));
  for (let i = 0; i < 4; i++) { const a = i * 1.7; g.ell(Math.cos(a) * 9, 22, Math.sin(a) * 9, 2.6, 2.6, 2.6, HX(['#ff7aa8', '#ffd84a', '#fff', '#c090ff'][i])); g.line([Math.cos(a) * 9, 11, Math.sin(a) * 9], [Math.cos(a) * 9, 21, Math.sin(a) * 9], '#4a9a3a', 0.5); }
};
DECOR_BUILD.dc_summer = function (g) {
  const sand = (x, y, z) => shadeC(HX('#f0d890'), (hash(x + ',' + y + ',' + z) % 6 === 0 ? -0.1 : 0.03));
  g.ell(0, 0, 0, 24, 5, 18, sand);
  [[-10, 0, 8, 6, 4], [5, 0, 4, 7, 4], [-2, 0, -7, 5, 3]].forEach(([x, y, z, r, h], i) => { g.cyl(x, z, r, 3, 3 + h * 2.4, sand); for (let k = 0; k < 6; k++) g.box(x - r + k * (r * 2 / 6), 3 + h * 2.4, z - 1, x - r + k * (r * 2 / 6) + 1, 3 + h * 2.4 + 1, z + 1, sand); g.cyl(x, z, r * 0.35, 3, 3 + h * 2.4 - 3, '#b89860'); });
  g.cyl(12, -6, 0.8, 2, 40, '#7a5a3a');
  for (let y = 0; y < 8; y++) { const r = 16 - y * 1.9; for (let a = 0; a < 6.28; a += 0.12) { const cx = 12 + Math.cos(a) * r, cz = -6 + Math.sin(a) * r, seg = Math.floor(a / 0.52) % 2; g.set(cx, 36 + y, cz, seg ? HX('#f0f0f0') : HX('#e84040')); } }
  g.ell(12, 44, -6, 1.6, 1.6, 1.6, '#e8d040'); g.set(-14, 11, 6, HX('#ff6a8a')); g.line([-14, 4, 8], [-14, 16, 8], '#6a4a2a', 0.8); g.box(-14, 12, 8, -9, 15, 8, '#e84040');
};
DECOR_BUILD.dc_halloween = function (g, glow) {
  const R = 15;
  g.ell(0, R * 0.85, 0, R, R * 0.85, R, (x, y, z, dx, dy, dz) => { const rib = Math.abs(Math.sin(Math.atan2(z, x) * 4.5)) > 0.8; return shadeC(HX('#e8761a'), (rib ? -0.2 : 0.04) + dy * 0.1); });
  g.cyl(0, 0, 2.4, R * 1.5, R * 1.5 + 5, '#5a7a2a'); g.line([2, R * 1.5 + 4, 0], [6, R * 1.5 + 8, 0], '#5a7a2a', 2);
  for (const e of [...g.m.values()]) { const x = e[3], y = e[4], z = e[5]; if (z > 9) { const ex = (Math.abs(x + 6) < 3.2 && y > 15 && y < 21 && (y - 15) < (3.2 - Math.abs(x + 6)) * 1.6 + 1.5) || (Math.abs(x - 6) < 3.2 && y > 15 && y < 21 && (y - 15) < (3.2 - Math.abs(x - 6)) * 1.6 + 1.5); const mo = y > 7 && y < 13 && Math.abs(x) < 10 && ((Math.floor(x / 3) % 2 === 0) || y < 10); if (ex || mo) { g.del(x, y, z); glow.set(x, y, 8, HX('#ffd24a')); } } }
  glow.ell(0, 12, 0, 6, 6, 6, HX('#ff9a1e'));
};
DECOR_BUILD.dc_winter = function (g, glow) {
  g.cyl(0, 0, 2.4, 0, 6, '#6a4a2a');
  for (let k = 0; k < 4; k++) { const y0 = 5 + k * 9, r0 = 17 - k * 3.6; for (let y = 0; y < 11; y++) g.cyl(0, 0, r0 * (1 - y / 11), y0 + y, y0 + y, (x, yy, z) => shadeC(HX('#1f7a3a'), (hash(x + ',' + yy + ',' + z) % 5 === 0 ? 0.1 : -0.04) + (y > 8 ? 0.15 : 0))); }
  const cols = ['#e8302a', '#f4d83a', '#4a8ae0', '#fff', '#e870c0'], r = rng('xt');
  for (let i = 0; i < 26; i++) { const k = Math.floor(r() * 4), y = 8 + k * 9 + r() * 7, rad = (17 - k * 3.6) * (1 - (y - (5 + k * 9)) / 11) * 0.9, a = r() * 6.28; glow.ell(Math.cos(a) * rad, y, Math.sin(a) * rad, 1.4, 1.4, 1.4, HX(cols[i % 5])); }
  for (let a = 0; a < 6.28; a += 0.1) { glow.set(Math.cos(a) * 3, 44 + Math.sin(a * 5) * 1.5, Math.sin(a) * 3, HX('#ffe070')); }
  glow.ell(0, 43, 0, 3, 3, 1.2, HX('#ffe070'));
  [[-14, 0, 8, '#e8302a'], [-8, 0, 14, '#4a8ae0'], [12, 0, 10, '#f4d83a']].forEach(([x, y, z, c], i) => { g.box(x, 0, z, x + 7, 6, z + 7, c); g.box(x + 3, 0, z, x + 4, 6, z + 7, '#fff'); g.box(x, 3, z + 3, x + 7, 3, z + 4, '#fff'); });
};


/* event trophies: a golden cup on a wooden base, with a glowing star in the event's colour */
EVENTS.forEach(ev => {
  DECOR_BUILD['tr_' + ev.id] = function (g, glow) {
    const gold = (x, y, z) => shadeC(HX('#e8b83a'), (y % 4 === 0 ? -0.08 : 0.03) + (x < 0 ? -0.06 : 0)), acc = HX(ev.color);
    g.box(-9, 0, -9, 9, 4, 9, (x, y, z) => shadeC(HX('#6a4228'), (hash(x + ',' + z) % 5 === 0 ? -0.1 : 0.02)));
    g.box(-7, 5, -7, 7, 6, 7, gold); g.cyl(0, 0, 2.2, 7, 14, gold);
    g.cyl(0, 0, 4, 15, 16, gold, 4); for (let y = 0; y < 14; y++) g.cyl(0, 0, 4.2 + y * 0.32, 17 + y, 17 + y, gold);
    g.ell(-9, 25, 0, 2.6, 4, 1, gold); g.ell(9, 25, 0, 2.6, 4, 1, gold);
    g.box(-1, 21, 5, 1, 27, 5, acc); g.box(-3, 24, 5, 3, 24, 5, acc);
    glow.ell(0, 36, 0, 3, 3, 3, acc);
  };
});

const DECOR_SWAY = { javafern: 1.8, anubias: 0.9, sword: 2.0, wisteria: 2.8, lotus: 0.8, seagrass: 3.2, kelp: 3.2, anemone: 2.2, seafan: 0.8 };
const _decorGeo = {};
function decorModel(id) {
  if (_decorGeo[id]) return _decorGeo[id];
  const g = new VGrid(0.05), glow = new VGrid(0);
  DECOR_BUILD[id](g, glow);
  const geo = g.geometry(); geo.computeBoundingBox();
  const out = { geo, glow: glow.size ? glow.geometry() : null, h: geo.boundingBox.max.y, minY: geo.boundingBox.min.y };
  return (_decorGeo[id] = out);
}
