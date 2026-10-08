'use strict';
/* ===== Procedural pixel-art fish: anatomy-based (body profile, rayed fins, gills, eyes, scales) ===== */

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const _hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/* hue-shifted shading: shadows go cool/dark, highlights go warm/light */
const shadeC = (c, f) => f >= 0 ? mixC(c, [255, 244, 214], f) : mixC(c, [14, 18, 56], -f);
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map(r => r.map(v => v / 16 - 0.5));
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const vnoise = (x, y, s) => { // smooth value noise in [0,1]
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const r = (i, j) => (hash(s + ':' + i + ',' + j) % 1000) / 1000;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return (r(xi, yi) * (1 - u) + r(xi + 1, yi) * u) * (1 - v) + (r(xi, yi + 1) * (1 - u) + r(xi + 1, yi + 1) * u) * v;
};

/* ---- archetypes. Lengths are fractions of body length L. r = length / body height. ---- */
const T = (k, len, sp, o) => Object.assign({ k, len, sp }, o || {});
const F = (k, u1, u2, h, ap, o) => Object.assign({ k, u1, u2, h, ap: ap == null ? 0.5 : ap }, o || {});
const ARCHS = {
  round:     { r: 1.9, pm: 0.52, ped: 0.2, top: 0.5, tail: T('round', 0.34, 0.26), dor: [F('sail', 0.3, 0.72, 0.16, 0.45)], anal: F('tri', 0.22, 0.4, 0.1, 0.4), pelv: { u: 0.58, len: 0.16 }, pect: { u: 0.7, len: 0.17 }, eye: { u: 0.84, r: 0.05 } },
  goldfish:  { r: 1.7, pm: 0.5, ped: 0.2, top: 0.52, tail: T('fan2', 0.5, 0.34), dor: [F('sail', 0.25, 0.7, 0.24, 0.35)], anal: F('tri', 0.2, 0.36, 0.14, 0.4), pelv: { u: 0.58, len: 0.2 }, pect: { u: 0.7, len: 0.2 }, eye: { u: 0.83, r: 0.055 }, scales: 1 },
  comet:     { r: 2.5, pm: 0.5, ped: 0.2, top: 0.5, tail: T('fan', 0.75, 0.3), dor: [F('sail', 0.3, 0.7, 0.2, 0.35)], anal: F('tri', 0.2, 0.36, 0.1, 0.4), pelv: { u: 0.58, len: 0.16 }, pect: { u: 0.7, len: 0.2 }, eye: { u: 0.85, r: 0.05 }, scales: 1 },
  ranchu:    { r: 1.25, pm: 0.55, ped: 0.3, top: 0.5, tail: T('fan', 0.4, 0.3, { wav: 1 }), dor: [], anal: F('tri', 0.15, 0.3, 0.1, 0.4), pelv: { u: 0.55, len: 0.16 }, pect: { u: 0.7, len: 0.2 }, eye: { u: 0.86, r: 0.06, dy: -0.02 }, hump: 0.12, scales: 1 },
  guppy:     { r: 3.4, pm: 0.5, ped: 0.22, top: 0.5, tail: T('delta', 0.5, 0.3), dor: [F('sail', 0.3, 0.55, 0.18, 0.7)], anal: F('tri', 0.3, 0.45, 0.07, 0.5), pelv: { u: 0.55, len: 0.1 }, pect: { u: 0.72, len: 0.12 }, eye: { u: 0.88, r: 0.055 } },
  swordtail: { r: 3.4, pm: 0.52, ped: 0.22, top: 0.5, tail: T('delta', 0.35, 0.2, { sword: 0.35 }), dor: [F('sail', 0.3, 0.55, 0.16, 0.6)], anal: F('tri', 0.3, 0.45, 0.07, 0.5), pelv: { u: 0.55, len: 0.1 }, pect: { u: 0.72, len: 0.12 }, eye: { u: 0.88, r: 0.05 } },
  platy:     { r: 2.4, pm: 0.5, ped: 0.24, top: 0.5, tail: T('round', 0.3, 0.24), dor: [F('sail', 0.3, 0.6, 0.15, 0.5)], anal: F('tri', 0.25, 0.4, 0.08, 0.5), pelv: { u: 0.55, len: 0.1 }, pect: { u: 0.72, len: 0.14 }, eye: { u: 0.86, r: 0.055 } },
  tetra:     { r: 3.5, pm: 0.45, ped: 0.2, top: 0.5, tail: T('fork', 0.28, 0.2), dor: [F('tri', 0.38, 0.55, 0.14, 0.4)], anal: F('sail', 0.18, 0.5, 0.08, 0.4), pelv: { u: 0.55, len: 0.09 }, pect: { u: 0.72, len: 0.1 }, eye: { u: 0.86, r: 0.07 }, scales: 1 },
  betta:     { r: 2.7, pm: 0.45, ped: 0.22, top: 0.5, tail: T('flow', 0.7, 0.5), dor: [F('flow', 0.25, 0.55, 0.3, 0.3)], anal: F('flow', 0.12, 0.5, 0.34, 0.35), pelv: { u: 0.62, len: 0.3, thread: 1 }, pect: { u: 0.72, len: 0.12 }, eye: { u: 0.88, r: 0.05 } },
  angel:     { r: 1.2, pm: 0.5, ped: 0.15, top: 0.5, tail: T('fork', 0.3, 0.3, { flat: 1 }), dor: [F('tri', 0.15, 0.78, 0.5, 0.18)], anal: F('tri', 0.15, 0.78, 0.5, 0.18), pelv: { u: 0.65, len: 0.5, thread: 1 }, pect: { u: 0.7, len: 0.14 }, eye: { u: 0.84, r: 0.05 }, stripeFins: 1 },
  marangel:  { r: 1.25, pm: 0.52, ped: 0.15, top: 0.5, tail: T('round', 0.32, 0.3), dor: [F('sail', 0.2, 0.76, 0.32, 0.2, { trail: 1 })], anal: F('sail', 0.2, 0.74, 0.3, 0.2, { trail: 1 }), pelv: { u: 0.65, len: 0.22 }, pect: { u: 0.7, len: 0.16 }, eye: { u: 0.85, r: 0.05 }, spineGill: 1 },
  gourami:   { r: 1.9, pm: 0.5, ped: 0.15, top: 0.5, tail: T('round', 0.3, 0.28), dor: [F('sail', 0.18, 0.55, 0.16, 0.5)], anal: F('sail', 0.12, 0.62, 0.2, 0.5), pelv: { u: 0.66, len: 0.45, thread: 1 }, pect: { u: 0.7, len: 0.12 }, eye: { u: 0.85, r: 0.055 }, scales: 1 },
  discus:    { r: 1.05, pm: 0.5, ped: 0.16, top: 0.5, tail: T('round', 0.2, 0.22), dor: [F('sail', 0.22, 0.75, 0.1, 0.6)], anal: F('sail', 0.22, 0.75, 0.1, 0.6), pelv: { u: 0.65, len: 0.12 }, pect: { u: 0.68, len: 0.12 }, eye: { u: 0.84, r: 0.05 } },
  cichlid:   { r: 1.85, pm: 0.55, ped: 0.2, top: 0.5, tail: T('round', 0.3, 0.24), dor: [F('spiny', 0.15, 0.78, 0.15, 0.6)], anal: F('sail', 0.18, 0.5, 0.12, 0.4), pelv: { u: 0.6, len: 0.2 }, pect: { u: 0.7, len: 0.17 }, eye: { u: 0.85, r: 0.055 }, scales: 1 },
  flowerhorn:{ r: 1.7, pm: 0.55, ped: 0.2, top: 0.5, tail: T('round', 0.32, 0.26), dor: [F('spiny', 0.15, 0.76, 0.18, 0.6)], anal: F('sail', 0.18, 0.5, 0.14, 0.4), pelv: { u: 0.6, len: 0.2 }, pect: { u: 0.7, len: 0.17 }, eye: { u: 0.86, r: 0.05, dy: 0.0 }, hump: 0.2, scales: 1 },
  piranha:   { r: 1.65, pm: 0.52, ped: 0.15, top: 0.5, tail: T('fork', 0.3, 0.3), dor: [F('tri', 0.38, 0.62, 0.2, 0.4)], anal: F('sail', 0.2, 0.55, 0.12, 0.5), pelv: { u: 0.62, len: 0.12 }, pect: { u: 0.7, len: 0.15 }, eye: { u: 0.86, r: 0.06 }, teeth: 1, scales: 1 },
  arowana:   { big: 1.2, r: 3.9, pm: 0.55, ped: 0.35, top: 0.45, tail: T('round', 0.22, 0.16), dor: [F('sail', 0.08, 0.32, 0.1, 0.5)], anal: F('sail', 0.08, 0.6, 0.09, 0.5), pelv: { u: 0.55, len: 0.1 }, pect: { u: 0.74, len: 0.1 }, eye: { u: 0.9, r: 0.04, dy: 0.02 }, barbels: 2, scales: 2, upmouth: 1 },
  snakehead: { big: 1.2, r: 4.6, pm: 0.6, ped: 0.45, top: 0.5, tail: T('round', 0.16, 0.12), dor: [F('ribbon', 0.12, 0.85, 0.07, 0.5)], anal: F('ribbon', 0.12, 0.6, 0.06, 0.5), pelv: { u: 0.6, len: 0.07 }, pect: { u: 0.76, len: 0.09 }, eye: { u: 0.9, r: 0.035 }, scales: 2 },
  gar:       { big: 1.3, r: 6.5, pm: 0.55, ped: 0.45, top: 0.5, tail: T('round', 0.14, 0.1), dor: [F('sail', 0.12, 0.26, 0.05, 0.5)], anal: F('sail', 0.12, 0.26, 0.05, 0.5), pelv: { u: 0.45, len: 0.05 }, pect: { u: 0.7, len: 0.06 }, eye: { u: 0.84, r: 0.025 }, beak: 0.22, scales: 2 },
  koi:       { r: 3, pm: 0.52, ped: 0.26, top: 0.5, tail: T('fork', 0.34, 0.22), dor: [F('sail', 0.32, 0.64, 0.12, 0.35)], anal: F('tri', 0.2, 0.34, 0.07, 0.4), pelv: { u: 0.58, len: 0.1 }, pect: { u: 0.72, len: 0.12 }, eye: { u: 0.88, r: 0.04 }, barbels: 2, scales: 2 },
  catfish:   { big: 1.1, r: 3.3, pm: 0.62, ped: 0.3, top: 0.55, tail: T('fork', 0.28, 0.2), dor: [F('tri', 0.6, 0.76, 0.22, 0.5)], anal: F('sail', 0.15, 0.45, 0.09, 0.5), pelv: { u: 0.5, len: 0.08 }, pect: { u: 0.72, len: 0.14 }, eye: { u: 0.86, r: 0.03, dy: -0.03 }, barbels: 4 },
  dragon:    { big: 1.25, r: 4.4, pm: 0.58, ped: 0.35, top: 0.5, tail: T('flow', 0.38, 0.18), dor: [F('flow', 0.1, 0.8, 0.12, 0.5)], anal: F('sail', 0.08, 0.5, 0.08, 0.5), pelv: { u: 0.55, len: 0.1 }, pect: { u: 0.74, len: 0.16 }, eye: { u: 0.9, r: 0.04 }, barbels: 2, scales: 2 },
  eel:       { big: 1.35, r: 7, pm: 0.7, ped: 0.55, top: 0.5, tail: T('round', 0.1, 0.07), dor: [F('ribbon', 0.04, 0.8, 0.03, 0.5)], anal: F('ribbon', 0.04, 0.9, 0.06, 0.5), pelv: { u: 0.6, len: 0.0 }, pect: { u: 0.8, len: 0.06 }, eye: { u: 0.93, r: 0.022 } },
  moray:     { big: 1.3, r: 5.4, pm: 0.8, ped: 0.6, top: 0.52, tail: T('round', 0.1, 0.09), dor: [F('ribbon', 0.0, 0.88, 0.07, 0.5)], anal: F('ribbon', 0.0, 0.7, 0.05, 0.5), pelv: { u: 0.6, len: 0.0 }, pect: { u: 0.8, len: 0.0 }, eye: { u: 0.9, r: 0.026 }, teeth: 1 },
  puffer:    { r: 1.2, pm: 0.5, ped: 0.15, top: 0.5, tail: T('round', 0.18, 0.12), dor: [F('sail', 0.28, 0.4, 0.09, 0.5)], anal: F('sail', 0.28, 0.4, 0.09, 0.5), pelv: { u: 0.6, len: 0.0 }, pect: { u: 0.7, len: 0.14 }, eye: { u: 0.82, r: 0.065 }, spikes: 0, lips: 1 },
  urchin:    { r: 1.2, pm: 0.5, ped: 0.15, top: 0.5, tail: T('round', 0.18, 0.12), dor: [F('sail', 0.28, 0.4, 0.09, 0.5)], anal: F('sail', 0.28, 0.4, 0.09, 0.5), pelv: { u: 0.6, len: 0.0 }, pect: { u: 0.7, len: 0.14 }, eye: { u: 0.82, r: 0.065 }, spikes: 1, lips: 1 },
  opah:      { r: 1.12, pm: 0.5, ped: 0.12, top: 0.5, tail: T('lunate', 0.28, 0.26), dor: [F('sail', 0.35, 0.65, 0.2, 0.4, { col: 'fin' })], anal: F('sail', 0.3, 0.55, 0.12, 0.4, { col: 'fin' }), pelv: { u: 0.62, len: 0.2 }, pect: { u: 0.68, len: 0.3 }, eye: { u: 0.85, r: 0.06 } },
  tang:      { r: 1.5, pm: 0.5, ped: 0.15, top: 0.5, tail: T('lunate', 0.3, 0.26), dor: [F('sail', 0.12, 0.8, 0.14, 0.5)], anal: F('sail', 0.12, 0.7, 0.12, 0.5), pelv: { u: 0.62, len: 0.1 }, pect: { u: 0.7, len: 0.16 }, eye: { u: 0.86, r: 0.05 }, scales: 1 },
  moorish:   { r: 1.3, pm: 0.5, ped: 0.14, top: 0.5, tail: T('round', 0.25, 0.2), dor: [F('whip', 0.35, 0.7, 0.55, 0.3)], anal: F('sail', 0.2, 0.55, 0.14, 0.4), pelv: { u: 0.62, len: 0.12 }, pect: { u: 0.7, len: 0.12 }, eye: { u: 0.82, r: 0.05 }, snout: 0.16 },
  trigger:   { r: 1.7, pm: 0.5, ped: 0.2, top: 0.5, tail: T('round', 0.3, 0.24), dor: [F('tri', 0.66, 0.78, 0.14, 0.5), F('sail', 0.12, 0.55, 0.12, 0.5)], anal: F('sail', 0.12, 0.55, 0.12, 0.5), pelv: { u: 0.6, len: 0.07 }, pect: { u: 0.7, len: 0.1 }, eye: { u: 0.84, r: 0.05, dy: -0.04 }, scales: 1 },
  clown:     { r: 2.2, pm: 0.52, ped: 0.22, top: 0.5, tail: T('round', 0.26, 0.2), dor: [F('sail', 0.3, 0.8, 0.14, 0.4)], anal: F('sail', 0.22, 0.4, 0.08, 0.5), pelv: { u: 0.6, len: 0.1 }, pect: { u: 0.74, len: 0.14 }, eye: { u: 0.86, r: 0.055 }, outlineFins: 1 },
  lionfish:  { r: 2.0, pm: 0.5, ped: 0.2, top: 0.5, tail: T('round', 0.28, 0.2), dor: [F('spiny', 0.12, 0.78, 0.48, 0.6, { rays: 10 })], anal: F('spiny', 0.18, 0.5, 0.2, 0.5, { rays: 4 }), pelv: { u: 0.6, len: 0.2 }, pect: { u: 0.7, len: 0.3, wide: 1 }, eye: { u: 0.86, r: 0.05 }, barbels: 1 },
  mandarin:  { r: 2.8, pm: 0.5, ped: 0.2, top: 0.5, tail: T('round', 0.3, 0.22), dor: [F('sail', 0.2, 0.6, 0.2, 0.4)], anal: F('sail', 0.2, 0.45, 0.1, 0.5), pelv: { u: 0.6, len: 0.1 }, pect: { u: 0.72, len: 0.22, wide: 1 }, eye: { u: 0.87, r: 0.06 } },
  cardinal:  { r: 2.1, pm: 0.52, ped: 0.2, top: 0.5, tail: T('fork', 0.26, 0.2), dor: [F('tri', 0.5, 0.65, 0.15, 0.5), F('sail', 0.15, 0.4, 0.1, 0.5)], anal: F('sail', 0.15, 0.5, 0.1, 0.5), pelv: { u: 0.6, len: 0.08 }, pect: { u: 0.72, len: 0.1 }, eye: { u: 0.84, r: 0.075 }, scales: 1 },
  anthias:   { r: 3.0, pm: 0.5, ped: 0.2, top: 0.5, tail: T('fork', 0.34, 0.26, { lobes: 1 }), dor: [F('sail', 0.2, 0.7, 0.14, 0.7)], anal: F('sail', 0.2, 0.5, 0.08, 0.5), pelv: { u: 0.6, len: 0.12 }, pect: { u: 0.72, len: 0.12 }, eye: { u: 0.86, r: 0.06 }, scales: 1 },
  firefish:  { r: 3.4, pm: 0.5, ped: 0.18, top: 0.5, tail: T('round', 0.24, 0.17), dor: [F('whip', 0.55, 0.7, 0.5, 0.5)], anal: F('sail', 0.22, 0.5, 0.07, 0.5), pelv: { u: 0.6, len: 0.07 }, pect: { u: 0.74, len: 0.1 }, eye: { u: 0.88, r: 0.06 } },
  blenny:    { r: 4.4, pm: 0.7, ped: 0.4, top: 0.52, tail: T('round', 0.2, 0.14), dor: [F('sail', 0.05, 0.8, 0.12, 0.7)], anal: F('sail', 0.1, 0.5, 0.07, 0.5), pelv: { u: 0.68, len: 0.07 }, pect: { u: 0.76, len: 0.12 }, eye: { u: 0.86, r: 0.06, dy: -0.07 }, crest: 0.1 },
  wrasse:    { r: 3.2, pm: 0.5, ped: 0.22, top: 0.5, tail: T('round', 0.28, 0.2), dor: [F('sail', 0.15, 0.8, 0.12, 0.5)], anal: F('sail', 0.15, 0.55, 0.1, 0.5), pelv: { u: 0.6, len: 0.1 }, pect: { u: 0.72, len: 0.14 }, eye: { u: 0.85, r: 0.045 }, lips: 1, scales: 2 },
  napoleon:  { r: 2.6, pm: 0.55, ped: 0.22, top: 0.5, tail: T('round', 0.28, 0.2), dor: [F('sail', 0.12, 0.72, 0.1, 0.5)], anal: F('sail', 0.12, 0.55, 0.09, 0.5), pelv: { u: 0.6, len: 0.1 }, pect: { u: 0.72, len: 0.14 }, eye: { u: 0.82, r: 0.04 }, lips: 1, hump: 0.16, scales: 2 },
  parrot:    { r: 2.1, pm: 0.55, ped: 0.22, top: 0.5, tail: T('lunate', 0.3, 0.2), dor: [F('sail', 0.12, 0.76, 0.12, 0.5)], anal: F('sail', 0.12, 0.6, 0.1, 0.5), pelv: { u: 0.6, len: 0.1 }, pect: { u: 0.72, len: 0.16 }, eye: { u: 0.85, r: 0.05 }, beakTeeth: 1, scales: 2 },
  seadragon: { big: 1.3, r: 5.2, pm: 0.45, ped: 0.4, top: 0.5, tail: T('round', 0.12, 0.08), dor: [F('ribbon', 0.35, 0.65, 0.07, 0.5)], anal: null, pelv: { u: 0.6, len: 0 }, pect: { u: 0.78, len: 0.1 }, eye: { u: 0.9, r: 0.03 }, leaf: 1, snout: 0.2 },
  anglerfish:{ r: 1.35, pm: 0.5, ped: 0.15, top: 0.5, tail: T('round', 0.22, 0.2), dor: [F('sail', 0.2, 0.5, 0.15, 0.5)], anal: F('sail', 0.2, 0.5, 0.12, 0.5), pelv: { u: 0.6, len: 0.0 }, pect: { u: 0.7, len: 0.16 }, eye: { u: 0.83, r: 0.04, dy: -0.05 }, lure: 1, teeth: 2, bigmouth: 1 },
  sturgeon:  { big: 1.3, r: 5, pm: 0.55, ped: 0.3, top: 0.55, tail: T('fork', 0.3, 0.2), dor: [F('tri', 0.12, 0.3, 0.1, 0.4)], anal: F('tri', 0.1, 0.24, 0.08, 0.4), pelv: { u: 0.4, len: 0.07 }, pect: { u: 0.7, len: 0.14 }, eye: { u: 0.88, r: 0.03 }, barbels: 4, snout: 0.24, scutes: 1 },
  barracuda: { big: 1.3, r: 7, pm: 0.6, ped: 0.3, top: 0.5, tail: T('fork', 0.26, 0.18), dor: [F('tri', 0.5, 0.6, 0.07, 0.5), F('tri', 0.1, 0.22, 0.07, 0.5)], anal: F('tri', 0.1, 0.22, 0.06, 0.5), pelv: { u: 0.5, len: 0.05 }, pect: { u: 0.76, len: 0.07 }, eye: { u: 0.9, r: 0.03 }, teeth: 1, scales: 2 },
  marlin:    { big: 1.35, r: 5, pm: 0.55, ped: 0.25, top: 0.5, tail: T('lunate', 0.3, 0.3), dor: [F('sail', 0.2, 0.86, 0.28, 0.25)], anal: F('tri', 0.12, 0.3, 0.1, 0.5), pelv: { u: 0.62, len: 0.14 }, pect: { u: 0.72, len: 0.16 }, eye: { u: 0.84, r: 0.03 }, beak: 0.32 },
  hammer:    { big: 1.3, r: 4.6, pm: 0.55, ped: 0.25, top: 0.5, tail: T('lunate', 0.34, 0.3), dor: [F('tri', 0.32, 0.58, 0.3, 0.35)], anal: F('tri', 0.12, 0.24, 0.08, 0.4), pelv: { u: 0.48, len: 0.08 }, pect: { u: 0.68, len: 0.28, wide: 1 }, eye: { u: 0.97, r: 0.035 }, hammer: 1 },
  grouper:   { r: 1.85, pm: 0.52, ped: 0.2, top: 0.5, tail: T('round', 0.3, 0.24), dor: [F('spiny', 0.25, 0.8, 0.14, 0.5)], anal: F('sail', 0.2, 0.5, 0.1, 0.5), pelv: { u: 0.6, len: 0.12 }, pect: { u: 0.7, len: 0.17 }, eye: { u: 0.85, r: 0.05 }, bigmouth: 1, scales: 1 },
  oarfish:   { big: 1.5, r: 8, pm: 0.6, ped: 0.45, top: 0.5, tail: T('round', 0.1, 0.07), dor: [F('ribbon', 0.0, 0.95, 0.06, 0.5)], anal: null, pelv: { u: 0.6, len: 0.0 }, pect: { u: 0.8, len: 0.05 }, eye: { u: 0.92, r: 0.03 } },
};
const ARCH_OF = {
  goldfish: 'goldfish', minnow: 'tetra', comet: 'comet', guppy: 'guppy', platy: 'platy', swordtail: 'swordtail',
  betta: 'betta', neon: 'tetra', rasbora: 'tetra', angelfish: 'angel', molly: 'platy', dwarfgourami: 'gourami',
  discus: 'discus', oscar: 'cichlid', flowerhorn: 'flowerhorn', arowana: 'arowana', snakehead: 'snakehead', piranha: 'piranha',
  koi: 'koi', gourami: 'gourami', ranchu: 'ranchu', arapaima: 'arowana', redtail: 'catfish', gar: 'gar',
  celestialkoi: 'koi', jadedragon: 'dragon', phoenixbetta: 'betta', goldarowana: 'arowana', eel: 'eel',
  damsel: 'round', blenny: 'blenny', goby: 'tetra', cardinal: 'cardinal', anthias: 'anthias', firefish: 'firefish',
  clown: 'clown', yellowtang: 'tang', tomato: 'clown', gramma: 'anthias', chromis: 'cardinal', dottyback: 'tetra',
  bluetang: 'tang', mandarin: 'mandarin', flameangel: 'marangel', lionfish: 'lionfish', trigger: 'trigger', porcupine: 'urchin',
  moorish: 'moorish', emperor: 'marangel', queenangel: 'marangel', tuskfish: 'wrasse', wrasse: 'napoleon', moray: 'moray',
  seadragon: 'seadragon', anglerfish: 'anglerfish', parrot: 'parrot', royalangel: 'marangel', opah: 'opah',
  danio: 'tetra', mosquitofish: 'platy', cherrybarb: 'round', corydoras: 'catfish', jewel: 'cichlid', pike: 'snakehead', showa: 'koi', pacu: 'piranha', aurorad: 'discus', sturgeon: 'sturgeon', platinum: 'arowana',
  yellowtail: 'round', pajama: 'cardinal', cleaner: 'wrasse', sailfinblenny: 'blenny', powderblue: 'tang', grouper: 'grouper', frenchangel: 'marangel', barracuda: 'barracuda', hammerhead: 'hammer', oarfish: 'oarfish', marlin: 'marlin',
};
const archOf = sp => ARCHS[ARCH_OF[sp.id] || sp.sh] || ARCHS.round;

/* ---- helpers on archetype geometry (all in units of L; y down; nose at x=1, tail base at x=0) ---- */
function bodyProfile(A) {
  const b = 0.55, a = A.pm * b / (1 - A.pm), um = a / (a + b), norm = Math.pow(um, a) * Math.pow(1 - um, b), tot = 1 / A.r;
  const f = u => { if (u >= 1) return 0; if (u <= 0) return A.ped; return A.ped + (1 - A.ped) * Math.min(1, Math.pow(u, a) * Math.pow(1 - u, b) / norm); };
  const bump = (u, c, w) => Math.max(0, 1 - Math.abs(u - c) / w);
  return {
    top: u => tot * A.top * f(u) + (A.hump ? A.hump * bump(u, 0.86, 0.14) * (tot) : 0) + (A.crest ? A.crest * bump(u, 0.82, 0.09) : 0) - (A.beak ? 0.0 : 0),
    bot: u => tot * (1 - A.top) * f(u),
    tot,
  };
}
function finH(k, t, ap, o) { // free-edge height 0..1 at position t along base
  const bump = p => t < ap ? Math.pow(t / ap, p) : Math.pow(Math.max(0, (1 - t) / (1 - ap)), p * 1.5);
  switch (k) {
    case 'tri': return bump(1);
    case 'sail': return bump(0.55);
    case 'ribbon': return Math.min(1, t * 10, (1 - t) * 10) ** 0.6;
    case 'spiny': { const n = o.rays || 8, q = (t * n) % 1; return bump(0.8) * (q < 0.5 ? 1 : 0.62); }
    case 'flow': return bump(0.6) * (0.9 + 0.1 * Math.sin(t * 11));
    case 'whip': return t < ap ? Math.pow(t / ap, 0.9) : Math.pow(1 - (t - ap) / (1 - ap), 0.9) * 0.2 + 0.0; // long swept filament handled by shape
  }
  return bump(0.6);
}

function archSize(A, L) {
  const P = bodyProfile(A);
  let topExt = P.tot * A.top + (A.hump || 0) * P.tot + (A.crest || 0), botExt = P.tot * (1 - A.top);
  (A.dor || []).forEach(d => (topExt = Math.max(topExt, P.tot * A.top + d.h + 0.02)));
  if (A.lure) topExt += 0.35;
  if (A.leaf) { topExt += 0.08; botExt += 0.08; }
  if (A.anal) botExt = Math.max(botExt, P.tot * (1 - A.top) + A.anal.h + 0.02);
  if (A.pelv && A.pelv.len) botExt = Math.max(botExt, P.tot * (1 - A.top) + A.pelv.len * (A.pelv.thread ? 1 : 0.8));
  const sp = A.tail.sp * (A.tail.k === 'flow' ? 1 : 1);
  topExt = Math.max(topExt, sp + 0.03); botExt = Math.max(botExt, sp + 0.03 + (A.tail.sword || 0));
  if (A.spikes) { topExt += 0.05; botExt += 0.05; }
  const tailLen = A.tail.len + (A.tail.sword ? 0.0 : 0);
  return { w: Math.ceil(L * (tailLen + 1 + 0.12 + (A.beak || 0) * 0.0)) + 6, h: Math.ceil(L * (topExt + botExt)) + 6, ox: 3 + Math.round(L * tailLen), oy: 3 + Math.ceil(L * topExt) };
}

/* ---- modifier tints (applied to base colour before lighting so volume is preserved) ---- */
function modTint(m, c, u, v, x, y, fin) {
  switch (m) {
    case 'pearl': return mixC(c, [[255, 214, 245], [201, 244, 255], [255, 250, 220]][Math.floor((u * 5 + v * 3) % 3 + 3) % 3], 0.6);
    case 'spotted': return (hash('sp' + Math.floor(x / 3) + ',' + Math.floor(y / 3)) % 3 === 0 && (x % 3 < 2 && y % 3 < 2)) ? [250, 250, 250] : shadeC(c, -0.08);
    case 'striped': return (Math.floor(y / 2) % 2 === 0) ? shadeC(c, -0.55) : c;
    case 'dappled': return vnoise(u * 7, v * 5, 'dap') > 0.52 ? mixC(c, [255, 190, 222], 0.88) : c;
    case 'marbled': { const n = Math.abs(Math.sin((u * 6 + vnoise(u * 4, v * 4, 'mb') * 4) * 1.4)); return n < 0.16 ? mixC(c, [240, 240, 248], 0.85) : shadeC(mixC(c, [120, 124, 140], 0.25), -0.05); }
    case 'fiery': return mixC(c, v < 0.3 ? [255, 226, 110] : v < 0.62 ? [255, 130, 10] : [200, 28, 28], 0.78);
    case 'frosty': return (hash('fr' + x + ',' + y) % 17 === 0) ? [255, 255, 255] : mixC(c, v < 0.5 ? [232, 250, 255] : [110, 205, 255], 0.72);
    case 'golden': return mixC(c, v < 0.3 ? [255, 244, 170] : v < 0.7 ? [255, 196, 20] : [190, 130, 10], 0.82);
    case 'glowing': return mixC(c, ((u - 0.5) ** 2 + (v - 0.5) ** 2) < 0.1 ? [230, 255, 190] : [80, 230, 80], 0.72);
    case 'electric': return (hash('el' + x + ',' + y) % 9 === 0) ? [255, 255, 170] : mixC(c, [40, 120, 255], 0.6);
    case 'toxic': return mixC(c, vnoise(u * 5, v * 5, 'tx') > 0.5 ? [130, 225, 40] : [105, 40, 160], 0.7);
    case 'aurora': { const t = Math.sin((u * 5 + v * 2) * 1.3); return mixC(c, t > 0.2 ? [70, 255, 175] : t > -0.5 ? [120, 190, 255] : [190, 100, 255], 0.7); }
    case 'cosmic': return (hash('co' + x + ',' + y) % 15 === 0) ? [255, 255, 255] : (hash('cx' + x + ',' + y) % 31 === 0) ? [140, 200, 255] : mixC(c, vnoise(u * 4, v * 3, 'neb') > 0.55 ? [130, 45, 185] : [34, 12, 95], 0.82);
    case 'prismatic': return mixC(c, [[255, 80, 80], [255, 210, 70], [90, 255, 140], [80, 205, 255], [150, 90, 255], [255, 90, 215]][Math.floor(((u + v * 0.35) * 6 + 60) % 6)], 0.68);
    case 'shadow': return (hash('sh' + x + ',' + y) % 13 === 0) ? [170, 110, 255] : mixC(c, [20, 4, 36], 0.8);
    case 'celestial': return mixC(c, v < 0.5 ? [255, 250, 225] : [255, 226, 150], 0.78);
  }
  return c;
}

/* ---- pattern: returns {t: 0..1 blend toward secondary, dark: 0..1 outline darkening} ---- */
function patternAt(s, A, u, v, x, y) {
  const o = { t: 0, dark: 0 };
  switch (s.pt) {
    case 'stripes': {
      const n = s.id === 'neon' ? 0 : 1;
      const cu = u + 0.06 * (v - 0.5) * (v - 0.5) * 4;
      const wd = A.r < 1.6 ? 0.055 : 0.04;
      for (const c of [0.3, 0.46, 0.62]) if (Math.abs(cu - c) < wd) o.t = 1;
      break;
    }
    case 'band': {
      const cu = u + 0.05 * (v - 0.5) * (v - 0.5) * 4;
      for (const [c, w] of [[0.3, 0.06], [0.7, 0.05]]) { const d = Math.abs(cu - c); if (d < w) o.t = 1; else if (d < w + 0.022) o.dark = 1; }
      break;
    }
    case 'spots': {
      const gx = Math.floor(u * 11), gy = Math.floor(v * 5);
      const hh = hash(s.id + gx + ',' + gy);
      const cx = (gx + 0.3 + (hh % 40) / 80) / 11, cy = (gy + 0.3 + ((hh >> 6) % 40) / 80) / 5;
      if (((u - cx) * 11) ** 2 + ((v - cy) * 5) ** 2 < 0.22 && hh % 3 !== 0) o.t = 1;
      break;
    }
    case 'patch': {
      const n = vnoise(u * 3.2 + 1, v * 2.2, s.id) + 0.25 * vnoise(u * 8, v * 6, s.id + 'b');
      if (n > 0.64) o.t = 1;
      break;
    }
    case 'hstripes': { if (Math.floor(v * 7) % 2 === 1 && u > 0.06 && u < 0.9) o.t = 1; break; }
    case 'lateral': {
      if (v > 0.36 && v < 0.5 && u < 0.86) o.t = 0.01; // handled in colour step
      break;
    }
  }
  return o;
}

