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

/* A fish picture for lists/cards. px ≈ desired width; scaled by whole pixels so it stays crisp. */
function fishSVG(spId, mods, px) {
  const cv = fishCanvas(spId, mods, 40, 0);
  const sc = Math.max(1, Math.round(px / 56)), glows = mods.map(m => MODS[m].glow).filter(Boolean).slice(0, 2);
  const filter = glows.length ? `filter:${glows.map(g => `drop-shadow(0 0 ${2 + sc}px ${g})`).join(' ')};` : '';
  const prism = mods.includes('prismatic') ? ' prism' : '';
  const key = spId + '|' + mods.join(',');
  if (!fishSVG.urls) fishSVG.urls = {};
  const url = fishSVG.urls[key] || (fishSVG.urls[key] = cv.toDataURL());
  return `<span class="fw${prism}"><img class="px" src="${url}" width="${cv.width * sc}" height="${cv.height * sc}" style="${filter}" alt="" draggable="false"></span>`;
}

/* Pixel egg sprite, coloured per egg tier */
const EGG_PALETTE = { 1: '#cbd5e1', 2: '#4cc9a0', 3: '#4d9fff', 4: '#b36bff', 5: '#ffb830' };
function eggArt(egg, size) { // egg type object or egg item
  const et = egg.n ? egg : eggType(egg), bred = egg.bred;
  const key = 'egg' + et.id + (bred ? 'b' : '') + size;
  if (_emojiCache.has(key)) return _emojiCache.get(key);
  const N = 16, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(N, N);
  const base = _hx(EGG_PALETTE[et.t]), spot = _hx(et.w === 'salt' ? '#2b86c8' : '#8a5a34');
  const S2 = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const ry = y < 7 ? 6.4 : 7.4, d = ((x + 0.5 - 8) / 5.4) ** 2 + ((y + 0.5 - 8.2) / ry) ** 2;
    if (d <= 1) S2[y * N + x] = 1;
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!S2[y * N + x]) continue;
    const dx = (x + 0.5 - 8) / 5.4, dy = (y + 0.5 - 8.2) / 7;
    let c = base;
    const sp = (hash(et.id + Math.floor(x / 2) + ',' + Math.floor(y / 2)) % 5 === 0) && !bred;
    if (sp || (bred && (x + y) % 5 === 0)) c = mixC(c, spot, 0.55);
    const l = -(dx * 0.6 + dy * 0.8);
    c = shadeC(c, Math.floor(l * 4 + BAYER[y & 3][x & 3] * 0.8 + 0.5) / 4 * 0.38);
    const edge = !S2[y * N + x - 1] || !S2[y * N + x + 1] || !S2[(y - 1) * N + x] || !S2[(y + 1) * N + x];
    if (edge) c = shadeC(c, -0.55);
    const i = (y * N + x) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
  }
  // glint
  [[5, 5], [5, 6], [6, 5]].forEach(([x, y]) => { const i = (y * N + x) * 4; if (img.data[i + 3]) { img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255; } });
  ctx.putImageData(img, 0, 0);
  const html = `<img class="px" src="${cv.toDataURL()}" width="${size}" height="${size}" alt="" draggable="false">`;
  _emojiCache.set(key, html);
  return html;
}

function bgIcon(id, w) {
  const cv = wallArt(id, 48, 32, false);
  return `<img class="px" src="${cv.toDataURL()}" style="width:${w || 56}px;border:2px solid #04101b" alt="" draggable="false">`;
}
/* icon for any decor item (sprite for objects, mini wall for backgrounds) */
function decorPic(d, size) { return d.k === 'bg' ? bgIcon(d.id, size) : decorIcon(d.id, size); }
