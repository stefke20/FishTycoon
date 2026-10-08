'use strict';
/* ===== Home: an isometric living room with a huge aquarium showing your 20 most valuable fish ever ===== */

const HOME = { W: 300, D: 232, WH: 150, TX: 50, TY: 34, TZ: 8 };
TANK_DIM3.home = [200, 72, 92];
TANK_TYPE.home = { id: 'home', n: 'Display Aquarium', w: 'fresh', base: 5, cap: 20, price: 0, lvl: 99, mult: 1 };
SKIN.home = { id: 'home', n: 'Home', price: 0, gravel: '#d6c79a', frame: '#2b2626', b: {} };
const HOME_TANK = { id: 'home', type: 'home', name: 'Display Aquarium', bg: 'bg_blue', skin: 'home', slots: ['sword', 'ship', 'castle', 'bubbles'], up: {}, wq: 100, fedUntil: 0 };

const homeGeo = (name, build) => shopGeo('home_' + name, build);
const woodFn = (base, k) => (x, y, z) => shadeC(_hx(base), (Math.floor(x / (k || 6)) % 2 ? -0.04 : 0.02) + (hash(x + ',' + y + ',' + z) % 9 === 0 ? -0.05 : 0));
function homeFloorGeo() {
  return homeGeo('floor', g => {
    for (let x = 0; x < HOME.W; x++) for (let z = 0; z < HOME.D; z++) {
      const plank = Math.floor(z / 9), col = ['#b98a5a', '#c4946a', '#ad7e50', '#bf8e60'][(plank * 7 + Math.floor((x + plank * 37) / 60)) % 4];
      const seam = z % 9 === 0 || (x + plank * 37) % 60 === 0;
      g.set(x, 0, z, shadeC(_hx(col), (seam ? -0.18 : 0) + (hash(x + ',' + z) % 11 === 0 ? 0.05 : 0)));
      if (x === 0 || z === 0 || x === HOME.W - 1 || z === HOME.D - 1) for (let y = -4; y < 0; y++) g.set(x, y, z, W_('#5a4030', -0.1));
    }
  });
}
const homeCabinetGeo = () => homeGeo('cabinet', g => {
  const w = 208, d = 78, h = 33; g.box(0, 0, 0, w, h, d, woodFn('#5a3a26', 5));
  g.box(-1, h, -1, w + 1, h + 1, d + 1, '#8a6a46');
  for (let x = 4; x < w - 4; x += 34) { g.box(x, 4, d, x + 31, h - 5, d, '#6e4a30'); g.box(x + 1, 5, d, x + 30, 5, d, '#3a2416'); g.box(x + 1, h - 6, d, x + 30, h - 6, d, '#3a2416'); g.box(x + 1, 5, d, x + 1, h - 6, d, '#3a2416'); g.box(x + 30, 5, d, x + 30, h - 6, d, '#3a2416'); g.box(x + 28, 14, d + 1, x + 29, 20, d + 1, '#d8b04a'); }
});
const homeSofaGeo = () => homeGeo('sofa', g => {
  const fab = (x, y, z) => shadeC(_hx('#b8553c'), (hash(x + ',' + y + ',' + z) % 7 === 0 ? -0.06 : 0.02));
  g.box(0, 0, 0, 92, 12, 38, fab); g.box(0, 12, 28, 92, 40, 38, fab); g.box(0, 12, 0, 9, 28, 37, fab); g.box(83, 12, 0, 92, 28, 37, fab);
  g.box(9, 12, 1, 83, 18, 28, (x, y, z) => shadeC(_hx('#cf6a4c'), (x % 30 === 0 ? -0.1 : 0)));
  for (const x0 of [10, 38, 64]) g.box(x0, 19, 22, x0 + 18, 36, 28, shadeC(_hx('#cf6a4c'), 0.04));
  g.box(3, 0, 3, 7, -3, 7, '#3a2a20'); g.box(85, 0, 3, 89, -3, 7, '#3a2a20'); g.box(3, 0, 31, 7, -3, 35, '#3a2a20'); g.box(85, 0, 31, 89, -3, 35, '#3a2a20');
  g.box(14, 19, 4, 26, 30, 9, '#e8d9a0'); g.box(66, 19, 5, 78, 29, 10, '#4a8aa0');
});
const homeTableGeo = () => homeGeo('table', g => {
  g.box(0, 12, 0, 50, 14, 28, woodFn('#7a5232', 5)); g.box(1, 15, 1, 49, 15, 27, '#bfe0e8');
  for (const [x, z] of [[2, 2], [46, 2], [2, 24], [46, 24]]) g.box(x, 0, z, x + 2, 11, z + 2, '#4a3220');
  g.box(8, 16, 8, 14, 18, 14, '#e8e8f0'); g.cyl(30, 14, 4, 16, 19, '#c0453a'); g.box(36, 16, 6, 44, 17, 20, '#2f6f5a');
});
const homeLampGeo = () => homeGeo('lamp', g => { g.cyl(0, 0, 5, 0, 1, '#3a3a40'); g.cyl(0, 0, 1, 1, 72, '#4a4a52'); });
const homeShadeGeo = () => homeGeo('shade', g => { g.cyl(0, 0, 8, 70, 84, '#fff0b8', 11); });
const homeCatGeo = () => homeGeo('cat', g => {
  const fur = (x, y, z) => shadeC(_hx('#d9893a'), (Math.floor(x / 2) % 2 ? -0.1 : 0.02) + (y > 6 ? 0.05 : 0));
  g.ell(0, 4, 0, 11, 4.5, 6, fur); g.ell(-10, 5, 3, 5, 4.2, 4, fur);
  g.box(-14, 8, 0, -12, 11, 1, '#d9893a'); g.box(-14, 8, 5, -12, 11, 6, '#d9893a'); g.box(-14, 4, 4, -13, 5, 4, '#2a2a2a');
  g.line([11, 3, 0], [16, 1, 6], fur, 1.6); g.line([16, 1, 6], [8, 1, 10], fur, 1.6);
});
const homeTrophyGeo = () => homeGeo('trophy', g => { g.cyl(0, 0, 3.4, 0, 1, '#5a3a22'); g.cyl(0, 0, 1, 2, 4, '#e0b030'); g.cyl(0, 0, 4, 5, 10, '#f0c848', 2.6); g.box(-5, 6, 0, -4, 8, 0, '#e0b030'); g.box(4, 6, 0, 5, 8, 0, '#e0b030'); });
const homeRugGeo = () => homeGeo('rug', g => {
  const w = 150, d = 108;
  for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) {
    const ring = Math.min(x, z, w - 1 - x, d - 1 - z), c = ring < 3 ? '#e8d9a0' : ring < 8 ? '#2f5f7a' : ring < 12 ? '#e0b86a' : ((Math.floor(x / 10) + Math.floor(z / 10)) % 2 ? '#4a85a0' : '#3a7088');
    g.set(x, 0, z, shadeC(_hx(c), hash(x + ',' + z) % 5 === 0 ? 0.04 : 0));
  }
  for (let z = 0; z < d; z += 3) { g.set(-1, 0, z, '#e8d9a0'); g.set(w, 0, z, '#e8d9a0'); }
});

class HomeScene extends TankScene3D {
  constructor(canvas) {
    super(canvas, HOME_TANK, false, () => {}, null);
    this.onFish = id => this.boop(id);
    this.zp.noPan = true; this.food = []; this.tip = null; this.vmap = new Map(); this.hofKey = null; this.vf = [];
    this.buildRoom();
    this.camBox = new THREE.Box3(new THREE.Vector3(-4, -6, -4), new THREE.Vector3(HOME.W + 4, HOME.WH + 8, HOME.D + 4));
    this.refit();
    const cv = canvas;
    cv.addEventListener('mousedown', e => { if (e.button !== 0) return; this.down = { t: performance.now(), x: e.clientX, y: e.clientY, moved: false }; this.holding = true; this.updateLure(e); });
    window.addEventListener('mousemove', e => { if (!this.holding || !cv.isConnected) return; if (this.down && Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 6) this.down.moved = true; this.updateLure(e); });
    window.addEventListener('mouseup', e => {
      if (!this.holding) return; this.holding = false; const d = this.down; this.down = null;
      if (d && !d.moved && performance.now() - d.t < 300 && this.lure && !this.pickedFish) this.dropFood(this.lure);
      this.lure = null; this.pickedFish = false;
    });
    cv.addEventListener('mouseleave', () => { this.lure = null; });
  }
  makeRoot() { const g = new THREE.Group(); g.position.set(HOME.TX, HOME.TY, HOME.TZ); this.scene.add(g); return g; }
  /* the 20 most valuable fish you ever owned — even the ones you sold */
  fishList() {
    const key = S.hof.map(e => e.id + ':' + e.value + ':' + e.name).join(',');
    if (key !== this.hofKey) {
      this.hofKey = key;
      this.vf = S.hof.map(e => { const id = 'hof:' + e.id; let f = this.vmap.get(id); if (!f) { f = { id, g: 1, vb: 0, loc: 'home', fav: false }; this.vmap.set(id, f); } f.sp = e.sp; f.mods = e.mods; f.name = e.name; f.e = e; return f; });
    }
    return this.vf;
  }
  buildRoom() {
    const sc = this.scene, W = HOME.W, D = HOME.D, WH = HOME.WH, mat = plainMat();
    sc.add(new THREE.HemisphereLight(0xfff0dc, 0x7a6a5a, 0.55)); const d = new THREE.DirectionalLight(0xffe2b0, 0.55); d.position.set(-0.7, 1, 0.5); sc.add(d);
    sc.add(new THREE.Mesh(homeFloorGeo(), mat));
    const back = paintTexture(W * 2, WH * 2, (x, w, h) => {
      x.fillStyle = '#5f8f94'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < w; i += 20) { x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(i, 0, 10, h); }
      x.fillStyle = '#e8dcc0'; x.fillRect(0, h - 44, w, 44); x.fillStyle = '#d0c0a0'; x.fillRect(0, h - 48, w, 5);
      x.fillStyle = '#e8dcc0'; x.fillRect(0, 0, w, 8);
      // framed pictures on both sides of the aquarium
      const frame = (cx, cy, fw, fh, col) => { x.fillStyle = '#4a3220'; x.fillRect(cx - fw / 2, cy - fh / 2, fw, fh); x.fillStyle = '#f2ecd8'; x.fillRect(cx - fw / 2 + 5, cy - fh / 2 + 5, fw - 10, fh - 10); x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, fw / 3.4, fh / 6, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(cx - fw / 3.4, cy); x.lineTo(cx - fw / 2.3, cy - fh / 8); x.lineTo(cx - fw / 2.3, cy + fh / 8); x.fill(); x.fillStyle = '#fff'; x.fillRect(cx + fw / 6, cy - 3, 4, 4); };
      frame(60, 150, 70, 90, '#e8663c'); frame(540, 150, 70, 90, '#3a8ad0'); frame(60, 60, 50, 38, '#d04a6a'); frame(540, 60, 50, 38, '#3aa86a');
    });
    const bw = texMesh(W, WH, back); bw.position.set(W / 2, WH / 2, 0); sc.add(bw);
    const left = paintTexture(D * 2, WH * 2, (x, w, h) => {
      x.fillStyle = '#6f9a8e'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 20) { x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(i, 0, 10, h); }
      x.fillStyle = '#e8dcc0'; x.fillRect(0, h - 44, w, 44); x.fillStyle = '#d0c0a0'; x.fillRect(0, h - 48, w, 5); x.fillRect(0, 0, w, 8);
      // window with curtains
      x.fillStyle = '#4a3320'; x.fillRect(160, 70, 150, 140); const g = x.createLinearGradient(0, 78, 0, 200); g.addColorStop(0, '#8fd0f0'); g.addColorStop(1, '#fbe7b0'); x.fillStyle = g; x.fillRect(168, 78, 134, 124); x.fillStyle = '#4a3320'; x.fillRect(233, 78, 4, 124); x.fillRect(168, 138, 134, 4);
      x.fillStyle = 'rgba(70,100,130,.45)'; for (let i = 0; i < 8; i++) x.fillRect(172 + i * 16, 170 - (i * 9) % 22, 11, 32 + (i * 9) % 22);
      x.fillStyle = '#c95a6a'; x.fillRect(140, 60, 28, 160); x.fillRect(300, 60, 28, 160); x.fillStyle = '#a84454'; for (let i = 0; i < 160; i += 12) { x.fillRect(142, 60 + i, 4, 8); x.fillRect(302, 60 + i, 4, 8); }
      x.fillStyle = '#4a3320'; x.fillRect(130, 54, 210, 7);
    });
    const lw = texMesh(D, WH, left); lw.rotation.y = Math.PI / 2; lw.position.set(0, WH / 2, D / 2); sc.add(lw);
    // aquarium cabinet
    const cab = new THREE.Mesh(homeCabinetGeo(), mat); cab.position.set(HOME.TX - 4, 0, HOME.TZ - 4); sc.add(cab);
    // rug, sofa, table, lamp, cat, shelf, plants
    const rug = new THREE.Mesh(homeRugGeo(), mat); rug.position.set(75, 1, 108); sc.add(rug);
    const sofa = new THREE.Mesh(homeSofaGeo(), mat); sofa.position.set(104, 1, 168); sc.add(sofa);
    const table = new THREE.Mesh(homeTableGeo(), mat); table.position.set(125, 1, 118); sc.add(table);
    const lamp = new THREE.Mesh(homeLampGeo(), mat); lamp.position.set(270, 1, 150); sc.add(lamp);
    const shade = new THREE.Mesh(homeShadeGeo(), new THREE.MeshBasicMaterial({ color: 0xfff0b0 })); shade.position.set(270, 1, 150); sc.add(shade);
    const glow = new THREE.PointLight(0xffe0a0, 0.5, 220); glow.position.set(270, 80, 150); sc.add(glow);
    this.cat = new THREE.Mesh(homeCatGeo(), mat); this.cat.position.set(190, 3, 130); this.cat.rotation.y = 2.4; sc.add(this.cat);
    const shelf = new THREE.Mesh(shelfGeo(), mat); shelf.position.set(1, 1, 150); shelf.scale.set(1, 1.5, 1.35); sc.add(shelf);
    for (const [x, z] of [[18, 22], [280, 26], [282, 205], [20, 215]]) { const pot = new THREE.Mesh(potGeo(), mat); pot.position.set(x, 1, z); sc.add(pot); }
    // trophy shelf on the left wall (one cup per few achievements)
    const board = new THREE.Mesh(homeGeo('board', g => g.box(0, 0, 0, 12, 2, 80, woodFn('#6a4a30', 5))), mat); board.position.set(1, 100, 60); sc.add(board);
    this.trophies = []; for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(homeTrophyGeo(), mat); t.position.set(7, 103, 68 + i * 9); t.visible = false; sc.add(t); this.trophies.push(t); }
    // you, sitting on the sofa facing the aquarium
    this.me = new Person({ skin: SKIN_TONES[1], hair: HAIRS[1], shirt: '#3a7bd5', pants: PANTS[0], style: 'short' }, [150, 168]);
    this.me.g.position.set(150, 10.5, 168); this.me.yaw = Math.PI / 2; this.me.g.rotation.y = Math.PI / 2; sc.add(this.me.g);
    this.me.legL.rotation.z = Math.PI / 2; this.me.legR.rotation.z = Math.PI / 2; this.me.armL.rotation.z = 0.5; this.me.armR.rotation.z = 0.5;
    this.me.body.children.forEach(c => { if (c === this.me.legL || c === this.me.legR) c.position.y = 11; });
    // food pellet mesh template
    this.pelGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8); this.pelMat = new THREE.MeshBasicMaterial({ color: 0xd9a35a });
  }
  /* mouse position -> point inside the tank (tank-local coordinates) */
  updateLure(e) {
    const r = this.cv.getBoundingClientRect(); this.mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); this.ray.setFromCamera(this.mouse, this.cam);
    const o = this.root.worldToLocal(this.ray.ray.origin.clone()), d = this.ray.ray.direction.clone(); if (Math.abs(d.z) < 1e-4) return;
    const t = (this.D * 0.5 - o.z) / d.z, p = o.addScaledVector(d, t);
    if (p.x < 6 || p.x > this.W - 6 || p.y < FLOOR_Y || p.y > this.WTR + 4) { this.lure = null; return; }
    this.lure = { x: p.x, y: Math.min(this.WTR - 6, Math.max(FLOOR_Y + 6, p.y)), z: this.D * 0.5 };
    const hit = this.pick(e); this.pickedFish = !!(hit && hit.fishId);
  }
  dropFood(p) { for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(this.pelGeo, this.pelMat); m.position.set(p.x + (Math.random() - 0.5) * 14, this.WTR - 2, this.D * 0.5 + (Math.random() - 0.5) * 20); m.userData.age = 0; this.root.add(m); this.food.push(m); } if (this.food.length > 40) this.root.remove(this.food.shift()); Sfx.play('pop'); }
  boop(id) {
    const o = this.fish.get(id); if (!o) return; const s = o.st;
    s.vx += (Math.random() - 0.5) * 120; s.vz += (Math.random() - 0.5) * 120; s.vy += 30; s.burst = 2.4; s.wait = 0; this.retarget(s, o.model.L);
    for (let i = 0; i < 10; i++) this.bubbles.push({ x: s.x + (Math.random() - 0.5) * 8, y: s.y + (Math.random() - 0.5) * 6, z: s.z + (Math.random() - 0.5) * 8, vy: 16 + Math.random() * 14 });
    this.tip = { id, t: 4.5 }; Sfx.play('pop'); this.pickedFish = true;
  }
  step(dt) {
    this.dtLast = dt;
    for (const o of this.fish.values()) {
      const s = o.st;
      if (this.lure) { const d = Math.hypot(this.lure.x - s.x, this.lure.y - s.y, this.lure.z - s.z); if (d < 260) { s.tx = this.lure.x + Math.sin(this.t * 2 + o.model.L) * 14; s.ty = this.lure.y + Math.cos(this.t * 1.7 + o.model.L) * 8; s.tz = this.lure.z + Math.sin(this.t * 1.3 + o.model.L) * 18; s.wait = 0; s.burst = 1.15; } }
      else if (this.food.length) {
        let best = null, bd = 1e9; for (const f of this.food) { const d = Math.hypot(f.position.x - s.x, f.position.y - s.y, f.position.z - s.z); if (d < bd) { bd = d; best = f; } }
        if (best && bd < 190) { s.tx = best.position.x; s.ty = best.position.y; s.tz = best.position.z; s.wait = 0; s.burst = 1.2; if (bd < 9 + o.model.L * 0.3) { best.userData.eaten = true; for (let i = 0; i < 3; i++) this.bubbles.push({ x: s.x, y: s.y, z: s.z, vy: 18 + Math.random() * 10 }); } }
      }
    }
    super.step(dt);
    for (const f of this.food) { f.userData.age += dt; if (f.position.y > FLOOR_Y + 2) f.position.y -= 8 * dt; if (f.userData.age > 40) f.userData.eaten = true; }
    this.food = this.food.filter(f => { if (f.userData.eaten) { this.root.remove(f); return false; } return true; });
  }
  frame(dt) {
    if (!this.me) return super.frame(dt);
    const t = this.t; this.me.head.rotation.y = Math.sin(t * 0.5) * 0.3; this.me.body.position.y = Math.sin(t * 1.6) * 0.15;
    this.cat.scale.set(1, 1 + Math.sin(t * 1.4) * 0.035, 1); this.cat.position.y = 3;
    const n = Math.min(8, Math.floor(Object.keys(S.ach).length / 4)); this.trophies.forEach((tr, i) => (tr.visible = i < n));
    super.frame(dt);
  }
  drawSel() {
    if (!this.tip) return; const o = this.fish.get(this.tip.id); if (!o) { this.tip = null; return; }
    this.tip.t -= this.dtLast || 0.016; if (this.tip.t <= 0) { this.tip = null; return; }
    const f = o.f, e = f.e, ctx = this.ctx, cv = this.cv, k = cv.height / 700, v = new THREE.Vector3(); o.group.getWorldPosition(v); v.project(this.cam);
    const x = (v.x + 1) / 2 * cv.width, y = (1 - v.y) / 2 * cv.height - 22 * k, lines = [`${f.name}`, fishName({ g: 1, sp: f.sp, mods: f.mods }), fmt(e.value)];
    ctx.save(); ctx.globalAlpha = Math.min(1, this.tip.t); ctx.font = `700 ${Math.round(13 * k)}px "Segoe UI", system-ui, sans-serif`; const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 20 * k, h = 58 * k, bx = x - w / 2, by = y - h;
    ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.strokeStyle = '#e0b030'; ctx.lineWidth = 2 * k; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, w, h, 9 * k); else ctx.rect(bx, by, w, h); ctx.moveTo(x - 6 * k, by + h - 0.5); ctx.lineTo(x, by + h + 9 * k); ctx.lineTo(x + 6 * k, by + h - 0.5); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#1b2a3c'; ctx.fillText(lines[0], x, by + 14 * k); ctx.font = `600 ${Math.round(11 * k)}px "Segoe UI", system-ui, sans-serif`; ctx.fillStyle = '#5a6a7c'; ctx.fillText(lines[1], x, by + 29 * k); ctx.font = `800 ${Math.round(14 * k)}px "Segoe UI", system-ui, sans-serif`; ctx.fillStyle = '#c08a10'; ctx.fillText(lines[2], x, by + 45 * k); ctx.restore();
  }
}
