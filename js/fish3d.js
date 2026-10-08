'use strict';
/* ===== 3D voxel fish builder (uses the archetype table in fish.js) ===== */

const WR = { goldfish: 0.8, comet: 0.6, ranchu: 0.95, angel: 0.2, marangel: 0.3, discus: 0.28, tang: 0.3, moorish: 0.25, opah: 0.3, trigger: 0.4, puffer: 0.95, urchin: 0.95, eel: 0.8, moray: 0.8, gar: 0.8, snakehead: 0.75, arowana: 0.5, catfish: 1.0, koi: 0.68, anglerfish: 0.9, parrot: 0.6, cichlid: 0.55, flowerhorn: 0.62, piranha: 0.45, gourami: 0.35, betta: 0.5, round: 0.62, guppy: 0.5, platy: 0.55, tetra: 0.6, clown: 0.6, cardinal: 0.55, wrasse: 0.6, napoleon: 0.7, lionfish: 0.55, mandarin: 0.6, blenny: 0.7, seadragon: 0.7, dragon: 0.6, sturgeon: 0.85, barracuda: 0.6, marlin: 0.55, hammer: 0.6, grouper: 0.7, oarfish: 0.5 };
const wrOf = s => { const k = ARCH_OF[s.id] || s.sh; return WR[k] != null ? WR[k] : 0.5; };

const _fish3dCache = new Map();
function fishModel(spId, mods, L) {
  const key = spId + '|' + mods.join(',') + '|' + L;
  let m = _fish3dCache.get(key);
  if (!m) { m = buildFish(SPECIES[spId], mods, L); _fish3dCache.set(key, m); }
  return m;
}
const modelLength = (sp, tier) => Math.round(([0, 30, 35, 40, 46, 52][tier]) * (archOf(sp).big || 1));

function buildFish(s, mods, L) {
  const A = archOf(s);
  const P = bodyProfile(A), g = new VGrid(0.035), wr = wrOf(s);
  const tone = c => { const gr = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2], m = mixC(c, [gr, gr, gr], 0.24); return [m[0] * 0.92, m[1] * 0.92, m[2] * 0.94]; };
  const base = tone(_hx(s.c)), c2 = tone(_hx(s.c2));
  const finPlain = (s.pt === 'none' || s.pt === 'belly' || s.pt === 'spots' || s.pt === 'lateral');
  let finC = finPlain ? mixC(c2, base, 0.3) : base;
  if (s.id === 'goldfish' || s.id === 'comet' || s.id === 'ranchu') finC = mixC(base, [255, 235, 190], 0.25);
  const belly = s.pt === 'belly' ? c2 : mixC(base, [255, 250, 235], 0.5);
  const tail = A.tail, tlen = tail.len, topAt = P.top, botAt = P.bot;
  const hzAt = u => Math.max(0.6 / L, (topAt(u) + botAt(u)) / 2 * wr);
  const t_h0 = Math.max(0.02, Math.min(topAt(0) + botAt(0), 0.5)) / 2;
  const gillU = A.eye.u - 0.17;
  const col = (c, f) => shadeC(c, f);

  /* ---------- colours ---------- */
  const bodyCol = (u, v, ix, iy, iz) => {
    const pat = patternAt(s, A, u, v, ix, iy);
    let c = mixC(base, belly, sstep(0.5, 0.95, v) * 0.85);
    if (s.pt === 'lateral') {
      if (v > 0.36 && v < 0.5 && u < 0.88) c = mixC([60, 235, 255], [200, 255, 255], (1 - Math.abs(v - 0.43) / 0.07) * 0.5);
      else if (v >= 0.5 && u < 0.6) c = c2;
    }
    if (pat.t > 0) c = mixC(c, c2, pat.t);
    if (pat.dark) c = [18, 14, 22];
    mods.forEach(m => (c = modTint(m, c, u, v, ix, iy)));
    if (mods.length) c = [c[0] * 0.78, c[1] * 0.78, c[2] * 0.8];
    let sh = -0.2 * (1 - sstep(0, 0.2, v)) + 0.1 * Math.exp(-Math.pow((v - 0.28) / 0.1, 2)) * sstep(0.1, 0.4, u) - 0.12 * sstep(0.88, 1, v) - 0.06 * (1 - sstep(0, 0.25, u));
    if (A.scales && u > 0.1 && u < gillU - 0.02) { const q = A.scales === 2 ? 3 : 4, a = (ix + (iy & 1) * 2) % q; if (a === 0) sh -= 0.07; else if (a === 1) sh += 0.03; }
    const gl = gillU + 0.04 * (1 - Math.pow(2 * v - 1, 2)) - 0.02;
    if (u > gl - 0.014 && u < gl + 0.006 && v > 0.12 && v < 0.9) sh -= 0.3; else if (u >= gl + 0.006 && u < gl + 0.12 && v > 0.12) sh += 0.06;
    return shadeC(c, sh);
  };
  const nRay = Math.max(6, Math.round(L * 0.3));
  const rayLine = (ang, n) => (((ang / Math.PI + 1) * n) % 1) < 0.25;
  const finCol = (f, ix, iy) => {
    let c = finC;
    if (A.stripeFins && s.pt === 'stripes') for (const cc of [0.3, 0.46, 0.62]) if (Math.abs(f.X - cc) < 0.05) c = c2;
    c = mixC(c, shadeC(c, 0.35), Math.min(1, (f.fade == null ? 0.5 : f.fade) * 0.8));
    if (f.d && f.d.col === 'fin') c = _hx('#e63946');
    mods.forEach(m => (c = modTint(m, c, f.X + 0.5, 0.5, ix, iy)));
    if (mods.length) c = [c[0] * 0.8, c[1] * 0.8, c[2] * 0.82];
    if (f.k !== 'pelv' && f.k !== 'sword' && rayLine(f.ang || 0, f.k === 'tail' ? nRay : 7)) c = shadeC(c, -0.2); else c = shadeC(c, 0.05);
    return c;
  };

  /* ---------- body ---------- */
  const x1 = Math.ceil(L * 1.02), beakEnd = A.beak ? Math.ceil(L * (1 + A.beak)) : x1;
  const bodyYZ = {}; // per x: max |z| for eye placement
  for (let ix = 0; ix <= beakEnd; ix++) {
    const X = ix / L;
    if (X <= 1) {
      let tp = topAt(X), bt = botAt(X);
      if (A.snout && X > 0.82) { const sn = 1 - (X - 0.82) / 0.18, m = Math.min(1, 0.45 + 0.55 * sn); tp *= m; bt *= m; }
      const hy = (tp + bt) / 2, yc = (bt - tp) / 2, hz = Math.max(0.6 / L, hy * wr);
      for (let iy = Math.floor(-bt * L) - 2; iy <= Math.ceil(tp * L) + 2; iy++) {
        const Y = -iy / L;
        for (let iz = -Math.ceil(hz * L) - 1; iz <= Math.ceil(hz * L) + 1; iz++) {
          const Z = iz / L;
          let tpp = tp, spk = 0;
          const d = ((Y - yc) / hy) ** 2 + (Z / hz) ** 2;
          if (d <= 1.0) { g.set(ix, iy, iz, bodyCol(X, (Y + tp) / (tp + bt), ix, iy, iz)); }
        }
      }
    } else if (A.beak) { // long jaw
      const bw = 0.03 * (1 - (X - 1) / A.beak * 0.6);
      for (let iy = -3; iy <= 3; iy++) for (let iz = -3; iz <= 3; iz++) if (Math.abs(iy / L) < bw && Math.abs(iz / L) < bw) g.set(ix, iy, iz, mixC(base, [40, 40, 30], 0.2));
    }
  }
  if (A.hammer) { const hw = Math.round(L * 0.23), hy = Math.max(2, Math.round(L * 0.045)), cy = Math.round(-((botAt(0.96) - topAt(0.96)) / 2) * L); for (let ix = Math.round(L * 0.9); ix <= Math.round(L * 1.03); ix++) for (let iz = -hw; iz <= hw; iz++) for (let iy = cy - hy; iy <= cy + hy; iy++) { const e = Math.abs(iz) > hw - 2; if (!(e && (iy < cy - hy + 1 || iy > cy + hy - 1))) g.set(ix, iy, iz, bodyCol(0.95, 0.3 + (iy - cy + hy) / (2 * hy) * 0.4, ix, iy, iz)); } }
  if (A.scutes) for (let ix = Math.round(L * 0.12); ix < Math.round(L * 0.85); ix += 3) { const tp = Math.round(topAt(ix / L) * L); g.set(ix, tp + 1, 0, shadeC(c2, -0.1)); for (const z of [-3, 3]) { const hz = Math.round(hzAt(ix / L) * L * 0.8); g.set(ix, 0, z > 0 ? hz : -hz, shadeC(c2, -0.05)); } }
  if (A.spikes) { const add = []; for (const e of g.m.values()) { const [r, gg, b, x, y, z] = e; if (x % 3 === 0 && (y + z) % 2 === 0 && x > 2 && x < L - 3) { const top = !g.has(x, y + 1, z), bot = !g.has(x, y - 1, z), sd = !g.has(x, y, z + 1), sd2 = !g.has(x, y, z - 1); if (top) add.push([x, y + 1, z]); if (bot) add.push([x, y - 1, z]); if (sd) add.push([x, y, z + 1]); if (sd2) add.push([x, y, z - 1]); } } add.forEach(p => g.set(p[0], p[1], p[2], shadeC(c2, -0.1))); }

  /* ---------- tail (single sheet at z=0, slightly V-bent) ---------- */
  const tx0 = Math.floor(-(tlen + (tail.sword ? 0.1 : 0)) * L);
  const tailTest = (X, Y) => {
    const t = -X / tlen; if (t < 0 || t > 1) return null;
    const h0 = t_h0, sp = tail.sp; let outer, inner = 0;
    switch (tail.k) {
      case 'fork': outer = h0 + (sp - h0) * Math.pow(t, 0.75); inner = t > 0.35 ? (t - 0.35) * sp * 1.25 : 0; if (t > 0.94) outer *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.94) / 0.06, 2))); break;
      case 'lunate': outer = h0 + (sp - h0) * Math.pow(t, 1.15); inner = t > 0.3 ? outer * Math.pow((t - 0.3) / 0.7, 0.9) * 0.92 : 0; break;
      case 'delta': outer = h0 + (sp - h0) * Math.pow(t, 0.85); break;
      case 'flow': outer = (h0 + (sp - h0) * Math.pow(t, 0.55)) * (1 + 0.07 * Math.sin(t * 13)); if (t > 0.85) outer *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.85) / 0.15, 2))); break;
      case 'fan2': outer = h0 + (sp - h0) * Math.pow(t, 0.6); if (t > 0.74) outer *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.74) / 0.26, 2))); inner = t > 0.7 ? Math.max(0, (t - 0.7)) * sp * 1.1 * Math.max(0, 1 - Math.abs(Y) * 5) : 0; break;
      case 'fan': outer = h0 + (sp - h0) * Math.pow(t, 0.6); if (t > 0.78) outer *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.78) / 0.22, 2))); if (tail.wav) outer *= 1 + 0.08 * Math.sin(Math.abs(Y) * 30 + t * 4); break;
      default: outer = t < 0.55 ? h0 + (sp - h0) * Math.pow(t / 0.55, 0.8) : sp * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.55) / 0.45, 2)));
    }
    const ay = Math.abs(Y); if (ay > outer || ay < inner) return null;
    return { t, ang: Math.atan2(Y, -X) };
  };
  const extTop = Math.ceil(L * (Math.max(tail.sp, P.tot * A.top + (A.hump || 0) + 0.05) + 0.5)), extBot = Math.ceil(L * (Math.max(tail.sp, P.tot * (1 - A.top)) + 0.35 + (tail.sword || 0)));
  const ripple = tail.k === 'fan' || tail.k === 'fan2' || tail.k === 'flow' || tail.k === 'delta' ? 1 : 0.35;
  for (let ix = tx0; ix < 1; ix++) {
    const X = ix / L;
    for (let iy = -extBot - 4; iy <= extTop + 4; iy++) {
      const Y = -iy / L, tt = tailTest(X, Y);
      if (tt) {
        const zo = Math.round(Math.sin(iy * 0.45 + ix * 0.11) * Math.min(2.2, tt.t * 3.4) * ripple);
        let c = finCol({ k: 'tail', X, ang: tt.ang, fade: tt.t }, ix, iy);
        if (s.pt === 'spots' && hash(s.id + 'tl' + Math.floor(ix / 2) + ',' + Math.floor(iy / 2)) % 6 === 0) c = mixC(c, base, 0.8);
        if (s.pt === 'stripes' && Math.abs(((tt.ang / Math.PI + 1) * 5) % 1 - 0.5) < 0.12) c = mixC(c, c2, 0.8);
        g.set(ix, iy, zo, c);
        if (rayLine(tt.ang, nRay)) g.set(ix, iy, zo + 1, shadeC(c, 0.04));
        if (L >= 34 && ripple === 1 && tt.t > 0.25) g.set(ix, iy, zo - 1, shadeC(c, 0.1));
      } else if (tail.sword && Math.abs(Y - t_h0 * 0.9) < 0.012 && X > -(tlen + 0.1)) g.set(ix, iy, 0, finCol({ k: 'sword', X, fade: 0.8 }, ix, iy));
    }
  }

  /* ---------- median fins (dorsal/anal) at z=0 ---------- */
  for (const d of (A.dor || [])) {
    if (d.k === 'whip') {
      const baseU = d.u1 + (d.u2 - d.u1) * 0.35, topY = topAt(baseU);
      for (let i = 0; i <= d.h * L * 1.1; i++) { const t = i / (d.h * L * 1.1), ix = Math.round((baseU - 0.12 * t) * L), iy = Math.round((topY + d.h * t) * L); const c = finCol({ k: 'dor', X: baseU, ang: 0 }, ix, iy); g.set(ix, iy, 0, c); if (t < 0.6) g.set(ix + 1, iy, 0, c); }
      for (let ix = Math.round(baseU * L); ix <= Math.round(d.u2 * L); ix++) { const tt = (ix / L - baseU) / (d.u2 - baseU), hh = 0.16 * (1 - tt), tp = topAt(ix / L); for (let iy = Math.round(tp * L) - 1; iy <= Math.round((tp + hh) * L); iy++) g.set(ix, iy, 0, finCol({ k: 'dor', X: ix / L, ang: 0 }, ix, iy)); }
      continue;
    }
    for (let ix = Math.round(d.u1 * L); ix <= Math.round(d.u2 * L); ix++) {
      const X = ix / L, t = (X - d.u1) / (d.u2 - d.u1), h = d.h * finH(d.k, t, d.ap, d), tp = topAt(X);
      for (let iy = Math.round(tp * L) - 1; iy <= Math.round((tp + h) * L); iy++) g.set(ix, iy, 0, finCol({ k: 'dor', X, d, ang: Math.atan2(-(iy / L) + tp + 0.25, X - (d.u1 + d.u2) / 2) }, ix, iy));
    }
  }
  if (A.anal) {
    const d = A.anal;
    for (let ix = Math.round(d.u1 * L); ix <= Math.round(d.u2 * L); ix++) {
      const X = ix / L, t = (X - d.u1) / (d.u2 - d.u1), h = d.h * finH(d.k, t, d.ap, d), bt = botAt(X);
      for (let iy = Math.round(-bt * L) + 1; iy >= Math.round(-(bt + h) * L); iy--) g.set(ix, iy, 0, finCol({ k: 'anal', X, d, ang: Math.atan2((-iy / L) - bt + 0.2, X - (d.u1 + d.u2) / 2) }, ix, iy));
    }
  }
  /* ---------- paired fins ---------- */
  if (A.pelv && A.pelv.len > 0) {
    const p = A.pelv, bx = p.u, by = botAt(bx), hz = hzAt(bx);
    for (const sgn of [-1, 1]) {
      const zz = sgn * Math.max(1, Math.round(hz * L * 0.5));
      if (p.thread) { for (let i = 0; i <= p.len * L; i++) { const t = i / (p.len * L); g.set(Math.round((bx - t * 0.12) * L), Math.round(-(by + t * p.len) * L), zz, finCol({ k: 'pelv', X: bx, fade: t }, 0, i)); } }
      else for (let i = 0; i <= p.len * L; i++) for (let j = 0; j <= (p.len * L) * (1 - i / (p.len * L + 1)); j++) g.set(Math.round(bx * L - j), Math.round(-(by) * L - i), zz, finCol({ k: 'pelv', X: bx, fade: i / (p.len * L) }, j, i));
    }
  }
  if (A.pect && A.pect.len > 0) {
    const p = A.pect, bx = p.u, hz = hzAt(bx), cyF = (botAt(bx) - topAt(bx)) / 2 + (botAt(bx) + topAt(bx)) * 0.12;
    const ww = (p.wide ? 0.2 : 0.075) * (p.len / 0.17 > 1 ? Math.min(2.2, p.len / 0.17) : 1);
    for (let ix = Math.round((bx - p.len) * L); ix <= Math.round(bx * L); ix++) {
      const dx = bx - ix / L, t = dx / p.len, half = ww * Math.pow(Math.sin(Math.min(1, t + 0.08) * Math.PI * 0.78), 0.9) * (1 - t * 0.25), cy = cyF + t * (p.wide ? 0 : 0.05);
      for (let iy = Math.round(-(cy + half) * L); iy <= Math.round(-(cy - half) * L); iy++) {
        const zt = Math.round(hz * L * 0.9 + 1 + t * L * (p.wide ? 0.22 : 0.1));
        for (const sgn of [-1, 1]) { for (let zz = Math.round(hz * L * 0.9 + 1); zz <= zt; zz++) g.set(ix, iy, sgn * zz, finCol({ k: 'pect', X: bx, fade: t, ang: 0 }, ix, iy)); }
      }
    }
  }

  /* ---------- details ---------- */
  const ink = [14, 10, 20];
  // eyes (both sides)
  const eu = A.eye.u, ex = Math.round(eu * L), er = Math.max(1, Math.floor(A.eye.r * L * 0.62));
  const tpE = topAt(eu), btE = botAt(eu), ey = Math.round(-(((btE - tpE) / 2) + (A.eye.dy || 0) - (tpE + btE) * 0.1) * L);
  const irisC = s.id === 'neon' || s.id === 'goby' ? [250, 250, 250] : [250, 205, 70];
  for (const sgn of [-1, 1]) {
    let zmax = 0; for (let z = 0; z <= L; z++) if (g.has(ex, ey, z * sgn)) zmax = z; else if (z > zmax + 1) break;
    for (let a = -er; a <= er; a++) for (let b = -er; b <= er; b++) {
      const d = Math.hypot(a, b); if (d > er + 0.4) continue;
      const zz = sgn * (zmax + (d < er * 0.5 ? 1 : 0)), c = d <= Math.max(0.6, er * 0.45) ? [8, 6, 14] : d > er - 0.2 && er > 1 ? ink : irisC;
      g.setRaw(ex + a, ey + b, zz, c);
    }
    if (er >= 2) g.setRaw(ex - 1, ey + 1, sgn * (zmax + 1), [255, 255, 255]);
  }
  // mouth
  const mouthY = Math.round(-(((botAt(0.97) - topAt(0.97)) / 2 + (botAt(0.97) + topAt(0.97)) * 0.16)) * L), nose = Math.round(L * (A.snout ? 1 : 1));
  const mouthLen = A.bigmouth ? Math.round(L * 0.22) : A.lips ? 3 : Math.max(2, Math.round(L * 0.06));
  for (let i = 0; i < mouthLen; i++) for (let z = -2; z <= 2; z++) if (g.has(nose - i, mouthY, z)) g.setRaw(nose - i, mouthY, z, ink);
  if (A.lips) for (let z = -1; z <= 1; z++) { g.set(nose, mouthY + 1, z, [230, 120, 130]); g.set(nose, mouthY - 1, z, [230, 120, 130]); }
  if (A.teeth) { const n = A.teeth === 2 ? 4 : 3; for (let i = 0; i < n; i++) for (const z of [-1, 1]) { g.setRaw(nose - 1 - i * 2, mouthY - 1, z, [250, 250, 245]); if (A.teeth === 2) g.setRaw(nose - 1 - i * 2, mouthY + 1, z, [250, 250, 245]); } }
  if (A.barbels) for (let i = 0; i < A.barbels; i++) { const zz = i % 2 ? 2 : -2; g.line([nose - 1, mouthY - 1, zz], [nose - 1 - L * (0.1 + 0.02 * i), mouthY - L * (0.06 + 0.02 * i), zz * 1.6], shadeC(base, -0.35), 0.5); }
  if (A.lure) { const sx = Math.round(L * 0.86), sy = Math.round(topAt(0.86) * L); for (let i = 0; i <= 14; i++) { const t = i / 14; g.set(sx + (L * 0.16) * t, sy + L * 0.34 * t + Math.sin(t * Math.PI) * 2, 0, [60, 40, 90]); } g.ell(sx + L * 0.16, sy + L * 0.36, 0, 2.5, 2.5, 2.5, c => [255, 235, 150]); }
  if (A.leaf) for (let i = 0; i < 9; i++) { const u0 = 0.12 + i * 0.09, top = i % 2 === 0, yy = Math.round((top ? topAt(u0) : -botAt(u0)) * L) + (top ? 2 : -2), x0 = Math.round(u0 * L), gc = [[120, 170, 40], [150, 190, 60], [200, 160, 40]][i % 3]; g.ell(x0, yy, 0, 3, 2, 1.2, gc); }
  const geo = g.geometry();
  geo.translate(-L * 0.4, 0, 0);
  return { geo, L, len: L * (1 + tlen), glow: mods.map(m => MODS[m].glow).find(Boolean) || null, ray: false };
}

