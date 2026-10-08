'use strict';
/* ===== Isometric 3D aquarium (three.js) ===== */
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


/* ===== WebGL / three.js service ===== */
const TANK_DIM3 = { starter: [96, 72, 64], medium: [120, 90, 72], large: [150, 110, 82], huge: [190, 140, 92], reef_s: [120, 90, 72], reef_m: [150, 110, 82], reef_l: [190, 140, 92], reef_g: [230, 160, 102] };
const DECOR_POS = [[0.22, 0.26], [0.72, 0.2], [0.26, 0.74], [0.74, 0.7]];
const FLOOR_Y = 3;

const GL = {
  ok: false, r: null, w: 0, h: 0,
  init() {
    if (this.r || this.failed) return this.ok;
    try {
      THREE.ColorManagement.legacyMode = false;
      this.r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.r.outputEncoding = THREE.sRGBEncoding; this.r.setClearColor(0x000000, 0); this.r.setPixelRatio(1);
      this.ok = true;
    } catch (e) { this.failed = true; this.ok = false; }
    return this.ok;
  },
  size(w, h) { if (this.w !== w || this.h !== h) { this.r.setSize(w, h, false); this.w = w; this.h = h; } },
};
function addLights(scene, strong) {
  scene.add(new THREE.HemisphereLight(0xd8ecff, 0x5a7090, strong ? 0.9 : 0.7));
  const d = new THREE.DirectionalLight(0xfff1d6, 1.0); d.position.set(-0.55, 1, 0.6); scene.add(d);
  const f = new THREE.DirectionalLight(0x9ec8ff, 0.25); f.position.set(0.8, 0.2, -0.5); scene.add(f);
}
const ISO_DIR = new THREE.Vector3(1, 0.78, 1).normalize();
function fitOrtho(cam, box, aspect, dir, margin) {
  const c = box.getCenter(new THREE.Vector3());
  cam.position.copy(c).addScaledVector(dir, 600); cam.lookAt(c); cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const p = new THREE.Vector3(x, y, z).applyMatrix4(cam.matrixWorldInverse); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
  }
  let w = (x1 - x0) * (1 + margin), h = (y1 - y0) * (1 + margin); if (w / h > aspect) h = w / aspect; else w = h * aspect;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  cam.left = cx - w / 2; cam.right = cx + w / 2; cam.top = cy + h / 2; cam.bottom = cy - h / 2; cam.near = 1; cam.far = 1600; cam.updateProjectionMatrix();
}

/* ---- materials with vertex-shader animation ---- */
function fishMaterial(model) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.userData.u = { uPhase: { value: 0 }, uAmp: { value: 0.3 }, uLen: { value: model.L }, uRay: { value: model.ray ? 1 : 0 } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uPhase;uniform float uAmp;uniform float uLen;uniform float uRay;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        if (uRay > 0.5) { transformed.y += sin(uPhase - abs(transformed.z) * 0.22) * uAmp * abs(transformed.z) * 0.4; }
        else {
          float k = clamp((-0.02 * uLen - transformed.x) / (0.85 * uLen), 0.0, 1.0);
          transformed.z += sin(uPhase + transformed.x * 0.3) * uAmp * k * k * uLen * 0.17;
          float hd = clamp(transformed.x / (0.6 * uLen), 0.0, 1.0);
          transformed.z -= sin(uPhase) * uAmp * hd * hd * uLen * 0.035;
        }`);
  };
  m.customProgramCacheKey = () => 'fishbend';
  if (model.glow) m.emissive = new THREE.Color(model.glow).multiplyScalar(0.22);
  return m;
}
function swayMaterial(h, amp, seed) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.userData.u = { uTime: { value: 0 }, uAmp: { value: amp }, uH: { value: Math.max(8, h) }, uSeed: { value: seed } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;uniform float uAmp;uniform float uH;uniform float uSeed;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float hh = clamp(transformed.y / uH, 0.0, 1.0); hh = hh * hh;
        transformed.x += sin(uTime * 1.4 + transformed.y * 0.12 + uSeed) * uAmp * hh * 3.0;
        transformed.z += cos(uTime * 1.1 + transformed.y * 0.10 + uSeed) * uAmp * 0.6 * hh * 3.0;`);
  };
  m.customProgramCacheKey = () => 'sway';
  return m;
}
const _plainMat = new Map();
const plainMat = () => { if (!_plainMat.has('p')) _plainMat.set('p', new THREE.MeshLambertMaterial({ vertexColors: true })); return _plainMat.get('p'); };
const glowMat = () => { if (!_plainMat.has('g')) _plainMat.set('g', new THREE.MeshBasicMaterial({ vertexColors: true })); return _plainMat.get('g'); };

/* ---- tank static geometry ---- */
const _floorGeo = {};
function floorGeometry(W, D, gravel) {
  const key = W + 'x' + D + gravel;
  if (_floorGeo[key]) return _floorGeo[key];
  const g = new VGrid(0.07), gc = shadeC(_hx(gravel), -0.22);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const n = vnoise(x * 0.08, z * 0.08, 'floor') + 0.5 * vnoise(x * 0.3, z * 0.3, 'fl2'), h = FLOOR_Y - 1 + Math.floor(n * 1.6);
    const hh = hash(x + ',' + z); let c = hh % 11 === 0 ? shadeC(gc, 0.22) : hh % 7 === 0 ? shadeC(gc, -0.2) : hh % 29 === 0 ? [240, 238, 226] : gc;
    g.set(x, h, z, c);
    const edge = x >= W - 1 || z >= D - 1 || x === 0 || z === 0;
    for (let y = h - 1; y >= (edge ? -3 : h - 1); y--) g.set(x, y, z, shadeC(gc, -0.18 - (h - y) * 0.03));
  }
  return (_floorGeo[key] = g.geometry());
}
function box(w, h, d, x, y, z, color, basic) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), basic ? new THREE.MeshBasicMaterial(basic) : new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z); return m;
}
function buildTankGroup(tank, mini) {
  const [W, D, WH] = TANK_DIM3[tank.type], skin = SKIN[tank.skin], salt = TANK_TYPE[tank.type].w === 'salt', WTR = WH - 8, grp = new THREE.Group(), out = { W, D, WH, WTR, grp };
  // floor
  grp.add(new THREE.Mesh(floorGeometry(W, D, skin.gravel), plainMat()));
  // walls with background art
  const tex = (w, h) => { const cv = wallArt(tank.bg, Math.round(w * 2), Math.round(h * 2), salt), t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.encoding = THREE.sRGBEncoding; t.generateMipmaps = false; return t; };
  const w1 = new THREE.Mesh(new THREE.PlaneGeometry(W, WH), new THREE.MeshBasicMaterial({ map: tex(W, WH) })); w1.position.set(W / 2, WH / 2, 0); grp.add(w1);
  const w2 = new THREE.Mesh(new THREE.PlaneGeometry(D, WH), new THREE.MeshBasicMaterial({ map: tex(D, WH), color: 0xbfc8d8 })); w2.rotation.y = Math.PI / 2; w2.position.set(0, WH / 2, D / 2); grp.add(w2);
  // frame
  const fc = new THREE.Color(skin.frame), hi = fc.clone().multiplyScalar(1.6), lo = fc.clone().multiplyScalar(0.55);
  grp.add(box(W + 8, 8, D + 8, W / 2, -8, D / 2, lo)); grp.add(box(W + 6, 2, D + 6, W / 2, -3.2, D / 2, fc));
  for (const [x, z] of [[-1.5, -1.5], [W + 1.5, -1.5], [-1.5, D + 1.5], [W + 1.5, D + 1.5]]) grp.add(box(3, WH + 4, 3, x, WH / 2 - 0.5, z, fc));
  const rim = (w, d, x, z) => grp.add(box(w, 2.4, d, x, WH + 1, z, hi));
  rim(W + 6, 3, W / 2, -1.5); rim(W + 6, 3, W / 2, D + 1.5); rim(3, D + 6, -1.5, D / 2); rim(3, D + 6, W + 1.5, D / 2);
  // glass + water
  const glass = { color: 0xcfeaff, transparent: true, opacity: 0.045, side: THREE.DoubleSide, depthWrite: false };
  const g1 = new THREE.Mesh(new THREE.PlaneGeometry(W, WH), new THREE.MeshBasicMaterial(glass)); g1.position.set(W / 2, WH / 2, D); g1.renderOrder = 6; grp.add(g1);
  const g2 = new THREE.Mesh(new THREE.PlaneGeometry(D, WH), new THREE.MeshBasicMaterial(glass)); g2.rotation.y = Math.PI / 2; g2.position.set(W, WH / 2, D / 2); g2.renderOrder = 6; grp.add(g2);
  const wm = new THREE.Mesh(new THREE.BoxGeometry(W, WTR, D), new THREE.MeshBasicMaterial({ color: salt ? 0x2ad0e0 : 0x3aa8e8, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.FrontSide })); wm.position.set(W / 2, WTR / 2, D / 2); wm.renderOrder = 5; grp.add(wm);
  const sf = new THREE.Mesh(new THREE.PlaneGeometry(W, D, mini ? 4 : 28, mini ? 3 : 20), new THREE.MeshBasicMaterial({ color: 0xcdf3ff, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide })); sf.rotation.x = -Math.PI / 2; sf.position.set(W / 2, WTR, D / 2); sf.renderOrder = 7; grp.add(sf); out.surface = sf;
  out.base = sf.geometry.attributes.position.array.slice();
  // light shafts
  out.shafts = [];
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(10 + i * 3, WTR * 1.1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); s.position.set(W * (0.15 + i * 0.18), WTR * 0.55, D * (0.2 + (i % 3) * 0.25)); s.rotation.y = Math.PI / 4; s.rotation.z = 0.28; s.renderOrder = 4; grp.add(s); out.shafts.push(s); }
  return out;
}

/* ---- a tank scene on a 2D canvas ---- */
class TankScene3D {
  constructor(canvas, tank, mini, onFish) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.tank = tank; this.mini = mini; this.onFish = onFish;
    this.scene = new THREE.Scene(); addLights(this.scene);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1600);
    this.fish = new Map(); this.decor = []; this.bubbles = []; this.t = Math.random() * 10; this.acc = 0; this.key = ''; this.dkey = '';
    const wrap = canvas.parentElement, cssW = mini ? 360 : Math.max(480, Math.min(1180, (wrap ? wrap.clientWidth : 900) - 20));
    const dpr = mini ? 1 : Math.min(2, window.devicePixelRatio || 1), cssH = mini ? 250 : Math.round(Math.min(820, cssW * 0.72));
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    canvas.style.width = mini ? '100%' : cssW + 'px'; canvas.style.height = mini ? 'auto' : cssH + 'px';
    this.ray = new THREE.Raycaster(); this.mouse = new THREE.Vector2();
    if (!mini && onFish) {
      canvas.addEventListener('click', e => { const f = this.pick(e); if (f) onFish(f); });
      let last = 0; canvas.addEventListener('mousemove', e => { const n = performance.now(); if (n - last < 60) return; last = n; const f = this.pick(e); canvas.style.cursor = f ? 'pointer' : 'default'; canvas.title = f && getFish(f) ? fishName(getFish(f)) : ''; });
    }
    this.rebuildStatic();
  }
  pick(e) {
    const r = this.cv.getBoundingClientRect(); this.mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.mouse, this.cam);
    const meshes = [...this.fish.values()].map(f => f.mesh), hit = this.ray.intersectObjects(meshes, false)[0];
    return hit ? hit.object.userData.fishId : null;
  }
  rebuildStatic() {
    if (this.stat) this.scene.remove(this.stat.grp);
    this.stat = buildTankGroup(this.tank, this.mini); this.scene.add(this.stat.grp);
    ({ W: this.W, D: this.D, WH: this.WH, WTR: this.WTR } = this.stat);
    const box3 = new THREE.Box3(new THREE.Vector3(-6, -14, -6), new THREE.Vector3(this.W + 6, this.WH + 5, this.D + 6));
    fitOrtho(this.cam, box3, this.cv.width / this.cv.height, ISO_DIR, this.mini ? 0.03 : 0.025);
    this.key = this.tank.type + '|' + this.tank.bg + '|' + this.tank.skin;
    this.fish.forEach(f => { this.scene.remove(f.group); }); this.fish.clear(); this.dkey = '';
  }
  syncDecor() {
    const k = this.tank.slots.join(',');
    if (k === this.dkey) return; this.dkey = k;
    this.decor.forEach(d => this.scene.remove(d)); this.decor = [];
    this.tank.slots.forEach((id, i) => {
      if (!id) return;
      const mod = decorModel(id), [fx, fz] = DECOR_POS[i], grp = new THREE.Group();
      const sway = DECOR_SWAY[id], mat = sway ? swayMaterial(mod.h, sway, i * 1.7) : plainMat();
      const m = new THREE.Mesh(mod.geo, mat); m.userData.mat = sway ? mat : null; grp.add(m);
      if (mod.glow) { const gm = new THREE.Mesh(mod.glow, glowMat()); grp.add(gm); }
      grp.position.set(this.W * fx, FLOOR_Y - mod.minY + (id === 'bubbles' ? 0 : -0.5), this.D * fz); grp.rotation.y = (i % 2 ? -0.5 : 0.35) + (id === 'ship' ? 0.3 : 0); grp.userData.id = id; grp.userData.sway = m;
      this.scene.add(grp); this.decor.push(grp);
    });
  }
  syncFish() {
    const fs = fishIn(this.tank.id), ids = new Set(fs.map(f => f.id));
    for (const [id, o] of this.fish) if (!ids.has(id)) { this.scene.remove(o.group); o.mat.dispose(); this.fish.delete(id); }
    for (const f of fs) {
      let o = this.fish.get(f.id), sig = f.sp + '|' + f.mods.join(',');
      if (o && o.sig !== sig) { this.scene.remove(o.group); o.mat.dispose(); this.fish.delete(f.id); o = null; }
      if (!o) {
        const sp = SPECIES[f.sp], model = fishModel(f.sp, f.mods, modelLength(sp, sp.t)), mat = fishMaterial(model), mesh = new THREE.Mesh(model.geo, mat), group = new THREE.Group();
        mesh.userData.fishId = f.id; group.add(mesh); this.scene.add(group);
        const hs = hash(f.id + this.tank.id);
        const st = { x: 12 + (hs % 1000) / 1000 * (this.W - 24), z: 12 + ((hs >>> 10) % 1000) / 1000 * (this.D - 24), y: 14 + ((hs >>> 5) % 1000) / 1000 * (this.WTR - 40), yaw: (hs % 628) / 100, pitch: 0, vx: 0, vy: 0, vz: 0, tx: 0, ty: 0, tz: 0, ph: (hs % 100) / 7, spd: model.L * (0.42 + (hs % 40) / 100), wait: 0, burst: 1 };
        st.tx = st.x; st.ty = st.y; st.tz = st.z; this.retarget(st, model.L);
        o = { group, mesh, mat, model, st, sig }; this.fish.set(f.id, o);
      }
      o.f = f;
    }
  }
  retarget(s, L) {
    const m = L * 0.6 + 8, near = Math.random() < 0.55;
    const clampx = v => Math.max(m, Math.min(this.W - m, v)), clampz = v => Math.max(m, Math.min(this.D - m, v));
    s.tx = near ? clampx(s.x + (Math.random() - 0.5) * this.W * 0.7) : m + Math.random() * (this.W - 2 * m);
    s.tz = near ? clampz(s.z + (Math.random() - 0.5) * this.D * 0.7) : m + Math.random() * (this.D - 2 * m);
    s.ty = FLOOR_Y + 8 + Math.random() * (this.WTR - FLOOR_Y - 22);
    s.burst = 0.55 + Math.random() * 0.9; s.wait = Math.random() < 0.15 ? 0.4 + Math.random() * 1.4 : 0;
  }
  step(dt) {
    const arr = [...this.fish.values()];
    for (const o of arr) {
      const s = o.st, L = o.model.L, dx = s.tx - s.x, dy = (s.ty - s.y) * 1.6, dz = s.tz - s.z, d = Math.hypot(dx, dy, dz);
      let vx = 0, vy = 0, vz = 0;
      if (s.wait > 0) s.wait -= dt; else if (d < L * 0.5) this.retarget(s, L);
      else { const sp = s.spd * s.burst; vx = dx / d * sp; vy = dy / d * sp * 0.55; vz = dz / d * sp; }
      const k = 1 - Math.exp(-dt * 1.5);
      s.vx += (vx - s.vx) * k; s.vy += (vy - s.vy) * k; s.vz += (vz - s.vz) * k;
      s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    }
    // separation
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i].st, b = arr[j].st, dx = a.x - b.x, dy = (a.y - b.y) * 1.5, dz = a.z - b.z, d = Math.hypot(dx, dy, dz), min = (arr[i].model.L + arr[j].model.L) * 0.42;
      if (d < min && d > 0.01) { const p = (min - d) * 1.2 * dt / d; a.x += dx * p; a.z += dz * p; a.y += dy * p * 0.6; b.x -= dx * p; b.z -= dz * p; b.y -= dy * p * 0.6; }
    }
    for (const o of arr) {
      const s = o.st, L = o.model.L;
      s.x = Math.max(8, Math.min(this.W - 8, s.x)); s.z = Math.max(8, Math.min(this.D - 8, s.z)); s.y = Math.max(FLOOR_Y + 5, Math.min(this.WTR - 10, s.y));
      const sp = Math.hypot(s.vx, s.vz);
      if (sp > L * 0.08) { const want = Math.atan2(-s.vz, s.vx); let dyaw = want - s.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw)); s.yaw += dyaw * (1 - Math.exp(-dt * 3.2)); }
      const wantP = Math.atan2(s.vy, Math.max(1, sp)) * 0.8; s.pitch += (wantP - s.pitch) * (1 - Math.exp(-dt * 4));
      s.ph += dt * (3.2 + (sp + Math.abs(s.vy)) / L * 5.5);
      const gr = o.f.g >= 1 ? 1 : o.f.g, sc = 0.5 + 0.5 * Math.min(1, gr);
      o.group.position.set(s.x, s.y + Math.sin(s.ph * 0.5) * 0.4, s.z); o.group.rotation.y = s.yaw; o.group.rotation.x = Math.sin(s.ph * 0.5) * 0.03;
      o.mesh.rotation.z = s.pitch; o.group.scale.setScalar(sc);
      o.mat.userData.u.uPhase.value = s.ph; o.mat.userData.u.uAmp.value = 0.28 + Math.min(0.7, (sp + Math.abs(s.vy)) / (L * 1.2));
    }
  }
  frame(dtReal) {
    if (!GL.init()) { const c = this.ctx; c.fillStyle = '#9fb3c8'; c.font = '16px sans-serif'; c.textAlign = 'center'; c.fillText('WebGL is required to display the aquarium', this.cv.width / 2, this.cv.height / 2); return; }
    if (this.key !== this.tank.type + '|' + this.tank.bg + '|' + this.tank.skin) this.rebuildStatic();
    this.syncDecor(); this.syncFish();
    const dt = Math.min(0.05, dtReal); this.t += dt;
    this.step(dt);
    for (const d of this.decor) { if (d.userData.sway && d.userData.sway.userData.mat) d.userData.sway.userData.mat.userData.u.uTime.value = this.t; if (d.userData.id === 'bubbles' && Math.random() < dt * 9) this.bubbles.push({ x: d.position.x + 12 + (Math.random() - 0.5) * 3, y: d.position.y + 8, z: d.position.z + 5 + (Math.random() - 0.5) * 3, vy: 14 + Math.random() * 10 }); }
    if (Math.random() < dt * (this.mini ? 1.5 : 4)) this.bubbles.push({ x: 8 + Math.random() * (this.W - 16), y: FLOOR_Y + 2, z: 8 + Math.random() * (this.D - 16), vy: 9 + Math.random() * 8 });
    this.bubbles = this.bubbles.filter(b => (b.y += b.vy * dt) < this.WTR - 1);
    if (!this.bub) { this.bub = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshBasicMaterial({ color: 0xe8f8ff, transparent: true, opacity: 0.75 }), 80); this.bub.frustumCulled = false; this.bub.renderOrder = 3; this.scene.add(this.bub); this.dummy = new THREE.Object3D(); }
    this.bub.count = Math.min(80, this.bubbles.length);
    for (let i = 0; i < this.bub.count; i++) { const b = this.bubbles[i]; this.dummy.position.set(b.x + Math.sin(this.t * 3 + i) * 0.8, b.y, b.z); this.dummy.updateMatrix(); this.bub.setMatrixAt(i, this.dummy.matrix); }
    this.bub.instanceMatrix.needsUpdate = true;
    if (!this.mini) { const p = this.stat.surface.geometry.attributes.position, base = this.stat.base; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(this.t * 1.6 + base[i * 3] * 0.12 + base[i * 3 + 1] * 0.1) * 0.7); p.needsUpdate = true; }
    this.stat.shafts.forEach((s, i) => { s.material.opacity = 0.035 + 0.025 * (0.5 + 0.5 * Math.sin(this.t * 0.7 + i * 1.3)); s.position.x += Math.sin(this.t * 0.2 + i) * 0.03; });
    GL.size(this.cv.width, this.cv.height);
    GL.r.render(this.scene, this.cam);
    this.ctx.clearRect(0, 0, this.cv.width, this.cv.height); this.ctx.drawImage(GL.r.domElement, 0, 0);
  }
  dispose() { this.fish.forEach(o => o.mat.dispose()); }
}

const Scenes = {
  list: [], running: false, last: 0, n: 0,
  bind(onFish) {
    this.list.forEach(s => s.dispose());
    this.list = [...document.querySelectorAll('canvas.tankscene')].map(cv => { const t = getTank(cv.dataset.tank); return t ? new TankScene3D(cv, t, cv.dataset.mini === '1', onFish) : null; }).filter(Boolean);
    if (!this.running) { this.running = true; requestAnimationFrame(t => Scenes.loop(t)); }
  },
  loop(now) {
    const dt = this.last ? (now - this.last) / 1000 : 0.016; this.last = now; this.n++;
    this.list.forEach((s, i) => {
      if (!s.cv.isConnected) return;
      const r = s.cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) { s.accum = 0; return; }
      if (s.mini) { s.accum = (s.accum || 0) + dt; if ((this.n + i) % 2) return; s.frame(s.accum); s.accum = 0; } else s.frame(dt);
    });
    requestAnimationFrame(t => Scenes.loop(t));
  },
};

/* ---- thumbnails (rendered once, cached as data URLs) ---- */
const _thumbs = {};
function renderThumb(key, w, h, make, dir, margin) {
  if (_thumbs[key]) return _thumbs[key];
  if (!GL.init()) return (_thumbs[key] = '');
  const scene = new THREE.Scene(); addLights(scene, true);
  const obj = make(); scene.add(obj);
  const box = new THREE.Box3().setFromObject(obj), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1600);
  fitOrtho(cam, box, w / h, dir || ISO_DIR, margin == null ? 0.08 : margin);
  GL.size(w, h); GL.r.render(scene, cam);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(GL.r.domElement, 0, 0);
  scene.traverse(o => { if (o.material && o.material.dispose && o.material !== _plainMat.get('p') && o.material !== _plainMat.get('g')) o.material.dispose(); });
  return (_thumbs[key] = cv.toDataURL());
}
const FISH_DIR = new THREE.Vector3(0.42, 0.5, 1).normalize();
function fishSVG(spId, mods, px) {
  const bucket = px <= 70 ? 150 : px <= 110 ? 230 : px <= 160 ? 340 : 520, h = Math.round(bucket * 0.66);
  const sp = SPECIES[spId], url = renderThumb('f' + spId + '|' + mods.join(',') + '|' + bucket, bucket, h, () => { const mdl = fishModel(spId, mods, modelLength(sp, sp.t)); const m = new THREE.Mesh(mdl.geo, plainMatFor(mdl)); const g = new THREE.Group(); g.add(m); g.rotation.y = 0; return g; }, FISH_DIR, 0.04);
  const prism = mods.includes('prismatic') ? ' prism' : '';
  const dw = Math.round(px * (px <= 70 ? 1.15 : 1)), glows = mods.map(m => MODS[m].glow).filter(Boolean).slice(0, 2);
  const filter = glows.length ? `filter:${glows.map(g => `drop-shadow(0 0 4px ${g})`).join(' ')};` : '';
  return `<span class="fw${prism}"><img src="${url}" style="width:${dw}px;height:auto;${filter}" alt="" draggable="false"></span>`;
}
function plainMatFor(mdl) { const m = new THREE.MeshLambertMaterial({ vertexColors: true }); if (mdl.glow) m.emissive = new THREE.Color(mdl.glow).multiplyScalar(0.22); return m; }
function decorIcon(id, size) {
  const mod = decorModel(id), s = Math.round(size * 2), url = renderThumb('d' + id + s, s, s, () => { const g = new THREE.Group(); g.add(new THREE.Mesh(mod.geo, plainMat())); if (mod.glow) g.add(new THREE.Mesh(mod.glow, glowMat())); return g; }, ISO_DIR, 0.06);
  return `<img src="${url}" style="width:${size}px;height:${size}px;object-fit:contain" alt="" draggable="false">`;
}
function bgIcon(id, w) { const cv = wallArt(id, 48, 32, false); return `<img class="px" src="${cv.toDataURL()}" style="width:${w || 56}px;border:2px solid #04101b" alt="" draggable="false">`; }
function decorPic(d, size) { return d.k === 'bg' ? bgIcon(d.id, size) : decorIcon(d.id, size); }
function tankIcon(typeId, w) {
  const fake = { id: 'icon', type: typeId, bg: null, skin: 'classic', slots: [null, null, null, null] }, s = w * 2;
  const url = renderThumb('t' + typeId + s, s, s, () => buildTankGroup(fake, true).grp, ISO_DIR, 0.04);
  return `<img src="${url}" style="width:${w}px;height:${w}px;object-fit:contain" alt="" draggable="false">`;
}
