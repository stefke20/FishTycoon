'use strict';
/* ===== Quality-of-life layer: fish tags, auto-rules, tab unlocks, first-hour guide, away report, day/night clock, breeding planner ===== */

const GAME_VERSION = '1.2.0';
const CHANGELOG = [
  { v: '1.2.0', d: 'Tidier, safer and rebalanced', notes: ['Arrows and a dropdown in every tank to jump to the next or previous aquarium (also ← → on the keyboard)', 'Sections you can fold away on the Inventory, Store, Shop, Menu, Stats, Collection and tank pages; compact list for the Aquarium Hall', 'Egg manager: sort by rarity, filter by tier or water, identical eggs stack, and eggs can be destroyed (one, a stack, or everything shown)', 'Breeding page rebuilt: search, group by aquarium / species / rarity, ready-only filter and compact rows', 'Sell a tank back, or trade a small tank in for the next size up (Starter → Medium → Large → Grand → Colossal, and the reef line)', 'Sale tanks: the Display Handler and Auto-fill only sell fish from tanks you mark as Sale tanks — breeding stock and campaign fish are never sold by accident', 'A fish can carry at most 5 modifiers, and modifiers now add together instead of multiplying', 'The Breeding Nest upgrade is limited to 3 levels', 'Economy rebalance: slower growth and breeding for rarer fish, tier-ups follow your store level, the fish market gets saturated when flooded, and customers tire of identical fish'] },
  { v: '1.1.0', d: 'Quality of life', notes: ['Auto-rules: sell plain fish and keep only the best of each species automatically (Shop → Management)', 'Coloured fish tags (Breeding stock, Boss candidate, Show fish, Keeper, Sell soon) that every filter understands', 'Breeding planner: pick any target fish and see the cheapest chain of pairings', 'Day and night lighting with a lunch-time rush in the store', 'A "while you were away" card when you start the game', 'A six-step first-hour checklist with rewards', 'Home, Fish Shows, Expeditions, Research and the Campaign now unlock with your store level, with a one-time "new" card'] },
  { v: '1.0.0', d: 'First release', notes: ['Store, aquariums, breeding, expeditions, fish shows, daily quests, research tree and the Ocean Campaign'] },
];

/* ---------- state ---------- */
const TAB_REQ = { home: 2, shows: 2, exp: 3, research: 3, camp: 4 };
const tabOpen = id => !TAB_REQ[id] || level() >= TAB_REQ[id];
function ensureG4() {
  const legacy = !S.g4 && (S.sales > 0 || S.fish.length > 0 || S.time > 60);
  S.g4 = Object.assign({ seen: {}, fresh: {}, q: [], guide: {}, guideBonus: false, guideHide: false }, S.g4);
  S.market = Object.assign({ glut: 0 }, S.market); S.demand = S.demand || {};
  S.rules = Object.assign({ on: false, list: [], sold: 0, money: 0, last: 0 }, S.rules);
  if (!S.settings.daymode) S.settings.daymode = 'auto';
  if (legacy) {
    for (const id in TAB_REQ) if (level() >= TAB_REQ[id]) S.g4.seen[id] = true;
    GUIDE.forEach(g => (S.g4.guide[g.id] = true)); S.g4.guideBonus = true; S.g4.guideHide = true;
  }
}

/* ================= FISH TAGS ================= */
const TAGS = [
  { id: 'breed', n: 'Breeding stock', c: '#4fe0a0', prot: true },
  { id: 'boss', n: 'Boss candidate', c: '#ff6b78', prot: true },
  { id: 'show', n: 'Show fish', c: '#ffc24a', prot: true },
  { id: 'keep', n: 'Keeper', c: '#6ab4ff', prot: true },
  { id: 'sell', n: 'Sell soon', c: '#ff9a52', prot: false },
];
const TAG = {}; TAGS.forEach(t => (TAG[t.id] = t));
const tagKept = f => !!(f.tag && TAG[f.tag] && TAG[f.tag].prot);
function setTag(fid, tag) { const f = getFish(fid); if (!f) return fail('Missing'); f.tag = f.tag === tag || !TAG[tag] ? null : tag; return ok(); }
function tagMany(ids, tag) { let n = 0; for (const id of ids) { const f = getFish(id); if (f && TAG[tag]) { f.tag = tag; n++; } } G.dirty = true; return n; }
function clearTags(ids) { let n = 0; for (const id of ids) { const f = getFish(id); if (f && f.tag) { f.tag = null; n++; } } G.dirty = true; return n; }

/* ================= AUTO-RULES ================= */
const RULE_TYPES = {
  junk: { n: 'Sell plain fish', d: 'Sell adults with few modifiers that are below a tier.' },
  dupes: { n: 'Keep the best of each species', d: 'Keep the most valuable few of every species and sell the surplus.' },
  tagged: { n: 'Sell tagged fish', d: 'Sell every adult tagged “Sell soon”.' },
};
function newRule(type) {
  const base = { id: 'r' + S.nextId++, type, on: true };
  if (type === 'junk') return Object.assign(base, { maxMods: 0, tierBelow: 3 });
  if (type === 'dupes') return Object.assign(base, { keep: 2, maxMods: 9, tierBelow: 6 });
  return base;
}
function addRule(type) { if (!S.unlocks.autoRules) return fail('Buy the Auto-Sorter in Shop → Management first'); if (!RULE_TYPES[type]) return fail('Unknown rule'); if (S.rules.list.length >= 8) return fail('Eight rules is the maximum'); S.rules.list.push(newRule(type)); return ok(); }
function delRule(id) { S.rules.list = S.rules.list.filter(r => r.id !== id); return ok(); }
function setRule(id, key, v) { const r = S.rules.list.find(x => x.id === id); if (!r) return fail('Missing'); if (key === 'on') r.on = !r.on; else r[key] = +v; return ok(); }
function ruleText(r) {
  const mods = r.maxMods >= 9 ? '' : r.maxMods === 0 ? ' with no modifiers' : ` with at most ${r.maxMods} modifier${r.maxMods > 1 ? 's' : ''}`;
  const tier = r.tierBelow >= 6 ? '' : ` below tier ${r.tierBelow}`;
  if (r.type === 'junk') return `Sell adults${mods}${tier}`;
  if (r.type === 'dupes') return `Keep the best ${r.keep} of each species, sell the rest` + (mods || tier ? ' if they are' + (mods ? mods.replace(' with', ' fish with') : '') + tier : '');
  return 'Sell every fish tagged “Sell soon”';
}
/* fish a rule must never touch: favourites, kept tags, show entrants, fish that fit an open order or the current boss */
function ruleReserved(f) {
  if (S.contracts.some(c => contractMatches(c, f))) return 'order';
  const c = CAMPAIGN[campCur()]; if (c && campMatches(c.spec, f)) return 'boss';
  return null;
}
/* tag the fish closest to the current boss's demand as Boss candidates (protected from every sell rule) */
function tagBossCandidates() {
  const c = CAMPAIGN[campCur()]; if (!c) return fail('No boss left to beat');
  const list = campCandidates(c.spec).filter(x => x.spOk && x.have.length).slice(0, 8); if (!list.length) return fail('No fish are close to the demand yet');
  list.forEach(x => (x.f.tag = 'boss')); G.dirty = true; return { ok: true, n: list.length };
}
const ruleEligible = f => isAdult(f) && f.loc !== 'store' && !SPECIES[f.sp].ev && !f.fav && !tagKept(f) && !fishLocked(f) && !ruleReserved(f);
/* what the rules would sell right now */
function ruleTargets() {
  const out = new Map();
  for (const r of S.rules.list) {
    if (!r.on) continue;
    const adults = S.fish.filter(f => isAdult(f) && !SPECIES[f.sp].ev);
    if (r.type === 'junk') adults.forEach(f => { if (ruleEligible(f) && f.mods.length <= r.maxMods && SPECIES[f.sp].t < r.tierBelow) out.set(f.id, r); });
    else if (r.type === 'tagged') adults.forEach(f => { if (ruleEligible(f) && f.tag === 'sell') out.set(f.id, r); });
    else if (r.type === 'dupes') {
      const by = {}; adults.forEach(f => (by[f.sp] = by[f.sp] || []).push(f));
      for (const sp in by) by[sp].sort((a, b) => fishValue(b) - fishValue(a)).slice(r.keep).forEach(f => { if (ruleEligible(f) && f.mods.length <= r.maxMods && SPECIES[f.sp].t < r.tierBelow) out.set(f.id, r); });
    }
  }
  return [...out.entries()].map(([id, rule]) => ({ f: getFish(id), rule })).sort((a, b) => fishValue(b.f) - fishValue(a.f));
}
function runRules(auto) {
  if (!S.unlocks.autoRules) return fail('Buy the Auto-Sorter in Shop → Management first');
  const list = ruleTargets(); let n = 0, money = 0;
  for (const { f } of list) { const r = sellMarket(f.id); if (r.ok) { n++; money += r.price; } }
  if (!n) return fail('The rules found nothing to sell');
  S.rules.sold += n; S.rules.money += money; S.rules.last = S.time; G.dirty = true;
  return { ok: true, n, money };
}
let _ruleT = 0;
function tickRules(dt) {
  _ruleT += dt; if (_ruleT < 15) return; _ruleT = 0;
  if (!S.unlocks.autoRules || !S.rules.on || !S.rules.list.some(r => r.on)) return;
  const r = runRules(true);
  if (r.ok) { G.msg(`Auto-rules sold ${r.n} fish for ${fmt(r.money)}`, 'gold'); if (G.sfx) G.sfx('sale'); }
}

/* ================= FIRST-HOUR CHECKLIST ================= */
const GUIDE = [
  { id: 'hatch', t: 'Hatch your first egg', d: 'Open Aquariums → your tank and drag an egg onto the water.', go: 'hall', goal: 1, val: () => S.stats.hatched, reward: { money: 100 } },
  { id: 'grow', t: 'Raise a fish to adulthood', d: 'Press Feed — babies reveal what they are once fully grown.', go: 'hall', goal: 1, val: () => S.stats.matured, reward: { money: 150 } },
  { id: 'sell', t: 'Sell a fish to a customer', d: 'Display an adult in the Store and accept an offer.', go: 'store', goal: 1, val: () => S.sales, reward: { money: 200 } },
  { id: 'clean', t: 'Wipe the glass or change the water', d: 'Drag the 🧽 sponge over the smudges, or press Change water.', go: 'hall', goal: 1, val: () => S.stats.cleaned + (S.stats.wiped >= 3 ? 1 : 0), reward: { money: 150, items: { mut1: 1 } } },
  { id: 'breed', t: 'Breed two fish', d: 'Pick two adults on the Breeding page and press Breed.', go: 'breed', goal: 1, val: () => S.bredCount, reward: { money: 300, items: { mut1: 1 } } },
  { id: 'lvl2', t: 'Reach store level 2', d: 'Every sale counts — level 2 needs 10 sales.', go: 'store', goal: 2, val: () => level(), reward: { money: 500, rp: 3 } },
];
const GUIDE_BONUS = { money: 1500, rp: 5, items: { mut2: 1 } };
const guideDone = g => g.val() >= g.goal;
const guideClaimed = g => !!S.g4.guide[g.id];
const guideClaimable = () => (S.g4.guideHide ? 0 : GUIDE.filter(g => guideDone(g) && !guideClaimed(g)).length + (guideAllClaimed() && !S.g4.guideBonus ? 1 : 0));
const guideAllClaimed = () => GUIDE.every(guideClaimed);
function giveReward(r) {
  if (r.money) { S.money += r.money; S.earned += r.money; }
  if (r.rp) gainRP(r.rp);
  for (const k in (r.items || {})) S.items[k] = (S.items[k] || 0) + r.items[k];
}
function rewardText(r) { return [r.money ? fmt(r.money) : '', r.rp ? r.rp + ' RP' : '', ...Object.entries(r.items || {}).map(([k, n]) => (CONSUMABLE[k] ? CONSUMABLE[k].e + ' ' : '') + n + '×' + (CONSUMABLE[k] ? CONSUMABLE[k].n : k))].filter(Boolean).join(' + '); }
function claimGuide(id) {
  const g = GUIDE.find(x => x.id === id); if (!g || !guideDone(g)) return fail('Not finished yet'); if (guideClaimed(g)) return fail('Already claimed');
  S.g4.guide[id] = true; giveReward(g.reward); return { ok: true, g };
}
function claimGuideBonus() {
  if (!guideAllClaimed() || S.g4.guideBonus) return fail('Claim all six goals first');
  S.g4.guideBonus = true; giveReward(GUIDE_BONUS); S.g4.guideHide = true; return ok();
}

/* ================= AWAY REPORT ================= */
/* advanceGrowth() pushes every fish that grew up offline onto G.awayList while it is an array */
function buildAway(r) {
  if (!r || r.fresh || !(r.away > 60)) return null;
  const grown = (G.awayList || []).map(getFish).filter(Boolean);
  const growing = S.fish.filter(f => !isAdult(f) && f.loc !== 'store' && getTank(f.loc));
  let eta = null; growing.forEach(f => { const t = getTank(f.loc), left = (1 - f.g) / Math.max(1e-6, growthRate({ sp: f.sp }, t)); if (eta == null || left < eta) eta = left; });
  const boats = S.exp.boats.filter(boatReady).length, sailing = S.exp.boats.filter(b => b && !boatReady(b));
  const rep = {
    gap: r.away, capped: r.away >= maxOffline() - 1,
    grown: grown.map(f => ({ id: f.id, name: f.name, label: fishName(f), mods: f.mods.length, value: fishValue(f), sp: f.sp, mlist: f.mods.slice() })).sort((a, b) => b.value - a.value),
    growing: growing.length, eta,
    boats, sailing: sailing.length, sailEta: sailing.length ? Math.min(...sailing.map(b => (b.start + b.dur - nowMs()) / 1000)) : null,
    eggs: S.eggs.length, dirty: S.tanks.filter(t => wqOf(t) < 55 && fishIn(t.id).length).length,
    login: loginClaimable(), quests: questsClaimable(), guide: guideClaimable(),
  };
  G.awayList = null; return rep;
}

/* ================= DAY & NIGHT, CLOCK, TRAFFIC ================= */
const DAY_SEC = 480;                                    // one game day is eight real minutes
const gameHour = () => (8 + (S.time || 0) / DAY_SEC * 24) % 24;
function realHour() { const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
const lightHour = () => { const m = S.settings.daymode; return m === 'real' ? realHour() : m === 'day' ? 13 : m === 'night' ? 23 : gameHour(); };
const trafficHour = () => (S.settings.daymode === 'real' ? realHour() : gameHour());
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
/* sun: 0 at night … 1 by day; warm: glow around sunrise and sunset */
function sunAt(h) {
  const k = h >= 7 && h <= 17 ? 1 : h >= 20 || h <= 5 ? 0 : h < 7 ? smooth((h - 5) / 2) : smooth((20 - h) / 3);
  const warm = Math.max(0, 1 - Math.abs(h - 6) / 1.4, 1 - Math.abs(h - 18.6) / 1.8);
  return { k, warm };
}
const mixRGB = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function lightTint(soft) {
  const { k, warm } = sunAt(lightHour());
  let c = mixRGB([104, 120, 188], [255, 255, 255], k);
  c = mixRGB(c, [255, 190, 130], warm * 0.55);
  if (soft) c = mixRGB(c, [255, 255, 255], 0.5);
  return c;
}
const TRAFFIC_PTS = [[0, 0.5], [5, 0.5], [7, 0.8], [9, 1.0], [10.5, 1.15], [12.2, 1.95], [14, 1.3], [16, 1.0], [17.5, 1.35], [19, 1.25], [21, 0.8], [23, 0.55], [24, 0.5]].map(([h, v]) => [h, +(v * 1.06).toFixed(3)]); // averages out to ~1 over a day
function trafficMult() {
  const h = trafficHour(); let i = 1; while (i < TRAFFIC_PTS.length - 1 && TRAFFIC_PTS[i][0] < h) i++;
  const [h0, v0] = TRAFFIC_PTS[i - 1], [h1, v1] = TRAFFIC_PTS[i];
  return v0 + (v1 - v0) * smooth((h - h0) / (h1 - h0 || 1));
}
function clockPhase() {
  const h = trafficHour();
  if (h >= 11.2 && h < 13.8) return { id: 'lunch', n: 'Lunch rush', icon: '🍽️' };
  if (h >= 17 && h < 19.5) return { id: 'eve', n: 'Evening crowd', icon: '🌆' };
  if (h >= 21 || h < 5.5) return { id: 'night', n: 'Quiet night', icon: '🌙' };
  if (h < 11.2) return { id: 'morn', n: 'Morning', icon: '🌅' };
  return { id: 'aft', n: 'Afternoon', icon: '☀️' };
}
function clockText() { const h = trafficHour(), hh = Math.floor(h), mm = Math.floor((h - hh) * 60 / 5) * 5; return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); }

/* ================= BREEDING PLANNER ================= */
/* Plans the cheapest chain of pairings that ends with a fish of one species carrying a set of modifiers.
   State = (species-fish or other-species-fish) × (subset of the wanted modifiers it carries). A pairing hands each
   parent modifier on with probability `inh`, and a modifier neither parent has appears with chance `fresh` × its rarity. */
function planBonus(key) { return Math.max(0, ...S.tanks.map(t => tankBonus(t)[key])); }
function planFor(spId, wanted) {
  const sp = SPECIES[spId]; if (!sp || sp.ev) return { err: 'Pick a normal species.' };
  const mods = [...new Set(wanted)].filter(m => MODS[m] && !MODS[m].ev).slice(0, 5), k = mods.length, full = (1 << k) - 1, w = sp.w;
  const pool = waterMods(w), tot = pool.reduce((a, m) => a + m.p, 0), pOf = m => (pool.find(x => x.id === m) || { p: 0 }).p;
  const inh = clamp((BASE_INHERIT + 0.06 * S.breedUp.match + 0.03 * lab('bloodline') + campPerk('inherit')) * (1 + planBonus('inherit')), 0, 0.95);
  const fresh = clamp((BASE_NEWMOD + 0.01 * S.breedUp.mutation + 0.008 * lab('splicing')) * (1 + planBonus('mod')), 0, 0.6);
  const eggs = 1 + S.breedUp.clutch + Math.floor(lab('cloning') / 2), modB = planBonus('mod');
  const growT = GROW_TIME[sp.t] / (1 + planBonus('growth')), cd = breedCooldown() * (1 + 0.3 * k / 2) * (1 + 0.25 * (sp.t - 1)) * (1 - clamp(planBonus('cool'), 0, 0.6));
  const R = Math.max(2, S.earned / Math.max(600, S.time));
  const score = c => c.time + c.money / R;
  const maskOf = f => mods.reduce((m, id, i) => (f.mods.includes(id) ? m | (1 << i) : m), 0);
  const adults = S.fish.filter(f => isAdult(f) && !SPECIES[f.sp].ev && SPECIES[f.sp].w === w);
  const candS = Array.from({ length: full + 1 }, () => []), candO = Array.from({ length: full + 1 }, () => []);
  for (let X = 0; X <= full; X++) adults.forEach(f => {
    if ((maskOf(f) & X) !== X) return;
    (f.sp === spId ? candS : candO)[X].push({ time: 0, money: 0, ids: [f.id], node: { t: 'have', f } });
  });
  const eggsFor = EGG_TYPES.filter(e => !e.ev && e.pool.includes(spId));
  const egg = eggsFor.filter(e => eggUnlocked(e.id)).sort((a, b) => eggPrice(a.id) * a.pool.length - eggPrice(b.id) * b.pool.length)[0];
  const lockedEgg = !egg && eggsFor.length ? eggsFor.slice().sort((a, b) => eggLevel(a) - eggLevel(b))[0] : null;
  const keepBest = (arr, n) => arr.sort((a, b) => score(a) - score(b)).slice(0, n);
  const disjoint = (a, b) => !a.ids.some(id => b.ids.includes(id));
  const order = []; for (let X = 0; X <= full; X++) order.push(X); order.sort((a, b) => bits(a) - bits(b));
  function bits(x) { let n = 0; while (x) { n += x & 1; x >>= 1; } return n; }
  for (const U of order) {
    if (egg) { // buy eggs and hope
      let p = 1 / egg.pool.length; for (let i = 0; i < k; i++) if (U & (1 << i)) p *= Math.min(1, pOf(mods[i]) * (1 + modB));
      const n = 1 / p; if (n <= 4000) candS[U].push({ time: growT + n * 6, money: n * eggPrice(egg.id), ids: [], node: { t: 'buy', egg, n, U, p } });
    }
    for (let A = 0; A <= full; A++) for (let B = A + 1; B <= full; B++) {
      if ((A | B) & ~U) continue;
      let q = 1; for (let i = 0; i < k; i++) { const bit = 1 << i; if (!(U & bit)) continue; const a = A & bit, b = B & bit; q *= a && b ? 1 - (1 - inh) * (1 - inh) : a || b ? inh : fresh * pOf(mods[i]) / tot; }
      if (q <= 1e-6) continue;
      for (const [LA, LB, spf] of [[candS[A], candS[B], 1], [candS[A], candO[B], 0.5], [candO[A], candS[B], 0.5]]) for (const a of LA.slice(0, 3)) for (const b of LB.slice(0, 3)) {
        if (!disjoint(a, b) || (LA === candS[A] && A === U) || (LB === candS[B] && B === U)) continue;
        const pEgg = q * spf, E = 1 / (1 - Math.pow(1 - pEgg, eggs));
        if (E > 4000) continue;
        candS[U].push({ time: a.time + b.time + E * cd + growT, money: a.money + b.money, ids: a.ids.concat(b.ids), node: { t: 'breed', a: a.node, b: b.node, p: pEgg, E, U } });
      }
    }
    candS[U] = keepBest(candS[U], 4);
  }
  const best = candS[full][0];
  if (!best) {
    if (sp.exp) return { err: `${sp.n} is a wild species — it can only be caught on expeditions (${LOCATION[sp.exp].n}). Bring one home first, then plan again.` };
    if (lockedEgg) return { err: `${sp.n} eggs unlock at store level ${eggLevel(lockedEgg)} — or breed a fish one tier lower and hope for a tier-up.` };
    return { err: 'No realistic route found with the fish you have. Try fewer modifiers, or hatch more fish first.' };
  }
  // flatten the tree into numbered steps
  const steps = [], seen = new Map();
  const visit = n => {
    if (n.t === 'have') return n;
    if (seen.has(n)) return n;
    if (n.t === 'breed') { visit(n.a); visit(n.b); }
    steps.push(n); n.no = steps.length; seen.set(n, true); return n;
  };
  visit(best.node);
  let tries = 0, buys = 0; steps.forEach(s => { if (s.t === 'breed') tries += s.E; else buys += s.n; });
  return { ok: true, sp: spId, mods, best, steps, owned: best.node.t === 'have', tries, buys, time: best.time, money: best.money, inh, fresh, eggs, egg, cd };
}

/* ================= tick ================= */
let _g4T = 0, _g4Phase = '', _g4Sig = -1;
function tickG4(dt) {
  tickRules(dt); S.market.glut = Math.max(0, S.market.glut - MARKET_RECOVER * dt); decayDemand(dt);
  _g4T += dt; if (_g4T < 1) return; _g4T = 0;
  for (const id in TAB_REQ) if (tabOpen(id) && !S.g4.seen[id] && !S.g4.q.includes(id)) { S.g4.q.push(id); S.g4.fresh[id] = true; G.dirty = true; }
  const ph = clockPhase();
  if (ph.id !== _g4Phase) {
    if (_g4Phase && (ph.id === 'lunch' || ph.id === 'eve') && storeFish().length) G.msg(`${ph.icon} ${ph.n}! Customers are streaming into the store.`, 'good');
    _g4Phase = ph.id; G.dirty = true;
  }
  const sig = guideClaimable(); if (sig !== _g4Sig) { _g4Sig = sig; G.dirty = true; }
}

/* ================= EGG MANAGEMENT ================= */
const eggKey = e => (e.bred || e.wild ? e.id : e.kind || e.water + e.tier);   // identical shop eggs stack, bred and wild eggs are unique
function eggSortKey(e, how) {
  if (how === 'tier_asc') return e.tier * 1000 + (e.water === 'salt' ? 1 : 0);
  if (how === 'water') return (e.water === 'salt' ? 0 : 1) * 1000 - e.tier;
  if (how === 'new') return -parseInt(String(e.id).slice(1), 10);
  return -e.tier * 1000 - (e.water === 'salt' ? 1 : 0);          // rarity, highest first
}
/* [{ key, egg, ids, n }] — stacks of identical eggs, sorted and filtered */
function eggStacks(list, how, tier, water) {
  const m = new Map();
  for (const e of list) {
    if (tier && tier !== 'all' && e.tier !== +tier) continue;
    if (water && water !== 'all' && (e.water === 'salt' ? 'salt' : e.water.startsWith('ev_') ? 'ev' : 'fresh') !== water) continue;
    const k = eggKey(e); if (!m.has(k)) m.set(k, { key: k, egg: e, ids: [] }); m.get(k).ids.push(e.id);
  }
  const out = [...m.values()]; out.forEach(s => (s.n = s.ids.length));
  return out.sort((a, b) => eggSortKey(a.egg, how) - eggSortKey(b.egg, how) || String(a.key).localeCompare(String(b.key)));
}
function discardEggs(ids) {
  const set = new Set(ids), n = S.eggs.filter(e => set.has(e.id)).length;
  if (!n) return fail('No eggs to destroy');
  S.eggs = S.eggs.filter(e => !set.has(e.id)); G.dirty = true; return { ok: true, n };
}

/* ================= SELLING & UPGRADING TANKS ================= */
const TANK_NEXT = { starter: 'medium', medium: 'large', large: 'huge', huge: 'mega', reef_s: 'reef_m', reef_m: 'reef_l', reef_l: 'reef_g', reef_g: 'reef_x' };
const TANK_REFUND = 0.5, TANK_TRADEIN = 0.5;
function tankUpgradeSpent(t) { return TANK_UPGRADES.reduce((a, u) => { let c = 0; for (let l = 0; l < t.up[u.id]; l++) c += Math.round(u.costs[l] * tankType(t).mult); return a + c; }, 0); }
const tankSellValue = t => Math.round(tankType(t).price * TANK_REFUND + tankUpgradeSpent(t) * TANK_REFUND);
function sellTankCheck(t) {
  if (!t) return 'Missing'; if (tankType(t).ev) return 'Event tanks cannot be sold';
  if (fishIn(t.id).length) return 'Move or sell the fish in this tank first';
  if (regularTanks().length <= 1) return 'You need to keep at least one tank';
  return null;
}
function sellTank(tid) {
  const t = getTank(tid), why = sellTankCheck(t); if (why) return fail(why);
  const v = tankSellValue(t);
  if (t.bg) S.decorInv[t.bg] = (S.decorInv[t.bg] || 0) + 1;
  t.slots.forEach(id => { if (id) S.decorInv[id] = (S.decorInv[id] || 0) + 1; });
  S.heroes.forEach(h => { if (h.tank === t.id) h.tank = null; });
  S.tanks = S.tanks.filter(x => x !== t); S.money += v; S.earned += v; G.dirty = true;
  return { ok: true, value: v, name: t.name };
}
/* trade a tank in for the next size up: keeps fish, decor, upgrades and name, pays the price difference */
function tankNextInfo(t) {
  const to = TANK_TYPE[TANK_NEXT[t.type]]; if (!to) return null;
  const from = tankType(t), cost = Math.max(0, Math.round(to.price - from.price * TANK_TRADEIN));
  return { to, from, cost, locked: level() < to.lvl ? to.lvl : 0 };
}
function upgradeTankType(tid) {
  const t = getTank(tid), i = t && tankNextInfo(t); if (!i) return fail('This is already the biggest tank of its kind');
  if (i.locked) return fail('Reach store level ' + i.locked + ' first');
  if (!spend(i.cost)) return fail('Not enough money');
  if (t.name === i.from.n || t.name.startsWith(i.from.n + ' #')) t.name = i.to.n + t.name.slice(i.from.n.length);
  t.type = i.to.id; G.dirty = true; return { ok: true, to: i.to };
}

/* ================= SALE TANKS & RESERVED FISH ================= */
/* The Display Handler (and Auto-fill) used to put every adult on display, so breeding stock and campaign fish got sold.
   Now: only fish in a Sale tank (or tagged "Sell soon") are ever moved to the store automatically. */
function toggleSaleTank(tid) {
  const t = getTank(tid); if (!t) return fail('Missing'); if (tankType(t).ev) return fail('Event tanks hold event fish');
  t.sale = !t.sale; return ok();
}
const hasSaleTank = () => S.tanks.some(t => t.sale);
function reservedFish(f) {
  if (f.fav || tagKept(f) || fishLocked(f)) return true;
  if (S.contracts.some(c => contractMatches(c, f))) return true;
  const c = CAMPAIGN[campCur()]; return !!(c && campMatches(c.spec, f));
}
function displayCandidates(auto) {
  return S.fish.filter(f => isAdult(f) && f.loc !== 'store' && !SPECIES[f.sp].ev && !reservedFish(f)
    && (!auto || f.tag === 'sell' || (getTank(f.loc) && getTank(f.loc).sale))).sort((a, b) => fishValue(b) * demandFactor(b) - fishValue(a) * demandFactor(a));
}

/* Breeding rest time grows with how rare the parents are: +30% per average modifier and +25% per tier above Common.
   Stops a farm of fully-loaded top-tier fish from breeding as fast as a pair of plain goldfish. */
function restFactor(a, b) {
  const mods = (a.mods.length + b.mods.length) / 2, tier = (SPECIES[a.sp].t + SPECIES[b.sp].t) / 2;
  return (1 + 0.3 * mods) * (1 + 0.25 * (tier - 1));
}

/* ================= FISH MARKET SATURATION ================= */
/* The market only absorbs a few fish at a time: every fish sold there "floods" it a little (glut), which then drains away.
   Dumping a whole tank at once pays much less — customers in your store are where the real money is. */
const MARKET_RECOVER = 0.1, MARKET_STEP = 0.035, MARKET_FLOOR = 0.25;
const marketMultAt = glut => clamp(1.1 - MARKET_STEP * glut, MARKET_FLOOR, 1);
const marketMult = () => marketMultAt(S.market.glut || 0);
const marketPrice = f => Math.round(fishValue(f) * quickSell() * marketMult() * demandFactor(f));
/* what selling this list in one go would pay, as the glut climbs */
function marketTotal(list) { let g = S.market.glut || 0, sum = 0; const seen = {}; for (const f of list) { const k = fishSig(f), d = Math.max(DEMAND_FLOOR, 1 - DEMAND_STEP * (((S.demand || {})[k] || 0) + (seen[k] || 0))); sum += fishValue(f) * quickSell() * marketMultAt(g) * d; g++; seen[k] = (seen[k] || 0) + 1; } return sum; }
const marketLabel = () => { const m = marketMult(); return m >= 1 ? 'Market open — full price' : `Market saturated — paying ${Math.round(m * 100)}%`; };

/* ================= DEMAND FOR A FISH TYPE ================= */
/* Customers get bored of the same fish: every sale of a species+modifier combination lowers what customers will offer
   for that exact type, and the demand recovers slowly. Breeding one perfect line and selling clones stops paying —
   a varied collection does. */
const DEMAND_STEP = 0.12, DEMAND_FLOOR = 0.2, DEMAND_RECOVER = 1 / 120;
const fishSig = f => f.sp + ':' + f.mods.slice().sort().join(',');
const demandFactor = f => Math.max(DEMAND_FLOOR, 1 - DEMAND_STEP * ((S.demand || {})[fishSig(f)] || 0));
function noteDemand(f) { const k = fishSig(f); S.demand[k] = (S.demand[k] || 0) + 1; }
function decayDemand(dt) { for (const k in S.demand) { S.demand[k] -= DEMAND_RECOVER * dt; if (S.demand[k] <= 0.01) delete S.demand[k]; } }

/* offspring can only climb to a tier your store has unlocked (same levels as the shop's eggs) */
const tierReachable = (water, tier) => water.startsWith('ev_') || level() >= (water === 'salt' ? SALT_EGG_UNLOCK_LEVEL : EGG_UNLOCK_LEVEL)[tier];
/* choose `n` fish for the display cases: best value first, but a variety — not five clones of the same type while other types wait */
function pickDisplay(list, n) {
  const used = new Set(storeFish().map(fishSig)), out = [];
  for (const f of list) { if (out.length >= n) break; const k = fishSig(f); if (!used.has(k)) { used.add(k); out.push(f); } }
  for (const f of list) { if (out.length >= n) break; if (!out.includes(f)) out.push(f); }
  return out;
}
