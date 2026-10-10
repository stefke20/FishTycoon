'use strict';
/* ===== Rain, snow and lightning for the 3D scenes ===== */

class WxFX {
  /* box = { x0, x1, y0, y1, z0, z1 } — the volume the weather falls through */
  constructor(parent, box, n) {
    this.box = box; this.n = n || 110; this.d = new THREE.Object3D();
    this.rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.45, 5, 0.45), new THREE.MeshBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.65, depthWrite: false }), this.n);
    this.snow = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false }), this.n);
    [this.rain, this.snow].forEach(m => { m.frustumCulled = false; m.renderOrder = 8; parent.add(m); });
    this.p = Array.from({ length: this.n }, () => ({ x: box.x0 + Math.random() * (box.x1 - box.x0), y: box.y0 + Math.random() * (box.y1 - box.y0), z: box.z0 + Math.random() * (box.z1 - box.z0), v: 0.7 + Math.random() * 0.6, s: Math.random() * 6 }));
  }
  update(dt, kind) {
    const b = this.box, h = b.y1 - b.y0, isRain = kind === 'rain' || kind === 'storm', isSnow = kind === 'snow', t = performance.now() / 1000;
    this.rain.visible = isRain; this.snow.visible = isSnow; if (!isRain && !isSnow) return;
    const m = isRain ? this.rain : this.snow, cnt = isRain ? (kind === 'storm' ? this.n : Math.round(this.n * 0.65)) : Math.round(this.n * 0.8); m.count = cnt;
    const fall = isRain ? 95 : 16;
    for (let i = 0; i < cnt; i++) {
      const p = this.p[i]; p.y -= fall * p.v * dt; if (p.y < b.y0) { p.y += h; p.x = b.x0 + Math.random() * (b.x1 - b.x0); p.z = b.z0 + Math.random() * (b.z1 - b.z0); }
      this.d.position.set(p.x + (isSnow ? Math.sin(t * 0.8 + p.s) * 3 : kind === 'storm' ? -(p.y - b.y0) * 0.12 : 0), p.y, p.z); this.d.rotation.z = isRain && kind === 'storm' ? 0.12 : 0; this.d.updateMatrix(); m.setMatrixAt(i, this.d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }
}

/* rain streaks sliding down a window pane */
class WindowRain {
  constructor(w, h, parent, pos, rotY) {
    this.cv = document.createElement('canvas'); this.cv.width = 96; this.cv.height = Math.max(32, Math.round(96 * h / w)); this.x = this.cv.getContext('2d'); this.tex = new THREE.CanvasTexture(this.cv); this.tex.magFilter = THREE.NearestFilter; this.tex.encoding = THREE.sRGBEncoding;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false })); this.mesh.position.set(pos[0], pos[1], pos[2]); this.mesh.rotation.y = rotY; this.mesh.renderOrder = 4; parent.add(this.mesh);
    this.drops = Array.from({ length: 22 }, () => ({ x: Math.random() * 96, y: Math.random() * this.cv.height, v: 12 + Math.random() * 30, l: 3 + Math.random() * 6 })); this.acc = 0;
  }
  update(dt, kind) {
    const on = kind === 'rain' || kind === 'storm' || kind === 'snow'; this.mesh.visible = on; if (!on) return; this.acc += dt; if (this.acc < 0.07) return; const step = this.acc; this.acc = 0;
    const x = this.x, H = this.cv.height; x.clearRect(0, 0, 96, H);
    if (kind === 'snow') { x.fillStyle = 'rgba(255,255,255,.55)'; this.drops.forEach(d => { d.y += d.v * 0.25 * step; if (d.y > H) d.y = 0; x.fillRect(d.x, d.y, 2, 2); }); }
    else { x.strokeStyle = 'rgba(190,225,255,.55)'; x.lineWidth = 1.4; this.drops.forEach(d => { d.y += d.v * step * 2; if (d.y > H + 8) { d.y = -6; d.x = Math.random() * 96; } x.beginPath(); x.moveTo(d.x, d.y); x.lineTo(d.x - 0.6, d.y + d.l); x.stroke(); }); }
    this.tex.needsUpdate = true;
  }
}
