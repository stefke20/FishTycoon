'use strict';
/* ===== Weather and local events in the store =====
   Weather changes every few minutes: rain and storms keep most people at home, but the ones who do come are serious buyers
   (higher offers, fewer bargain hunters). Local events (a school trip, a convention…) send a short rush of customers who want
   one particular kind of fish — stock it in your display cases and they pay extra. */

const WEATHER = {
  clear:  { n: 'Sunny', icon: '☀️', traffic: 1.12, offer: 1.0, serious: 0, dim: 0, say: 'The sun is out — a nice day for browsing.' },
  cloudy: { n: 'Cloudy', icon: '☁️', traffic: 1.0, offer: 1.0, serious: 0, dim: 0.1, say: 'Clouds are rolling in.' },
  rain:   { n: 'Rainy', icon: '🌧️', traffic: 0.78, offer: 1.1, serious: 0.5, dim: 0.22, say: "It's raining — fewer customers, but those who come mean business." },
  storm:  { n: 'Stormy', icon: '⛈️', traffic: 0.5, offer: 1.18, serious: 0.8, dim: 0.38, say: 'A storm! Hardly anyone is out, but whoever shows up will pay well.' },
  snow:   { n: 'Snowy', icon: '❄️', traffic: 0.7, offer: 1.07, serious: 0.35, dim: 0.12, say: "It's snowing — a quiet, cosy day in the shop." },
};
const isWinterMonth = () => { const m = new Date(typeof nowMs === 'function' ? nowMs() : Date.now()).getMonth(); return m === 11 || m <= 1; };

/* ---------- local events ---------- */
const TOWN_EVENTS = [
  { id: 'school', n: 'School trip', icon: '🚌', traffic: 2.1, other: 0.9, want: 1.3, dur: 150, weight: 3, d: 'A class of kids is on a trip to your shop.' },
  { id: 'convention', n: 'Aquarists’ convention', icon: '🎪', traffic: 1.6, other: 0.7, want: 1.5, dur: 170, weight: 2, d: 'Hobbyists in town for the convention are hunting for rare, modified fish.' },
  { id: 'chef', n: 'Chef’s tasting', icon: '👨‍🍳', traffic: 1.3, other: 0.85, want: 1.9, dur: 140, weight: 2, d: 'A famous chef is looking for one particular species.' },
  { id: 'wedding', n: 'Wedding party', icon: '💒', traffic: 1.4, other: 0.9, want: 1.7, dur: 150, weight: 2, d: 'Wedding guests want a fish with a special look as a gift.' },
  { id: 'tourists', n: 'Tourist bus', icon: '🚍', traffic: 2.5, other: 1.0, want: 1.0, dur: 120, weight: 3, d: 'A bus full of tourists pulls up — they buy almost anything.' },
];
const TOWN_EVENT = {}; TOWN_EVENTS.forEach(e => (TOWN_EVENT[e.id] = e));
const WEDDING_MODS = ['pearl', 'golden', 'frosty', 'candy', 'neon', 'glowing'];

function ensureG6() {
  S.wx = Object.assign({ kind: 'clear', until: 0, flash: 0 }, S.wx);
  S.town = Object.assign({ cur: null, next: 420, done: 0, log: [] }, S.town);
}
const wxNow = () => WEATHER[S.wx.kind] || WEATHER.clear;
function pickWeather() {
  const w = isWinterMonth() ? { clear: 34, cloudy: 26, snow: 28, storm: 4, rain: 8 } : { clear: 40, cloudy: 26, rain: 24, storm: 8, snow: 0 };
  let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0);
  for (const k in w) { r -= w[k]; if (r <= 0) return k; }
  return 'clear';
}
function setWeather(kind, secs) { S.wx.kind = kind; S.wx.until = S.time + (secs || 300 + Math.random() * 300); G.dirty = true; }

/* ---------- event spec: what the visitors want ---------- */
function newTownEvent() {
  const defs = TOWN_EVENTS.filter(e => e.id !== 'tourists' || level() >= 3); let r = Math.random() * defs.reduce((a, e) => a + e.weight, 0), def = defs[0];
  for (const e of defs) { r -= e.weight; if (r <= 0) { def = e; break; } }
  const maxT = typeof maxSpeciesTier === 'function' ? maxSpeciesTier() : 2, spec = {};
  if (def.id === 'school') { spec.maxTier = Math.min(2, maxT); spec.water = 'fresh'; }
  else if (def.id === 'convention') spec.minMods = level() >= 5 ? 2 : 1;
  else if (def.id === 'chef') { const pool = SPECIES_LIST.filter(s => !s.ev && !s.exp && s.t <= Math.max(1, maxT - 0) && s.t >= Math.max(1, maxT - 1)); spec.sp = pick(pool).id; }
  else if (def.id === 'wedding') spec.mod = pick(WEDDING_MODS);
  return { id: def.id, left: def.dur, total: def.dur, spec, seen: 0, sold: 0, earned: 0 };
}
function townWants(ev, f) {
  if (!ev) return false; const sp = SPECIES[f.sp], s = ev.spec;
  if (ev.id === 'tourists') return true;
  if (s.maxTier && (sp.t > s.maxTier || (s.water && sp.w !== s.water))) return false;
  if (s.minMods && f.mods.length < s.minMods) return false;
  if (s.sp && f.sp !== s.sp) return false;
  if (s.mod && !f.mods.includes(s.mod)) return false;
  return true;
}
function townWantText(ev) {
  const s = ev.spec;
  if (ev.id === 'school') return `${s.water === 'fresh' ? 'freshwater' : ''} fish of tier ${s.maxTier} or lower`;
  if (ev.id === 'convention') return `fish with ${s.minMods}+ modifier${s.minMods > 1 ? 's' : ''}`;
  if (ev.id === 'chef') return `a ${SPECIES[s.sp].n}`;
  if (ev.id === 'wedding') return `a fish with the ${MODS[s.mod].n} modifier`;
  return 'anything';
}
/* how much the visitors of the current event offer relative to normal for this fish (1 = normal) */
const townOfferMult = f => { const ev = S.town.cur; if (!ev) return 1; const d = TOWN_EVENT[ev.id]; return townWants(ev, f) ? d.want : d.other; };
const wxOfferMult = () => wxNow().offer;
const wxTraffic = () => wxNow().traffic * (S.town.cur ? TOWN_EVENT[S.town.cur.id].traffic : 1);

/* ---------- tick ---------- */
let _wxT = 99;
function tickWeather(dt) {
  _wxT += dt; if (_wxT < 1) return; const step = _wxT; _wxT = 0;
  if (S.time >= S.wx.until) { const was = S.wx.kind, k = pickWeather(); setWeather(k); if (k !== was && S.time > 5) G.msg(`${WEATHER[k].icon} ${WEATHER[k].say}`, k === 'storm' || k === 'rain' ? 'good' : ''); }
  if (S.wx.kind === 'storm' && Math.random() < step * 0.12) S.wx.flash = S.time;
  const t = S.town;
  if (t.cur) { t.cur.left -= step; if (t.cur.left <= 0) { const e = t.cur, d = TOWN_EVENT[e.id]; t.log.unshift({ id: e.id, sold: e.sold, earned: e.earned, at: Date.now() }); t.log.length = Math.min(t.log.length, 8); t.done++; t.cur = null; t.next = S.time + 360 + Math.random() * 420; G.msg(`${d.icon} The ${d.n.toLowerCase()} is over: ${e.sold} sale${e.sold === 1 ? '' : 's'} for ${fmt(e.earned)}.`, e.sold ? 'gold' : ''); G.dirty = true; } }
  else if (S.time >= t.next && level() >= 2 && storeFish().length) {
    t.cur = newTownEvent(); const d = TOWN_EVENT[t.cur.id]; G.dirty = true;
    G.msg(`${d.icon} ${d.n}! They want ${townWantText(t.cur)} — put some in your display cases.`, 'gold'); if (G.sfx) G.sfx('good');
  }
}
/* called when an event customer buys */
function townNoteSale(c, price) { const ev = S.town.cur; if (ev && c.ev) { ev.sold++; ev.earned += price; } }
