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
  goldfish:  { r: 1.7, pm: 0.5, ped: 0.2, top: 0.52, tail: T('fan', 0.5, 0.36), dor: [F('sail', 0.25, 0.7, 0.24, 0.35)], anal: F('tri', 0.2, 0.36, 0.14, 0.4), pelv: { u: 0.58, len: 0.2 }, pect: { u: 0.7, len: 0.2 }, eye: { u: 0.83, r: 0.055 }, scales: 1 },
  comet:     { r: 2.5, pm: 0.5, ped: 0.2, top: 0.5, tail: T('fan', 0.75, 0.3), dor: [F('sail', 0.3, 0.7, 0.2, 0.35)], anal: F('tri', 0.2, 0.36, 0.1, 0.4), pelv: { u: 0.58, len: 0.16 }, pect: { u: 0.7, len: 0.2 }, eye: { u: 0.85, r: 0.05 }, scales: 1 },
  ranchu:    { r: 1.25, pm: 0.55, ped: 0.3, top: 0.5, tail: T('fan', 0.4, 0.3, { wav: 1 }), dor: [], anal: F('tri', 0.15, 0.3, 0.1, 0.4), pelv: { u: 0.55, len: 0.16 }, pect: { u: 0.7, len: 0.2 }, eye: { u: 0.86, r: 0.06, dy: -0.02 }, hump: 0.12, scales: 1 },
  guppy:     { r: 3.4, pm: 0.5, ped: 0.22, top: 0.5, tail: T('delta', 0.62, 0.38), dor: [F('sail', 0.3, 0.55, 0.18, 0.7)], anal: F('tri', 0.3, 0.45, 0.07, 0.5), pelv: { u: 0.55, len: 0.1 }, pect: { u: 0.72, len: 0.12 }, eye: { u: 0.88, r: 0.055 } },
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
  lionfish:  { r: 2.0, pm: 0.5, ped: 0.2, top: 0.5, tail: T('round', 0.28, 0.2), dor: [F('spiny', 0.12, 0.78, 0.48, 0.6, { rays: 10 })], anal: F('spiny', 0.18, 0.5, 0.2, 0.5, { rays: 4 }), pelv: { u: 0.6, len: 0.2 }, pect: { u: 0.7, len: 0.42, wide: 1 }, eye: { u: 0.86, r: 0.05 }, barbels: 1 },
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
  ray:       { ray: 1, wing: 0.9, tail: 0.5 },
  manta:     { ray: 1, wing: 1.25, tail: 0.28, horns: 1 },
};
const ARCH_OF = {
  goldfish: 'goldfish', minnow: 'tetra', comet: 'comet', guppy: 'guppy', platy: 'platy', swordtail: 'swordtail',
  betta: 'betta', neon: 'tetra', rasbora: 'tetra', angelfish: 'angel', molly: 'platy', dwarfgourami: 'gourami',
  discus: 'discus', oscar: 'cichlid', flowerhorn: 'flowerhorn', arowana: 'arowana', snakehead: 'snakehead', piranha: 'piranha',
  koi: 'koi', gourami: 'gourami', ranchu: 'ranchu', arapaima: 'arowana', redtail: 'catfish', gar: 'gar',
  celestialkoi: 'koi', jadedragon: 'dragon', phoenixbetta: 'betta', goldarowana: 'arowana', stingray: 'ray', eel: 'eel',
  damsel: 'round', blenny: 'blenny', goby: 'tetra', cardinal: 'cardinal', anthias: 'anthias', firefish: 'firefish',
  clown: 'clown', yellowtang: 'tang', tomato: 'clown', gramma: 'anthias', chromis: 'cardinal', dottyback: 'tetra',
  bluetang: 'tang', mandarin: 'mandarin', flameangel: 'marangel', lionfish: 'lionfish', trigger: 'trigger', porcupine: 'urchin',
  moorish: 'moorish', emperor: 'marangel', queenangel: 'marangel', tuskfish: 'wrasse', wrasse: 'napoleon', moray: 'moray',
  seadragon: 'seadragon', mantaray: 'manta', anglerfish: 'anglerfish', parrot: 'parrot', royalangel: 'marangel', opah: 'opah',
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
  if (A.ray) return { w: Math.ceil(L * (1 + A.tail * 0.8)) + 4, h: Math.ceil(L * A.wing * 0.85) + 6 };
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
    case 'pearl': return mixC(c, [[255, 214, 245], [201, 244, 255], [255, 250, 220]][Math.floor((u * 5 + v * 3) % 3 + 3) % 3], 0.5);
    case 'spotted': return (hash('sp' + Math.floor(x / 3) + ',' + Math.floor(y / 3)) % 5 === 0 && (x % 3 < 2 && y % 3 < 2)) ? [255, 255, 255] : c;
    case 'striped': return (Math.floor(y / 2) % 3 === 0) ? shadeC(c, -0.4) : c;
    case 'dappled': return vnoise(u * 7, v * 5, 'dap') > 0.62 ? mixC(c, [255, 222, 240], 0.75) : c;
    case 'fiery': return mixC(c, v < 0.3 ? [255, 226, 110] : v < 0.62 ? [255, 130, 10] : [200, 28, 28], 0.72);
    case 'frosty': return (hash('fr' + x + ',' + y) % 23 === 0) ? [255, 255, 255] : mixC(c, v < 0.5 ? [232, 250, 255] : [110, 205, 255], 0.65);
    case 'golden': return mixC(c, v < 0.3 ? [255, 244, 170] : v < 0.7 ? [255, 196, 20] : [190, 130, 10], 0.75);
    case 'glowing': return mixC(c, ((u - 0.5) ** 2 + (v - 0.5) ** 2) < 0.1 ? [230, 255, 190] : [80, 230, 80], 0.68);
    case 'cosmic': return (hash('co' + x + ',' + y) % 19 === 0) ? [255, 255, 255] : (hash('cx' + x + ',' + y) % 41 === 0) ? [140, 200, 255] : mixC(c, vnoise(u * 4, v * 3, 'neb') > 0.55 ? [120, 40, 170] : [34, 12, 90], 0.78);
    case 'prismatic': return mixC(c, [[255, 80, 80], [255, 210, 70], [90, 255, 140], [80, 205, 255], [150, 90, 255], [255, 90, 215]][Math.floor(((u + v * 0.35) * 6 + 60) % 6)], 0.62);
    case 'shadow': return (hash('sh' + x + ',' + y) % 13 === 0) ? [170, 110, 255] : mixC(c, [20, 4, 36], 0.76);
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
    case 'lateral': {
      if (v > 0.36 && v < 0.5 && u < 0.86) o.t = 0.01; // handled in colour step
      break;
    }
  }
  return o;
}

/* ---- main sprite generator ---- */
const _fishCache = new Map();
function fishCanvas(spId, mods, L, frame) {
  const key = spId + '|' + mods.join(',') + '|' + L + '|' + frame;
  let c = _fishCache.get(key);
  if (c) return c;
  const A0 = archOf(SPECIES[spId]);
  c = renderFish(SPECIES[spId], mods, Math.round(L * (A0.big || 1)), frame);
  _fishCache.set(key, c);
  return c;
}

function renderFish(s, mods, L, frame) {
  const A = archOf(s);
  if (A.ray) return renderRay(s, A, mods, L, frame);
  const Z = archSize(A, L), W = Z.w, H = Z.h, ox = Z.ox, oy = Z.oy;
  const P = bodyProfile(A);
  const base = _hx(s.c), c2 = _hx(s.c2);
  const finPlain = (s.pt === 'none' || s.pt === 'belly' || s.pt === 'spots' || s.pt === 'lateral');
  let finC = finPlain ? mixC(c2, base, 0.3) : base;
  if (s.id === 'goldfish' || s.id === 'comet' || s.id === 'ranchu') finC = mixC(base, [255, 235, 190], 0.25);
  const belly = s.pt === 'belly' ? c2 : mixC(base, [255, 250, 235], 0.5);
  const sway = [0, 1, 0, -1][frame % 4] * 0.045; // tail bend amount (fraction of L)
  const px = L; // pixels per unit
  const cover = new Int8Array(W * H);   // 0 none 1 body 2 fin(back) 3 fin(front) 4 detail
  const col = new Array(W * H);
  const fy0 = {}; // helper

  const topAt = u => P.top(u), botAt = u => P.bot(u);
  const tail = A.tail, tlen = tail.len;
  const t_h0 = Math.max(0.02, Math.min(topAt(0) + botAt(0), 0.5)) / 2;

  /* tail geometry per column */
  const tailTest = (fx, fy) => {
    const t = -fx / tlen;
    if (t < 0 || t > 1) return null;
    const sw = sway * Math.pow(t, 1.4) * (tail.k === 'flow' ? 2 : 1) * (A.r < 2 ? 1.4 : 1);
    const y = fy - sw; // bend
    const h0 = t_h0, sp = tail.sp;
    let outer, inner = 0;
    switch (tail.k) {
      case 'fork': outer = h0 + (sp - h0) * Math.pow(t, 0.75); inner = t > 0.35 ? (t - 0.35) * sp * 1.25 : 0; if (t > 0.94) outer *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.94) / 0.06, 2))); break;
      case 'lunate': outer = h0 + (sp - h0) * Math.pow(t, 1.15); inner = t > 0.3 ? outer * Math.pow((t - 0.3) / 0.7, 0.9) * 0.92 : 0; break;
      case 'delta': outer = h0 + (sp - h0) * Math.pow(t, 0.85); break;
      case 'flow': { outer = (h0 + (sp - h0) * Math.pow(t, 0.55)) * (1 + 0.07 * Math.sin(t * 13 + frame * 0.8)); if (t > 0.85) outer *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.85) / 0.15, 2))); break; }
      case 'fan': { outer = h0 + (sp - h0) * Math.pow(t, 0.6); if (t > 0.78) outer *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.78) / 0.22, 2))); if (tail.wav) outer *= 1 + 0.08 * Math.sin(Math.abs(y) * 30 + t * 4); inner = t > 0.75 ? 0 : 0; break; }
      default: outer = t < 0.55 ? h0 + (sp - h0) * Math.pow(t / 0.55, 0.8) : sp * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.55) / 0.45, 2)));
    }
    if (tail.lobes && t > 0.5) { outer += 0.0; inner = Math.max(inner, 0.0); }
    const ay = Math.abs(y);
    if (ay > outer || ay < inner) return null;
    if (tail.k === 'fan' && t > 0.7 && inner === 0) {} // full fan
    return { t, y, ang: Math.atan2(y, -fx), edge: outer - ay };
  };

  const rayLine = (ang, n, t) => { const q = ((ang / Math.PI + 1) * n) % 1; return q < 0.22; };

  for (let py = 0; py < H; py++) for (let pxl = 0; pxl < W; pxl++) {
    const X = (pxl + 0.5 - ox) / px, Y = (py + 0.5 - oy) / px;
    const idx = py * W + pxl;
    let k = 0, info = null;

    // --- body ---
    let inBody = false, u = X;
    if (X >= 0 && X <= 1) {
      let tp = topAt(X), bt = botAt(X);
      if (A.spikes && (pxl % 3 === 0)) { tp += 1.4 / px; bt += 1.4 / px; }
      if (A.snout && X > 0.82) { const sn = 1 - (X - 0.82) / 0.18; tp *= Math.min(1, 0.45 + 0.55 * sn); bt *= Math.min(1, 0.45 + 0.55 * sn); }
      // slight vertical lift at snout for upturned mouths
      const yy = Y;
      if (yy >= -tp && yy <= bt) { inBody = true; info = { v: (yy + tp) / (tp + bt), tp, bt }; }
    }
    if (A.beak && X > 1 && X < 1 + A.beak) { // gar/long jaw: thin beak beyond the nose
      const bt = 0.022 * (1 - (X - 1) / A.beak * 0.6);
      if (Math.abs(Y - 0.01) < bt) { inBody = true; u = 1; info = { v: (Y + bt) / (2 * bt), tp: bt, bt }; }
    }
    if (inBody) { cover[idx] = 1; col[idx] = { u: Math.min(1, u), v: info.v, body: true, X, Y }; continue; }

    // --- fins (drawn behind body; first match wins among fins) ---
    let fin = null;
    // tail
    if (X < 0.02) {
      const tt = tailTest(X, Y);
      if (tt) fin = { k: 'tail', t: tt.t, ang: tt.ang, X, Y, edge: tt.edge };
    }
    // sword (swordtail lower lobe)
    if (!fin && tail.sword && X < 0.02 && X > -tlen - 0.1) {
      const t = -X / (tlen + 0.1), ys = 0.5 * (topAt(0) + botAt(0)) * 0 + (botAt(0)) * 0.6;
      if (Math.abs(Y - sway * 0.8 - (t_h0 * 0.9)) < 0.012) fin = { k: 'sword', t, ang: 0, X, Y };
    }
    // dorsal fins
    if (!fin) for (const d of (A.dor || [])) {
      if (X < d.u1 || X > d.u2) continue;
      const t = (X - d.u1) / (d.u2 - d.u1), tt = d.trail ? t : t;
      let h = d.h * finH(d.k === 'whip' ? 'tri' : d.k, t, d.ap, d);
      if (d.k === 'whip') { if (t < 0.5) h = d.h * Math.pow(1 - t * 0.2, 1) * 0.0; const w = 0.012; if (Math.abs(X - (d.u1 + 0.02 + (t) * 0.0)) < 1) { /* filament drawn below */ } h = 0; }
      const base = -topAt(X);
      if (Y <= base + 0.012 && Y >= base - h) { fin = { k: 'dor', t, X, Y, d, h, ang: Math.atan2(Y - (base + 0.25), X - (d.u1 + d.u2) / 2) }; break; }
    }
    // whip filament (moorish idol / firefish): swept-back thin trailing spike
    if (!fin) for (const d of (A.dor || [])) if (d.k === 'whip') {
      const baseU = d.u1 + (d.u2 - d.u1) * 0.35, topY = -topAt(baseU);
      const t = (baseU - X) / (baseU - (baseU - d.h * 0.55)); // runs backwards
      if (t >= 0 && t <= 1) {
        const yy = topY - d.h * (1 - t * 0.0) * (1 - t) - 0.0 + (frame % 2) * 0 ; // diagonal up and back
        const ty = topY - d.h * (1 - t) ;
        if (Math.abs(Y - ty) < 0.016 + 0.02 * (1 - t)) { fin = { k: 'dor', t, X, Y, d, h: 0, ang: 0 }; break; }
      }
      // sail part
      if (X >= baseU - 0.0 && X <= d.u2) { const tt = (X - baseU) / (d.u2 - baseU); const hh = 0.16 * (1 - tt) ; if (Y <= -topAt(X) + 0.01 && Y >= -topAt(X) - hh * 1.0) { fin = { k: 'dor', t: tt, X, Y, d, h: hh, ang: 0 }; break; } }
    }
    // anal fin
    if (!fin && A.anal) {
      const d = A.anal;
      if (X >= d.u1 && X <= d.u2) {
        const t = (X - d.u1) / (d.u2 - d.u1);
        const h = d.h * finH(d.k, t, d.ap, d), base = botAt(X);
        if (Y >= base - 0.012 && Y <= base + h) fin = { k: 'anal', t, X, Y, d, h, ang: Math.atan2(Y - (base - 0.2), X - (d.u1 + d.u2) / 2) };
      }
    }
    // pelvic fin(s)
    if (!fin && A.pelv && A.pelv.len > 0) {
      const p = A.pelv, bx = p.u, by = botAt(bx);
      const dx = X - bx, dy = Y - by;
      if (p.thread) {
        // long streamer trailing down and slightly back
        const t = dy / p.len; if (t > -0.02 && t < 1) { const cx = -t * 0.12 + (frame % 2 ? 0.01 : 0); if (Math.abs(dx - cx) < 0.014 + 0.008 * (1 - t)) fin = { k: 'pelv', t, X, Y, ang: 0 }; }
      } else if (dy > -0.01 && dy < p.len && dx < 0.02 && dx > -p.len * 0.9) {
        const t = dy / p.len; if (dx > -p.len * 0.9 * (1 - t) - 0.03 * t) fin = { k: 'pelv', t, X, Y, ang: Math.atan2(dy, dx) };
      }
    }
    if (fin) { cover[idx] = 2; col[idx] = fin; }
  }

  // --- pectoral fin (front layer, semi transparent look) ---
  if (A.pect && A.pect.len > 0) {
    const p = A.pect, bx = p.u, by = (-topAt(bx) + botAt(bx)) * 0.5 + (botAt(bx) + topAt(bx)) * 0.12;
    const wing = Math.sin(frame * Math.PI / 2) * 0.02;
    for (let py = 0; py < H; py++) for (let pxl = 0; pxl < W; pxl++) {
      const X = (pxl + 0.5 - ox) / px, Y = (py + 0.5 - oy) / px;
      const dx = bx - X, dy = Y - by; // dx > 0 : behind attachment
      const ww = (p.wide ? 0.2 : 0.075) * (p.len / 0.17 > 1 ? Math.min(2.2, p.len / 0.17) : 1);
      if (dx >= -0.01 && dx <= p.len) {
        const t = dx / p.len;
        const half = ww * Math.sin(Math.min(1, (t + 0.08)) * Math.PI * 0.78) ** 0.9 * (1 - t * 0.25);
        const cy = by + t * (p.wide ? 0.0 : 0.05) + wing * t;
        if (Math.abs(Y - cy) <= half && X <= 1) {
          const idx = py * W + pxl;
          cover[idx] = 3; col[idx] = { k: 'pect', t, X, Y, ang: Math.atan2(Y - by, -dx) };
        }
      }
    }
  }
  // --- extras: barbels, leaf appendages, lure, spines etc. (set as detail cover) ---
  const plot = (x, y, c, kind) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; cover[y * W + x] = kind || 4; col[y * W + x] = { fixed: c }; };
  const line = (x0, y0, x1, y1, c) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0))); for (let i = 0; i <= n; i++) plot(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); };
  const dark = shadeC(base, -0.5);
  if (A.barbels) {
    const nx = ox + L, ny = oy + P.bot(0.97) * L * 0.4;
    for (let i = 0; i < A.barbels; i++) { const off = i % 2 ? 1 : -1; line(nx - 1, ny + off * 0 + i * 0.6, nx + 1 - L * (0.10 + 0.02 * i), ny + L * (0.07 + 0.03 * i) + (frame % 2) * 0.6, shadeC(base, -0.35)); }
  }
  if (A.lure) {
    const sx = ox + L * 0.86, sy = oy - P.top(0.86) * L, ex = ox + L * 1.02 + (frame % 2) * 0.6, ey = sy - L * 0.34;
    for (let i = 0; i <= 14; i++) { const t = i / 14; plot(sx + (ex - sx) * t + Math.sin(t * 3) * L * 0.04, sy + (ey - sy) * t - Math.sin(t * Math.PI) * L * 0.08, [60, 40, 90]); }
    const bulb = [255, 245, 170]; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (a * a + b * b <= 5) plot(ex + a, ey + b, a * a + b * b > 3 ? [255, 190, 80] : bulb);
  }
  if (A.leaf) {
    for (let i = 0; i < 9; i++) {
      const u0 = 0.12 + i * 0.09, top = i % 2 === 0, yy = top ? -P.top(u0) : P.bot(u0);
      const cx = ox + u0 * L, cy = oy + yy * L + (top ? -2 : 2);
      const g1 = [[120, 170, 40], [150, 190, 60], [200, 160, 40]][i % 3];
      for (let a = -3; a <= 3; a++) for (let b = -2; b <= 2; b++) if ((a / 3) ** 2 + (b / 2) ** 2 <= 1) plot(cx + a + (top ? -1 : 1) * Math.abs(b) * 0.5 - 1, cy + b * (top ? -1 : 1) + (top ? -1 : 1), b > 0 ? shadeC(g1, -0.2) : g1, 2);
    }
  }

  /* ---------- colouring ---------- */
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(W, H), D = img.data;
  const setpx = (i, c, a) => { D[i * 4] = Math.max(0, Math.min(255, c[0])) | 0; D[i * 4 + 1] = Math.max(0, Math.min(255, c[1])) | 0; D[i * 4 + 2] = Math.max(0, Math.min(255, c[2])) | 0; D[i * 4 + 3] = a == null ? 255 : a; };
  const gillU = A.eye.u - 0.17;

  const nRayTail = Math.max(6, Math.round(L * 0.3));
  const finCol = (f, x, y) => {
    let c = finC;
    // pattern bleeding into fins
    if (A.stripeFins && s.pt === 'stripes') { for (const cc of [0.3, 0.46, 0.62]) if (Math.abs(f.X - cc) < 0.05) c = c2; }
    if (s.pt === 'stripes' && (f.k === 'dor' || f.k === 'anal') && A.stripeFins) {}
    // fade lighter toward free edge
    const fade = f.k === 'tail' ? f.t : f.k === 'pect' ? f.t : 0.5;
    c = mixC(c, shadeC(c, 0.35), Math.min(1, fade * 0.8));
    if (A.outlineFins && f.k !== 'pelv') c = c; // clown: black edge handled in outline pass
    // two-tone tails (koi/goldfish)
    if (f.k === 'tail' && (s.pt === 'patch' && s.id !== 'koi' && s.id !== 'celestialkoi')) {}
    if (A.dor && f.k === 'dor' && f.d && f.d.col === 'fin') c = _hx('#e63946');
    mods.forEach(m => (c = modTint(m, c, f.X + 0.5, 0.5, x, y, true)));
    return c;
  };

  const bodyColor = (cc, x, y) => {
    const { u, v, X } = cc;
    const pat = patternAt(s, A, u, v, x, y);
    let c = base;
    // base countershading ramp
    c = mixC(c, belly, sstep(0.52, 0.95, v) * 0.85);
    if (s.pt === 'lateral') {
      if (v > 0.36 && v < 0.5 && u < 0.88) c = mixC([60, 235, 255], [200, 255, 255], (1 - Math.abs(v - 0.43) / 0.07) * 0.5); // iridescent line
      else if (v >= 0.5 && u < 0.6) c = c2;
    }
    if (pat.t > 0) c = mixC(c, c2, pat.t);
    if (pat.dark) c = [18, 14, 22];
    mods.forEach(m => (c = modTint(m, c, u, v, x, y)));
    // scales: subtle diamond lattice
    let sh = 0;
    // lighting: dark back line, highlight band on the upper flank, rounded belly
    sh += -0.34 * (1 - sstep(0, 0.2, v));
    sh += 0.16 * Math.exp(-Math.pow((v - 0.27) / 0.09, 2)) * sstep(0.1, 0.4, u);
    sh += -0.2 * sstep(0.86, 1, v);
    sh += -0.06 * (1 - sstep(0.0, 0.25, u));
    if (A.scales && L >= 34 && u > 0.1 && u < gillU - 0.02) {
      const q = A.scales === 2 ? 3 : 4;
      const a = (x + (Math.floor(y / 2) % 2) * 2) % q, b = (y) % 2;
      if (a === 0 && b === 0) sh -= 0.09; else if (a === 1 && b === 0) sh += 0.04;
    }
    // operculum (gill plate) lighter, gill line dark
    const gl = gillU + 0.045 * (1 - Math.pow(2 * v - 1, 2)) * 0.9 - 0.02;
    if (u > gl - 0.012 && u < gl + 0.006 && v > 0.12 && v < 0.9) { sh -= 0.28; }
    else if (u >= gl + 0.006 && u < gl + 0.12 && v > 0.12) sh += 0.07;
    // quantised, dithered lighting
    const lv = 6, qd = Math.floor(sh * lv + BAYER[y & 3][x & 3] * 0.9 + 0.5) / lv;
    return shadeC(c, qd);
  };

  for (let py = 0; py < H; py++) for (let pxl = 0; pxl < W; pxl++) {
    const i = py * W + pxl, k = cover[i]; if (!k) continue;
    const cc = col[i];
    if (cc.fixed) { setpx(i, cc.fixed); continue; }
    if (cc.body) { setpx(i, bodyColor(cc, pxl, py)); continue; }
    // fin pixel
    let c = finCol(cc, pxl, pxl + py);
    const n = cc.k === 'tail' ? nRayTail : 7;
    if (cc.k !== 'pelv' && cc.k !== 'sword' && rayLine(cc.ang || 0, n, cc.t)) c = shadeC(c, -0.24);
    else if (cc.k === 'pelv') c = shadeC(c, -0.04);
    else c = shadeC(c, 0.06);
    if (cc.k === 'pect') c = shadeC(c, 0.08);
    setpx(i, c);
  }

  /* outline pass */
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : cover[y * W + x];
  const out = new Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = at(x, y); if (!k) continue;
    const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
    const i = y * W + x;
    const cur = [D[i * 4], D[i * 4 + 1], D[i * 4 + 2]];
    if (edge) out[i] = shadeC(cur, k === 2 || k === 3 ? -0.5 : -0.62);
    else if (k === 1 && (at(x - 1, y) === 2 || at(x + 1, y) === 2 || at(x, y - 1) === 2 || at(x, y + 1) === 2)) out[i] = shadeC(cur, -0.35);
    else if (k === 3 && (at(x - 1, y) === 1 || at(x, y + 1) === 1 || at(x, y - 1) === 1)) out[i] = shadeC(cur, -0.28);
  }
  if (A.outlineFins) { // clownfish style white-black fin edges
    for (let i = 0; i < W * H; i++) if (out[i] && cover[i] === 2) out[i] = [18, 14, 22];
  }
  for (let i = 0; i < W * H; i++) if (out[i]) setpx(i, out[i]);

  /* mouth, eye and head details (on top) */
  const ex = Math.round(ox + A.eye.u * L), ey = Math.round(oy + ((A.eye.dy || 0) - 0.0) * L + (-P.top(A.eye.u) * 0.25 + P.bot(A.eye.u) * 0.0) * L - (A.hump ? 0 : 0));
  const noseX = Math.round(ox + L * (A.snout ? 1 : 1)), mouthY = Math.round(oy + L * (P.bot(0.99) * 0.35 - P.top(0.99) * 0.0) + L * (A.bigmouth ? 0.03 : 0));
  const ink = [14, 10, 20];
  const setIf = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) { setpx(y * W + x, c); } };
  // mouth line
  const mouthLen = A.bigmouth ? Math.round(L * 0.2) : A.lips ? 3 : Math.max(2, Math.round(L * 0.06));
  for (let i = 0; i < mouthLen; i++) setIf(noseX - 1 - i - (A.bigmouth ? 0 : 0), mouthY, ink);
  if (A.lips) { setIf(noseX - 1, mouthY - 1, [230, 120, 130]); setIf(noseX - 2, mouthY - 1, [230, 120, 130]); setIf(noseX - 1, mouthY + 1, [230, 120, 130]); }
  if (A.teeth) { const n = A.teeth === 2 ? 4 : 3; for (let i = 0; i < n; i++) setIf(noseX - 2 - i * 2, mouthY + 1, [250, 250, 245]); if (A.teeth === 2) for (let i = 0; i < n; i++) setIf(noseX - 2 - i * 2, mouthY - 1, [250, 250, 245]); }
  if (A.beakTeeth) { for (let i = 0; i < 3; i++) { setIf(noseX - 1 - i, mouthY, [255, 250, 230]); setIf(noseX - 1 - i, mouthY + 1, shadeC([255, 250, 230], -0.2)); } }
  // eye
  const er = Math.max(1, Math.round(A.eye.r * L));
  const irisC = s.id === 'neon' || s.id === 'goby' ? [250, 250, 250] : [250, 205, 70];
  for (let a = -er - 1; a <= er + 1; a++) for (let b = -er - 1; b <= er + 1; b++) {
    const d = Math.hypot(a, b);
    if (d <= er + 0.6) {
      const ring = d > er - 0.5;
      setIf(ex + a, ey + b, ring ? ink : (Math.hypot(a - 0.0, b - 0.0) < Math.max(0.8, er * 0.45) ? [8, 6, 14] : irisC));
    }
  }
  if (er >= 2) setIf(ex - 1, ey - 1, [255, 255, 255]); else setIf(ex, ey, [20, 14, 22]);
  if (A.lure) {} 

  // spike dots for urchin fish: lighter tips
  ctx.putImageData(img, 0, 0);
  return cv;
}

/* top-down ray / manta */
function renderRay(s, A, mods, L, frame) {
  const Z = archSize(A, L), W = Z.w, H = Z.h;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(W, H), D = img.data;
  const base = _hx(s.c), c2 = _hx(s.c2), cx = Math.round(L * 0.5) + 3, cy = H / 2;
  const flap = Math.sin(frame * Math.PI / 2) * 0.06;
  const mask = new Int8Array(W * H), colr = new Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const X = (x + 0.5 - 3) / L, Y = (y + 0.5 - cy) / L; // X: 0 tail root .. 1 nose
    const ay = Math.abs(Y);
    // wing outline: nose at X=1, widest at X~0.55, sweeping to rear
    let w = 0;
    if (X > 0 && X < 1.04) {
      const t = X;
      const front = Math.pow(Math.max(0, (1.04 - t) / 0.5), 0.9);
      const rear = Math.pow(Math.min(1, t / 0.5), 0.7);
      w = A.wing * 0.5 * Math.min(1, front * 1.0) * (0.25 + 0.75 * Math.min(1, rear)) * (1 + flap * (ay > 0.2 ? 1 : 0));
      w *= (t > 0.45 ? 1 : 0.35 + t / 0.45 * 0.65);
      // swept trailing edge
      const sweep = (t - 0.5) * 0.9;
      const lim = 0.5 * A.wing * (1 - Math.max(0, 0.9 - t * 1.4));
      w = Math.min(w, Math.max(0.0, A.wing * 0.5 * (1.05 - Math.abs(t - 0.6) * 1.9)));
      if (A.horns && t > 0.88) w = Math.max(w, ay < 0.1 ? 0.1 : 0);
    }
    const inWing = ay <= w && X > 0.06;
    const tl = -X / A.tail; // tail beyond root (X<0)
    const inTail = X <= 0.12 && X > -A.tail && ay <= 0.035 * (1 - (-Math.min(0, X)) / A.tail * 0.8) + 0.008;
    if (inWing || inTail) {
      const u = Math.max(0, Math.min(1, X)), v = (Y / (A.wing * 0.5)) * 0.5 + 0.5;
      let c = base;
      const n = vnoise(X * 5, Y * 5, s.id);
      if (s.pt === 'spots') { const g = hash(s.id + Math.floor(X * 10) + ',' + Math.floor(Y * 10)); if (g % 4 === 0 && ((X * 10) % 1 - 0.5) ** 2 + ((Y * 10) % 1 - 0.5) ** 2 < 0.12) c = c2; }
      else if (s.pt === 'belly') { if (ay < 0.14 && X > 0.2) c = mixC(base, c2, 0.5); }
      c = mixC(c, shadeC(c, -0.25), 0.4 * n);
      mods.forEach(m => (c = modTint(m, c, u, v, x, y)));
      let sh = -0.25 * sstep(0.2, 0.5, ay) + 0.12 * (1 - sstep(0, 0.15, ay));
      // wing ribs
      if (inWing && ((Math.round((Math.atan2(Y, X - 0.9) + 3.2) * 9)) % 2 === 0) && ay > 0.12) sh -= 0.06;
      const qd = Math.floor(sh * 6 + BAYER[y & 3][x & 3] * 0.9 + 0.5) / 6;
      c = shadeC(c, qd);
      mask[y * W + x] = 1; colr[y * W + x] = c;
    }
  }
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : mask[y * W + x];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (!mask[i]) continue;
    let c = colr[i];
    if (!at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1)) c = shadeC(c, -0.6);
    D[i * 4] = c[0]; D[i * 4 + 1] = c[1]; D[i * 4 + 2] = c[2]; D[i * 4 + 3] = 255;
  }
  // eyes + spiracles
  const ex = Math.round(3 + L * 0.9), ey1 = Math.round(cy - L * 0.12), ey2 = Math.round(cy + L * 0.12);
  [ey1, ey2].forEach(yy => { for (let a = 0; a <= 1; a++) for (let b = 0; b <= 1; b++) { const i = (yy + b) * W + ex + a; if (i >= 0 && i < W * H) { D[i * 4] = a && b ? 255 : 12; D[i * 4 + 1] = a && b ? 255 : 10; D[i * 4 + 2] = a && b ? 255 : 18; D[i * 4 + 3] = 255; } } });
  ctx.putImageData(img, 0, 0);
  return cv;
}
