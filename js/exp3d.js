'use strict';
/* ===== Isometric expedition map and fish-show hall ===== */

const MAP = { W: 430, D: 310, H: [214, 286] }, ISL_S = 1.35;
const islGeo = (name, build) => shopGeo('isl_' + name, build);
const GLOWS = {};   // location id -> glow geometry (emissive voxels)
const J = (c, k) => shadeC(_hx(c), k || 0);
function shallow(g, r, col) { g.cyl(0, 0, r, -1, -1, (x, y, z) => J(col, (hash(x + ',' + z) % 7 === 0 ? 0.08 : -0.02))); }
function palm(g, x, z, h, lean) {
  g.line([x, 2, z], [x + lean, h, z + lean * 0.6], '#8a6a3a', 1.1);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, tx = x + lean + Math.cos(a) * 9, tz = z + lean * 0.6 + Math.sin(a) * 9; g.line([x + lean, h, z + lean * 0.6], [tx, h - 3, tz], (X, Y, Z, t) => J('#3f9f4a', t * 0.12), 1.0, 0.4); }
}
function tree(g, x, z, h, r, col) { g.cyl(x, z, 1.4, 1, h, '#6a4a2a'); g.ell(x, h + r * 0.5, z, r, r * 0.8, r, (X, Y, Z, dx, dy) => J(col, dy * 0.12 + (hash(X + ',' + Y + ',' + Z) % 5 === 0 ? 0.05 : -0.03))); }
function islandBuilders() {
  return {
    lagoon: g => {
      shallow(g, 32, '#52dccf'); g.cyl(0, 0, 21, 0, 1, (x, y, z) => J('#ecdca4', hash(x + ',' + z) % 6 === 0 ? -0.06 : 0.02)); g.cyl(0, 0, 17, 2, 2, '#f2e4b0');
      palm(g, -6, -4, 19, 3); palm(g, 8, 3, 16, -2); palm(g, -1, 10, 14, 2);
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28, r = 25 + (i % 3) * 2, c = ['#ff7aa0', '#ff9a52', '#e86ad0', '#ffd25a'][i % 4]; g.ell(Math.cos(a) * r, 0, Math.sin(a) * r, 2 + (i % 2), 2.5 + (i % 3), 2 + (i % 2), (x, y, z, dx, dy) => J(c, dy * 0.15)); }
      g.cyl(9, -9, 0.6, 2, 9, '#fff'); for (let a = 0; a < 6.28; a += 0.3) g.set(9 + Math.cos(a) * 6, 9 - Math.abs(Math.cos(a)) * 1.5, -9 + Math.sin(a) * 6, a % 0.6 < 0.3 ? [232, 60, 60] : [250, 250, 250]);
      g.box(-14, 2, 8, -8, 3, 11, '#c0453a'); g.box(-15, 0, 6, -6, 2, 13, '#8a5a30');
    },
    mangrove: g => {
      shallow(g, 32, '#3a8a7a'); g.cyl(0, 0, 22, 0, 1, (x, y, z) => J('#6a5a3a', hash(x + ',' + z) % 5 === 0 ? -0.1 : 0)); g.cyl(0, 0, 18, 2, 2, '#4a6a3a');
      [[-10, -6], [4, -10], [11, -2], [-4, 3], [7, 9], [-12, 8], [0, -2]].forEach(([x, z], i) => { for (let k = 0; k < 4; k++) { const a = k * 1.57 + i; g.line([x + Math.cos(a) * 5, 0, z + Math.sin(a) * 5], [x, 7, z], '#5a4020', 0.8); } tree(g, x, z, 8, 6 + (i % 2) * 2, '#3f8f4a'); });
      g.cyl(-4, 11, 4, 1, 1, '#3a7a8a'); g.cyl(8, -14, 3, 1, 1, '#3a7a8a');
      g.box(-20, 6, 10, -12, 7, 18, '#8a6a3a'); for (const [x, z] of [[-20, 10], [-12, 10], [-20, 18], [-12, 18]]) g.box(x, 0, z, x, 6, z, '#5a4020'); g.box(-19, 8, 11, -13, 13, 17, '#a8845a'); g.box(-20, 14, 10, -12, 14, 18, '#d8c070');
    },
    kelp: g => {
      shallow(g, 32, '#2f9aa8'); g.cyl(0, 0, 11, 0, 2, (x, y, z) => J('#7a8590', hash(x + ',' + y + ',' + z) % 4 === 0 ? -0.12 : 0.02)); g.ell(2, 4, -1, 7, 4, 6, '#8a95a0');
      for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 14 + (i % 5) * 3, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 12 + (i * 7) % 14; for (let y = 0; y < h; y += 2) g.line([x + Math.sin(y * 0.4 + i) * 1.6, y, z + Math.cos(y * 0.35 + i) * 1.2], [x + Math.sin((y + 2) * 0.4 + i) * 1.6, y + 2, z + Math.cos((y + 2) * 0.35 + i) * 1.2], (X, Y) => J(i % 3 ? '#4a9a48' : '#c8a23c', Y / 80), 0.9); }
      [[-22, 6], [20, -10], [10, 22]].forEach(([x, z]) => { g.ell(x, 1, z, 2.4, 2.4, 2.4, '#e8e0d0'); g.ell(x, 3, z, 2, 2, 2, '#d04a3a'); });
    },
    amazon: g => {
      shallow(g, 33, '#4aa08a'); for (let y = 0; y < 9; y++) g.cyl(0, 0, 24 - y * 1.2, y, y, (x, yy, z) => J(y < 2 ? '#c8b87a' : '#4a9a3a', hash(x + ',' + z) % 7 === 0 ? -0.1 : y * 0.015));
      for (let t = -20; t <= 20; t += 1) { const z = Math.sin(t * 0.3) * 5 + t * 0.15; g.cyl(t, z, 2, 6, 6, '#3a9ae0'); g.cyl(t, z, 1.2, 7, 7, '#5ab2f0'); }
      [[-10, -10], [6, -12], [14, 4], [-14, 6], [-2, 12], [9, 14], [-6, -2], [3, 0]].forEach(([x, z], i) => tree(g, x, z, 12 + (i * 3) % 7, 5 + (i % 3), i % 2 ? '#2f7a3a' : '#3f8f3a'));
      g.box(-19, 8, 10, -11, 12, 16, '#a8845a'); for (let y = 0; y < 5; y++) g.box(-20 + y, 13 + y, 9 + y * 0.6, -10 - y, 13 + y, 17 - y * 0.6, '#d8b848'); g.box(12, 7, -17, 22, 8, -14, '#7a5230'); g.box(11, 8, -17, 12, 9, -14, '#7a5230');
    },
    arctic: g => {
      shallow(g, 33, '#9ad8f0'); g.cyl(0, 0, 24, 0, 3, (x, y, z) => J('#eef8fc', hash(x + ',' + z) % 5 === 0 ? -0.06 : 0));
      [[-8, -6, 8, 22], [10, 2, 6, 15], [-3, 10, 5, 11], [14, -10, 4, 9]].forEach(([x, z, r, h], i) => g.cyl(x, z, r, 3, h + 3, (X, Y, Z) => J(i % 2 ? '#bfe6fa' : '#d8f0fa', (Y - 3) / 80 + (hash(X + ',' + Z) % 4 === 0 ? -0.05 : 0)), r * 0.2));
      for (let i = 0; i < 3; i++) { const x = -16 + i * 5, z = 14 - i * 2; g.box(x, 3, z, x + 1, 7, z + 1, '#202428'); g.box(x + 1, 3, z, x + 1, 6, z + 1, '#f4f4f4'); g.box(x, 8, z, x + 1, 8, z + 1, '#202428'); g.set(x + 2, 7, z, '#ff9a2a'); }
      for (let i = 0; i < 8; i++) { const a = i * 0.9 + 0.3; g.box(Math.cos(a) * 28, 0, Math.sin(a) * 28, Math.cos(a) * 28 + 3, 2, Math.sin(a) * 28 + 3, '#dff3fb'); }
    },
    trench: g => {
      for (let r = 30; r > 2; r -= 3) g.cyl(0, 0, r, -1, -1, (x, y, z) => J((Math.floor(r / 3)) % 2 ? '#1c1a48' : '#26226a', hash(x + ',' + z) % 9 === 0 ? 0.05 : 0));
      g.cyl(0, 0, 7, -1, -1, '#050510'); for (let i = 0; i < 6; i++) { const a = i * 1.05; g.ell(Math.cos(a) * 22, 0, Math.sin(a) * 22, 3, 2, 3, '#3a3a58'); }
      for (let y = 0; y < 22; y += 2) g.cyl(Math.sin(y * 0.5) * 2 - 12, Math.cos(y * 0.5) * 2 + 8, 0.7, y, y, '#8ab0d8');
      const gl = new VGrid(0.02); gl.ell(0, 20, 0, 3, 3, 3, '#7affea'); gl.line([0, 17, 0], [0, 10, 0], '#3a9a8a', 0.5); gl.ell(0, 19, 3, 0.9, 0.9, 0.9, '#ffffff'); for (let i = 0; i < 5; i++) gl.set(-14 + i * 6, 3 + (i % 2) * 2, 12 - i * 3, '#7affea'); GLOWS.trench = gl.geometry();
    },
    vents: g => {
      shallow(g, 32, '#6a4a4a'); g.cyl(0, 0, 22, 0, 4, (x, y, z) => J('#2a2528', hash(x + ',' + y + ',' + z) % 4 === 0 ? 0.06 : -0.02)); g.cyl(0, 0, 15, 4, 24, (x, y, z) => J('#322b2e', hash(x + ',' + y + ',' + z) % 5 === 0 ? 0.07 : -0.03), 5);
      g.cyl(0, 0, 5, 24, 24, '#6a2010'); for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4; g.cyl(Math.cos(a) * 19, Math.sin(a) * 19, 3, 0, 5 + i % 3, '#3a3236', 1); }
      [[-6, 0], [-4, 6]].forEach(([x, z]) => g.ell(x + 2, 30, z, 6, 4, 5, (X, Y, Z, dx, dy) => J('#8a8a92', dy * 0.1))); g.ell(8, 36, -4, 5, 4, 4, '#9a9aa2');
      const gl = new VGrid(0.03); gl.cyl(0, 0, 4.5, 24, 24, '#ffb030'); for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.5; gl.line([Math.cos(a) * 4, 24, Math.sin(a) * 4], [Math.cos(a) * 15, 6, Math.sin(a) * 15], (X, Y, Z, t) => J('#ff6a1a', -t * 0.2), 1.1); }
      for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4; gl.cyl(Math.cos(a) * 19, Math.sin(a) * 19, 1.3, 6 + i % 3, 6 + i % 3, '#ff8a2a'); } GLOWS.vents = gl.geometry();
    },
    sunken: g => {
      shallow(g, 33, '#58d8c8'); g.cyl(0, 0, 21, 0, 2, (x, y, z) => J('#c8b88a', hash(x + ',' + z) % 5 === 0 ? -0.1 : 0)); g.cyl(0, 0, 15, 3, 3, '#d8c898'); g.cyl(0, 0, 11, 4, 4, '#e0d4a8');
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28, x = Math.cos(a) * 14, z = Math.sin(a) * 14, h = i % 3 === 0 ? 8 : 15; g.cyl(x, z, 1.8, 3, h, (X, Y) => J('#e8dcb8', Y % 5 === 0 ? -0.1 : 0.02)); g.box(x - 2.4, h + 1, z - 2.4, x + 2.4, h + 1, z + 2.4, '#d4c8a0'); }
      g.box(-6, 17, 13, 6, 18, 15, '#e0d4a8'); g.box(-2, 6, -2, 2, 14, 2, '#d4a838'); g.ell(0, 16, 0, 2.6, 3, 2.6, '#e8c040');
      for (let i = 0; i < 14; i++) { const a = i * 0.9, r = 17 + (i % 4) * 3; g.ell(Math.cos(a) * r, 2, Math.sin(a) * r, 1.6, 2 + (i % 3), 1.6, '#3a9a5a'); }
      const gl = new VGrid(0.03); gl.ell(0, 20, 0, 2.2, 2.2, 2.2, '#fff2a0'); gl.cyl(0, 0, 3, 5, 5, '#ffe070'); GLOWS.sunken = gl.geometry();
    },
  };
}
const _islBuild = islandBuilders();
function islandGeo(id) { const geo = islGeo(id, _islBuild[id]); return geo; }
function boatGeo() {
  return shopGeo('boat', g => {
    for (let x = -8; x <= 9; x++) { const w = x > 5 ? Math.max(0, 3 - (x - 5)) : 3; g.box(x, 0, -w, x, 2, w, (X, Y) => J('#8a5a30', Y === 2 ? 0.08 : Y === 0 ? -0.15 : 0)); }
    g.box(-7, 3, -2, 6, 3, 2, '#c9a06a'); g.box(-7, 4, -3, -3, 7, 3, '#e8e0d0'); g.box(-6, 5, -3, -4, 6, 3, '#4a8ad0');
    g.cyl(0, 0, 0.7, 3, 19, '#5a3a22');
    for (let y = 6; y <= 18; y++) { const len = (18 - y) * 0.55 + 0.5; g.box(1 - len - 1, y, 0, 0.8, y, 0, '#f5f1e6'); g.box(1.2, y, 0, 1.2 + (18 - y) * 0.2, y, 0, '#ede6d6'); }
    g.box(0, 19, 0, 3, 20, 0, '#d63a3a'); g.box(-8, 2, -1, -8, 4, 1, '#3a2418');
  });
}
function harborGeo() {
  return shopGeo('harbor', g => {
    shallow(g, 1, '#52dccf');
    g.box(-34, 0, -4, 34, 1, 4, (x, y, z) => J('#8a6a44', (x % 4 === 0 ? -0.1 : 0.02))); for (let x = -34; x <= 34; x += 8) { g.box(x, -3, -4, x, 0, -4, '#4a3420'); g.box(x, -3, 4, x, 0, 4, '#4a3420'); }
    g.cyl(-26, -12, 4.5, 0, 12, (x, y) => J(y % 6 < 3 ? '#f4f4f4' : '#d8403a'), 3); g.box(-31, 13, -17, -21, 15, -7, '#3a3a40'); g.ell(-26, 17, -12, 3, 3, 3, '#fff2a0');
    g.box(18, 1, -14, 30, 9, -6, '#c8b090'); for (let y = 0; y < 5; y++) g.box(17 + y, 10 + y, -15 + y * 0.8, 31 - y, 10 + y, -5 - y * 0.8, '#b04a3a');
    g.box(6, 1, 6, 9, 4, 9, '#8a5a30'); g.box(12, 1, 6, 15, 3, 9, '#8a5a30');
  });
}
const SLOT_X = [-22, -8, 6, 20];

class ExpScene {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.t = 0; this.scene = new THREE.Scene(); this.ray = new THREE.Raycaster(); this.mouse = new THREE.Vector2();
    this.scene.add(new THREE.HemisphereLight(0xf0f8ff, 0x4a6a8a, 0.85)); const d = new THREE.DirectionalLight(0xfff2d8, 0.85); d.position.set(-0.6, 1, 0.5); this.scene.add(d);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 3000);
    const wrap = canvas.parentElement, cssW = Math.max(560, Math.min(1100, (wrap ? wrap.clientWidth : 900) - 20)), cssH = Math.round(cssW * 0.64), dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr); canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    this.build();
    const box = this.mapBox();
    fitOrtho(this.cam, box, canvas.width / canvas.height, ISO_DIR, 0.0);
    this.zp = new ZoomPan(this, this.constructor.name); this.zp.bind(canvas); this.zp.capture();
    canvas.addEventListener('click', e => { if (this.zp.moved) return; const id = this.pickLoc(e); if (id) this.onPick(id); });
    let last = 0; canvas.addEventListener('mousemove', e => { const n = performance.now(); if (n - last < 60) return; last = n; canvas.style.cursor = this.pickLoc(e) ? 'pointer' : 'grab'; });
    this.onPick = id => { UI.expLoc = id; render(); };
  }
  mapBox() { return new THREE.Box3(new THREE.Vector3(10, -6, -14), new THREE.Vector3(MAP.W - 36, 54, MAP.D + 26)); }
  build() { this.buildOcean(); this.buildPlaces(); }
  buildOcean() {
    const sc = this.scene;
    // ocean: tiled wave texture on a big plane
    const cvw = document.createElement('canvas'); cvw.width = cvw.height = 128; const x = cvw.getContext('2d'); x.fillStyle = '#2a86c4'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 70; i++) { x.fillStyle = i % 3 ? 'rgba(255,255,255,0.14)' : 'rgba(10,50,110,0.18)'; const px = (i * 37) % 128, py = (i * 53) % 128; x.fillRect(px, py, 10 + (i % 4) * 3, 2); }
    const tex = new THREE.CanvasTexture(cvw); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(36, 26); tex.magFilter = THREE.NearestFilter; tex.encoding = THREE.sRGBEncoding; this.oceanTex = tex;
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(MAP.W + 1400, MAP.D + 1400), new THREE.MeshBasicMaterial({ map: tex })); ocean.rotation.x = -Math.PI / 2; ocean.position.set(MAP.W / 2, -2, MAP.D / 2); sc.add(ocean);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(MAP.W + 40, 8, MAP.D + 40), new THREE.MeshBasicMaterial({ color: 0x0c4a80 })); edge.position.set(MAP.W / 2, -7, MAP.D / 2); sc.add(edge);
    this.isl = {}; this.hits = [];
    this.clouds = []; for (let i = 0; i < 5; i++) { const c = new THREE.Group(); for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(14 + k * 4, 5, 9 + k * 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })); b.position.set(k * 9 - 12, k % 2 * 2, k % 3 * 3); c.add(b); } c.position.set(30 + i * 90, 46, 30 + (i * 67) % 240); sc.add(c); this.clouds.push(c); }
  }
  buildPlaces() {
    const sc = this.scene, mat = plainMat();
    LOCATIONS.forEach(l => {
      const m = new THREE.Mesh(islandGeo(l.id), mat); m.position.set(l.pos[0], 0, l.pos[1]); m.scale.setScalar(ISL_S); sc.add(m); this.isl[l.id] = m;
      if (GLOWS[l.id]) { const gm = new THREE.Mesh(GLOWS[l.id], glowMat()); gm.position.copy(m.position); gm.scale.setScalar(ISL_S); sc.add(gm); }
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(28 * ISL_S, 28 * ISL_S, 40, 10), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(l.pos[0], 8, l.pos[1]); hit.userData.loc = l.id; sc.add(hit); this.hits.push(hit);
    });
    const hb = new THREE.Mesh(harborGeo(), mat); hb.position.set(MAP.H[0], 0, MAP.H[1] + 14); sc.add(hb);
    this.boats = []; for (let i = 0; i < 4; i++) { const g = new THREE.Group(), m = new THREE.Mesh(boatGeo(), mat); g.add(m); g.visible = false; const flag = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 0.6), new THREE.MeshBasicMaterial({ color: 0xffd23a })); flag.position.set(2, 25, 0); flag.visible = false; g.add(flag); sc.add(g); this.boats.push({ g, m, flag }); }
  }
  pickLoc(e) { const r = this.cv.getBoundingClientRect(); this.mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); this.ray.setFromCamera(this.mouse, this.cam); const h = this.ray.intersectObjects(this.hits, false)[0]; return h ? h.object.userData.loc : null; }
  proj(x, y, z) { const v = new THREE.Vector3(x, y, z).project(this.cam); return [(v.x + 1) / 2 * this.cv.width, (1 - v.y) / 2 * this.cv.height]; }
  syncBoats() {
    this.boatInfo = [];
    this.boats.forEach((B, i) => {
      B.g.visible = i < S.exp.slots; if (!B.g.visible) return;
      const b = S.exp.boats[i], H = MAP.H; let x = H[0] + SLOT_X[i], z = H[1] + 4, yaw = Math.PI / 2, ready = false, p = 0;
      if (b) {
        const L = LOCATION[b.loc]; p = boatProgress(b); ready = p >= 1;
        if (!ready) { const out = p < 0.5 ? p / 0.5 : 1 - (p - 0.5) / 0.5, tx = L.pos[0], tz = L.pos[1] + 34, ox = H[0] + SLOT_X[i], oz = H[1] + 4; x = ox + (tx - ox) * out; z = oz + (tz - oz) * out; const dir = p < 0.5 ? 1 : -1; yaw = Math.atan2(-(tz - oz) * dir, (tx - ox) * dir); }
      }
      B.g.position.set(x, -0.5 + Math.sin(this.t * 2 + i) * 0.6, z); B.g.rotation.y = yaw; B.g.rotation.z = Math.sin(this.t * 1.7 + i) * 0.05; B.flag.visible = ready;
      this.boatInfo.push({ i, x, z, p, b, ready });
    });
  }
  frame(dtReal) {
    if (!GL.init()) return; const dt = Math.min(0.05, dtReal); this.t += dt;
    this.oceanTex.offset.x += dt * 0.004; this.oceanTex.offset.y += dt * 0.0025;
    this.clouds.forEach((c, i) => { c.position.x += dt * (1.2 + i * 0.2); if (c.position.x > MAP.W + 60) c.position.x = -20; });
    this.syncBoats();
    GL.size(this.cv.width, this.cv.height); GL.r.render(this.scene, this.cam);
    const ctx = this.ctx, cv = this.cv; ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(GL.r.domElement, 0, 0);
    this.overlay(ctx);
  }
  overlay(ctx) {
    const cv = this.cv, k = cv.height / 640; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tag = (txt, x, y, col, bold) => { ctx.font = `${bold ? 700 : 600} ${Math.round(13 * k)}px "Segoe UI", system-ui, sans-serif`; const w = ctx.measureText(txt).width + 14 * k, h = 20 * k; ctx.fillStyle = 'rgba(8,20,34,0.84)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, 6 * k); else ctx.rect(x - w / 2, y - h / 2, w, h); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.5 * k; ctx.stroke(); ctx.fillStyle = '#eef6ff'; ctx.fillText(txt, x, y + 0.5); };
    LOCATIONS.forEach(l => {
      const p = this.proj(l.pos[0], 44, l.pos[1]), lock = !expUnlocked(l), sel = UI.expLoc === l.id;
      if (sel) { const q = this.proj(l.pos[0], 0, l.pos[1]), pr = Math.abs(this.proj(l.pos[0] + 32 * ISL_S, 0, l.pos[1])[0] - q[0]) * 1.1, pulse = 1 + 0.04 * Math.sin(this.t * 4); ctx.save(); ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 3 * k; ctx.shadowColor = '#ffcf40'; ctx.shadowBlur = 12 * k; ctx.setLineDash([9 * k, 6 * k]); ctx.lineDashOffset = -this.t * 40; ctx.beginPath(); ctx.ellipse(q[0], q[1], pr * pulse, pr * 0.62 * pulse, 0, 0, 6.3); ctx.stroke(); ctx.restore(); }
      tag((lock ? '🔒 ' : l.icon + ' ') + l.n + (lock ? ` · Lv ${l.lvl}` : ''), p[0], p[1], lock ? '#6a7a8c' : sel ? '#ffe27a' : l.color, sel);
    });
    (this.boatInfo || []).forEach(B => { if (!B.b) return; const p = this.proj(B.x, 30, B.z), L = LOCATION[B.b.loc]; if (B.ready) tag('⚓ Ready!', p[0], p[1] - 4 * k, '#ffd23a', true); else tag(`⛵ ${fmtDur((1 - B.p) * B.b.dur / 1000)}`, p[0], p[1], L.color); });
  }
  refresh() {}
  dispose() {}
}

/* location thumbnail (cached) */
function locIcon(id, px) {
  const s = px * 2, url = renderThumb('loc' + id + s, s, s, () => { const g = new THREE.Group(); g.add(new THREE.Mesh(islandGeo(id), plainMat())); if (GLOWS[id]) g.add(new THREE.Mesh(GLOWS[id], glowMat())); return g; }, ISO_DIR, 0.06);
  return `<img src="${url}" style="width:${px}px;height:${px}px;object-fit:contain" alt="" draggable="false">`;
}
function boatIcon(px) { const s = px * 2, url = renderThumb('boat' + s, s, s, () => { const g = new THREE.Group(); g.add(new THREE.Mesh(boatGeo(), plainMat())); return g; }, ISO_DIR, 0.1); return `<img src="${url}" style="width:${px}px;height:${px}px;object-fit:contain" alt="" draggable="false">`; }

/* ================= the fish-show hall ================= */
const SHOWH = { W: 240, D: 200, WH: 96 };
const CASE_POS = [[36, 40], [84, 40], [132, 40], [180, 40], [36, 100], [84, 100], [132, 100], [180, 100]];
function rosetteGeo(col) { return shopGeo('rosette' + col, g => { g.cyl(0, 0, 4, 0, 1, col); g.cyl(0, 0, 2.4, 2, 2, shadeC(_hx(col), 0.2)); g.box(-3, -6, 0, -1, -1, 0, col); g.box(1, -6, 0, 3, -1, 0, shadeC(_hx(col), -0.15)); }); }
function podiumGeo() { return shopGeo('podium', g => { [[0, 22, '#e0b030'], [-26, 15, '#b8c0c8'], [26, 10, '#b87a3a']].forEach(([x, h, c]) => { g.box(x - 11, 0, -11, x + 11, h, 11, (X, Y) => J(c, Y === h ? 0.12 : -0.04)); g.box(x - 11, h, -11, x + 11, h, 11, J(c, 0.15)); }); }); }
function judgeTableGeo() { return shopGeo('judgetable', g => { g.box(0, 0, 0, 40, 10, 14, woodFn('#6a4a30', 5)); g.box(-1, 10, -1, 41, 11, 15, '#8a6a46'); g.box(4, 12, 4, 10, 13, 10, '#f4f4f4'); g.box(20, 12, 5, 26, 18, 9, '#d8403a'); g.box(30, 12, 3, 36, 14, 11, '#2f6f5a'); }); }
class ShowScene {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.t = 0; this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6a5a6a, 0.8)); const d = new THREE.DirectionalLight(0xfff0d0, 0.9); d.position.set(-0.6, 1, 0.5); this.scene.add(d);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2000);
    const wrap = canvas.parentElement, cssW = Math.max(520, Math.min(1000, (wrap ? wrap.clientWidth : 900) - 20)), cssH = Math.round(cssW * 0.64), dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr); canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    this.cases = []; this.people = []; this.key = ''; this.fish = []; this.ribbons = []; this.entr = [];
    this.build();
    const box = new THREE.Box3(new THREE.Vector3(-2, -4, -6), new THREE.Vector3(SHOWH.W + 2, SHOWH.WH + 4, SHOWH.D + 2));
    fitOrtho(this.cam, box, canvas.width / canvas.height, ISO_DIR, 0.0);
    this.zp = new ZoomPan(this, 'show'); this.zp.bind(canvas); this.zp.capture();
  }
  build() {
    const sc = this.scene, W = SHOWH.W, D = SHOWH.D, WH = SHOWH.WH, mat = plainMat();
    sc.add(new THREE.Mesh(shopGeo('showfloor', g => { for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { const carpet = x > 100 && x < 140 && z > 8; const c = carpet ? ((Math.floor(z / 6) % 2) ? '#a8232f' : '#b8303c') : ((Math.floor(x / 12) + Math.floor(z / 12)) % 2 ? '#e8e0cc' : '#cfc4a8'); g.set(x, 0, z, shadeC(_hx(c), (carpet && (x === 101 || x === 139) ? 0.2 : 0) + (hash(x + ',' + z) % 11 === 0 ? 0.04 : 0))); if (x === 0 || z === 0 || x === W - 1 || z === D - 1) for (let y = -4; y < 0; y++) g.set(x, y, z, W_('#5a4a3a', -0.1)); } }), mat));
    this.banner = document.createElement('canvas'); this.banner.width = W * 2; this.banner.height = WH * 2; this.btex = new THREE.CanvasTexture(this.banner); this.btex.magFilter = THREE.NearestFilter; this.btex.minFilter = THREE.NearestFilter; this.btex.encoding = THREE.sRGBEncoding; this.btex.generateMipmaps = false; this.drawBanner('Fish Show');
    const back = texMesh(W, WH, this.btex); back.position.set(W / 2, WH / 2, 0); sc.add(back);
    const left = texMesh(D, WH, paintTexture(D * 2, WH * 2, (x, w, h) => { x.fillStyle = '#6a2a40'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 28) { x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(i, 0, 14, h); } x.fillStyle = '#4a1a2a'; x.fillRect(0, h - 40, w, 40); x.fillStyle = '#e0b030'; x.fillRect(0, h - 44, w, 4); [60, 200, 340].forEach(c => { x.fillStyle = '#e0b030'; x.fillRect(c - 22, 30, 44, 8); x.fillStyle = '#d8403a'; x.beginPath(); x.moveTo(c - 20, 38); x.lineTo(c + 20, 38); x.lineTo(c, 100); x.fill(); }); }));
    left.rotation.y = Math.PI / 2; left.position.set(0, WH / 2, D / 2); sc.add(left);
    CASE_POS.forEach(([x, z], i) => {
      const grp = new THREE.Group(), w = 40, d = 28; grp.position.set(x - w / 2, 1, z - d / 2); grp.add(new THREE.Mesh(displayTankGeo(0), mat));
      const water = new THREE.Mesh(new THREE.BoxGeometry(w - 1, 24, d - 1), new THREE.MeshBasicMaterial({ color: 0x4ab8e8, transparent: true, opacity: 0.2, depthWrite: false })); water.position.set(w / 2, 27, d / 2); water.renderOrder = 5; grp.add(water);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(w, 28, d), new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide })); glass.position.set(w / 2, 28, d / 2); glass.renderOrder = 6; grp.add(glass);
      const hl = new THREE.Mesh(new THREE.BoxGeometry(w + 6, 36, d + 6), new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending })); hl.position.set(w / 2, 26, d / 2); hl.renderOrder = 4; grp.add(hl);
      sc.add(grp); this.cases.push({ grp, w, d, hl, pos: [x, z] });
    });
    const pod = new THREE.Mesh(podiumGeo(), mat); pod.position.set(120, 1, 158); sc.add(pod);
    const tr = new THREE.Mesh(homeTrophyGeo(), mat); tr.scale.setScalar(1.6); tr.position.set(120, 24, 158); sc.add(tr);
    const jt = new THREE.Mesh(judgeTableGeo(), mat); jt.position.set(28, 1, 146); sc.add(jt);
    for (let i = 0; i < 7; i++) { const p = new Person(personApp('aud' + i + 'x'), [26 + i * 30 + (i % 2) * 8, 182 + (i % 2) * 8]); p.yaw = Math.PI / 2; p.g.rotation.y = Math.PI / 2; p.face = Math.PI / 2; p.ph = i; this.scene.add(p.g); this.people.push(p); }
    this.judges = [0, 1].map(i => { const p = new Person({ skin: SKIN_TONES[i + 1], hair: HAIRS[i + 3], shirt: '#2a2f3a', pants: '#2a2a30', style: i ? 'long' : 'short', hat: i ? null : 'glasses' }, [60 + i * 80, 67]); p.speed = 14; p.dest = 0; this.scene.add(p.g); return p; });
  }
  drawBanner(title) {
    const x = this.banner.getContext('2d'), w = this.banner.width, h = this.banner.height; x.clearRect(0, 0, w, h);
    x.fillStyle = '#5a1f36'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 24) { x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(i, 0, 12, h); }
    x.fillStyle = '#3a1020'; x.fillRect(0, h - 36, w, 36); x.fillStyle = '#e0b030'; x.fillRect(0, h - 40, w, 4); x.fillRect(0, 0, w, 6);
    x.fillStyle = '#f2d060'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#000'; x.shadowBlur = 6; let fs = 34; do { x.font = `bold ${fs}px Georgia, serif`; fs -= 2; } while (x.measureText(title.toUpperCase()).width > w - 190 && fs > 12); x.fillText(title.toUpperCase(), w / 2, 36); x.shadowBlur = 0;
    for (const cx of [60, w - 60]) { x.fillStyle = '#e0b030'; x.beginPath(); x.arc(cx, 38, 20, 0, 7); x.fill(); x.fillStyle = '#5a1f36'; x.beginPath(); x.ellipse(cx, 38, 11, 6, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(cx - 11, 38); x.lineTo(cx - 17, 31); x.lineTo(cx - 17, 45); x.fill(); }
    this.btex.needsUpdate = true;
  }
  /* what the hall displays: the live show of the chosen league, or its last results */
  data() {
    const lg = UI.showLeague && LEAGUE[UI.showLeague] ? UI.showLeague : 'local', sh = S.shows.leagues[lg], last = S.shows.last[lg];
    if (UI.showResult && last) return { lg, cat: last.cat, resolved: true, list: last.results.map(r => ({ ...r })) };
    if (!sh) return { lg, cat: null, resolved: false, list: [] };
    const mine = sh.entries.map(getFish).filter(Boolean).map(f => ({ name: f.name, sp: f.sp, mods: f.mods.slice(), you: true })), rv = sh.rivals.map(r => ({ name: r.name, sp: r.sp, mods: r.mods, you: false }));
    return { lg, cat: sh.cat, resolved: false, list: mine.concat(rv).slice(0, 8) };
  }
  sync() {
    const D = this.data(), key = D.lg + '|' + D.resolved + '|' + D.list.map(r => r.sp + r.mods.join('') + r.you + (r.place || '')).join(',');
    if (key === this.key) return; this.key = key; this.drawBanner((LEAGUE[D.lg].n) + (D.cat ? ' · ' + SHOW_CATS[D.cat].n : ''));
    this.fish.forEach(o => { o.tank.grp.remove(o.group); o.mat.dispose(); }); this.fish = []; this.ribbons.forEach(r => this.scene.remove(r)); this.ribbons = []; this.entr = D.list;
    D.list.forEach((r, i) => {
      const tank = this.cases[i]; if (!tank) return; const sp = SPECIES[r.sp], model = fishModel(r.sp, r.mods, modelLength(sp, sp.t)), mat = fishMaterial(model, r.mods), mesh = new THREE.Mesh(model.geo, mat), group = new THREE.Group();
      group.add(mesh); const sc = Math.min(0.62, 22 / model.L); group.scale.setScalar(sc); tank.grp.add(group);
      this.fish.push({ group, mat, model, tank, sc, st: { x: tank.w * 0.5, z: tank.d * 0.5, y: 28, yaw: 0, ph: i * 2, tx: 0, tz: 0, ty: 28, sp: 6 + (i % 5) } });
      tank.hl.material.opacity = r.you ? 0.2 : 0;
      if (D.resolved && r.place <= 3) { const m = new THREE.Mesh(rosetteGeo(['#e0b030', '#b8c0c8', '#b87a3a'][r.place - 1]), plainMat()); m.scale.setScalar(1.5); m.position.set(tank.pos[0], 49, tank.pos[1] + 16); this.scene.add(m); this.ribbons.push(m); }
    });
    for (let i = D.list.length; i < 8; i++) this.cases[i].hl.material.opacity = 0;
  }
  frame(dtReal) {
    if (!GL.init()) return; const dt = Math.min(0.05, dtReal); this.t += dt; this.sync();
    this.fish.forEach(o => { const s = o.st, tk = o.tank, L = o.model.L * o.sc, m = 5 + L * 0.5; if (Math.hypot(s.tx - s.x, s.tz - s.z, s.ty - s.y) < 2 || s.tx === 0) { s.tx = m + Math.random() * Math.max(1, tk.w - 2 * m); s.tz = m + Math.random() * Math.max(1, tk.d - 2 * m); s.ty = 20 + Math.random() * 14; } const dx = s.tx - s.x, dz = s.tz - s.z, dy = s.ty - s.y, d = Math.hypot(dx, dz, dy) || 1; s.x += dx / d * s.sp * dt; s.z += dz / d * s.sp * dt; s.y += dy / d * s.sp * dt * 0.5; const want = Math.atan2(-dz, dx); let dyaw = want - s.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw)); s.yaw += dyaw * (1 - Math.exp(-dt * 3)); s.ph += dt * 6; o.group.position.set(s.x, s.y, s.z); o.group.rotation.y = s.yaw; o.mat.userData.u.uPhase.value = s.ph; o.mat.userData.u.uAmp.value = 0.5; o.mat.userData.u.uTime.value = this.t; });
    this.ribbons.forEach((r, i) => { r.position.y = 49 + Math.sin(this.t * 3 + i) * 0.8; });
    this.judges.forEach(p => { if (!p.path.length) { p.dest = (p.dest + 1) % 4; p.path = [[34 + p.dest * 52, 67 + (p.dest % 2) * 2]]; } p.update(dt); });
    this.people.forEach(p => p.update(dt));
    GL.size(this.cv.width, this.cv.height); GL.r.render(this.scene, this.cam);
    const ctx = this.ctx, cv = this.cv; ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(GL.r.domElement, 0, 0); this.overlay(ctx);
  }
  proj(x, y, z) { const v = new THREE.Vector3(x, y, z).project(this.cam); return [(v.x + 1) / 2 * this.cv.width, (1 - v.y) / 2 * this.cv.height]; }
  overlay(ctx) {
    const cv = this.cv, k = cv.height / 640; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    this.entr.forEach((r, i) => {
      const c = this.cases[i]; if (!c) return; const p = this.proj(c.pos[0], 56, c.pos[1]);
      const line1 = (r.you ? '★ ' : '') + r.name, line2 = r.score != null ? `#${r.place} · ${r.score}` : (r.you ? 'Your entry' : 'Rival');
      ctx.font = `700 ${Math.round(11 * k)}px "Segoe UI", system-ui, sans-serif`; const w = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) + 12 * k, h = 28 * k;
      ctx.fillStyle = r.you ? 'rgba(70,52,8,0.88)' : 'rgba(8,20,34,0.84)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(p[0] - w / 2, p[1] - h / 2, w, h, 6 * k); else ctx.rect(p[0] - w / 2, p[1] - h / 2, w, h); ctx.fill(); ctx.strokeStyle = r.you ? '#ffd23a' : '#4a6a8a'; ctx.lineWidth = 1.5 * k; ctx.stroke();
      ctx.fillStyle = '#f2f8ff'; ctx.fillText(line1, p[0], p[1] - 6 * k); ctx.font = `600 ${Math.round(10.5 * k)}px "Segoe UI", system-ui, sans-serif`; ctx.fillStyle = r.place && r.place <= 3 ? ['#ffd23a', '#d0d8e0', '#e0a060'][r.place - 1] : '#9fb8d0'; ctx.fillText(line2, p[0], p[1] + 7 * k);
    });
  }
  refresh() { this.key = ''; }
  dispose() { this.fish.forEach(o => o.mat.dispose()); }
}
