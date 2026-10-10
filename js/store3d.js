'use strict';
/* ===== Isometric 3D fish shop (store tab) ===== */

const SHOP = { W: 240, D: 190, WH: 104 };
const SKIN_TONES = ['#f2c9a0', '#e0a878', '#b9805a', '#7a4e32'], HAIRS = ['#2a1c14', '#5a3a22', '#c9a24a', '#b0b0b8', '#a8332a', '#1c1c24'];
const SHIRTS = ['#3a7bd5', '#d5503a', '#4aa86a', '#c9a22e', '#8a52c8', '#2a2f3a', '#e07aa8', '#e8e8ee'], PANTS = ['#2e3a5a', '#3a3a3e', '#5a4630', '#26424a'];
const SLOTS_POS = (() => { // display tank positions: [x, z, rotated]
  const a = [];
  [20, 64, 108, 152].forEach(x => a.push([x + 20, 22 + 14, 0]));        // back wall row
  [60, 104, 148].forEach(z => a.push([14 + 14, z + 20, 1]));            // left wall row
  [[96, 84], [142, 84], [96, 124], [142, 124], [119, 150]].forEach(p => a.push([p[0], p[1], 0])); // island
  return a;
})();
const QUEUE_X = 214, QUEUE_Z0 = 104, DOOR = [216, -16], DOOR_IN = [216, 14];
/* places where customers stop to admire the display tanks: [x, z, tank to look at] */
const BROWSE_SPOTS = [[40, 64], [84, 64], [128, 64], [172, 64], [58, 82], [58, 126], [58, 170], [66, 104], [168, 104], [70, 150], [168, 150], [119, 178], [104, 190 - 6], [150, 176], [30, 190 - 8]];

/* ---- walk grid so customers wander around the furniture instead of through it ---- */
const NAV = (() => {
  const cs = 4, nx = Math.ceil(SHOP.W / cs), nz = Math.ceil(SHOP.D / cs), blocked = new Uint8Array(nx * nz);
  const rect = (x0, z0, x1, z1, m) => { for (let ix = Math.floor((x0 - m) / cs); ix <= Math.floor((x1 + m) / cs); ix++) for (let iz = Math.floor((z0 - m) / cs); iz <= Math.floor((z1 + m) / cs); iz++) if (ix >= 0 && iz >= 0 && ix < nx && iz < nz) blocked[iz * nx + ix] = 1; };
  SLOTS_POS.forEach(([x, z, rot]) => { const w = rot ? 28 : 40, d = rot ? 40 : 28; rect(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 5); });
  rect(184, 96, 199, 179, 5); rect(1, 8, 13, 52, 4); rect(4, 176, 16, 188, 3); rect(226, 8, 238, 20, 3); rect(220, 178, 232, 188, 3);
  return { cs, nx, nz, blocked };
})();
function navPath(sx, sz, gx, gz) {
  const { cs, nx, nz, blocked } = NAV, cell = (x, z) => [Math.max(0, Math.min(nx - 1, Math.floor(x / cs))), Math.max(0, Math.min(nz - 1, Math.floor(z / cs)))];
  const free = ([ix, iz]) => { if (!blocked[iz * nx + ix]) return [ix, iz]; for (let r = 1; r < 12; r++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { const a = ix + dx, b = iz + dz; if (a >= 0 && b >= 0 && a < nx && b < nz && !blocked[b * nx + a]) return [a, b]; } return [ix, iz]; };
  const S0 = free(cell(sx, sz)), G0 = free(cell(gx, gz)), id = c => c[1] * nx + c[0];
  const g = new Map([[id(S0), 0]]), from = new Map(), open = [[0, S0]], done = new Set();
  const h = c => Math.hypot(c[0] - G0[0], c[1] - G0[1]);
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]); const [, c] = open.shift(), ci = id(c); if (done.has(ci)) continue; done.add(ci);
    if (c[0] === G0[0] && c[1] === G0[1]) break;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dz) continue; const a = c[0] + dx, b = c[1] + dz; if (a < 0 || b < 0 || a >= nx || b >= nz || blocked[b * nx + a]) continue;
      if (dx && dz && (blocked[c[1] * nx + a] || blocked[b * nx + c[0]])) continue;
      const ni = b * nx + a, ng = g.get(ci) + Math.hypot(dx, dz); if (g.has(ni) && g.get(ni) <= ng) continue; g.set(ni, ng); from.set(ni, ci); open.push([ng + h([a, b]), [a, b]]);
    }
  }
  const out = []; let cur = id(G0); if (!from.has(cur) && cur !== id(S0)) return [[gx, gz]];
  while (cur !== id(S0)) { out.push([(cur % nx + 0.5) * cs, (Math.floor(cur / nx) + 0.5) * cs]); cur = from.get(cur); }
  out.reverse();
  // line-of-sight smoothing
  const clear = (a, b) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2); for (let i = 1; i < n; i++) { const x = a[0] + (b[0] - a[0]) * i / n, z = a[1] + (b[1] - a[1]) * i / n, c = cell(x, z); if (blocked[c[1] * nx + c[0]]) return false; } return true; };
  const sm = []; let anchor = [sx, sz], i = 0;
  while (i < out.length) { let j = out.length - 1; while (j > i && !clear(anchor, out[j])) j--; sm.push(out[j]); anchor = out[j]; i = j + 1; }
  sm.push([gx, gz]); return sm;
}

const _shopGeo = {};
function shopGeo(name, build) { if (_shopGeo[name]) return _shopGeo[name]; const g = new VGrid(0.05); build(g); return (_shopGeo[name] = g.geometry()); }
const W_ = (c, f) => shadeC(_hx(c), f || 0);

function paintTexture(w, h, draw, opts) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; draw(x, w, h);
  const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.encoding = THREE.sRGBEncoding; t.generateMipmaps = false; return t;
}
function texMesh(w, h, tex, opts) { opts = opts || {}; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, color: opts.color || 0xffffff })); return m; }

/* ----- building blocks ----- */
function floorGeo() {
  return shopGeo('floor', g => {
    for (let x = 0; x < SHOP.W; x++) for (let z = 0; z < SHOP.D; z++) {
      const tx = Math.floor(x / 10), tz = Math.floor(z / 10), chk = (tx + tz) % 2;
      let c = chk ? '#d9d2c2' : '#3f7f86';
      if (x > 62 && x < 176 && z > 68 && z < 176) { c = ((Math.floor((x - 62) / 4) + Math.floor((z - 68) / 4)) % 2) ? '#a8453a' : '#b6554a'; if (x < 66 || x > 172 || z < 72 || z > 172) c = '#e8d9a0'; }
      const h = hash(x + ',' + z) % 9 === 0 ? 0.06 : 0;
      g.set(x, 0, z, shadeC(_hx(c), h + (x % 10 === 0 || z % 10 === 0 ? -0.12 : 0)));
      if (x === 0 || z === 0 || x === SHOP.W - 1 || z === SHOP.D - 1) for (let y = -4; y < 0; y++) g.set(x, y, z, W_('#5a4a3a', -0.1));
    }
  });
}
function counterGeo() {
  return shopGeo('counter', g => {
    const wood = (x, y, z) => shadeC(_hx('#7a4a2a'), (x % 6 === 0 ? -0.1 : 0.02) + (y % 5 === 0 ? -0.05 : 0));
    g.box(0, 1, 0, 15, 24, 83, wood);
    for (let z = 4; z < 80; z += 14) g.box(15, 4, z, 15, 20, z + 9, (x, y) => shadeC(_hx('#5a3418'), y % 2 ? 0 : 0.04));
    g.box(-2, 25, -2, 17, 27, 85, '#e4e0d6'); g.box(-2, 27, -2, 17, 27, 85, '#f4f1ea');
    // register
    g.box(4, 28, 36, 12, 31, 48, '#31353f'); g.box(8, 32, 38, 12, 40, 46, '#252830'); g.box(11, 33, 39, 12, 39, 45, '#5ee0a0'); g.box(5, 28, 49, 11, 29, 55, '#9aa0aa');
    g.box(5, 30, 20, 11, 37, 26, '#e0c84a'); // food tin
    g.ell(8, 31, 68, 6, 4, 6, (x, y, z, dx, dy, dz) => (dy > 0.2 ? [180, 215, 235] : [90, 160, 200])); g.ell(8, 30, 68, 3, 1.5, 3, '#ffb83a'); // fish bowl
    g.box(1, 28, 6, 3, 31, 10, '#c0453a'); g.box(1, 28, 12, 3, 30, 15, '#4a8ad0');
  });
}
function shelfGeo() {
  return shopGeo('shelf', g => {
    const wood = '#8a6a44';
    g.box(0, 0, 0, 2, 62, 44, wood); g.box(0, 0, 0, 12, 2, 44, wood);
    for (const y of [2, 22, 42, 62]) g.box(0, y, 0, 12, y + 1, 44, shadeC(_hx(wood), 0.1));
    const cols = ['#e04a4a', '#4a8ad0', '#e0c84a', '#4ac08a', '#a85ad0', '#e8e8f0', '#f08a3a'];
    for (const y of [3, 23, 43]) { let z = 2; while (z < 40) { const w = 4 + (hash(y + '_' + z) % 4), h = 6 + (hash(z + '_' + y) % 8), c = cols[hash(y * 7 + z) % cols.length]; if (hash(z + y) % 3 === 0) g.cyl(7, z + w / 2, w / 2, y, y + h - 1, c); else g.box(3, y, z, 10, y + h, z + w, c); z += w + 2; } }
  });
}
function benchGeo() { return shopGeo('stool', g => { g.cyl(0, 0, 5, 9, 12, '#a8453a'); g.cyl(0, 0, 4, 0, 8, '#3a3f4a'); g.cyl(0, 0, 6, 0, 1, '#3a3f4a'); }); }
function potGeo() {
  return shopGeo('pot', g => {
    g.cyl(0, 0, 6, 0, 10, (x, y) => shadeC(_hx('#b8613a'), y % 4 === 0 ? -0.1 : 0.03), 4.5); g.cyl(0, 0, 6.5, 9, 11, '#c8714a');
    const r = rng('pot'); for (let i = 0; i < 14; i++) blade(g, [0, 11, 0], i * 2.4, 0.9 + r() * 0.5, 14 + r() * 12, 2.2, 0.5, t => mixC(HX('#2f8f4a'), HX('#52c86a'), t));
  });
}
function doorFrameGeo() {
  return shopGeo('door', g => {
    const wood = '#5a3a22'; g.box(0, 0, 0, 3, 72, 3, wood); g.box(0, 0, 26, 3, 72, 29, wood); g.box(0, 72, 0, 3, 75, 29, wood);
    g.box(1, 48, 9, 2, 66, 20, '#ffffff');
  });
}
function displayTankGeo(rot) {
  return shopGeo('dtank' + rot, g => {
    const w = rot ? 28 : 40, d = rot ? 40 : 28;
    const wood = (x, y, z) => shadeC(_hx('#6a4a30'), (y === 7 ? -0.12 : 0.02) + (hash(x + y + z) % 8 === 0 ? -0.04 : 0));
    g.box(0, 0, 0, w, 13, d, wood);
    g.box(-1, 13, -1, w + 1, 14, d + 1, '#2e3138');
    // door panels
    if (rot) g.box(w, 2, 3, w, 11, d - 3, '#4a3320'); else g.box(3, 2, d, w - 3, 11, d, '#4a3320');
    // gravel inside tank
    for (let x = 1; x < w; x++) for (let z = 1; z < d; z++) g.set(x, 15, z, hash(x + ',' + z) % 5 === 0 ? '#e8e0c8' : '#b8ac8a');
    // frame
    const fr = '#2e3138'; for (const [x, z] of [[0, 0], [w, 0], [0, d], [w, d]]) g.box(x, 14, z, x, 14 + 28, z, fr);
    for (const y of [42]) { g.box(0, y, 0, w, y, 0, fr); g.box(0, y, d, w, y, d, fr); g.box(0, y, 0, 0, y, d, fr); g.box(w, y, 0, w, y, d, fr); }
    g.box(0, 43, 0, w, 44, 1, '#e8f4ff'); g.box(0, 43, 1, 1, 44, d, '#e8f4ff'); // light bars along the back edges
    const r = rng('dt' + rot); for (let i = 0; i < 4; i++) blade(g, [4 + r() * (w - 8), 16, 4 + r() * (d - 8)], r() * 6, 1.2, 6 + r() * 6, 1, 0.2, t => mixC(HX('#3f9f4a'), HX('#8ad06a'), t));
    g.ell(w * 0.7, 17, d * 0.3, 3, 2, 3, '#7f8b99');
  });
}

/* ----- people ----- */
const _partGeo = {};
function personGeos(app) {
  const key = app.skin + app.hair + app.shirt + app.pants + app.style + (app.hat || '') + (app.apron ? 'a' : '');
  if (_partGeo[key]) return _partGeo[key];
  const sk = _hx(app.skin), hr = _hx(app.hair), sh = _hx(app.shirt), pn = _hx(app.pants);
  const mk = fn => { const g = new VGrid(0.05); fn(g); return g.geometry(); };
  const out = {};
  out.torso = mk(g => { g.box(-2, 0, -4, 2, 10, 4, (x, y, z) => (app.apron && x >= 1 && y < 8 ? _hx('#3f9f6a') : shadeC(sh, y > 8 ? 0.06 : 0))); g.box(-1, 10, -1, 1, 11, 1, sk); if (app.apron) g.box(-1, 0, -4, 2, 0, 4, '#3f9f6a'); });
  out.head = mk(g => {
    g.box(-3, 0, -3, 3, 6, 3, (x, y, z) => shadeC(sk, y > 4 ? 0.04 : 0));
    g.box(3, 3, -2, 3, 4, -1, '#2a2a30'); g.box(3, 3, 1, 3, 4, 2, '#2a2a30'); g.box(3, 1, -1, 3, 1, 1, shadeC(sk, -0.25));
    if (app.style === 'short') { g.box(-3, 6, -3, 3, 7, 3, hr); g.box(-3, 3, -3, -3, 6, 3, hr); g.box(2, 6, -3, 3, 6, 3, hr); }
    else if (app.style === 'long') { g.box(-3, 6, -3, 3, 7, 3, hr); g.box(-4, -2, -3, -3, 6, 3, hr); g.box(-3, 3, -4, 2, 6, -4, hr); g.box(-3, 3, 4, 2, 6, 4, hr); }
    else if (app.style === 'cap') { g.box(-3, 6, -3, 3, 7, 3, '#c0453a'); g.box(3, 5, -3, 6, 5, 3, '#c0453a'); }
    if (app.hat === 'top') { g.cyl(0, 0, 5, 6, 6, '#1a1a22'); g.cyl(0, 0, 3.4, 7, 12, '#1a1a22'); g.cyl(0, 0, 3.6, 7, 8, '#c9a22e'); g.box(3, 3, 2, 4, 5, 3, '#e0c84a'); }
    if (app.hat === 'glasses') { g.box(3, 3, -3, 4, 4, 3, '#2a2a30'); }
  });
  out.arm = mk(g => g.box(-1, -9, -1, 1, 0, 1, (x, y) => (y > -4 ? shadeC(sh, 0.04) : sk)));
  out.leg = mk(g => g.box(-1, -10, -1, 2, -1, 1, (x, y) => (y < -8 ? '#2a2a30' : shadeC(pn, 0))));
  return (_partGeo[key] = out);
}
class Person {
  constructor(app, pos) {
    this.app = app; this.g = new THREE.Group(); const P = personGeos(app), m = plainMat();
    this.legL = new THREE.Mesh(P.leg, m), this.legR = new THREE.Mesh(P.leg, m); this.legL.position.set(0, 11, -2); this.legR.position.set(0, 11, 2);
    this.torso = new THREE.Mesh(P.torso, m); this.torso.position.y = 11;
    this.head = new THREE.Mesh(P.head, m); this.head.position.y = 22;
    this.armL = new THREE.Mesh(P.arm, m), this.armR = new THREE.Mesh(P.arm, m); this.armL.position.set(0, 21, -6), this.armR.position.set(0, 21, 6);
    this.body = new THREE.Group(); [this.legL, this.legR, this.torso, this.head, this.armL, this.armR].forEach(x => this.body.add(x)); this.g.add(this.body);
    this.g.position.set(pos[0], 0.5, pos[1]); this.yaw = Math.PI; this.g.rotation.y = this.yaw; this.ph = Math.random() * 6; this.path = []; this.speed = 30; this.out = false; this.moving = false;
  }
  go(pts) { this.path = pts.slice(); }
  navTo(x, z, pre) { this.path = (pre || []).concat(navPath(this.g.position.x, this.g.position.z, x, z)); }
  update(dt) {
    let moving = false;
    if (this.path.length) {
      const t = this.path[0], dx = t[0] - this.g.position.x, dz = t[1] - this.g.position.z, d = Math.hypot(dx, dz);
      if (d < 1.5) this.path.shift(); else { const st = Math.min(d, this.speed * dt); this.g.position.x += dx / d * st; this.g.position.z += dz / d * st; const want = Math.atan2(-dz, dx); let dy = want - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); this.yaw += dy * (1 - Math.exp(-dt * 10)); moving = true; }
    } else if (this.face != null) { let dy = this.face - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); this.yaw += dy * (1 - Math.exp(-dt * 6)); }
    this.moving = moving; this.ph += dt * (moving ? 9 : 1.6); const s = moving ? Math.sin(this.ph) : 0;
    this.legL.rotation.z = s * 0.7; this.legR.rotation.z = -s * 0.7; this.armL.rotation.z = -s * 0.6; this.armR.rotation.z = s * 0.6;
    if (!moving) { this.armL.rotation.z = Math.sin(this.ph) * 0.05; this.armR.rotation.z = -Math.sin(this.ph) * 0.05; }
    this.body.position.y = moving ? Math.abs(Math.sin(this.ph)) * 0.8 : Math.sin(this.ph) * 0.15; this.g.rotation.y = this.yaw;
    this.head.rotation.y = moving ? 0 : Math.sin(this.ph * 0.4) * 0.35;
  }
}
const personApp = id => { const h = hash(id); return { skin: SKIN_TONES[h % 4], hair: HAIRS[(h >>> 3) % 6], shirt: SHIRTS[(h >>> 6) % 8], pants: PANTS[(h >>> 9) % 4], style: ["short", "long", "cap", "bald"][(h >>> 12) % 4] }; };

/* ----- the scene ----- */
class StoreScene {
  constructor(canvas, onFish, onSlot) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.onFish = onFish; this.onSlot = onSlot; this.t = 0;
    this.scene = new THREE.Scene(); this.scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6a5a4a, 0.8)); const d = new THREE.DirectionalLight(0xfff0d0, 0.95); d.position.set(-0.6, 1, 0.5); this.scene.add(d);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2000);
    const wrap = canvas.parentElement, cssW = Math.max(520, Math.min(1180, (wrap ? wrap.clientWidth : 960) - 20)), cssH = Math.round(cssW * 0.6), dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr); canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    this.people = new Map(); this.tanks = []; this.slotFish = []; this.fishObjs = new Map(); this.floats = []; this.lastEarned = S.earned; this.ray = new THREE.Raycaster(); this.mouse = new THREE.Vector2();
    this.build();
    const box = new THREE.Box3(new THREE.Vector3(-2, -4, -22), new THREE.Vector3(SHOP.W + 2, SHOP.WH + 2, SHOP.D + 2));
    fitOrtho(this.cam, box, canvas.width / canvas.height, ISO_DIR, 0.0);
    this.zp = new ZoomPan(this, 'store'); this.zp.bind(canvas); this.zp.capture();
    canvas.addEventListener('click', e => { if (!this.zp.moved) this.click(e); });
    let last = 0; canvas.addEventListener('mousemove', e => { const n = performance.now(); if (n - last < 60) return; last = n; const h = this.pickTank(e); canvas.style.cursor = h ? 'pointer' : 'default'; });
  }
  build() {
    const sc = this.scene, W = SHOP.W, D = SHOP.D, WH = SHOP.WH, mat = plainMat();
    sc.add(new THREE.Mesh(floorGeo(), mat));
    // back wall (z=0) with window + door hole + wainscot
    const backTex = paintTexture(W * 2, WH * 2, (x, w, h) => {
      x.fillStyle = '#e8dcc0'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < w; i += 16) { x.fillStyle = 'rgba(160,130,90,0.10)'; x.fillRect(i, 0, 8, h); }
      x.fillStyle = '#7a5a3a'; x.fillRect(0, h - 56, w, 56); x.fillStyle = '#8f6c46'; for (let i = 0; i < w; i += 24) x.fillRect(i + 2, h - 52, 20, 44); x.fillStyle = '#b08a5a'; x.fillRect(0, h - 58, w, 4);
      x.fillStyle = '#5a3a22'; x.fillRect(0, 0, w, 8); x.fillStyle = '#b08a5a'; x.fillRect(0, 8, w, 3);
      // window
      x.fillStyle = '#4a3320'; x.fillRect(300, 56, 150, 100); const g = x.createLinearGradient(0, 62, 0, 150); g.addColorStop(0, '#8fd0f0'); g.addColorStop(1, '#fbe7b0'); x.fillStyle = g; x.fillRect(306, 62, 138, 88); x.fillStyle = '#4a3320'; x.fillRect(373, 62, 4, 88); x.fillRect(306, 104, 138, 4);
      x.fillStyle = 'rgba(80,110,140,.5)'; for (let i = 0; i < 9; i++) x.fillRect(312 + i * 15, 120 - (i * 7) % 18, 10, 30 + (i * 7) % 18);
      // door hole
      x.clearRect(412 + 20, 56, 56, 152);
    });
    const back = texMesh(W, WH, backTex); back.position.set(W / 2, WH / 2, 0); sc.add(back);
    // sunlit street behind the door
    const street = new THREE.Mesh(new THREE.PlaneGeometry(40, 90), new THREE.MeshBasicMaterial({ color: 0xcfe9f5 })); street.position.set(216, 45, -2); sc.add(street); this.street = street;
    const leftTex = paintTexture(D * 2, WH * 2, (x, w, h) => {
      x.fillStyle = '#d9ccaa'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 16) { x.fillStyle = 'rgba(130,110,80,0.10)'; x.fillRect(i, 0, 8, h); }
      x.fillStyle = '#6a4a30'; x.fillRect(0, h - 56, w, 56); x.fillStyle = '#7e5a3a'; for (let i = 0; i < w; i += 24) x.fillRect(i + 2, h - 52, 20, 44); x.fillStyle = '#b08a5a'; x.fillRect(0, h - 58, w, 4);
      x.fillStyle = '#5a3a22'; x.fillRect(0, 0, w, 8);
      x.fillStyle = '#4a3320'; x.fillRect(120, 56, 120, 90); x.fillStyle = '#9fd8f2'; x.fillRect(126, 62, 108, 78); x.fillStyle = '#4a3320'; x.fillRect(178, 62, 4, 78);
    });
    const left = texMesh(D, WH, leftTex); left.rotation.y = Math.PI / 2; left.position.set(0, WH / 2, D / 2); sc.add(left);
    // neon sign + posters
    const sign = paintTexture(200, 30, (x, w, h) => { x.clearRect(0, 0, w, h); x.font = 'bold 24px monospace'; x.textBaseline = 'middle'; x.fillStyle = '#ff6ad5'; x.shadowColor = '#ff6ad5'; x.shadowBlur = 8; x.fillText('FISH TYCOON', 6, 16); x.shadowBlur = 0; x.fillStyle = '#ffd0f0'; x.fillText('FISH TYCOON', 6, 16); });
    const sg = texMesh(100, 15, sign); sg.position.set(122, 84, 0.6); sc.add(sg); this.sign = sg;
    this.posters = [];
    const posterPos = [[200, 78, 0, 0], [30, 78, 0, 0], [0, 78, 40, 1], [0, 78, 120, 1], [0, 78, 160, 1], [160, 82, 0, 0]];
    posterPos.forEach((p, i) => { const pt = paintTexture(40, 52, (x, w, h) => { x.fillStyle = ['#f2e2b8', '#cfe6f2', '#f0d0d0', '#d8f0d0', '#ead8f4', '#f6ecc8'][i % 6]; x.fillRect(0, 0, w, h); x.strokeStyle = '#5a3a22'; x.lineWidth = 3; x.strokeRect(1, 1, w - 2, h - 2); const c = ['#e8663c', '#3a8ad0', '#d04a6a', '#3aa86a', '#8a52c8', '#e0a82e'][i % 6]; x.fillStyle = c; x.beginPath(); x.ellipse(20, 24, 12, 7, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(6, 24); x.lineTo(0, 15); x.lineTo(0, 33); x.fill(); x.fillStyle = '#fff'; x.fillRect(26, 21, 3, 3); x.fillStyle = '#5a3a22'; x.fillRect(8, 40, 24, 3); x.fillRect(12, 45, 16, 2); });
      const m = texMesh(20, 26, pt); if (p[3]) { m.rotation.y = Math.PI / 2; m.position.set(0.8, p[1], p[2]); } else m.position.set(p[0], p[1], 0.8); m.visible = i < 2; sc.add(m); this.posters.push(m); });
    // mounted trophy fish
    this.trophies = [];
    [['marlin', 50, 0], ['koi', 168, 0]].forEach(([id, x], i) => { const sp = SPECIES[id], mdl = fishModel(id, [], modelLength(sp, sp.t)), m = new THREE.Mesh(mdl.geo, plainMatFor(mdl, [])); m.scale.setScalar(0.5); m.position.set(x, 66, 3); m.rotation.y = 0; sc.add(m); });
    // door frame, counter, shelves, pots
    const door = new THREE.Mesh(doorFrameGeo(), mat); door.position.set(209, 0, 0); door.rotation.y = 0; sc.add(door);
    const counter = new THREE.Mesh(counterGeo(), mat); counter.position.set(184, 1, 96); sc.add(counter);
    const sh1 = new THREE.Mesh(shelfGeo(), mat); sh1.position.set(1, 1, 0); sh1.rotation.y = 0; sh1.position.set(206, 1, 0); // shelf beside door? keep clear: put on left wall
    sh1.position.set(1, 1, 8); sh1.rotation.y = 0; sh1.scale.set(1, 1, 1); sc.add(sh1);
    const pot1 = new THREE.Mesh(potGeo(), mat); pot1.position.set(10, 1, 182); sc.add(pot1);
    const pot2 = new THREE.Mesh(potGeo(), mat); pot2.position.set(232, 1, 14); sc.add(pot2);
    const pot3 = new THREE.Mesh(potGeo(), mat); pot3.position.set(226, 1, 184); sc.add(pot3);
    this.stools = []; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(benchGeo(), mat); m.position.set(232, 1, 70 + i * 14); m.visible = false; sc.add(m); this.stools.push(m); }
    this.cashier = new Person({ skin: SKIN_TONES[1], hair: HAIRS[1], shirt: '#e8e8ee', pants: PANTS[0], style: 'long', apron: true }, [170, 132]); this.cashier.face = 0; this.cashier.yaw = 0; this.cashier.g.visible = false; sc.add(this.cashier.g);
    this.owner = null;
  }
  syncTanks() {
    const cap = storeCap();
    while (this.tanks.length < cap && this.tanks.length < SLOTS_POS.length) {
      const i = this.tanks.length, [x, z, rot] = SLOTS_POS[i], grp = new THREE.Group(), w = rot ? 28 : 40, d = rot ? 40 : 28;
      grp.position.set(x - w / 2, 1, z - d / 2); grp.add(new THREE.Mesh(displayTankGeo(rot), plainMat()));
      const water = new THREE.Mesh(new THREE.BoxGeometry(w - 1, 24, d - 1), new THREE.MeshBasicMaterial({ color: 0x4ab8e8, transparent: true, opacity: 0.2, depthWrite: false })); water.position.set(w / 2, 14 + 13, d / 2); water.renderOrder = 5; grp.add(water);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(w, 28, d), new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide })); glass.position.set(w / 2, 28, d / 2); glass.renderOrder = 6; glass.userData.slot = i; grp.add(glass);
      
      this.scene.add(grp); this.tanks.push({ grp, w, d, glass, pos: [x, z], rot });
    }
  }
  syncFish() {
    const cap = storeCap(), fs = storeFish(), ids = new Set(fs.map(f => f.id));
    this.slotFish.length = Math.max(this.slotFish.length, cap);
    for (let i = 0; i < this.slotFish.length; i++) if (this.slotFish[i] && !ids.has(this.slotFish[i])) { const o = this.fishObjs.get(this.slotFish[i]); if (o) { o.tank.grp.remove(o.group); if (o.fx) o.fx.dispose(o.group); o.mat.dispose(); this.fishObjs.delete(this.slotFish[i]); } this.slotFish[i] = null; }
    for (const f of fs) {
      if (this.slotFish.includes(f.id)) continue;
      const i = this.slotFish.findIndex((v, k) => !v && k < cap); if (i < 0) continue;
      this.slotFish[i] = f.id;
      const tank = this.tanks[i]; if (!tank) continue;
      const sp = SPECIES[f.sp], model = fishModel(f.sp, f.mods, modelLength(sp, sp.t)), mat = fishMaterial(model, f.mods), mesh = new THREE.Mesh(model.geo, mat), group = new THREE.Group();
      mesh.userData.fishId = f.id; group.add(mesh); const sc = Math.min(0.62, 22 / model.L); group.scale.setScalar(sc); tank.grp.add(group);
      const fx = f.mods.some(m => FX_DEF[m]) ? new FishFX(group, f.mods, model.L, true) : null;
      const hs = hash(f.id); this.fishObjs.set(f.id, { group, mesh, mat, model, tank, fx, f, sc, st: { x: tank.w * 0.5, z: tank.d * 0.5, y: 28, yaw: 0, ph: hs % 10, tx: 0, tz: 0, ty: 28, sp: 6 + (hs % 5) } });
    }
    this.fishObjs.forEach(o => { o.f = getFish(o.f.id) || o.f; });
  }
  syncPeople(dt) {
    const live = new Set(S.customers.map(c => c.id));
    const ready = S.customers.filter(c => c.ready);
    S.customers.forEach(c => {
      let p = this.people.get(c.id);
      if (!p) {
        const app = personApp(c.id); if (c.type === 'collector') app.hat = 'top'; else if (c.type === 'enthusiast') app.hat = 'glasses'; else if (c.type === 'vip') app.hat = 'top';
        const late = c.age > 2, st = late ? pick(BROWSE_SPOTS) : DOOR;
        p = new Person(app, st); p.speed = 24 + (hash(c.id) % 8); p.c = c; p.state = 'browse'; p.wait = rnd(0.5, 2); p.spot = null;
        if (!late) { p.g.rotation.y = -Math.PI / 2; p.yaw = -Math.PI / 2; p.navTo(DOOR_IN[0], DOOR_IN[1]); p.entering = true; }
        this.scene.add(p.g); this.people.set(c.id, p); if (!late && typeof Sfx !== 'undefined') Sfx.play('bell');
      }
      p.c = c;
      if (c.ready) {
        const k = ready.indexOf(c), tgt = [QUEUE_X, QUEUE_Z0 + k * 15];
        if (p.state !== 'queue' || p.tgt[0] !== tgt[0] || p.tgt[1] !== tgt[1]) { p.state = 'queue'; p.tgt = tgt; p.navTo(tgt[0], tgt[1]); p.face = Math.PI; }
      } else if (p.state === 'browse') {
        if (p.path.length) return;
        p.entering = false;
        if (p.wait > 0) { p.wait -= dt; return; }
        // pick a new display tank to admire
        let sp, tries = 0; do { sp = pick(BROWSE_SPOTS); tries++; } while (sp === p.spot && tries < 5);
        p.spot = sp; p.navTo(sp[0], sp[1]); p.wait = rnd(2.5, 6);
        let best = null, bd = 1e9; this.tanks.forEach(tk => { const d = Math.hypot(tk.pos[0] - sp[0], tk.pos[1] - sp[1]); if (d < bd) { bd = d; best = tk; } });
        p.face = best ? Math.atan2(-(best.pos[1] - sp[1]), best.pos[0] - sp[0]) : Math.PI;
      }
    });
    for (const [id, p] of this.people) if (!live.has(id) && !p.out) { p.out = true; p.c = null; p.face = null; p.navTo(DOOR_IN[0], DOOR_IN[1], []); p.path.push(DOOR); }
  }
  frameDt(dtReal) {
    if (!GL.init()) return;
    const dt = Math.min(0.05, dtReal); this.t += dt;
    this.syncTanks(); this.syncFish(); this.syncPeople(dt);
    this.posters.forEach((m, i) => (m.visible = i < 1 + Math.min(5, S.storeUp.sign)));
    this.stools.forEach((m, i) => (m.visible = i < S.storeUp.seats)); this.cashier.g.visible = S.storeUp.cashier > 0; this.cashier.update(dt);
    this.sign.material.opacity = 1; this.sign.material.color.setScalar(0.88 + 0.12 * Math.sin(this.t * 3));
    // fish
    this.fishObjs.forEach(o => {
      const s = o.st, tk = o.tank, L = o.model.L * o.sc, mx = 5 + L * 0.5, mz = 5 + L * 0.5;
      if (Math.hypot(s.tx - s.x, s.tz - s.z, (s.ty - s.y)) < 2 || s.tx === 0) { s.tx = mx + Math.random() * Math.max(1, tk.w - 2 * mx); s.tz = mz + Math.random() * Math.max(1, tk.d - 2 * mz); s.ty = 20 + Math.random() * 14; }
      const dx = s.tx - s.x, dz = s.tz - s.z, dy = s.ty - s.y, d = Math.hypot(dx, dz, dy) || 1, v = s.sp;
      s.x += dx / d * v * dt; s.z += dz / d * v * dt; s.y += dy / d * v * dt * 0.5;
      const want = Math.atan2(-dz, dx); let dyaw = want - s.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw)); s.yaw += dyaw * (1 - Math.exp(-dt * 3)); s.ph += dt * 6;
      o.group.position.set(s.x, s.y, s.z); o.group.rotation.y = s.yaw; o.mat.userData.u.uPhase.value = s.ph; o.mat.userData.u.uAmp.value = 0.5; o.mat.userData.u.uTime.value = this.t; if (o.fx) o.fx.update(dt, o.model.L, this.cv.height / 700);
    });
    this.people.forEach((p, id) => { p.update(dt); if (p.out && !p.path.length) { this.scene.remove(p.g); this.people.delete(id); } });
    if (S.earned > this.lastEarned) { this.floats.push({ txt: '+' + fmt(S.earned - this.lastEarned), t: 0 }); } this.lastEarned = S.earned;
    GL.size(this.cv.width, this.cv.height); GL.r.render(this.scene, this.cam);
    const ctx = this.ctx; ctx.clearRect(0, 0, this.cv.width, this.cv.height); ctx.drawImage(GL.r.domElement, 0, 0);
    this.overlay(ctx, dt);
  }
  frame(dt) {
    if (!this._dn) { this._dn = 1; this.dayNight(sunAt(lightHour())); }
    if (!this.wx) {   // rain outside the door and on the window
      this.wx = new WxFX(this.scene, { x0: 200, x1: 232, y0: 0, y1: 78, z0: -1.9, z1: -0.5 }, 70); this.winRain = new WindowRain(54, 38, this.scene, [0.9, SHOP.WH - 49, SHOP.D - 90], Math.PI / 2);
    }
    const kind = S.wx.kind; this.wx.update(dt, kind); this.winRain.update(dt, kind);
    if (S.wx.flash && this._flash !== S.wx.flash) { this._flash = S.wx.flash; this.flashT = 0.4; const w = this.cv.parentElement; if (w) { w.classList.add('flash'); setTimeout(() => w.classList.remove('flash'), 450); } }
    if (this.flashT > 0) { this.flashT -= dt; this.dayNight(sunAt(lightHour())); }
    this.frameDt(dt);
  }
  /* the street behind the door follows the time of day */
  dayNight(sun) {
    if (!this.street) return; let c = mixRGB(mixRGB([14, 22, 52], [207, 233, 245], sun.k), [255, 170, 110], sun.warm * 0.5);
    c = mixRGB(c, [70, 82, 100], wxNow().dim * 0.9); if (this.flashT > 0) c = [255, 255, 255];
    this.street.material.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
  }
  proj(x, y, z) { const v = new THREE.Vector3(x, y, z).project(this.cam); return [(v.x + 1) / 2 * this.cv.width, (1 - v.y) / 2 * this.cv.height]; }
  overlay(ctx, dt) {
    const k = this.cv.height / 700; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tag = (txt, x, y, col, sub) => { ctx.font = `600 ${Math.round(13 * k)}px "Segoe UI", system-ui, sans-serif`; const w = ctx.measureText(txt).width + 14 * k, h = 20 * k; ctx.fillStyle = 'rgba(8,20,34,0.82)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - h / 2, w, h, 6 * k) : ctx.rect(x - w / 2, y - h / 2, w, h); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.5 * k; ctx.stroke(); ctx.fillStyle = col; ctx.fillText(txt, x, y + 0.5); if (sub != null) { ctx.fillStyle = 'rgba(8,20,34,.9)'; ctx.fillRect(x - w / 2 + 3 * k, y + h / 2 + 2 * k, w - 6 * k, 3 * k); ctx.fillStyle = sub > 0.3 ? '#5fe08f' : '#ff6b73'; ctx.fillRect(x - w / 2 + 3 * k, y + h / 2 + 2 * k, (w - 6 * k) * Math.max(0, sub), 3 * k); } };
    this.tanks.forEach((tk, i) => { const id = this.slotFish[i], f = id && getFish(id); const p = this.proj(tk.pos[0], 52, tk.pos[1]); if (f) tag(fmt(fishValue(f)), p[0], p[1], '#ffbf3c'); else { ctx.font = `600 ${Math.round(12 * k)}px system-ui`; ctx.fillStyle = 'rgba(180,210,235,.75)'; ctx.fillText('+ add fish', p[0], p[1]); } });
    const bubble = (txt, x, y, col, sub, tail) => {
      ctx.font = `700 ${Math.round(14 * k)}px "Segoe UI", system-ui, sans-serif`; const w = Math.max(30 * k, ctx.measureText(txt).width + 18 * k), h = (sub != null ? 30 : 22) * k, bx = x - w / 2, by = y - h - 9 * k, r = 9 * k;
      ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.strokeStyle = col; ctx.lineWidth = 2 * k; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, w, h, r); else ctx.rect(bx, by, w, h); ctx.moveTo(x - 6 * k, by + h - 0.5); ctx.lineTo(x, by + h + 9 * k); ctx.lineTo(x + 6 * k, by + h - 0.5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.fillRect(x - 5 * k, by + h - 2.5 * k, 10 * k, 4 * k);
      ctx.fillStyle = '#1b2a3c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, by + (sub != null ? 11 : 11.5) * k);
      if (sub != null) { ctx.fillStyle = 'rgba(30,50,70,.18)'; ctx.fillRect(bx + 6 * k, by + h - 9 * k, w - 12 * k, 4 * k); ctx.fillStyle = sub > 0.3 ? '#2fb46a' : '#e0505a'; ctx.fillRect(bx + 6 * k, by + h - 9 * k, (w - 12 * k) * Math.max(0, sub), 4 * k); }
    };
    this.people.forEach(p => {
      if (!p.c || p.out) return; const c = p.c, f = getFish(c.fishId); if (!f) return;
      const pp = this.proj(p.g.position.x, 40, p.g.position.z);
      if (!c.ready) { if (!p.moving) bubble('…', pp[0], pp[1], '#9fb3c8'); return; }
      const r = c.offer / fishValue(f);
      bubble((c.type === 'collector' ? '★ ' : c.type === 'vip' ? '👑 ' : c.type === 'event' ? '🎟 ' : '') + fmt(c.offer), pp[0], pp[1], r >= 1 ? '#2fb46a' : r < 0.8 ? '#e0505a' : '#5a7a9a', c.pat / c.patMax);
    });
    this.floats = this.floats.filter(f => (f.t += dt) < 1.6); this.floats.forEach(f => { const p = this.proj(192, 44 + f.t * 24, 120); ctx.globalAlpha = Math.max(0, 1 - f.t / 1.6); ctx.font = `700 ${Math.round(20 * k)}px system-ui`; ctx.fillStyle = '#ffd36a'; ctx.fillText(f.txt, p[0], p[1]); ctx.globalAlpha = 1; });
  }
  pickTank(e) {
    const r = this.cv.getBoundingClientRect(); this.mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); this.ray.setFromCamera(this.mouse, this.cam);
    const hit = this.ray.intersectObjects(this.tanks.map(t => t.glass), false)[0]; return hit ? hit.object.userData.slot : null;
  }
  click(e) { const i = this.pickTank(e); if (i == null) return; const id = this.slotFish[i]; if (id) this.onFish(id); else this.onSlot(); }
  dispose() { this.fishObjs.forEach(o => o.mat.dispose()); }
}
