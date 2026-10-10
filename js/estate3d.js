'use strict';
/* ===== Isometric estate scenes: the garden with a pond and the aquarium gallery with a glass tunnel ===== */

/* ---------------- garden ---------------- */
const GARDEN = { GW: 340, GD: 270, PX: 96, PZ: 62, PW: 190, PD: 118, WTR: 54, WH: 60 };
TANK_DIM3.garden = [GARDEN.PW, GARDEN.PD, GARDEN.WH];
TANK_TYPE.garden = { id: 'garden', n: 'Garden Pond', w: 'fresh', base: 5, cap: 16, price: 0, lvl: 99, mult: 1 };
SKIN.garden = { id: 'garden', n: 'Pond', price: 0, gravel: '#b8a878', frame: '#6a6a60', b: {} };
const GARDEN_TANK = { id: 'garden', type: 'garden', name: 'Garden Pond', bg: 'bg_forest', skin: 'garden', slots: [null, null, null, null], up: {}, wq: 100, fedUntil: 0 };
const gardGeo = (name, build) => shopGeo('garden_' + name, build);
const stoneC = (x, y, z, base) => shadeC(_hx(base || '#a29e92'), (hash(x + ',' + y + ',' + z) % 5 === 0 ? -0.12 : hash(x + ',' + z) % 7 === 0 ? 0.08 : 0));
const inPond = (x, z, m) => x >= GARDEN.PX - (m || 0) && x < GARDEN.PX + GARDEN.PW + (m || 0) && z >= GARDEN.PZ - (m || 0) && z < GARDEN.PZ + GARDEN.PD + (m || 0);

function gardenGroundGeo() {
  return gardGeo('ground', g => {
    const { GW, GD, PX, PZ, PW, PD, WTR } = GARDEN;
    for (let x = 0; x < GW; x++) for (let z = 0; z < GD; z++) {
      if (inPond(x, z, 0)) continue;
      const edge = inPond(x, z, 5), rim = inPond(x, z, 2);
      const path = (x > 150 && x < 178 && z > 175) || (z > 188 && z < 214 && x > 120) || (Math.abs(x - 164 - (z - 180) * 0.0) < 0 && false);
      let c;
      if (rim) c = stoneC(x, 0, z, '#b4b0a4');
      else if (edge) c = stoneC(x, 0, z, '#8a8678');
      else if (path) c = shadeC(_hx(((Math.floor(x / 11) + Math.floor(z / 11)) % 2) ? '#c8c0aa' : '#bdb59f'), (x % 11 === 0 || z % 11 === 0 ? -0.15 : 0));
      else { const n = hash(x + ',' + z); c = shadeC(_hx(['#5fae4c', '#6bb957', '#58a244', '#63b350'][n % 4]), (Math.floor(x / 14 + z / 17) % 2 ? 0.02 : -0.02) + (n % 29 === 0 ? 0.09 : 0)); }
      g.set(x, 0, z, c); if (x < 2 || z < 2 || x > GW - 3 || z > GD - 3) for (let y = -3; y < 0; y++) g.set(x, y, z, shadeC(_hx('#6a4a2e'), -0.1 - (hash(x + ',' + z) % 4) * 0.03)); else g.set(x, -1, z, '#6a4a2e');
      if (rim) for (let y = 1; y <= 2; y++) g.set(x, y, z, stoneC(x, y, z, '#b4b0a4'));
    }
    // inner pond walls (below ground level, around the hole)
    for (let x = PX - 1; x <= PX + PW; x++) for (let z = PZ - 1; z <= PZ + PD; z++) {
      if (inPond(x, z, 0) || !inPond(x, z, 1)) continue;
      for (let y = -WTR; y < 0; y++) g.set(x, y, z, stoneC(x, y, z, '#6e6a60'));
    }
  });
}
function pondFloorGeo() {
  return gardGeo('pondfloor', g => {
    for (let x = 0; x < GARDEN.PW; x++) for (let z = 0; z < GARDEN.PD; z++) { const n = hash(x + ',' + z); g.set(x, 0, z, shadeC(_hx(n % 9 === 0 ? '#8a8268' : '#b8a878'), (n % 5 === 0 ? 0.06 : -0.03))); }
    for (let i = 0; i < 26; i++) { const x = 10 + (hash('r' + i) % (GARDEN.PW - 20)), z = 10 + (hash('q' + i) % (GARDEN.PD - 20)); g.ell(x, 1, z, 3 + (i % 3), 2, 3 + (i % 2), (X, Y, Z) => stoneC(X, Y, Z, '#8a8a86')); }
    for (let i = 0; i < 14; i++) { const x = 8 + (hash('w' + i) % (GARDEN.PW - 16)), z = 8 + (hash('v' + i) % (GARDEN.PD - 16)); for (let h = 0; h < 12 + (i % 5) * 3; h++) g.set(x + Math.round(Math.sin(h * 0.5 + i) * 1.2), 1 + h, z, shadeC(_hx('#3f9a4a'), h * 0.01)); }
  });
}
function lilyGeo() {
  return gardGeo('lilies', g => {
    for (let i = 0; i < 11; i++) { const cx = 14 + (hash('lx' + i) % (GARDEN.PW - 28)), cz = 12 + (hash('lz' + i) % (GARDEN.PD - 24)), r = 4 + (i % 3); g.cyl(cx, cz, r, 0, 0, (x, y, z) => ((x - cx) > 0 && Math.abs(z - cz) < 1 ? null : shadeC(_hx('#3e9a50'), (hash(x + ',' + z) % 4) * 0.03))); if (i % 2) g.ell(cx + 1, 1, cz, 1.5, 1, 1.5, '#ff9ac0'); }
  });
}
const gardBench = () => gardGeo('bench', g => { g.box(0, 4, 0, 34, 5, 11, W_('#9a6a3e')); g.box(0, 9, 10, 34, 18, 11, W_('#9a6a3e', -0.05)); for (const x of [2, 31]) { g.box(x, 0, 1, x + 1, 4, 3, '#5a5a62'); g.box(x, 0, 8, x + 1, 4, 10, '#5a5a62'); g.box(x, 5, 10, x + 1, 17, 11, '#5a5a62'); } });
const gardLantern = () => gardGeo('lantern', g => { g.cyl(0, 0, 4, 0, 1, '#8a8a86'); g.cyl(0, 0, 1.6, 2, 12, '#9a9a96'); g.box(-4, 13, -4, 4, 17, 4, '#a8a8a4'); g.box(-3, 14, -3, 3, 16, 3, '#ffe9a0'); g.box(-5, 18, -5, 5, 19, 5, '#8a8a86'); g.box(-3, 20, -3, 3, 21, 3, '#9a9a96'); });
const gardBridge = () => gardGeo('bridge', g => {
  const L = 200, Wd = 22;
  for (let x = 0; x < L; x++) { const t = x / (L - 1), y = Math.round(Math.sin(t * Math.PI) * 15); for (let z = 0; z < Wd; z++) { g.set(x, y, z, shadeC(_hx('#b07a44'), (x % 7 === 0 ? -0.12 : 0.02) + (z % 6 === 0 ? -0.06 : 0))); } for (const z of [0, Wd - 1]) for (let h = 1; h <= 9; h++) if (h === 9 || x % 14 === 0) g.set(x, y + h, z, shadeC(_hx('#d0583c'), h === 9 ? 0.04 : -0.06)); }
  for (const x of [0, L - 1]) for (let y = -2; y <= 0; y++) g.box(x - 3, y, -1, x + 3, y, Wd, '#8a8a86');
});
const gardFall = () => gardGeo('fall', g => {
  for (let x = -16; x <= 16; x++) for (let z = -12; z <= 12; z++) { const h = Math.round(34 - (Math.abs(x) * 1.15 + Math.abs(z) * 1.35)); for (let y = 0; y < h; y++) g.set(x, y, z, stoneC(x, y, z, y > 28 ? '#8a9a7a' : '#85827a')); }
  g.box(-3, 20, 8, 3, 33, 12, [150, 215, 240]); g.box(-3, 0, 12, 3, 20, 14, [160, 222, 245]);
});
function sakura(g, x, z, h) { g.cyl(x, z, 2.2, 1, h, '#6a4630', 1.6); g.line([x, h - 6, z], [x + 9, h + 2, z - 4], '#6a4630', 1); g.line([x, h - 8, z], [x - 9, h, z + 5], '#6a4630', 1); for (const [dx, dy, dz, r] of [[0, 4, 0, 14], [10, 3, -4, 9], [-10, 1, 5, 10], [4, 10, 6, 8]]) g.ell(x + dx, h + dy, z + dz, r, r * 0.65, r, (X, Y, Z) => shadeC(_hx(hash(X + ',' + Y + ',' + Z) % 3 ? '#f7b6d0' : '#fcd0e0'), hash(X + ',' + Y + ',' + Z) % 7 === 0 ? -0.08 : 0.02)); }
const gardGazebo = () => gardGeo('gazebo', g => {
  const R = 30; g.cyl(0, 0, R, 0, 1, (x, y, z) => stoneC(x, y, z, '#cfc8b4'));
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, x = Math.cos(a) * (R - 4), z = Math.sin(a) * (R - 4); g.cyl(x, z, 1.6, 2, 40, '#e8e0cc'); g.ell(x, 41, z, 2.6, 1.4, 2.6, '#c8a24a'); }
  g.cyl(0, 0, R + 4, 42, 43, '#a8433a'); g.cyl(0, 0, R, 44, 52, (x, y, z, t) => shadeC(_hx(((Math.floor(Math.atan2(z, x) * 3) % 2) ? '#c0453a' : '#a8352a')), t * 0.1), 4); g.cyl(0, 0, 1.2, 53, 62, '#e0b030'); g.ell(0, 63, 0, 2.5, 2.5, 2.5, '#f0c848');
  g.box(-9, 2, -3, 9, 6, 3, '#9a6a3e'); g.box(-9, 7, 3, 9, 12, 3, '#9a6a3e');
});
function bush(g, x, z, r, col) { g.ell(x, r * 0.55, z, r, r * 0.7, r, (X, Y, Z, dx, dy) => J(col || '#3f9a4a', dy * 0.1 + (hash(X + ',' + Y + ',' + Z) % 6 === 0 ? 0.06 : -0.02))); }
function flowerBed(g, x0, z0, w, d, cols) { g.box(x0 - 1, 1, z0 - 1, x0 + w, 2, z0 + d, '#7a6a4a'); for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) { g.set(x, 1, z, '#4a3622'); if (hash(x + ',' + z) % 3 === 0) { g.set(x, 2, z, '#3f9a4a'); g.set(x, 3, z, cols[hash(x + 'f' + z) % cols.length]); } } }

function gardenSceneryGeo(lvl) {
  return gardGeo('scenery' + lvl, g => {
    const { GW, GD, PX, PZ, PW, PD } = GARDEN;
    // trees and bushes along the back
    tree(g, 36, 40, 34, 17, '#3f9a4a'); tree(g, 70, 24, 40, 20, '#4aa857'); tree(g, 40, 120, 30, 15, '#58b050'); tree(g, 300, 36, 38, 18, '#3f9a4a'); tree(g, 316, 110, 30, 14, '#4aa857');
    for (const [x, z, r] of [[16, 80, 8], [22, 170, 9], [330, 70, 8], [326, 160, 10], [96, 30, 7], [150, 22, 8], [210, 24, 7], [260, 26, 8]]) bush(g, x, z, r);
    flowerBed(g, 24, 190, 44, 14, ['#ff7aa0', '#ffd25a', '#e86ad0', '#ffffff']); flowerBed(g, 280, 190, 40, 14, ['#ff9a52', '#ff7aa0', '#ffd25a']);
    for (let i = 0; i < 9; i++) { const a = i * 0.7; g.ell(PX + PW + 10 + Math.cos(a) * 3, 3, PZ + 6 + i * 11, 4, 3, 4, (X, Y, Z) => stoneC(X, Y, Z, '#8a8a86')); }
    // low fence: back (z = 0) and left (x = 0)
    for (let x = 0; x < GW; x += 2) { g.box(x, 1, 1, x, 14, 1, '#d8c8a4'); if (x % 12 === 0) g.box(x - 1, 1, 0, x + 1, 17, 2, '#a8845a'); }
    for (let z = 0; z < GD; z += 2) { g.box(1, 1, z, 1, 14, z, '#d8c8a4'); if (z % 12 === 0) g.box(0, 1, z - 1, 2, 17, z + 1, '#a8845a'); }
    for (let x = 0; x < GW; x++) { g.set(x, 6, 1, '#b89a6c'); g.set(x, 11, 1, '#b89a6c'); } for (let z = 0; z < GD; z++) { g.set(1, 6, z, '#b89a6c'); g.set(1, 11, z, '#b89a6c'); }
    if (lvl >= 3) { sakura(g, 262, 74, 40); sakura(g, 60, 200, 34); for (let i = 0; i < 40; i++) g.set(200 + (hash('p' + i) % 120), 1 + (hash('q' + i) % 2), 150 + (hash('r' + i) % 70), '#fcd0e0'); }
  });
}

class GardenScene extends HofTankScene {
  constructor(canvas) { super(canvas, GARDEN_TANK, 'garden'); }
  rootPos() { return [GARDEN.PX, -GARDEN.WTR + 1, GARDEN.PZ]; }
  hofSlice() { return hofFor('garden'); }
  get fishScale() { return 0.68; }
  /* the pond has no glass: a stone-lined hole in the lawn with a rippling surface */
  rebuildStatic() {
    if (this.stat) this.root.remove(this.stat.grp);
    const { PW: W, PD: D, WTR, WH } = GARDEN, grp = new THREE.Group();
    grp.add(new THREE.Mesh(pondFloorGeo(), plainMat()));
    const wm = new THREE.Mesh(new THREE.BoxGeometry(W, WTR, D), new THREE.MeshBasicMaterial({ color: 0x2f9ec8, transparent: true, opacity: 0.26, depthWrite: false, side: THREE.FrontSide })); wm.position.set(W / 2, WTR / 2, D / 2); wm.renderOrder = 2; grp.add(wm);
    const sf = new THREE.Mesh(new THREE.PlaneGeometry(W, D, 28, 20), new THREE.MeshBasicMaterial({ color: 0xaee8f4, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide })); sf.rotation.x = -Math.PI / 2; sf.position.set(W / 2, WTR, D / 2); sf.renderOrder = 5; grp.add(sf);
    const lil = new THREE.Mesh(lilyGeo(), plainMat()); lil.position.y = WTR + 0.5; grp.add(lil);
    this.root.add(grp);
    this.stat = { grp, W, D, WH, WTR, surface: sf, base: sf.geometry.attributes.position.array.slice(), shafts: [], orient() {} };
    this.W = W; this.D = D; this.WH = WH; this.WTR = WTR; this.box3 = new THREE.Box3(new THREE.Vector3(0, -WTR, 0), new THREE.Vector3(W, WH, D));
    if (!this.zp) { this.zp = new ZoomPan(this, 'garden'); this.zp.bind(this.cv); this.yawCur = this.zp.v.yaw * Math.PI / 2; this.tiltCur = this.zp.v.tilt; }
    this.key = this.tank.type + '|' + this.tank.bg + '|' + this.tank.skin;
    this.fish.forEach(f => this.root.remove(f.group)); this.fish.clear(); this.dkey = '';
  }
  setup() {
    const sc = this.scene, mat = plainMat(), { GW, GD, PX, PZ, PW, PD } = GARDEN;
    const sun = new THREE.DirectionalLight(0xfff0c8, 0.5); sun.position.set(-0.4, 1, 0.3); sc.add(sun);
    sc.add(new THREE.Mesh(gardenGroundGeo(), mat));
    this.lvl = -1; this.extras = new THREE.Group(); sc.add(this.extras);
    this.camBox = new THREE.Box3(new THREE.Vector3(-4, -8, -4), new THREE.Vector3(GW + 4, 70, GD + 4));
    this.wxfx = new WxFX(this.scene, { x0: 0, x1: GW, y0: 0, y1: 120, z0: 0, z1: GD }, 150);
    this.buildLevel();
  }
  buildLevel() {
    const lvl = Math.max(1, estLvl('garden')), mat = plainMat(), { GW, GD, PX, PZ, PW, PD } = GARDEN;
    if (lvl === this.lvl) return; this.lvl = lvl;
    this.scene.remove(this.extras); this.extras = new THREE.Group(); this.scene.add(this.extras);
    const put = (geo, x, y, z, ry, s) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry || 0; if (s) m.scale.setScalar(s); this.extras.add(m); return m; };
    put(gardenSceneryGeo(lvl), 0, 0, 0);
    put(gardBench(), 190, 1, 150, 0); put(gardBench(), 110, 1, 212, Math.PI, 0.9);
    put(gardLantern(), PX + PW + 14, 1, PZ + PD + 10, 0); put(gardLantern(), PX - 14, 1, PZ + PD + 10, 0);
    if (lvl >= 2) {
      put(gardBridge(), PX - 5, 3, PZ + PD / 2 - 11, 0).scale.set((PW + 10) / 200, 1, 1);
      put(gardFall(), PX + 36, 1, PZ - 16, 0); this.fall = { x: PX + 36 - PX, z: -4 };
      for (const [x, z] of [[PX + 10, PZ - 12], [PX + PW - 10, PZ - 12], [PX + PW + 14, PZ + 40]]) put(gardLantern(), x, 1, z, 0);
    }
    if (lvl >= 3) { put(gardGazebo(), 280, 1, 175, 0); for (const [x, z] of [[PX - 14, PZ + 20], [PX + PW + 14, PZ + 80], [PX + PW + 14, PZ + 10], [PX + 60, PZ + PD + 10]]) put(gardLantern(), x, 1, z, 0); }
    // koi-keeper (you) with a watering can sitting on the front bench
    if (!this.me) {
      this.me = new Person({ skin: SKIN_TONES[1], hair: HAIRS[1], shirt: '#3a7bd5', pants: PANTS[0], style: 'short' }, [208, 156]); this.me.g.position.set(207, 6.5, 156); this.me.yaw = -Math.PI / 2; this.me.g.rotation.y = this.me.yaw; this.scene.add(this.me.g);
      this.me.legL.rotation.z = Math.PI / 2; this.me.legR.rotation.z = Math.PI / 2; this.me.armL.rotation.z = 0.4; this.me.armR.rotation.z = 0.4;
    }
  }
  step(dt) {
    super.step(dt);
    if (estLvl('garden') !== this.lvl && estLvl('garden') > 0) this.buildLevel();
    if (this.fall && Math.random() < dt * 14) this.bubbles.push({ x: this.fall.x + (Math.random() - 0.5) * 8, y: GARDEN.WTR - 6, z: this.fall.z + 8 + Math.random() * 6, vy: 8 + Math.random() * 8 });
    if (this.wxfx) this.wxfx.update(dt, S.wx.kind);
    if (this.me) { this.me.head.rotation.y = Math.sin(this.t * 0.5) * 0.3; this.me.body.position.y = Math.sin(this.t * 1.6) * 0.15; }
  }
}

/* ---------------- aquarium gallery with a walk-through glass tunnel ---------------- */
const GALLERY = { HW: 360, HD: 280, TX: 55, TZ: 28, W: 250, D: 140, WH: 100, R: 22, FLOOR: -12 };
TANK_DIM3.gallery = [GALLERY.W, GALLERY.D, GALLERY.WH];
TANK_TYPE.gallery = { id: 'gallery', n: 'Gallery Aquarium', w: 'salt', base: 5, cap: 16, price: 0, lvl: 99, mult: 1 };
SKIN.gallery = { id: 'gallery', n: 'Gallery', price: 0, gravel: '#e8dcc0', frame: '#2b3a4a', b: {} };
const GALLERY_TANK = { id: 'gallery', type: 'gallery', name: 'Gallery Aquarium', bg: 'bg_reef', skin: 'gallery', slots: [null, null, null, null], up: {}, wq: 100, fedUntil: 0 };
const galGeo = (name, build) => shopGeo('gallery_' + name, build);
function galleryHallGeo() {
  return galGeo('hall', g => {
    const { HW, HD, FLOOR } = GALLERY;
    for (let x = 0; x < HW; x++) for (let z = 0; z < HD; z++) { const t = (Math.floor(x / 20) + Math.floor(z / 20)) % 2; g.set(x, FLOOR, z, shadeC(_hx(t ? '#d4dde4' : '#bfcad4'), (x % 20 === 0 || z % 20 === 0 ? -0.1 : 0) + (hash(x + ',' + z) % 11 === 0 ? 0.03 : 0))); for (let y = FLOOR - 4; y < FLOOR; y++) g.set(x, y, z, W_('#4a5a6a', -0.1)); }
    // plinth the tank stands on
    g.box(GALLERY.TX - 8, FLOOR + 1, GALLERY.TZ - 8, GALLERY.TX + GALLERY.W + 8, -1, GALLERY.TZ + GALLERY.D + 8, (x, y, z) => W_('#2f3f52', (y % 3 === 0 ? -0.06 : 0)));
  });
}
const galRamp = (dir) => galGeo('ramp' + dir, g => { const Lr = 60; for (let i = 0; i < Lr; i++) { const h = Math.round(18 * (dir > 0 ? 1 - i / Lr : i / Lr)); for (let z = 0; z < 36; z++) for (let y = 0; y <= h; y++) g.set(i, y - 12 + 0, z, W_(z < 3 || z > 32 ? '#e0b030' : '#9aa6b2', (i % 6 === 0 ? -0.1 : 0))); } });
const galBench = () => galGeo('bench', g => { g.box(0, 4, 0, 44, 6, 12, W_('#2f5f7a')); for (const x of [3, 40]) g.box(x, 0, 2, x + 2, 4, 10, '#4a4a52'); });
const galKiosk = () => galGeo('kiosk', g => { g.box(0, 0, 0, 56, 20, 22, W_('#e8dcc0')); g.box(-2, 20, -2, 58, 23, 24, W_('#c0453a')); g.box(6, 26, 8, 50, 40, 9, W_('#2f5f7a')); g.box(10, 8, 22, 46, 14, 23, W_('#4a6a8a')); for (let i = 0; i < 8; i++) g.box(8 + i * 5, 24, -1, 10 + i * 5, 24, 24, i % 2 ? '#ffffff' : '#c0453a'); });
const galPlant = () => galGeo('plant', g => { g.cyl(0, 0, 6, 0, 10, '#8a5a3a', 5); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; g.line([0, 10, 0], [Math.cos(a) * 10, 24 + (i % 3) * 4, Math.sin(a) * 10], '#3f9a4a', 1.4); } });
const galReef = () => galGeo('reef', g => { for (let i = 0; i < 12; i++) { const x = (hash('c' + i) % 200) + 20, z = (hash('d' + i) % 100) + 15, h = 8 + (i % 4) * 4, col = ['#ff7aa0', '#ff9a52', '#e86ad0', '#ffd25a', '#4ac8d8'][i % 5]; g.cyl(x, z, 2.5, 3, 3 + h, (X, Y, Z, t) => shadeC(_hx(col), t * 0.2), 5); g.ell(x, 4 + h, z, 5, 3, 5, col); } });
function galJelly() { return galGeo('jelly', g => { g.ell(0, 8, 0, 8, 6, 8, (x, y, z, dx, dy) => (dy < -0.2 ? null : shadeC(_hx('#d8b0ff'), dy * 0.2))); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; g.line([Math.cos(a) * 5, 6, Math.sin(a) * 5], [Math.cos(a) * 6, -8, Math.sin(a) * 6], '#c890ff', 0.5); } }); }

class GalleryScene extends HofTankScene {
  constructor(canvas) { super(canvas, GALLERY_TANK, 'gallery'); }
  rootPos() { return [GALLERY.TX, 0, GALLERY.TZ]; }
  hofSlice() { return hofFor('gallery'); }
  get fishScale() { return 0.82; }
  setup() {
    const sc = this.scene, mat = plainMat(), { HW, HD, FLOOR, W, D, R } = GALLERY;
    sc.add(new THREE.Mesh(galleryHallGeo(), mat));
    // back and left walls with banners and windows
    const back = paintTexture(HW * 2, 190, (x, w, h) => { x.fillStyle = '#34506a'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 40) { x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(i, 0, 20, h); } x.fillStyle = '#1f2f40'; x.fillRect(0, h - 36, w, 36); x.fillStyle = '#e8dcc0'; x.font = 'bold 44px "Segoe UI", sans-serif'; x.textAlign = 'center'; x.fillText('AQUARIUM GALLERY', w / 2, 70); x.font = '22px "Segoe UI", sans-serif'; x.fillStyle = '#9ad0e8'; x.fillText('Walk beneath the Hall of Fame', w / 2, 104); for (const cx of [90, w - 90]) { x.fillStyle = '#4a7a9a'; x.fillRect(cx - 40, 120, 80, 120); x.fillStyle = '#2f9ec8'; x.fillRect(cx - 34, 126, 68, 108); x.fillStyle = '#ff9a52'; x.beginPath(); x.ellipse(cx, 190, 20, 9, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(cx + 18, 190); x.lineTo(cx + 32, 180); x.lineTo(cx + 32, 200); x.fill(); } });
    const bw = texMesh(HW, 95, back); bw.position.set(HW / 2, FLOOR + 47, 0); sc.add(bw);
    const left = paintTexture(HD * 2, 190, (x, w, h) => { x.fillStyle = '#3d5a74'; x.fillRect(0, 0, w, h); x.fillStyle = '#1f2f40'; x.fillRect(0, h - 36, w, 36); for (let k = 0; k < 4; k++) { const cx = 70 + k * 120; x.fillStyle = '#e8dcc0'; x.fillRect(cx - 34, 50, 68, 90); x.fillStyle = '#2f9ec8'; x.fillRect(cx - 28, 56, 56, 78); x.fillStyle = '#e8f6ff'; x.beginPath(); x.ellipse(cx, 96, 16, 7, 0.3, 0, 7); x.fill(); } });
    const lw = texMesh(HD, 95, left); lw.rotation.y = Math.PI / 2; lw.position.set(0, FLOOR + 47, HD / 2); sc.add(lw);
    this.camBox = new THREE.Box3(new THREE.Vector3(-4, FLOOR - 4, -4), new THREE.Vector3(HW + 4, 130, HD + 4));
    this.lvl = -1; this.extras = new THREE.Group(); sc.add(this.extras); this.people = []; this.jelly = [];
    this.tubeTopY = FLOOR_Y + R * 2 - 3;
    this.buildLevel();
  }
  buildLevel() {
    const lvl = Math.max(1, estLvl('gallery')), mat = plainMat(), { W, D, R, FLOOR, TX, TZ, HW, HD } = GALLERY;
    if (lvl === this.lvl) return; this.lvl = lvl;
    this.scene.remove(this.extras); this.scene.remove(this.dyn); this.extras = new THREE.Group(); this.scene.add(this.extras); this.dyn = new THREE.Group(); this.dyn.position.set(TX, 0, TZ); this.scene.add(this.dyn);
    this.people.forEach(p => this.scene.remove(p.g)); this.people = []; this.jelly = [];
    const glass = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }), steel = new THREE.MeshLambertMaterial({ color: 0x8aa0b4 }), cy = FLOOR_Y + R - 1;
    const tube = (axis, len, off) => {
      const grp = new THREE.Group(), cyl = new THREE.Mesh(new THREE.CylinderGeometry(R, R, len, 28, 1, true), glass); cyl.renderOrder = 7; cyl.rotation.z = axis === 'x' ? Math.PI / 2 : 0; if (axis === 'z') cyl.rotation.x = Math.PI / 2; grp.add(cyl);
      for (let i = 0; i <= 12; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(R + 0.4, 1.3, 6, 28), steel); const p = -len / 2 + i * len / 12; if (axis === 'x') { ring.rotation.y = Math.PI / 2; ring.position.x = p; } else ring.position.z = p; grp.add(ring); }
      const floor = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? len : R * 1.5, 2, axis === 'x' ? R * 1.5 : len), new THREE.MeshLambertMaterial({ color: 0xc8d4de })); floor.position.y = -R + 3 + 0.2; grp.add(floor);
      grp.position.set(off[0], cy, off[1]); this.dyn.add(grp); return grp;
    };
    const len = W + 2 * 56;
    tube('x', len, [W / 2, D / 2]);
    // ramps up from the hall to the tunnel
    const rampL = new THREE.Mesh(galRamp(-1), mat); rampL.position.set(TX - 8 - 60, 0, TZ + D / 2 - 18); this.extras.add(rampL);
    const rampR = new THREE.Mesh(galRamp(1), mat); rampR.position.set(TX + W + 8, 0, TZ + D / 2 - 18); this.extras.add(rampR);
    if (lvl >= 2) { tube('z', D + 2 * 40, [W * 0.5, D / 2 + 0]); const reef = new THREE.Mesh(galReef(), mat); this.dyn.add(reef); }
    // hall furniture
    const put = (geo, x, y, z, ry, s) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry || 0; if (s) m.scale.setScalar(s); this.extras.add(m); return m; };
    put(galKiosk(), 300, FLOOR + 1, 36, 0, 0.9); put(galBench(), 80, FLOOR + 1, 232, 0); put(galBench(), 190, FLOOR + 1, 232, 0); put(galBench(), 290, FLOOR + 1, 232, 0);
    for (const [x, z] of [[14, 24], [340, 24], [14, 262], [344, 262], [20, 150]]) put(galPlant(), x, FLOOR + 1, z, 0, 1.1);
    // rope barrier at the tank front
    for (let x = TX + 6; x <= TX + W; x += 40) { const post = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 14, 8), steel); post.position.set(x, FLOOR + 8, TZ + D + 22); this.extras.add(post); }
    // light shafts and jellyfish (deep dome)
    if (lvl >= 3) { const jg = galJelly(); for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(jg, new THREE.MeshBasicMaterial({ vertexColors: true })); m.position.set(30 + (i * 33) % (W - 60), 60 + (i % 3) * 8, 14 + (i * 41) % (D - 28)); m.userData = { b: m.position.clone(), ph: i }; m.scale.setScalar(1.3); this.dyn.add(m); this.jelly.push(m); } }
    // visitors: some wander the hall, some walk the tunnel
    const nHall = 3 + lvl * 2, nTube = 2 + lvl * 2;
    for (let i = 0; i < nHall + nTube; i++) {
      const p = new Person(personApp('gal' + i), [60 + Math.random() * 240, 200]); p.g.position.y = FLOOR + 0.5; p.tube = i >= nHall; p.speed = 22 + (i % 4) * 4; p.wait = Math.random() * 4; this.scene.add(p.g); this.people.push(p);
      if (p.tube) this.sendThroughTunnel(p, i % 2 === 0, true);
    }
  }
  /* world position of the tunnel centre line */
  tubeLine() { return { z: GALLERY.TZ + GALLERY.D / 2, x0: GALLERY.TX - 62, x1: GALLERY.TX + GALLERY.W + 62 }; }
  floorAt(x) { const { TX, W, FLOOR } = GALLERY, top = 6.5; const a = TX - 8, b = TX + W + 8; if (x >= a && x <= b) return top; if (x < a) return Math.max(FLOOR + 0.5, top - (a - x) / 60 * (top - FLOOR - 0.5)); return Math.max(FLOOR + 0.5, top - (x - b) / 60 * (top - FLOOR - 0.5)); }
  sendThroughTunnel(p, ltr, initial) { const t = this.tubeLine(); p.tubeDir = ltr; const hallY = GALLERY.TZ + GALLERY.D + 40; if (initial) { p.g.position.x = ltr ? t.x0 + Math.random() * (t.x1 - t.x0) * 0.8 : t.x1 - Math.random() * (t.x1 - t.x0) * 0.8; p.g.position.z = t.z + (Math.random() - 0.5) * 8; } p.go(ltr ? [[t.x1, t.z + (Math.random() - 0.5) * 8], [t.x1 + 20, hallY - 10], [t.x0 - 20, hallY - 10], [t.x0, t.z]] : [[t.x0, t.z + (Math.random() - 0.5) * 8], [t.x0 - 20, hallY - 10], [t.x1 + 20, hallY - 10], [t.x1, t.z]]); }
  step(dt) {
    super.step(dt);
    if (estLvl('gallery') !== this.lvl && estLvl('gallery') > 0) this.buildLevel();
    const { R, TZ, D, TX, HW, HD } = GALLERY, cz = TZ + D / 2;
    // fish never swim through the tunnel
    for (const o of this.fish.values()) { const s = o.st; for (const lz of [D / 2]) { const dz = s.z - lz; if (Math.abs(dz) < R + 7 && s.y < this.tubeTopY + 6) { s.z = lz + (dz >= 0 ? 1 : -1) * (R + 7); s.tz = s.z + (dz >= 0 ? 6 : -6); } } if (this.lvl >= 2) { const dx = s.x - this.W * 0.5; if (Math.abs(dx) < R + 7 && s.y < this.tubeTopY + 6) { s.x = this.W * 0.5 + (dx >= 0 ? 1 : -1) * (R + 7); s.tx = s.x + (dx >= 0 ? 6 : -6); } } }
    for (const p of this.people) {
      p.update(dt);
      if (!p.path.length) {
        p.wait -= dt;
        if (p.wait <= 0) { if (p.tube) this.sendThroughTunnel(p, Math.random() < 0.5); else { p.go([[40 + Math.random() * 280, GALLERY.TZ + D + 36 + Math.random() * 60]]); p.wait = 2 + Math.random() * 5; } }
      }
      const x = p.g.position.x, z = p.g.position.z; p.g.position.y = this.floorAt(x) + (Math.abs(z - cz) < 24 && x > TX - 70 && x < TX + this.W + 70 ? 0 : 0);
      if (!(Math.abs(z - cz) < 26 && x > TX - 66 && x < TX + this.W + 66)) p.g.position.y = this.floorAt(x) <= GALLERY.FLOOR + 1 ? GALLERY.FLOOR + 0.5 : this.floorAt(x);
    }
    for (const j of this.jelly) { j.position.y = j.userData.b.y + Math.sin(this.t * 0.8 + j.userData.ph) * 6; j.position.x = j.userData.b.x + Math.sin(this.t * 0.3 + j.userData.ph * 2) * 8; j.scale.set(1.3, 1.3 + Math.sin(this.t * 2 + j.userData.ph) * 0.08, 1.3); }
  }
}
