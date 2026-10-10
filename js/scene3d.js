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
  else if (bg === 'bg_stpat') {
    ctx.drawImage(bandGradient(w, h, ['#bfe8ff', '#8fd8a0', '#4fb868', '#2f8f48', '#1d6a34']), 0, 0);
    ['#e8403a', '#f08a2a', '#f4d83a', '#4cc060', '#4a8ae0', '#8a52c8'].forEach((c, i) => { ctx.fillStyle = c; for (let a = 0.05; a < Math.PI - 0.05; a += 0.012) ctx.fillRect(Math.round(w * 0.5 + Math.cos(a) * (w * 0.38 - i * 5)), Math.round(h * 0.78 - Math.sin(a) * (h * 0.7 - i * 5)), 3, 3); });
    blob(w * 0.12, h * 0.8, 9, '#ffffff'); blob(w * 0.18, h * 0.78, 7, '#ffffff'); blob(w * 0.88, h * 0.8, 9, '#ffffff'); blob(w * 0.82, h * 0.78, 7, '#ffffff');
    for (let i = 0; i < 18; i++) { const hh = hash('cl' + i); rect(hh % w, h - 8 - (hh >> 8) % 12, 3, 3, '#1d6a34'); rect((hh % w) + 1, h - 11 - (hh >> 8) % 12, 1, 1, '#9be8a0'); }
  } else if (bg === 'bg_valentine') {
    ctx.drawImage(bandGradient(w, h, ['#ffd6e4', '#ffaac4', '#f07a9c', '#c8406a', '#7a1f48']), 0, 0);
    const heart = (cx, cy, r, c) => { ctx.fillStyle = c; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const X = x / r, Y = -y / r * 1.1; if (Math.pow(X * X + Y * Y - 1, 3) - X * X * Y * Y * Y <= 0) ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1); } };
    for (let i = 0; i < 9; i++) { const hh = hash('hb' + i); heart(hh % w, 12 + (hh >> 8) % (h - 30), 6 + hh % 6, ['#ff7aa0', '#ffd0e0', '#e0305a', '#ffa8c0'][i % 4]); }
  } else if (bg === 'bg_spring') {
    ctx.drawImage(bandGradient(w, h, ['#cfeeff', '#a8e0e8', '#8fd0b8', '#6ab890', '#3f8f66']), 0, 0);
    for (let b = 0; b < 3; b++) { const x = w * (0.1 + b * 0.4); ctx.fillStyle = '#6a4a38'; for (let i = 0; i < h * 0.55; i++) ctx.fillRect(Math.round(x + Math.sin(i * 0.12 + b) * 6), i, 3, 1); for (let i = 0; i < 26; i++) { const hh = hash('bl' + b + i); blob(x + (hh % 50) - 25, 6 + (hh >> 8) % (h * 0.5), 3 + hh % 3, ['#ffb0d0', '#ffd0e4', '#ff8ab8', '#ffe8f0'][i % 4]); } }
  } else if (bg === 'bg_summer') {
    ctx.drawImage(bandGradient(w, h, ['#ffe08a', '#ffb060', '#ff8a60', '#4ab0d8', '#2a7ab8']), 0, 0);
    blob(w * 0.5, h * 0.36, 16, '#fff2b0'); blob(w * 0.5, h * 0.36, 12, '#ffe070');
    rect(0, h * 0.84, w, h * 0.16, '#f0d890'); for (let i = 0; i < 40; i++) rect(hash('sa' + i) % w, h * 0.86 + hash('sb' + i) % 12, 2, 1, '#d8b86a');
    [0.15, 0.82].forEach(px => { ctx.fillStyle = '#6a4a2a'; for (let i = 0; i < 40; i++) ctx.fillRect(Math.round(w * px + Math.sin(i * 0.12) * 3), h * 0.84 - i, 3, 1); for (let k = 0; k < 6; k++) for (let i = 0; i < 18; i++) { ctx.fillStyle = '#2f8f48'; ctx.fillRect(Math.round(w * px + Math.cos(k * 1.05) * i * 0.9), Math.round(h * 0.84 - 40 + Math.sin(k * 1.05) * i * 0.4 + i * i * 0.012), 3, 2); } });
  } else if (bg === 'bg_halloween') {
    ctx.drawImage(bandGradient(w, h, ['#3a1858', '#2a1245', '#1a0c30', '#0e0620']), 0, 0);
    blob(w * 0.72, h * 0.3, 15, '#fff0c0'); blob(w * 0.72 + 4, h * 0.3 - 3, 3, '#e8d090'); blob(w * 0.72 - 5, h * 0.3 + 4, 2, '#e8d090');
    for (let i = 0; i < 40; i++) rect(hash('hs' + i) % w, hash('ht' + i) % (h * 0.6), 1, 1, '#ffffff');
    [0.12, 0.45, 0.9].forEach((px, k) => { ctx.fillStyle = '#0a0414'; for (let i = 0; i < h * 0.55; i++) ctx.fillRect(Math.round(w * px + Math.sin(i * 0.1 + k) * 3), h - i, 3 + (i < 12 ? 2 : 0), 1); for (let j = 0; j < 5; j++) { const bx = w * px, by = h - h * 0.35 - j * 8; for (let i = 0; i < 16; i++) ctx.fillRect(Math.round(bx + (j % 2 ? i : -i)), Math.round(by - i * 0.5), 2, 1); } });
    for (let i = 0; i < 4; i++) { const bx = (hash('bt' + i) % w), by = 10 + (hash('bu' + i) % 30); ctx.fillStyle = '#0a0414'; ctx.fillRect(bx - 4, by, 3, 2); ctx.fillRect(bx + 2, by, 3, 2); ctx.fillRect(bx - 1, by - 1, 3, 3); }
  } else if (bg === 'bg_winter') {
    ctx.drawImage(bandGradient(w, h, ['#16285a', '#243a78', '#3a5a98', '#8ab0d8', '#e8f0f8']), 0, 0);
    for (let i = 0; i < 5; i++) { const px = w * (0.08 + i * 0.22); for (let k = 0; k < 4; k++) { ctx.fillStyle = '#12503a'; for (let y = 0; y < 10; y++) ctx.fillRect(Math.round(px - (y + 4) * (1 + k * 0.1)), h * 0.5 + k * 11 + y, Math.round((y + 4) * 2 * (1 + k * 0.1)), 1); ctx.fillStyle = '#f0f8ff'; ctx.fillRect(Math.round(px - 3), h * 0.5 + k * 11, 6, 1); } }
    rect(0, h * 0.9, w, h * 0.1, '#f0f6ff'); for (let i = 0; i < 70; i++) rect(hash('sn' + i) % w, hash('sm' + i) % h, 1, 1, '#ffffff');
    rect(w * 0.55, h * 0.56, 22, 14, '#a8632f'); ctx.fillStyle = '#c0303a'; for (let y = 0; y < 8; y++) ctx.fillRect(w * 0.55 - y, h * 0.56 - 8 + y, 22 + y * 2, 1); rect(w * 0.55 + 8, h * 0.56 + 4, 5, 10, '#ffd870');
  }
  return base;
}


/* ===== WebGL / three.js service ===== */
const TANK_DIM3 = { starter: [144, 108, 96], medium: [180, 135, 108], large: [225, 165, 123], huge: [285, 210, 138], reef_s: [180, 135, 108], reef_m: [225, 165, 123], reef_l: [285, 210, 138], reef_g: [345, 240, 153], mega: [375, 255, 150], reef_x: [420, 285, 165] };
EVENTS.forEach(e => (TANK_DIM3['ev_' + e.id] = [210, 156, 114]));
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
  scene.add(new THREE.HemisphereLight(0xd8ecff, 0x5a7090, strong ? 0.75 : 0.55));
  const d = new THREE.DirectionalLight(0xfff1d6, 0.85); d.position.set(-0.55, 1, 0.6); scene.add(d);
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
const FX_FLAGS = { lucky: [4, 2], potgold: [0, 1], lovestruck: [0, 0], cupid: [0, 1], sunkissed: [0, 1], splash: [0, 3], pumpkinlit: [3, 0], festive: [3, 0], neon: [3, 0], magma: [3, 1], glitch: [3, 2], diamond: [3, 3], phoenix: [4, 0], robot: [4, 1], ruby: [4, 2], emerald: [4, 2], sapphire: [4, 2], zombie: [4, 3], pearl: [0, 0], golden: [0, 1], fiery: [0, 2], frosty: [0, 3], glowing: [1, 0], electric: [1, 1], toxic: [1, 2], aurora: [1, 3], cosmic: [2, 0], prismatic: [2, 1], shadow: [2, 2], celestial: [2, 3] };
const FX_GLSL = `
  vec3 vox = floor(vP - vN * 0.25 + 0.5); float hv = h31(vox);
  if (uF1.x > 0.5) { float sw = sin(vP.x * 0.16 + vP.y * 0.1 + uTime * 1.6); float bnd = smoothstep(0.5, 1.0, sw); vec3 ir = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + vP.x * 0.03 + uTime * 0.3)); diffuseColor.rgb = mix(diffuseColor.rgb, ir, 0.55 * bnd); totalEmissiveRadiance += ir * 0.2 * bnd + vec3(0.02); }
  if (uF1.y > 0.5) { float tw = pow(max(0.0, sin(uTime * 4.0 + hv * 60.0)), 20.0) * step(0.74, hv); totalEmissiveRadiance += vec3(1.0, 0.95, 0.6) * tw * 1.3 + vec3(0.04, 0.025, 0.0); }
  if (uF1.z > 0.5) { float fl = h31(vox + floor(uTime * 7.0)); totalEmissiveRadiance += vec3(1.0, 0.35, 0.05) * (0.05 + 0.32 * fl); }
  if (uF1.w > 0.5) { float tw = pow(max(0.0, sin(uTime * 3.0 + hv * 50.0)), 24.0) * step(0.76, hv); totalEmissiveRadiance += vec3(0.8, 0.95, 1.0) * tw * 1.3 + vec3(0.0, 0.03, 0.07); }
  if (uF2.x > 0.5) { totalEmissiveRadiance += vec3(0.3, 1.0, 0.3) * (0.08 + 0.1 * sin(uTime * 2.5)); }
  if (uF2.y > 0.5) { float arc = step(0.91, h31(vox + floor(uTime * 10.0))); totalEmissiveRadiance += vec3(0.5, 0.9, 1.0) * arc * 1.7 + vec3(0.0, 0.02, 0.06); }
  if (uF2.z > 0.5) { float n2 = h31(vec3(vox.x, floor(vox.y * 0.5 - uTime * 1.5), vox.z)); totalEmissiveRadiance += vec3(0.5, 1.0, 0.1) * step(0.88, n2) * 0.8 + vec3(0.0, 0.03, 0.0); }
  if (uF2.w > 0.5) { float w = sin(vP.x * 0.12 + uTime * 1.2 + sin(vP.y * 0.2 + uTime) * 2.0); vec3 ac = mix(vec3(0.2, 1.0, 0.6), vec3(0.7, 0.3, 1.0), 0.5 + 0.5 * sin(vP.x * 0.05 + uTime * 0.7)); totalEmissiveRadiance += ac * smoothstep(0.2, 1.0, w) * 0.4; }
  if (uF3.x > 0.5) { float tw = pow(max(0.0, sin(uTime * 2.5 + hv * 80.0)), 10.0) * step(0.66, hv); totalEmissiveRadiance += vec3(0.9, 0.9, 1.0) * tw * 1.4 + vec3(0.12, 0.04, 0.26) * (0.5 + 0.5 * sin(uTime + vP.x * 0.1)); }
  if (uF3.y > 0.5) { vec3 rb = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + vP.x * 0.04 + uTime * 0.35)); diffuseColor.rgb = mix(diffuseColor.rgb, rb, 0.72); totalEmissiveRadiance += rb * 0.08; }
  if (uF3.z > 0.5) { totalEmissiveRadiance += vec3(0.35, 0.1, 0.85) * step(0.93, h31(vox + floor(uTime * 3.0))) * 0.9; diffuseColor.rgb *= 0.85; }
  if (uF3.w > 0.5) { float tw = pow(max(0.0, sin(uTime * 3.0 + hv * 70.0)), 18.0) * step(0.72, hv); totalEmissiveRadiance += vec3(1.0, 0.95, 0.7) * (0.1 + 0.08 * sin(uTime * 2.0)) + vec3(1.0, 1.0, 0.9) * tw * 1.3; }

  float lumx = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
  if (uF4.x > 0.5) { totalEmissiveRadiance += diffuseColor.rgb * smoothstep(0.5, 0.85, lumx) * 1.7 * (0.85 + 0.15 * sin(uTime * 5.0)); }
  if (uF4.y > 0.5) { totalEmissiveRadiance += diffuseColor.rgb * smoothstep(0.5, 0.85, lumx) * 1.5 + vec3(1.0, 0.4, 0.05) * 0.18 * h31(vox + floor(uTime * 5.0)) * smoothstep(0.5, 0.85, lumx); }
  if (uF4.z > 0.5) { float g1 = step(0.9, h31(vec3(vox.y, floor(uTime * 9.0), 1.0))); vec3 gc = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 0.0, 0.8), step(0.5, h31(vox + floor(uTime * 9.0)))); diffuseColor.rgb = mix(diffuseColor.rgb, gc, g1 * 0.35); totalEmissiveRadiance += gc * g1 * 0.8; }
  if (uF4.w > 0.5) { float tw = pow(max(0.0, sin(uTime * 5.0 + hv * 90.0)), 12.0) * step(0.55, hv); vec3 rb = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + hv + uTime * 0.3)); totalEmissiveRadiance += rb * tw * 1.7 + vec3(0.1, 0.12, 0.16); }
  if (uF5.x > 0.5) { float fl2 = h31(vox + floor(uTime * 8.0)); totalEmissiveRadiance += vec3(1.0, 0.45, 0.05) * (0.12 + 0.45 * fl2) + vec3(1.0, 0.8, 0.2) * step(0.9, fl2) * 0.5; }
  if (uF5.y > 0.5) { float bl = step(0.975, h31(vox)) * (0.5 + 0.5 * sin(uTime * 6.0 + hv * 20.0)); totalEmissiveRadiance += vec3(1.0, 0.2, 0.1) * bl * 1.6; }
  if (uF5.z > 0.5) { float tw = pow(max(0.0, sin(uTime * 4.0 + hv * 70.0)), 14.0) * step(0.68, hv); totalEmissiveRadiance += diffuseColor.rgb * 0.3 + vec3(1.0) * tw * 1.3; }
  if (uF5.w > 0.5) { totalEmissiveRadiance += vec3(0.3, 0.5, 0.1) * step(0.93, h31(vox + floor(uTime * 2.0))) * 0.6; }
`;
function fishMaterial(model, mods) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  const F1 = new THREE.Vector4(0, 0, 0, 0), F2 = new THREE.Vector4(0, 0, 0, 0), F3 = new THREE.Vector4(0, 0, 0, 0), F4 = new THREE.Vector4(0, 0, 0, 0), F5 = new THREE.Vector4(0, 0, 0, 0), arr = [F1, F2, F3, F4, F5], comp = ['x', 'y', 'z', 'w'];
  (mods || []).forEach(md => { const f = FX_FLAGS[md]; if (f) arr[f[0]][comp[f[1]]] = 1; });
  m.userData.u = { uPhase: { value: 0 }, uAmp: { value: 0.3 }, uLen: { value: model.L }, uKind: { value: model.kind || 0 }, uTime: { value: 0 }, uF1: { value: F1 }, uF2: { value: F2 }, uF3: { value: F3 }, uF4: { value: F4 }, uF5: { value: F5 } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uPhase;uniform float uAmp;uniform float uLen;uniform float uKind;uniform float uTime;uniform vec4 uF4;varying vec3 vP;varying vec3 vN;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vP = position; vN = normal;
        { float gr = fract(sin(dot(vec3(floor(position.y * 0.5), floor(uTime * 7.0), 3.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453); if (uF4.z > 0.5 && gr > 0.93) transformed.x += (gr - 0.93) * 70.0; }
        if (uKind > 2.5) { float fz = abs(transformed.z) - 0.12 * uLen; if (fz > 0.0) transformed.y += sin(uPhase) * fz * 0.45; }
        else if (uKind > 1.5) { float rr = length(transformed.xz); float ww = smoothstep(0.1 * uLen, 0.6 * uLen, rr); transformed.y += sin(uPhase + rr * 0.18) * ww * uLen * 0.06; transformed.xz *= 1.0 + sin(uPhase * 0.5) * 0.02; }
        else if (uKind > 0.5) { float bb = smoothstep(-0.15 * uLen, 0.2 * uLen, transformed.y); transformed.xz *= 1.0 + 0.12 * sin(uPhase) * bb; float tl = clamp(-transformed.y / uLen, 0.0, 1.0); transformed.x += sin(uPhase * 0.8 - transformed.y * 0.25) * tl * 3.0; transformed.z += cos(uPhase * 0.7 - transformed.y * 0.22) * tl * 3.0; transformed.y += sin(uPhase) * 0.8 * bb; }
        else {
        float k = clamp((-0.02 * uLen - transformed.x) / (0.85 * uLen), 0.0, 1.0);
        transformed.z += sin(uPhase + transformed.x * 0.3) * uAmp * k * k * uLen * 0.17;
        float hd = clamp(transformed.x / (0.6 * uLen), 0.0, 1.0);
        transformed.z -= sin(uPhase) * uAmp * hd * hd * uLen * 0.035;
        }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vP;varying vec3 vN;uniform float uTime;uniform vec4 uF1;uniform vec4 uF2;uniform vec4 uF3;uniform vec4 uF4;uniform vec4 uF5;\nfloat h31(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + FX_GLSL);
  };
  m.customProgramCacheKey = () => 'fishfx';
  if (model.kind === 1) { m.transparent = true; m.opacity = 0.82; m.depthWrite = false; }
  if ((mods || []).includes('ghost') || (mods || []).includes('haunted')) { m.transparent = true; m.opacity = 0.55; m.depthWrite = false; }
  if (model.glow) m.emissive = new THREE.Color(model.glow).multiplyScalar(model.kind === 1 ? 0.35 : 0.06);
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


/* ---- particle effects for modifiers ---- */
const _fxTex = {};
function fxTexture(kind) {
  if (_fxTex[kind]) return _fxTex[kind];
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  if (kind === 'soft') { const g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  else if (kind === 'star') { x.translate(32, 32); const g = x.createRadialGradient(0, 0, 0, 0, 0, 12); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(-32, -32, 64, 64); x.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { x.rotate(Math.PI / 2); x.beginPath(); x.moveTo(-2, 0); x.lineTo(0, -30); x.lineTo(2, 0); x.closePath(); x.fill(); } }
  else if (kind === 'flake') { x.translate(32, 32); x.strokeStyle = '#fff'; x.lineWidth = 3; for (let i = 0; i < 6; i++) { x.rotate(Math.PI / 3); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -26); x.moveTo(0, -14); x.lineTo(7, -20); x.moveTo(0, -14); x.lineTo(-7, -20); x.stroke(); } }
  else if (kind === 'ring') { x.strokeStyle = '#fff'; x.lineWidth = 5; x.beginPath(); x.arc(32, 32, 22, 0, 7); x.stroke(); x.fillStyle = 'rgba(255,255,255,.25)'; x.fill(); }
  else if (kind === 'clover') { x.fillStyle = '#fff'; [[24, 24], [40, 24], [24, 40], [40, 40]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 9, 0, 7); x.fill(); }); x.fillRect(31, 36, 3, 22); }
  else if (kind === 'heart') { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(32, 56); x.bezierCurveTo(4, 36, 8, 8, 32, 22); x.bezierCurveTo(56, 8, 60, 36, 32, 56); x.fill(); }
  else if (kind === 'petal') { x.fillStyle = '#fff'; x.translate(32, 32); x.rotate(0.6); x.beginPath(); x.ellipse(0, 0, 9, 18, 0, 0, 7); x.fill(); }
  else if (kind === 'coin') { x.fillStyle = '#fff'; x.beginPath(); x.arc(32, 32, 20, 0, 7); x.fill(); x.fillStyle = '#000'; x.globalAlpha = 0.35; x.beginPath(); x.arc(32, 32, 12, 0, 7); x.fill(); }
  else if (kind === 'drop') { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(32, 6); x.bezierCurveTo(52, 34, 50, 56, 32, 56); x.bezierCurveTo(14, 56, 12, 34, 32, 6); x.fill(); }
  else if (kind === 'square') { x.fillStyle = '#fff'; x.fillRect(16, 16, 32, 32); }
  else if (kind === 'bolt') { x.strokeStyle = '#fff'; x.lineWidth = 5; x.lineJoin = 'miter'; x.beginPath(); x.moveTo(38, 4); x.lineTo(22, 32); x.lineTo(38, 32); x.lineTo(24, 60); x.stroke(); }
  const t = new THREE.CanvasTexture(c); return (_fxTex[kind] = t);
}
const FX_DEF = {
  pearl: { tex: 'soft', col: [1, 0.85, 1], n: 8, size: 9, kind: 'twinkle' },
  golden: { tex: 'star', col: [1, 0.86, 0.3], n: 12, size: 13, kind: 'twinkle' },
  fiery: { tex: 'soft', col: [1, 0.42, 0.08], n: 18, size: 11, kind: 'rise', speed: 0.6 },
  frosty: { tex: 'flake', col: [0.8, 0.95, 1], n: 12, size: 11, kind: 'fall', speed: 0.3 },
  glowing: { tex: 'soft', col: [0.4, 1, 0.4], n: 3, size: 38, kind: 'halo' },
  electric: { tex: 'bolt', col: [0.5, 0.9, 1], n: 6, size: 15, kind: 'flash' },
  toxic: { tex: 'ring', col: [0.55, 1, 0.2], n: 10, size: 9, kind: 'rise', speed: 0.45 },
  aurora: { tex: 'soft', col: [0.4, 1, 0.75], n: 10, size: 14, kind: 'orbit' },
  cosmic: { tex: 'star', col: [0.85, 0.85, 1], n: 14, size: 11, kind: 'orbit' },
  prismatic: { tex: 'soft', col: [1, 1, 1], n: 10, size: 14, kind: 'orbit', rainbow: true },
  shadow: { tex: 'soft', col: [0.5, 0.2, 0.95], n: 14, size: 16, kind: 'rise', speed: 0.25 },
  camo: null,
  bubbly: { tex: 'ring', col: [0.6, 0.85, 1], n: 8, size: 10, kind: 'rise', speed: 0.7 },
  candy: { tex: 'star', col: [1, 0.75, 0.9], n: 10, size: 10, kind: 'twinkle', rainbow: true },
  ruby: { tex: 'star', col: [1, 0.3, 0.4], n: 8, size: 12, kind: 'twinkle' },
  emerald: { tex: 'star', col: [0.3, 1, 0.55], n: 8, size: 12, kind: 'twinkle' },
  sapphire: { tex: 'star', col: [0.35, 0.6, 1], n: 8, size: 12, kind: 'twinkle' },
  neon: { tex: 'soft', col: [1, 0.3, 0.85], n: 3, size: 34, kind: 'halo' },
  zombie: { tex: 'soft', col: [0.45, 0.8, 0.15], n: 10, size: 9, kind: 'fall', speed: 0.45 },
  skeleton: { tex: 'soft', col: [0.8, 0.78, 0.7], n: 8, size: 8, kind: 'fall', speed: 0.25 },
  magma: { tex: 'soft', col: [1, 0.45, 0.1], n: 14, size: 10, kind: 'rise', speed: 0.5 },
  ghost: { tex: 'soft', col: [0.7, 0.85, 1], n: 12, size: 22, kind: 'rise', speed: 0.3 },
  robot: { tex: 'star', col: [1, 0.85, 0.3], n: 6, size: 12, kind: 'flash' },
  glitch: { tex: 'square', col: [0.2, 1, 0.9], n: 10, size: 9, kind: 'flash', rainbow: true },
  diamond: { tex: 'star', col: [0.9, 0.97, 1], n: 16, size: 15, kind: 'twinkle', rainbow: true },
  phoenix: { tex: 'soft', col: [1, 0.5, 0.1], n: 24, size: 16, kind: 'rise', speed: 0.9, halo: true },
  lucky: { tex: 'clover', col: [0.4, 1, 0.55], n: 9, size: 14, kind: 'fall', speed: 0.35 },
  potgold: { tex: 'coin', col: [1, 0.82, 0.25], n: 12, size: 11, kind: 'fall', speed: 0.7 },
  lovestruck: { tex: 'heart', col: [1, 0.4, 0.6], n: 8, size: 14, kind: 'rise', speed: 0.6 },
  cupid: { tex: 'star', col: [1, 0.85, 0.85], n: 10, size: 13, kind: 'orbit', halo: true },
  blossom: { tex: 'petal', col: [1, 0.7, 0.85], n: 12, size: 12, kind: 'fall', speed: 0.5 },
  dyed: { tex: 'soft', col: [1, 1, 1], n: 10, size: 11, kind: 'twinkle', rainbow: true },
  sunkissed: { tex: 'star', col: [1, 0.85, 0.4], n: 9, size: 12, kind: 'twinkle' },
  splash: { tex: 'drop', col: [0.5, 0.82, 1], n: 12, size: 11, kind: 'rise', speed: 0.5 },
  pumpkinlit: { tex: 'soft', col: [1, 0.5, 0.1], n: 10, size: 10, kind: 'rise', speed: 0.45, halo: true },
  haunted: { tex: 'soft', col: [0.7, 0.55, 1], n: 12, size: 20, kind: 'orbit' },
  candycane: { tex: 'star', col: [1, 0.5, 0.55], n: 8, size: 11, kind: 'twinkle' },
  festive: { tex: 'star', col: [1, 1, 1], n: 12, size: 12, kind: 'twinkle', rainbow: true },
  celestial: { tex: 'star', col: [1, 0.95, 0.7], n: 10, size: 14, kind: 'rise', speed: 0.35, halo: true },
};
class FishFX {
  constructor(group, mods, L, mini) {
    this.sys = [];
    mods.forEach(m => {
      const d = FX_DEF[m]; if (!d || (typeof G !== 'undefined' && G.lowFx)) return;
      const n = mini ? Math.ceil(d.n * 0.5) : d.n, pos = new Float32Array(n * 3), colr = new Float32Array(n * 3);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colr, 3));
      const mat = new THREE.PointsMaterial({ size: d.size, map: fxTexture(d.tex), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: false });
      const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 8; group.add(pts);
      const ps = Array.from({ length: n }, (_, i) => ({ life: Math.random(), ox: (Math.random() - 0.5), oy: (Math.random() - 0.5), oz: (Math.random() - 0.5), ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 0.8 }));
      this.sys.push({ d, geo, mat, pts, ps, pos, colr, base: d.size });
    });
  }
  update(dt, L, scale) {
    for (const S of this.sys) {
      const d = S.d; S.mat.size = S.base * (scale || 1);
      S.ps.forEach((p, i) => {
        p.life += dt * (d.kind === 'halo' ? 0.5 : 0.55) * p.sp; if (p.life > 1) { p.life -= 1; p.ox = Math.random() - 0.5; p.oy = Math.random() - 0.5; p.oz = Math.random() - 0.5; }
        const t = p.life; let x = p.ox * L * 0.9 - L * 0.05, y = p.oy * L * 0.42, z = p.oz * L * 0.34, a = Math.sin(Math.PI * t);
        switch (d.kind) {
          case 'twinkle': a = Math.pow(Math.sin(Math.PI * t), 2); break;
          case 'rise': y += t * L * (d.speed || 0.5); x -= t * L * 0.25; break;
          case 'fall': y += (0.5 - t) * L * (d.speed || 0.5) * 2; x += Math.sin(t * 6 + p.ph) * L * 0.05; break;
          case 'orbit': { const an = p.ph + t * 6.28 * 1.5; x = Math.cos(an) * L * 0.5 - L * 0.05; z = Math.sin(an) * L * 0.34; y = Math.sin(an * 1.3 + p.ph) * L * 0.22; break; }
          case 'flash': a = Math.pow(Math.max(0, Math.sin(t * 20 + p.ph)), 6); break;
          case 'halo': x = -L * 0.05; y = 0; z = 0; a = 0.35 + 0.2 * Math.sin(t * 6.28 + p.ph); break;
        }
        S.pos[i * 3] = x; S.pos[i * 3 + 1] = y; S.pos[i * 3 + 2] = z;
        let c = d.col; if (d.rainbow) { const h = (t + p.ph) % 1; c = [0.5 + 0.5 * Math.cos(6.28 * h), 0.5 + 0.5 * Math.cos(6.28 * (h + 0.33)), 0.5 + 0.5 * Math.cos(6.28 * (h + 0.67))]; }
        if (d.kind === 'rise' && d.col[0] > 0.9 && d.col[1] < 0.5) c = [1, 0.25 + 0.6 * (1 - t), 0.05];
        S.colr[i * 3] = c[0] * a; S.colr[i * 3 + 1] = c[1] * a; S.colr[i * 3 + 2] = c[2] * a;
      });
      S.geo.attributes.position.needsUpdate = true; S.geo.attributes.color.needsUpdate = true;
    }
  }
  dispose(group) { this.sys.forEach(S => { group.remove(S.pts); S.geo.dispose(); S.mat.dispose(); }); }
}

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
  const artZ = tex(W, WH), artX = tex(D, WH), mkArt = (map, col) => new THREE.Mesh(new THREE.PlaneGeometry(map === artZ ? W : D, WH), new THREE.MeshBasicMaterial({ map, color: col, side: THREE.DoubleSide }));
  const wz0 = mkArt(artZ, 0xffffff); wz0.position.set(W / 2, WH / 2, 0); const wzD = mkArt(artZ, 0xffffff); wzD.position.set(W / 2, WH / 2, D);
  const wx0 = mkArt(artX, 0xbfc8d8); wx0.rotation.y = Math.PI / 2; wx0.position.set(0, WH / 2, D / 2); const wxW = mkArt(artX, 0xbfc8d8); wxW.rotation.y = Math.PI / 2; wxW.position.set(W, WH / 2, D / 2);
  [wz0, wzD, wx0, wxW].forEach(m => grp.add(m));
  // frame
  const fc = new THREE.Color(skin.frame), hi = fc.clone().multiplyScalar(1.6), lo = fc.clone().multiplyScalar(0.55);
  grp.add(box(W + 8, 8, D + 8, W / 2, -8, D / 2, lo)); grp.add(box(W + 6, 2, D + 6, W / 2, -3.2, D / 2, fc));
  for (const [x, z] of [[-1.5, -1.5], [W + 1.5, -1.5], [-1.5, D + 1.5], [W + 1.5, D + 1.5]]) grp.add(box(3, WH + 4, 3, x, WH / 2 - 0.5, z, fc));
  const rim = (w, d, x, z) => grp.add(box(w, 2.4, d, x, WH + 1, z, hi));
  rim(W + 6, 3, W / 2, -1.5); rim(W + 6, 3, W / 2, D + 1.5); rim(3, D + 6, -1.5, D / 2); rim(3, D + 6, W + 1.5, D / 2);
  // glass + water
  const glass = { color: 0xcfeaff, transparent: true, opacity: 0.045, side: THREE.DoubleSide, depthWrite: false };
  const mkGlass = (w, rotY, x, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), new THREE.MeshBasicMaterial(glass)); m.rotation.y = rotY; m.position.set(x, WH / 2, z); m.renderOrder = 6; grp.add(m); return m; };
  const gz0 = mkGlass(W, 0, W / 2, 0), gzD = mkGlass(W, 0, W / 2, D), gx0 = mkGlass(D, Math.PI / 2, 0, D / 2), gxW = mkGlass(D, Math.PI / 2, W, D / 2);
  out.orient = dir => { const farX0 = dir.x > 0, farZ0 = dir.z > 0; wx0.visible = farX0; gx0.visible = !farX0; wxW.visible = !farX0; gxW.visible = farX0; wz0.visible = farZ0; gz0.visible = !farZ0; wzD.visible = !farZ0; gzD.visible = farZ0; };
  out.orient(ISO_DIR);
  const wm = new THREE.Mesh(new THREE.BoxGeometry(W, WTR, D), new THREE.MeshBasicMaterial({ color: salt ? 0x2ad0e0 : 0x3aa8e8, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.FrontSide })); wm.position.set(W / 2, WTR / 2, D / 2); wm.renderOrder = 5; grp.add(wm);
  const sf = new THREE.Mesh(new THREE.PlaneGeometry(W, D, mini ? 4 : 28, mini ? 3 : 20), new THREE.MeshBasicMaterial({ color: 0xcdf3ff, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide })); sf.rotation.x = -Math.PI / 2; sf.position.set(W / 2, WTR, D / 2); sf.renderOrder = 7; grp.add(sf); out.surface = sf;
  out.base = sf.geometry.attributes.position.array.slice();
  // light shafts
  out.shafts = [];
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(10 + i * 3, WTR * 1.1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); s.position.set(W * (0.15 + i * 0.18), WTR * 0.55, D * (0.2 + (i % 3) * 0.25)); s.rotation.y = Math.PI / 4; s.rotation.z = 0.28; s.renderOrder = 4; grp.add(s); out.shafts.push(s); }
  return out;
}


/* ---- zoom & pan (mouse wheel, drag, double-click) ---- */
const _views = {};
class ZoomPan {
  constructor(scene, key) { this.s = scene; this.v = _views[key] || (_views[key] = { zoom: 1, px: 0, py: 0, yaw: 0, tilt: 0.78 }); this.moved = false; }
  capture() { const c = this.s.cam; this.b = { cx: (c.left + c.right) / 2, cy: (c.top + c.bottom) / 2, hw: (c.right - c.left) / 2, hh: (c.top - c.bottom) / 2 }; this.apply(); }
  apply() {
    const v = this.v, b = this.b, c = this.s.cam, hw = b.hw / v.zoom, hh = b.hh / v.zoom, mx = Math.max(0, b.hw - hw) + b.hw * 0.25, my = Math.max(0, b.hh - hh) + b.hh * 0.25;
    v.px = Math.max(-mx, Math.min(mx, v.px)); v.py = Math.max(-my, Math.min(my, v.py));
    c.left = b.cx + v.px - hw; c.right = b.cx + v.px + hw; c.top = b.cy + v.py + hh; c.bottom = b.cy + v.py - hh; c.updateProjectionMatrix();
  }
  zoomAt(f, nx, ny) {
    const v = this.v, b = this.b, z0 = v.zoom, z1 = Math.max(0.85, Math.min(6, z0 * f)), hw0 = b.hw / z0, hh0 = b.hh / z0, hw1 = b.hw / z1, hh1 = b.hh / z1;
    const Px = b.cx + v.px + nx * hw0, Py = b.cy + v.py + ny * hh0; v.px = Px - nx * hw1 - b.cx; v.py = Py - ny * hh1 - b.cy; v.zoom = z1; this.apply();
  }
  reset() { this.v.zoom = 1; this.v.px = 0; this.v.py = 0; this.apply(); }
  bind(cv) {
    cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(); this.zoomAt(Math.exp(-e.deltaY * 0.0016), (e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1)); }, { passive: false });
    cv.addEventListener('dblclick', () => this.reset());
    let drag = null;
    cv.addEventListener('mousedown', e => { if (e.button !== 0 || this.noPan) return; drag = { x: e.clientX, y: e.clientY, px: this.v.px, py: this.v.py }; this.moved = false; });
    window.addEventListener('mousemove', e => { if (!drag || !cv.isConnected) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 5) this.moved = true; if (!this.moved) return; const r = cv.getBoundingClientRect(), b = this.b, z = this.v.zoom; this.v.px = drag.px - dx / r.width * 2 * b.hw / z; this.v.py = drag.py + dy / r.height * 2 * b.hh / z; this.apply(); cv.style.cursor = 'grabbing'; });
    window.addEventListener('mouseup', () => { drag = null; setTimeout(() => (this.moved = false), 0); });
  }
}

/* ---- a tank scene on a 2D canvas ---- */
class TankScene3D {
  constructor(canvas, tank, mini, onFish, onHero) {
    this.onHero = onHero; this.cv = canvas; this.ctx = canvas.getContext('2d'); this.tank = tank; this.mini = mini; this.onFish = onFish;
    this.scene = new THREE.Scene(); addLights(this.scene); this.root = this.makeRoot();
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1600);
    this.fish = new Map(); this.blobs = []; this.sparks = []; this.decor = []; this.bubbles = []; this.t = Math.random() * 10; this.acc = 0; this.key = ''; this.dkey = '';
    const wrap = canvas.parentElement, cssW = mini ? 360 : Math.max(480, Math.min(1180, (wrap ? wrap.clientWidth : 900) - 20));
    const dpr = mini ? 1 : Math.min(2, window.devicePixelRatio || 1), cssH = mini ? 250 : Math.round(Math.min(820, cssW * 0.72));
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    canvas.style.width = mini ? '100%' : cssW + 'px'; canvas.style.height = mini ? 'auto' : cssH + 'px';
    this.ray = new THREE.Raycaster(); this.mouse = new THREE.Vector2();
    if (!mini && onFish) {
      canvas.addEventListener('click', e => { if (this.zp && this.zp.moved) return; const f = this.pick(e); if (f && f.fishId) this.onFish(f.fishId); else if (f && f.heroId && this.onHero) this.onHero(f.heroId); });
      let last = 0; canvas.addEventListener('mousemove', e => { const n = performance.now(); if (n - last < 60) return; last = n; const f = this.pick(e); canvas.style.cursor = f ? 'pointer' : 'grab'; canvas.title = f ? (f.fishId && getFish(f.fishId) ? getFish(f.fishId).name + ' · ' + fishName(getFish(f.fishId)) : f.heroId ? HERO[(S.heroes.find(h => h.id === f.heroId) || {}).kind].n : '') : ''; });
    }
    this.rebuildStatic();
  }
  makeRoot() { return this.scene; }
  fishList() { return fishIn(this.tank.id); }
  pick(e) {
    const r = this.cv.getBoundingClientRect(); this.mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.mouse, this.cam);
    const meshes = [...this.fish.values()].map(f => f.mesh).concat(this.hero ? [this.hero.mesh] : []), hit = this.ray.intersectObjects(meshes, false)[0];
    return hit ? hit.object.userData : null;
  }
  rebuildStatic() {
    if (this.stat) this.root.remove(this.stat.grp);
    this.stat = buildTankGroup(this.tank, this.mini); this.root.add(this.stat.grp);
    ({ W: this.W, D: this.D, WH: this.WH, WTR: this.WTR } = this.stat);
    const box3 = new THREE.Box3(new THREE.Vector3(-6, -14, -6), new THREE.Vector3(this.W + 6, this.WH + 5, this.D + 6));
    this.box3 = box3;
    if (!this.mini && !this.zp) { this.zp = new ZoomPan(this, 'tank' + this.tank.id); this.zp.bind(this.cv); this.yawCur = this.zp.v.yaw * Math.PI / 2; this.tiltCur = this.zp.v.tilt; }
    this.refit();
    this.key = this.tank.type + '|' + this.tank.bg + '|' + this.tank.skin;
    this.fish.forEach(f => { this.root.remove(f.group); }); this.fish.clear(); this.dkey = '';
  }
  camDir() { const a = Math.PI / 4 + (this.yawCur || 0), h = Math.SQRT2; return new THREE.Vector3(h * Math.cos(a), this.tiltCur || 0.78, h * Math.sin(a)).normalize(); }
  refit() { const dir = this.camDir(); fitOrtho(this.cam, this.camBox || this.box3, this.cv.width / this.cv.height, dir, this.mini ? 0.03 : 0.025); this.stat.orient(dir); if (this.zp) this.zp.capture(); }
  stepCamera(dt) {
    if (!this.zp) return; const v = this.zp.v, ty = v.yaw * Math.PI / 2;
    if (Math.abs(ty - this.yawCur) > 0.002 || Math.abs(v.tilt - this.tiltCur) > 0.002) { const k = 1 - Math.exp(-dt * 7); this.yawCur += (ty - this.yawCur) * k; this.tiltCur += (v.tilt - this.tiltCur) * k; this.refit(); }
  }
  photo() {
    const c = document.createElement('canvas'); c.width = this.cv.width; c.height = this.cv.height; const x = c.getContext('2d'), g = x.createRadialGradient(c.width / 2, c.height * 0.3, 10, c.width / 2, c.height * 0.4, c.width * 0.7); g.addColorStop(0, '#14385a'); g.addColorStop(1, '#08111d'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); x.drawImage(this.cv, 0, 0);
    c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = this.tank.name.replace(/\W+/g, '-') + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
  }
  syncHero() {
    const h = S.heroes.find(x => x.tank === this.tank.id);
    if (!h) { if (this.hero) { this.root.remove(this.hero.group); this.hero.mat.dispose(); this.hero = null; } return; }
    if (this.hero && this.hero.id === h.id) return;
    if (this.hero) { this.root.remove(this.hero.group); this.hero.mat.dispose(); }
    const model = heroModel(h.kind), mat = fishMaterial(model, []), mesh = new THREE.Mesh(model.geo, mat), group = new THREE.Group();
    mesh.userData.heroId = h.id; group.add(mesh); this.root.add(group);
    const st = { x: this.W * 0.5, z: this.D * 0.5, y: this.WTR * 0.5, yaw: 0, pitch: 0, vx: 0, vy: 0, vz: 0, tx: 0, ty: 0, tz: 0, ph: 0, spd: model.L * 0.28, wait: 0, burst: 1 };
    st.tx = st.x; st.ty = st.y; st.tz = st.z; this.retarget(st, model.L);
    this.hero = { id: h.id, group, mesh, mat, model, st, f: { g: 1 }, kind: h.kind };
  }
  syncDecor() {
    const k = this.tank.slots.join(',');
    if (k === this.dkey) return; this.dkey = k;
    this.decor.forEach(d => this.root.remove(d)); this.decor = [];
    this.tank.slots.forEach((id, i) => {
      if (!id) return;
      const mod = decorModel(id), [fx, fz] = DECOR_POS[i], grp = new THREE.Group();
      const sway = DECOR_SWAY[id], mat = sway ? swayMaterial(mod.h, sway, i * 1.7) : plainMat();
      const m = new THREE.Mesh(mod.geo, mat); m.userData.mat = sway ? mat : null; grp.add(m);
      if (mod.glow) { const gm = new THREE.Mesh(mod.glow, glowMat()); grp.add(gm); }
      const ds = 1.35; grp.scale.setScalar(ds); grp.position.set(this.W * fx, FLOOR_Y - mod.minY * ds + (id === 'bubbles' ? 0 : -0.5), this.D * fz); grp.rotation.y = (i % 2 ? -0.5 : 0.35) + (id === 'ship' ? 0.3 : 0); grp.userData.id = id; grp.userData.sway = m;
      this.root.add(grp); this.decor.push(grp);
    });
  }
  syncFish() {
    const fs = this.fishList(), ids = new Set(fs.map(f => f.id));
    for (const [id, o] of this.fish) if (!ids.has(id)) { if (o.fx) o.fx.dispose(o.group); this.root.remove(o.group); o.mat.dispose(); this.fish.delete(id); }
    for (const f of fs) {
      const baby = f.g < 1, spId = baby ? '_baby' : f.sp, mods = baby ? [] : f.mods;
      let o = this.fish.get(f.id), sig = spId + '|' + mods.join(',');
      if (o && o.sig !== sig) { // a baby just grew up: reveal the real fish with a puff of bubbles
        if (o.baby && !baby) for (let i = 0; i < 16; i++) this.bubbles.push({ x: o.st.x + (Math.random() - 0.5) * 14, y: o.st.y + (Math.random() - 0.5) * 8, z: o.st.z + (Math.random() - 0.5) * 14, vy: 14 + Math.random() * 14 });
        if (o.fx) o.fx.dispose(o.group); this.root.remove(o.group); o.mat.dispose(); this.fish.delete(f.id); var prev = o.st; o = null;
      }
      if (!o) {
        const sp = SPECIES[spId], model = fishModel(spId, mods, modelLength(sp, sp.t)), mat = fishMaterial(model, mods), mesh = new THREE.Mesh(model.geo, mat), group = new THREE.Group();
        mesh.userData.fishId = f.id; group.add(mesh); this.root.add(group); const fx = mods.some(m => FX_DEF[m]) ? new FishFX(group, mods, model.L, this.mini) : null;
        const hs = hash(f.id + this.tank.id);
        const st = prev || { x: 12 + (hs % 1000) / 1000 * (this.W - 24), z: 12 + ((hs >>> 10) % 1000) / 1000 * (this.D - 24), y: 14 + ((hs >>> 5) % 1000) / 1000 * (this.WTR - 40), yaw: (hs % 628) / 100, pitch: 0, vx: 0, vy: 0, vz: 0, tx: 0, ty: 0, tz: 0, ph: (hs % 100) / 7, wait: 0, burst: 1 };
        st.spd = model.L * (0.42 + (hs % 40) / 100); prev = null;
        if (!st.tx && !st.ty) { st.tx = st.x; st.ty = st.y; st.tz = st.z; this.retarget(st, model.L); }
        o = { group, mesh, mat, model, st, sig, fx, baby }; this.fish.set(f.id, o);
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
    const arr = [...this.fish.values()].concat(this.hero ? [this.hero] : []);
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
      const sc = (o.baby ? 0.5 + 0.5 * Math.min(1, o.f.g) : 1) * (o.f.big || 1);
      o.group.position.set(s.x, s.y + Math.sin(s.ph * 0.5) * 0.4, s.z); o.group.rotation.y = s.yaw; o.group.rotation.x = Math.sin(s.ph * 0.5) * 0.03;
      o.mesh.rotation.z = s.pitch; o.group.scale.setScalar(sc);
      o.mat.userData.u.uPhase.value = s.ph; o.mat.userData.u.uTime.value = this.t; if (o.fx) o.fx.update(dt, L, this.fxScale);
      if (o === this.hero && (o.model.kind === 1 || o.model.kind === 2)) { o.group.rotation.y = s.ph * 0.05; o.mesh.rotation.z = 0; } o.mat.userData.u.uAmp.value = 0.28 + Math.min(0.7, (sp + Math.abs(s.vy)) / (L * 1.2));
    }
  }
  frame(dtReal) {
    if (!GL.init()) { const c = this.ctx; c.fillStyle = '#9fb3c8'; c.font = '16px sans-serif'; c.textAlign = 'center'; c.fillText('WebGL is required to display the aquarium', this.cv.width / 2, this.cv.height / 2); return; }
    if (this.key !== this.tank.type + '|' + this.tank.bg + '|' + this.tank.skin) this.rebuildStatic();
    this.fxScale = this.cv.height / 700;
    this.syncDecor(); this.syncFish(); this.syncHero();
    const dt = Math.min(0.05, dtReal); this.t += dt; this.stepCamera(dt);
    this.step(dt);
    for (const d of this.decor) { if (d.userData.sway && d.userData.sway.userData.mat) d.userData.sway.userData.mat.userData.u.uTime.value = this.t; if (d.userData.id === 'bubbles' && Math.random() < dt * 9) this.bubbles.push({ x: d.position.x + 16 + (Math.random() - 0.5) * 3, y: d.position.y + 11, z: d.position.z + 6 + (Math.random() - 0.5) * 3, vy: 14 + Math.random() * 10 }); }
    if (Math.random() < dt * (this.mini ? 1.5 : 4)) this.bubbles.push({ x: 8 + Math.random() * (this.W - 16), y: FLOOR_Y + 2, z: 8 + Math.random() * (this.D - 16), vy: 9 + Math.random() * 8 });
    this.bubbles = this.bubbles.filter(b => (b.y += b.vy * dt) < this.WTR - 1);
    if (!this.bub) { this.bub = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshBasicMaterial({ color: 0xe8f8ff, transparent: true, opacity: 0.75 }), 80); this.bub.frustumCulled = false; this.bub.renderOrder = 3; this.root.add(this.bub); this.dummy = new THREE.Object3D(); }
    this.bub.count = Math.min(80, this.bubbles.length);
    for (let i = 0; i < this.bub.count; i++) { const b = this.bubbles[i]; this.dummy.position.set(b.x + Math.sin(this.t * 3 + i) * 0.8, b.y, b.z); this.dummy.updateMatrix(); this.bub.setMatrixAt(i, this.dummy.matrix); }
    this.bub.instanceMatrix.needsUpdate = true;
    if (!this.mini) { const p = this.stat.surface.geometry.attributes.position, base = this.stat.base; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(this.t * 1.6 + base[i * 3] * 0.12 + base[i * 3 + 1] * 0.1) * 0.7); p.needsUpdate = true; }
    this.stat.shafts.forEach((s, i) => { s.material.opacity = 0.035 + 0.025 * (0.5 + 0.5 * Math.sin(this.t * 0.7 + i * 1.3)); s.position.x += Math.sin(this.t * 0.2 + i) * 0.03; });
    GL.size(this.cv.width, this.cv.height);
    GL.r.render(this.scene, this.cam);
    this.ctx.clearRect(0, 0, this.cv.width, this.cv.height); this.ctx.drawImage(GL.r.domElement, 0, 0);
    this.syncDirt(); this.drawDirt(dt); this.drawSel();
  }
  /* ---- dirty glass: smudges mirror the water quality, wipe them with the sponge ---- */
  syncDirt() {
    if (this.tank.id === 'home') return;
    const q = wqOf(this.tank), want = dirtCount(q);
    if (q >= 97) { if (this.blobs.length) this.blobs = []; return; }
    while (this.blobs.length + 1 <= want + 1e-6 && this.blobs.length < 90) {
      const algae = q < 10;
      this.blobs.push({ s: Math.random() < 0.5 ? 0 : 1, u: 0.05 + Math.random() * 0.9, v: 0.06 + Math.random() * 0.9, r: (algae ? 0.085 : 0.045) + Math.random() * (algae ? 0.05 : 0.045), hp: 1, ang: Math.random() * 3, algae, px: 0, py: 0, pr: 1 });
    }
  }
  drawDirt(dt) {
    const ctx = this.ctx, cv = this.cv;
    if (this.blobs.length) {
      const dir = this.camDir(), nx = dir.x > 0 ? this.W : 0, nz = dir.z > 0 ? this.D : 0, ppu = cv.width / (this.cam.right - this.cam.left), y0 = FLOOR_Y + 6, y1 = this.WTR - 6, v3 = new THREE.Vector3(), unit = Math.min(this.W, this.D);
      for (const b of this.blobs) {
        const y = y0 + b.v * (y1 - y0); if (b.s === 0) v3.set(nx, y, b.u * this.D); else v3.set(b.u * this.W, y, nz);
        v3.project(this.cam); b.px = (v3.x + 1) / 2 * cv.width; b.py = (1 - v3.y) / 2 * cv.height; b.pr = Math.max(3, b.r * unit * ppu);
        const col = b.algae ? '38,120,52' : '128,116,72', a = b.hp * (b.algae ? 0.8 : 0.6);
        ctx.save(); ctx.translate(b.px, b.py); ctx.rotate(b.ang); ctx.scale(1.35, 0.8);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, b.pr); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.55, `rgba(${col},${a * 0.55})`); g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, b.pr, 0, 6.3); ctx.fill(); ctx.restore();
      }
    }
    if (this.sparks.length) { this.sparks = this.sparks.filter(p => (p.t += dt) < 0.7); this.sparks.forEach(p => { ctx.globalAlpha = 1 - p.t / 0.7; ctx.fillStyle = '#e8fbff'; ctx.beginPath(); ctx.arc(p.x + p.vx * p.t, p.y + p.vy * p.t, p.r, 0, 6.3); ctx.fill(); }); ctx.globalAlpha = 1; }
  }
  /* wipe at a client position; returns how many smudges were removed */
  scrub(cx, cy, moved) {
    if (!this.blobs.length) return 0;
    const r = this.cv.getBoundingClientRect(), k = this.cv.width / r.width, x = (cx - r.left) * k, y = (cy - r.top) * (this.cv.height / r.height), rad = (30 + 8 * lab('sponge')) * k;
    for (const b of this.blobs) if (Math.hypot(b.px - x, b.py - y) < b.pr * 0.9 + rad) { b.hp -= Math.max(0.1, moved * k / (b.pr * 1.4 + 1)); for (let i = 0; i < 2; i++) this.sparks.push({ x: b.px + (Math.random() - 0.5) * b.pr, y: b.py + (Math.random() - 0.5) * b.pr, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 30, r: 1.5 + Math.random() * 2.5, t: 0 }); }
    const before = this.blobs.length; this.blobs = this.blobs.filter(b => b.hp > 0);
    const n = before - this.blobs.length; if (n) wipedSmudge(this.tank.id, this.blobs.length, n);
    return n;
  }
  drawSel() {
    if (this.mini || !UI.selFish) return; const o = this.fish.get(UI.selFish); if (!o) return;
    const ctx = this.ctx, cv = this.cv, v = o.group.position.clone().project(this.cam), x = (v.x + 1) / 2 * cv.width, y = (1 - v.y) / 2 * cv.height, ppu = cv.width / (this.cam.right - this.cam.left), r = Math.max(22, o.model.L * ppu * 0.62) * (1 + 0.06 * Math.sin(this.t * 6)), k = cv.height / 700;
    ctx.save(); ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 2.5 * k; ctx.shadowColor = '#ffcf40'; ctx.shadowBlur = 10 * k; ctx.setLineDash([7 * k, 5 * k]); ctx.lineDashOffset = -this.t * 30; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.72, 0, 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
    const ay = y - r * 0.72 - (10 + 4 * Math.sin(this.t * 5)) * k; ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.moveTo(x - 8 * k, ay - 12 * k); ctx.lineTo(x + 8 * k, ay - 12 * k); ctx.lineTo(x, ay); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  refresh(t, onFish, onHero) { this.tank = t; this.onFish = onFish; this.onHero = onHero; }
  dispose() { this.fish.forEach(o => o.mat.dispose()); }
}

const Scenes = {
  list: [], cache: new Map(), running: false, last: 0, n: 0,
  /* scenes survive re-renders of the page: a scene is re-attached to the new canvas instead of being rebuilt, so nothing resets */
  bind(onFish, onHero, onStoreFish) {
    const old = new Map(); this.list.forEach(sc => old.set(sc.skey, sc)); this.cache.forEach((sc, k) => { if (!old.has(k)) old.set(k, sc); }); this.cache.clear();
    const next = [], claim = (key, cv, refresh, make) => { let sc = old.get(key); if (sc) { old.delete(key); cv.replaceWith(sc.cv); refresh(sc); } else sc = make(); sc.skey = key; next.push(sc); return sc; };
    document.querySelectorAll('canvas.tankscene:not(.bossscene)').forEach(cv => {
      const t = getTank(cv.dataset.tank); if (!t) return; const mini = cv.dataset.mini === '1';
      claim('tank:' + t.id + ':' + t.type + ':' + (mini ? 1 : 0), cv, sc => sc.refresh(t, onFish, onHero), () => new TankScene3D(cv, t, mini, onFish, onHero));
    });
    document.querySelectorAll('canvas.storescene').forEach(cv => { if (typeof StoreScene === 'undefined') return; const onSlot = () => { UI.modal = { type: 'storeAdd' }; render(); }; claim('store', cv, sc => { sc.onFish = onStoreFish; sc.onSlot = onSlot; }, () => new StoreScene(cv, onStoreFish, onSlot)); });
    document.querySelectorAll('canvas.expscene').forEach(cv => { if (typeof ExpScene !== 'undefined') claim('exp', cv, sc => {}, () => new ExpScene(cv)); });
    document.querySelectorAll('canvas.showscene').forEach(cv => { if (typeof ShowScene !== 'undefined') claim('show', cv, sc => {}, () => new ShowScene(cv)); });
    document.querySelectorAll('canvas.campscene').forEach(cv => { if (typeof CampScene !== 'undefined') claim('camp', cv, sc => {}, () => new CampScene(cv)); });
    document.querySelectorAll('canvas.bossscene').forEach(cv => { const i = +cv.dataset.idx; claim('boss:' + i, cv, sc => {}, () => new BossScene(cv, i)); });
    document.querySelectorAll('canvas.homescene').forEach(cv => { if (typeof HomeScene === 'undefined') return; claim('home', cv, sc => {}, () => new HomeScene(cv)); });
    document.querySelectorAll('canvas.gardenscene').forEach(cv => { if (typeof GardenScene === 'undefined') return; claim('garden', cv, sc => {}, () => new GardenScene(cv)); });
    document.querySelectorAll('canvas.galleryscene').forEach(cv => { if (typeof GalleryScene === 'undefined') return; claim('gallery', cv, sc => {}, () => new GalleryScene(cv)); });
    old.forEach((sc, k) => { if (k === 'store' || k === 'home' || k === 'garden' || k === 'gallery' || k === 'exp' || k === 'show' || k === 'camp') this.cache.set(k, sc); else sc.dispose(); });
    this.list = next;
    if (!this.running) { this.running = true; requestAnimationFrame(t => Scenes.loop(t)); }
  },
  loop(now) {
    const dt = this.last ? (now - this.last) / 1000 : 0.016; this.last = now; this.n++;
    this.list.forEach((s, i) => {
      if (!s.cv.isConnected) return;
      const r = s.cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) { s.accum = 0; return; }
      if (s.mini === true) { s.accum = (s.accum || 0) + dt; if ((this.n + i) % 2) return; s.frame(s.accum); s.accum = 0; } else s.frame(dt);
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
const FISH_DIR = new THREE.Vector3(0.28, 0.45, 1).normalize();
function fishSVG(spId, mods, px) {
  const bucket = px <= 70 ? 150 : px <= 110 ? 230 : px <= 160 ? 340 : 520, h = Math.round(bucket * 0.66);
  const sp = SPECIES[spId], url = renderThumb('f' + spId + '|' + mods.join(',') + '|' + bucket, bucket, h, () => { const mdl = fishModel(spId, mods, modelLength(sp, sp.t)); const m = new THREE.Mesh(mdl.geo, plainMatFor(mdl, mods)); const g = new THREE.Group(); g.add(m); g.rotation.y = 0; return g; }, FISH_DIR, 0.04);
  const prism = mods.includes('prismatic') ? ' prism' : '';
  const dw = Math.round(px * (px <= 70 ? 1.15 : 1)), glows = mods.map(m => MODS[m].glow).filter(Boolean).slice(0, 2);
  const filter = glows.length ? `filter:${glows.map(g => `drop-shadow(0 0 4px ${g})`).join(' ')};` : '';
  return `<span class="fw${prism}"><img src="${url}" style="width:${dw}px;height:auto;${filter}" alt="" draggable="false"></span>`;
}
function plainMatFor(mdl, mods) { const m = fishMaterial(mdl, mods || []); m.userData.u.uTime.value = 2.35; m.userData.u.uAmp.value = 0.05; return m; }
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

function heroThumb(kind, px) {
  const h = Math.round(px * 0.8), url = renderThumb('hero' + kind + px, px, h, () => { const mdl = heroModel(kind), mat = fishMaterial(mdl, []); mat.userData.u.uTime.value = 2.3; mat.userData.u.uAmp.value = 0.1; const g = new THREE.Group(); g.add(new THREE.Mesh(mdl.geo, mat)); return g; }, FISH_DIR, 0.05);
  return `<img src="${url}" style="width:${px}px;height:auto" alt="" draggable="false">`;
}
