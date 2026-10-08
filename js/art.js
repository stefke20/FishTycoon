'use strict';
/* ===== Misc pixel art: UI icons, eggs, fish images for lists ===== */

/* Pixelated emoji (nav / generic icons): drawn tiny, hard-edged and posterised */
const _emojiCache = new Map();
function pxEmoji(e, size) {
  size = size || 44;
  const key = e + size;
  if (_emojiCache.has(key)) return _emojiCache.get(key);
  const N = 16, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const ctx = cv.getContext('2d');
  ctx.font = '13px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(e, N / 2, N / 2 + 1);
  const d = ctx.getImageData(0, 0, N, N);
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i + 3] < 110) { d.data[i + 3] = 0; continue; }
    d.data[i + 3] = 255;
    for (let k = 0; k < 3; k++) d.data[i + k] = Math.round(d.data[i + k] / 48) * 48;
  }
  ctx.putImageData(d, 0, 0);
  const html = `<img class="px" src="${cv.toDataURL()}" width="${size}" height="${size}" alt="" draggable="false">`;
  _emojiCache.set(key, html);
  return html;
}

/* 3D voxel egg, coloured per egg tier (rendered once and cached) */
const EGG_PALETTE = { 1: '#cbd5e1', 2: '#4cc9a0', 3: '#4d9fff', 4: '#b36bff', 5: '#ffb830' };
function eggArt(egg, size) { // egg type object or egg item
  const et = egg.n ? egg : eggType(egg), bred = !!egg.bred, px = size * 2;
  const url = renderThumb('egg' + et.id + bred + px, px, px, () => {
    const g = new VGrid(0.05), base = _hx(EGG_PALETTE[et.t]), spot = _hx(et.w === 'salt' ? '#2b86c8' : '#8a5a34');
    g.ell(0, 0, 0, 6, 8, 6, (x, y, z, dx, dy, dz) => {
      let c = base; const h = hash(et.id + x + ',' + y + ',' + z);
      if (bred ? (Math.floor((y + 12) / 3) % 2 === 0) : h % 6 === 0) c = mixC(c, spot, 0.55);
      return shadeC(c, dy * -0.1);
    });
    const grp = new THREE.Group(); grp.add(new THREE.Mesh(g.geometry(), plainMat())); return grp;
  }, ISO_DIR, 0.05);
  return `<img src="${url}" style="width:${size}px;height:${size}px;object-fit:contain" alt="" draggable="false">`;
}
