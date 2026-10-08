'use strict';
/* ===== Sparse voxel grid -> THREE.BufferGeometry (face culling + per-vertex ambient occlusion) ===== */

class VGrid {
  constructor(jit) { this.m = new Map(); this.jit = jit == null ? 0.04 : jit; }
  static key(x, y, z) { return ((x + 512) << 20) | ((y + 512) << 10) | (z + 512); }
  set(x, y, z, c) {
    x = Math.round(x); y = Math.round(y); z = Math.round(z);
    if (typeof c === 'string') c = _hx(c);
    const j = 1 + this.jit * (((hash(x + ',' + y + ',' + z) % 1000) / 500) - 1);
    this.m.set(VGrid.key(x, y, z), [Math.min(255, c[0] * j), Math.min(255, c[1] * j), Math.min(255, c[2] * j), x, y, z]);
  }
  setRaw(x, y, z, c) { x = Math.round(x); y = Math.round(y); z = Math.round(z); this.m.set(VGrid.key(x, y, z), [c[0], c[1], c[2], x, y, z]); }
  has(x, y, z) { return this.m.has(VGrid.key(x, y, z)); }
  getc(x, y, z) { return this.m.get(VGrid.key(x, y, z)); }
  del(x, y, z) { this.m.delete(VGrid.key(Math.round(x), Math.round(y), Math.round(z))); }
  box(x0, y0, z0, x1, y1, z1, c) { for (let x = Math.round(x0); x <= Math.round(x1); x++) for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let z = Math.round(z0); z <= Math.round(z1); z++) this.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); }
  ell(cx, cy, cz, rx, ry, rz, c) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, dz = (z - cz) / rz;
      if (dx * dx + dy * dy + dz * dz <= 1) this.set(x, y, z, typeof c === 'function' ? c(x, y, z, dx, dy, dz) : c);
    }
  }
  cyl(cx, cz, r0, y0, y1, c, r1) { // vertical (optionally tapered) cylinder
    if (r1 == null) r1 = r0;
    for (let y = Math.round(y0); y <= Math.round(y1); y++) { const t = (y - y0) / Math.max(1, y1 - y0), r = r0 + (r1 - r0) * t;
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) if ((x - cx) ** 2 + (z - cz) ** 2 <= r * r + 0.25) this.set(x, y, z, typeof c === 'function' ? c(x, y, z, t) : c); }
  }
  line(a, b, c, r0, r1) { // thick 3D line
    if (r1 == null) r1 = r0;
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) * 1.5));
    for (let i = 0; i <= n; i++) { const t = i / n, r = r0 + (r1 - r0) * t, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t;
      if (r <= 0.6) this.set(x, y, z, typeof c === 'function' ? c(x, y, z, t) : c); else this.ell(x, y, z, r, r, r, typeof c === 'function' ? (px, py, pz) => c(px, py, pz, t) : c); }
  }
  get size() { return this.m.size; }
  /* Build geometry. Returns THREE.BufferGeometry with position/normal/color. */
  geometry(opts) {
    opts = opts || {};
    const P = [], N = [], C = [], I = [];
    const has = (x, y, z) => this.m.has(VGrid.key(x, y, z));
    const FACES = [
      { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] }, { n: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, -1] },
      { n: [0, 1, 0], u: [0, 0, 1], v: [1, 0, 0] }, { n: [0, -1, 0], u: [0, 0, 1], v: [-1, 0, 0] },
      { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] }, { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
    ];
    // corners in (su,sv) ∈ {-1,1}²
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    let vi = 0;
    for (const e of this.m.values()) {
      const x = e[3], y = e[4], z = e[5], cr = Math.pow(e[0] / 255, 2.2), cg = Math.pow(e[1] / 255, 2.2), cb = Math.pow(e[2] / 255, 2.2);
      for (const f of FACES) {
        if (has(x + f.n[0], y + f.n[1], z + f.n[2])) continue;
        const ao = [];
        for (const [su, sv] of corners) {
          const s1 = has(x + f.n[0] + f.u[0] * su, y + f.n[1] + f.u[1] * su, z + f.n[2] + f.u[2] * su) ? 1 : 0;
          const s2 = has(x + f.n[0] + f.v[0] * sv, y + f.n[1] + f.v[1] * sv, z + f.n[2] + f.v[2] * sv) ? 1 : 0;
          const c = has(x + f.n[0] + f.u[0] * su + f.v[0] * sv, y + f.n[1] + f.u[1] * su + f.v[1] * sv, z + f.n[2] + f.u[2] * su + f.v[2] * sv) ? 1 : 0;
          ao.push(s1 && s2 ? 0 : 3 - (s1 + s2 + c));
        }
        corners.forEach(([su, sv], k) => {
          P.push(x + f.n[0] * 0.5 + f.u[0] * su * 0.5 + f.v[0] * sv * 0.5, y + f.n[1] * 0.5 + f.u[1] * su * 0.5 + f.v[1] * sv * 0.5, z + f.n[2] * 0.5 + f.u[2] * su * 0.5 + f.v[2] * sv * 0.5);
          N.push(f.n[0], f.n[1], f.n[2]);
          const m = 0.55 + 0.45 * (ao[k] / 3); C.push(cr * m, cg * m, cb * m);
        });
        if (ao[0] + ao[2] > ao[1] + ao[3]) I.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3); else I.push(vi + 1, vi + 2, vi + 3, vi + 1, vi + 3, vi);
        vi += 4;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    g.setIndex(I);
    g.computeBoundingBox(); g.computeBoundingSphere();
    return g;
  }
}
