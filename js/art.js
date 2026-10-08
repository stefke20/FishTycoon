'use strict';
/* ===== Procedural SVG fish ===== */

const SHAPES = {
  round: { b: [60, 40, 34, 26], tail: '28,40 4,16 10,40 4,64', dorsal: 'M40 16 Q58 -2 80 18 Z', vent: 'M50 64 Q62 78 74 62 Z', eye: [80, 34, 5] },
  slender: { b: [62, 40, 42, 16], tail: '24,40 2,22 8,40 2,58', dorsal: 'M50 26 Q64 12 80 27 Z', vent: 'M54 54 Q66 66 78 53 Z', eye: [92, 35, 4.5] },
  tall: { b: [58, 40, 26, 33], tail: '34,40 12,24 16,40 12,56', dorsal: 'M44 10 Q52 -8 76 16 Z', vent: 'M44 70 Q52 88 76 64 Z', eye: [72, 30, 5] },
  eel: { b: [62, 40, 50, 11], tail: '16,40 0,26 5,40 0,54', dorsal: 'M38 31 Q62 20 92 31 Z', vent: 'M44 49 Q62 58 82 49 Z', eye: [102, 37, 3.5] },
};

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function modOverlay(m, uid, b) {
  const [cx, cy, rx, ry] = b;
  const x0 = cx - rx, y0 = cy - ry, w = rx * 2, h = ry * 2;
  const grad = (id, stops, vert) => `<linearGradient id="${id}${uid}" x1="0" y1="0" x2="${vert ? 0 : 1}" y2="${vert ? 1 : 1}">${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"/>`).join('')}</linearGradient>`;
  const rect = (fill, op) => `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${fill}" opacity="${op}"/>`;
  const dots = (n, fill, r, op, seed) => {
    let s = '';
    for (let i = 0; i < n; i++) {
      const hx = hash(seed + i);
      s += `<circle cx="${(x0 + (hx % 1000) / 1000 * w).toFixed(1)}" cy="${(y0 + ((hx >> 10) % 1000) / 1000 * h).toFixed(1)}" r="${r}" fill="${fill}" opacity="${op}"/>`;
    }
    return s;
  };
  switch (m) {
    case 'pearl': return `<defs>${grad('pe', [[0, '#ffffff'], [0.35, '#ffd6f5'], [0.65, '#c9f4ff'], [1, '#ffffff']])}</defs>${rect(`url(#pe${uid})`, 0.5)}`;
    case 'spotted': return dots(9, '#ffffff', 2.6, 0.85, 'sp');
    case 'striped': return Array.from({ length: 5 }, (_, i) => `<rect x="${x0}" y="${y0 + 4 + i * (h / 5)}" width="${w}" height="${h / 14}" fill="#0b132b" opacity="0.35"/>`).join('');
    case 'dappled': return dots(7, '#ffe3f1', 5.5, 0.55, 'dp');
    case 'fiery': return `<defs>${grad('fi', [[0, '#ffe066'], [0.5, '#ff7b00'], [1, '#c1121f']], true)}</defs>${rect(`url(#fi${uid})`, 0.7)}`;
    case 'frosty': return `<defs>${grad('fr', [[0, '#ffffff'], [1, '#6fd3ff']], true)}</defs>${rect(`url(#fr${uid})`, 0.6)}${dots(7, '#fff', 1.8, 0.95, 'fr')}`;
    case 'golden': return `<defs>${grad('go', [[0, '#fff3b0'], [0.5, '#ffc300'], [1, '#b8860b']])}</defs>${rect(`url(#go${uid})`, 0.7)}`;
    case 'glowing': return `<defs><radialGradient id="gl${uid}"><stop offset="0" stop-color="#eaffc9"/><stop offset="1" stop-color="#4be04b"/></radialGradient></defs>${rect(`url(#gl${uid})`, 0.65)}`;
    case 'cosmic': return rect('#2b0a5c', 0.65) + dots(14, '#fff', 1.3, 0.95, 'co') + dots(3, '#9ad1ff', 2.2, 0.9, 'cx');
    case 'prismatic': return `<defs>${grad('pr', [[0, '#ff4d4d'], [0.2, '#ffd23f'], [0.4, '#4dff88'], [0.6, '#4dc9ff'], [0.8, '#8f4dff'], [1, '#ff4dd2']])}</defs>${rect(`url(#pr${uid})`, 0.6)}`;
    case 'shadow': return rect('#12001f', 0.6) + dots(6, '#a66bff', 3, 0.4, 'sh');
  }
  return '';
}

function speciesPattern(s, b, uid) {
  const [cx, cy, rx, ry] = b;
  const x0 = cx - rx, y0 = cy - ry, w = rx * 2, h = ry * 2;
  switch (s.pt) {
    case 'belly': return `<ellipse cx="${cx}" cy="${cy + ry * 0.75}" rx="${rx * 1.1}" ry="${ry * 0.55}" fill="${s.c2}" opacity="0.6"/>`;
    case 'stripes': return [0.28, 0.45, 0.62].map(f => `<rect x="${x0 + w * f}" y="${y0}" width="${w * 0.07}" height="${h}" fill="${s.c2}" opacity="0.85"/>`).join('');
    case 'spots': return [[0.3, 0.35], [0.5, 0.6], [0.6, 0.3], [0.75, 0.55], [0.4, 0.75], [0.2, 0.55]].map(p => `<circle cx="${x0 + w * p[0]}" cy="${y0 + h * p[1]}" r="${Math.max(2.5, ry * 0.18)}" fill="${s.c2}" opacity="0.9"/>`).join('');
    case 'band': return [0.22, 0.62].map(f => `<rect x="${x0 + w * f}" y="${y0}" width="${w * 0.13}" height="${h}" fill="${s.c2}" stroke="#1b1b1b" stroke-width="1.5"/>`).join('');
    case 'patch': return [[0.3, 0.3, 0.2, 0.28], [0.58, 0.62, 0.22, 0.3], [0.7, 0.28, 0.14, 0.2]].map(p => `<ellipse cx="${x0 + w * p[0]}" cy="${y0 + h * p[1]}" rx="${w * p[2]}" ry="${h * p[3]}" fill="${s.c2}" opacity="0.9"/>`).join('');
  }
  return '';
}

/* returns an html string (span wrapper + svg). px = rendered width */
function fishSVG(spId, mods, px, uid) {
  const s = SPECIES[spId], sh = SHAPES[s.sh], b = sh.b;
  uid = String(uid || hash(spId + mods.join()));
  const finC = (s.pt === 'none' || s.pt === 'belly' || s.pt === 'spots') ? s.c2 : s.c;
  const clip = `<clipPath id="cl${uid}"><ellipse cx="${b[0]}" cy="${b[1]}" rx="${b[2]}" ry="${b[3]}"/></clipPath>`;
  const glows = mods.map(m => MODS[m].glow).filter(Boolean).slice(0, 3);
  const filter = glows.length ? `filter:${glows.map(g => `drop-shadow(0 0 ${3 + glows.length}px ${g})`).join(' ')};` : '';
  const prism = mods.includes('prismatic') ? ' prism' : '';
  const svg = `<svg viewBox="0 -8 124 96" width="${px}" height="${Math.round(px * 96 / 124)}" style="${filter}" aria-hidden="true">
    <defs>${clip}</defs>
    <g fill="${finC}" stroke="rgba(0,0,0,.35)" stroke-width="1.2" stroke-linejoin="round" opacity="0.95">
      <polygon points="${sh.tail}"/><path d="${sh.dorsal}"/><path d="${sh.vent}"/>
    </g>
    <ellipse cx="${b[0]}" cy="${b[1]}" rx="${b[2]}" ry="${b[3]}" fill="${s.c}"/>
    <g clip-path="url(#cl${uid})">${speciesPattern(s, b, uid)}${mods.map(m => modOverlay(m, uid, b)).join('')}</g>
    <ellipse cx="${b[0]}" cy="${b[1]}" rx="${b[2]}" ry="${b[3]}" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="1.6"/>
    <circle cx="${sh.eye[0]}" cy="${sh.eye[1]}" r="${sh.eye[2]}" fill="#fff"/><circle cx="${sh.eye[0] + 1}" cy="${sh.eye[1]}" r="${sh.eye[2] * 0.52}" fill="#111"/>
  </svg>`;
  return `<span class="fw${prism}">${svg}</span>`;
}
