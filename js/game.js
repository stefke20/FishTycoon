'use strict';
/* ===== Game state & logic (no DOM access in here) ===== */

const SAVE_KEY = 'fishtycoon_save_v1';
const MAX_OFFLINE = 4 * 3600;
let S = null; // game state
const G = { dirty: true, msg: () => {}, flash: () => {} };

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function newTank(typeId, n) {
  const t = TANK_TYPE[typeId];
  return {
    id: 't' + S.nextId++, type: typeId, name: n || t.n,
    up: { filter: 0, aerator: 0, light: 0, feeder: 0 },
    bg: null, slots: new Array(ITEM_SLOTS).fill(null),
    skin: 'classic', fedUntil: 0,
  };
}

function newState() {
  S = {
    v: 1, money: 100, sales: 0, earned: 0, nextId: 1, time: 0, savedAt: Date.now(),
    hallSlots: START_HALL_SLOTS, tanks: [], fish: [], eggs: [],
    decorInv: {}, items: { mut1: 0, mut2: 0, mut3: 0 }, skins: { classic: true }, food: 0,
    storeUp: { cases: 0, ads: 0, sign: 0, seats: 0, counter: 0, cashier: 0, collector: 0 },
    breedUp: { clutch: 0, cooldown: 0, match: 0, lineage: 0 },
    customers: [], nextCustomer: 8, cashierOn: true, seenHelp: false, bredCount: 0, bestValue: 0,
  };
  S.tanks.push(newTank('starter', 'My First Tank'));
  S.eggs.push({ id: 'e' + S.nextId++, water: 'fresh', tier: 1, kind: 'fresh1_pond', bred: null });
  S.eggs.push({ id: 'e' + S.nextId++, water: 'fresh', tier: 1, kind: 'fresh1_livebearer', bred: null });
  return S;
}

/* ---------- persistence ---------- */
function saveGame() {
  try { S.savedAt = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); return true; } catch (e) { return false; }
}
function loadGame() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
  if (!raw) { newState(); return { fresh: true }; }
  return importSave(raw, true);
}
function importSave(raw, offline) {
  try {
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.tanks) || typeof d.money !== 'number') throw new Error('bad save');
    const base = JSON.parse(JSON.stringify((newState(), S)));
    S = Object.assign(base, d);
    S.storeUp = Object.assign({ cases: 0, ads: 0, sign: 0, seats: 0, counter: 0, cashier: 0, collector: 0 }, d.storeUp);
    S.items = Object.assign({ mut1: 0, mut2: 0, mut3: 0 }, d.items);
    S.breedUp = Object.assign({ clutch: 0, cooldown: 0, match: 0, lineage: 0 }, d.breedUp);
    const MIG = { stingray: 'sturgeon', mantaray: 'hammerhead' };
    S.fish.forEach(f => { if (MIG[f.sp]) f.sp = MIG[f.sp]; });
    S.eggs.forEach(e => { if (e.bred && MIG[e.bred.sp]) e.bred.sp = MIG[e.bred.sp]; });
    let gained = 0;
    if (offline) {
      const gap = clamp((Date.now() - (S.savedAt || Date.now())) / 1000, 0, MAX_OFFLINE);
      if (gap > 30) gained = advanceGrowth(gap);
      S.customers = [];
      return { fresh: false, away: gap, matured: gained };
    }
    return { fresh: false };
  } catch (e) { newState(); return { fresh: true, error: true }; }
}
function exportSave() { return JSON.stringify(S); }
function resetGame() { newState(); saveGame(); G.dirty = true; }

/* ---------- lookups ---------- */
const getTank = id => S.tanks.find(t => t.id === id);
const getFish = id => S.fish.find(f => f.id === id);
const fishIn = tid => S.fish.filter(f => f.loc === tid);
const storeFish = () => S.fish.filter(f => f.loc === 'store');
const level = () => { let l = 1; for (let i = 1; i < LEVELS.length; i++) if (S.sales >= LEVELS[i]) l = i; return l; };
const nextLevelAt = () => { const l = level(); return l + 1 < LEVELS.length ? LEVELS[l + 1] : null; };
const storeCap = () => 3 + S.storeUp.cases;
const customerCap = () => 2 + S.storeUp.counter;
const foodMult = () => FOOD[S.food].mult;

function tankType(t) { return TANK_TYPE[t.type]; }
function rating(t) { return tankType(t).base + t.up.filter + t.up.aerator; }
function tankBonus(t) {
  const b = { growth: 0, value: 0, mod: 0, tier: 0, inherit: 0 };
  const add = o => { if (o) for (const k in o) b[k] += o[k]; };
  if (t.bg) add(DECOR_BY_ID[t.bg].b);
  t.slots.forEach(id => id && add(DECOR_BY_ID[id].b));
  add(SKIN[t.skin].b);
  b.growth += 0.05 * t.up.filter + 0.10 * t.up.aerator;
  b.mod += 0.15 * t.up.light;
  return b;
}
function fishValue(f) {
  let v = SPECIES[f.sp].value;
  f.mods.forEach(m => (v *= MODS[m].m));
  return Math.round(v * (1 + (f.vb || 0)));
}
function previewValue(f) { // value incl. current tank bonus for growing fish
  if (f.g >= 1 || f.loc === 'store') return fishValue(f);
  const t = getTank(f.loc); const vb = t ? tankBonus(t).value : 0;
  return fishValue({ sp: f.sp, mods: f.mods, vb });
}
function fishName(f) {
  return f.mods.map(m => MODS[m].n).join(' ') + (f.mods.length ? ' ' : '') + SPECIES[f.sp].n;
}
const isAdult = f => f.g >= 1;

/* ---------- fish creation ---------- */
function rollMods(existing, bonus) {
  const mods = existing.slice();
  MODS_LIST.forEach(m => {
    if (!mods.includes(m.id) && Math.random() < m.p * (1 + bonus)) mods.push(m.id);
  });
  return mods;
}
function makeFish(sp, mods, loc) {
  return { id: 'f' + S.nextId++, sp, mods, g: 0, vb: 0, loc, ready: 0 };
}
function tankFree(t) { return tankType(t).cap - fishIn(t.id).length; }

/* ---------- shop actions (return {ok, err}) ---------- */
const fail = err => ({ ok: false, err });
const ok = () => { G.dirty = true; return { ok: true }; };
function spend(n) { if (S.money < n) return false; S.money -= n; return true; }

const eggType = e => EGG_TYPE[e.kind] || EGG_TYPE[e.water + e.tier + '_mix'];
function eggPrice(kind) {
  const e = EGG_TYPE[kind];
  return Math.round(EGG_PRICE[e.t] * (e.w === 'salt' ? SALT_EGG_MULT : 1) * e.pm);
}
const eggLevel = e => (e.w === 'salt' ? SALT_EGG_UNLOCK_LEVEL[e.t] : EGG_UNLOCK_LEVEL[e.t]);
const hasSaltTank = () => S.tanks.some(t => tankType(t).w === 'salt');
function eggUnlocked(kind) { const e = EGG_TYPE[kind]; return level() >= eggLevel(e) && (e.w === 'fresh' || hasSaltTank()); }
function buyEgg(kind, qty) {
  qty = qty || 1;
  const e = EGG_TYPE[kind];
  if (!eggUnlocked(kind)) return fail('Not unlocked yet');
  if (!spend(eggPrice(kind) * qty)) return fail('Not enough money');
  for (let i = 0; i < qty; i++) S.eggs.push({ id: 'e' + S.nextId++, water: e.w, tier: e.t, kind, bred: null });
  return ok();
}
function buyConsumable(id) {
  const c = CONSUMABLE[id];
  if (!spend(c.price)) return fail('Not enough money');
  S.items[id]++; return ok();
}
/* Mutagen: flat chance for one extra random modifier (weighted by base rarity) */
function applyBoost(mods, boostId) {
  if (!boostId || Math.random() >= CONSUMABLE[boostId].boost) return mods;
  const pool = MODS_LIST.filter(m => !mods.includes(m.id));
  if (!pool.length) return mods;
  let r = Math.random() * pool.reduce((a, m) => a + m.p, 0);
  for (const m of pool) { r -= m.p; if (r <= 0) { G.boosted = true; return mods.concat(m.id); } }
  return mods;
}
function buyTank(typeId) {
  const tt = TANK_TYPE[typeId];
  if (level() < tt.lvl) return fail('Reach store level ' + tt.lvl);
  if (S.tanks.length >= S.hallSlots) return fail('Your aquarium hall is full — buy another slot');
  if (!spend(tt.price)) return fail('Not enough money');
  S.tanks.push(newTank(typeId, tt.n + ' #' + (S.tanks.filter(t => t.type === typeId).length + 1)));
  return ok();
}
const hallSlotCost = () => S.hallSlots >= MAX_HALL_SLOTS ? null : hallSlotPrice(S.hallSlots);
function buyHallSlot() {
  const c = hallSlotCost();
  if (c == null) return fail('Maximum reached');
  if (!spend(c)) return fail('Not enough money');
  S.hallSlots++; return ok();
}
function tankUpgradeCost(t, u) {
  const lvl = t.up[u.id];
  if (lvl >= u.max) return null;
  return Math.round(u.costs[lvl] * tankType(t).mult);
}
function buyTankUpgrade(tid, uid) {
  const t = getTank(tid), u = TANK_UPGRADES.find(x => x.id === uid);
  const c = tankUpgradeCost(t, u);
  if (c == null) return fail('Maxed');
  if (!spend(c)) return fail('Not enough money');
  t.up[uid]++; return ok();
}
function buyDecor(id) {
  const d = DECOR_BY_ID[id];
  if (!spend(d.price)) return fail('Not enough money');
  S.decorInv[id] = (S.decorInv[id] || 0) + 1; return ok();
}
function decorFits(d, t) { return d.w === 'both' || d.w === tankType(t).w; }
function placeDecor(tid, slot, id) { // slot: 'bg' or 0..3
  const t = getTank(tid), d = DECOR_BY_ID[id];
  if (!S.decorInv[id]) return fail('None in inventory');
  if (!decorFits(d, t)) return fail('This item does not suit ' + tankType(t).w + 'water');
  if ((slot === 'bg') !== (d.k === 'bg')) return fail('Wrong slot type');
  removeDecor(tid, slot, true);
  S.decorInv[id]--;
  if (slot === 'bg') t.bg = id; else t.slots[slot] = id;
  return ok();
}
function removeDecor(tid, slot, silent) {
  const t = getTank(tid);
  const cur = slot === 'bg' ? t.bg : t.slots[slot];
  if (!cur) return ok();
  S.decorInv[cur] = (S.decorInv[cur] || 0) + 1;
  if (slot === 'bg') t.bg = null; else t.slots[slot] = null;
  return silent ? { ok: true } : ok();
}
function buySkin(id) {
  const s = SKIN[id];
  if (S.skins[id]) return fail('Already owned');
  if (!spend(s.price)) return fail('Not enough money');
  S.skins[id] = true; return ok();
}
function applySkin(tid, id) {
  if (!S.skins[id]) return fail('Not owned');
  getTank(tid).skin = id; return ok();
}
function buyFood() {
  if (S.food >= FOOD.length - 1) return fail('Maxed');
  const f = FOOD[S.food + 1];
  if (!spend(f.price)) return fail('Not enough money');
  S.food++; return ok();
}
function buyStoreUp(id) {
  const u = STORE_UPGRADES.find(x => x.id === id), l = S.storeUp[id];
  if (l >= u.max) return fail('Maxed');
  if (!spend(u.cost(l))) return fail('Not enough money');
  S.storeUp[id]++; return ok();
}
function buyBreedUp(id) {
  const u = BREED_UPGRADES.find(x => x.id === id), l = S.breedUp[id];
  if (l >= u.max) return fail('Maxed');
  if (!spend(u.cost(l))) return fail('Not enough money');
  S.breedUp[id]++; return ok();
}

/* ---------- eggs / fish ---------- */
function canHatchIn(egg, t) {
  if (tankType(t).w !== egg.water) return 'Wrong water type';
  if (rating(t) < egg.tier) return 'Needs water rating ' + egg.tier + ' (has ' + rating(t) + ')';
  if (tankFree(t) <= 0) return 'Tank is full';
  return null;
}
function hatchEgg(eid, tid, boostId) {
  const egg = S.eggs.find(e => e.id === eid), t = getTank(tid);
  if (!egg || !t) return fail('Missing');
  const why = canHatchIn(egg, t);
  if (why) return fail(why);
  let sp, mods;
  if (egg.bred) { sp = egg.bred.sp; mods = egg.bred.mods.slice(); }
  else { sp = pick(eggType(egg).pool); mods = rollMods([], tankBonus(t).mod); }
  G.boosted = false;
  if (boostId) {
    if (!(S.items[boostId] > 0)) return fail('You have none of that mutagen');
    S.items[boostId]--;
    mods = applyBoost(mods, boostId);
  }
  S.eggs = S.eggs.filter(e => e !== egg);
  const f = makeFish(sp, mods, tid);
  S.fish.push(f);
  G.hatched = f;
  return ok();
}
function moveFish(fid, loc) {
  const f = getFish(fid);
  if (!f) return fail('Missing');
  if (loc === 'store') {
    if (!isAdult(f)) return fail('Only fully grown fish can be displayed');
    if (storeFish().length >= storeCap()) return fail('Display cases are full');
  } else {
    const t = getTank(loc);
    if (!t) return fail('No tank');
    if (tankType(t).w !== SPECIES[f.sp].w) return fail('Wrong water type');
    if (rating(t) < SPECIES[f.sp].t) return fail('Needs water rating ' + SPECIES[f.sp].t);
    if (tankFree(t) <= 0) return fail('Tank is full');
  }
  f.loc = loc; return ok();
}
function removeFishRefs(fid) {
  S.fish = S.fish.filter(f => f.id !== fid);
  S.customers = S.customers.filter(c => c.fishId !== fid);
}
function sellMarket(fid) {
  const f = getFish(fid);
  if (!f || !isAdult(f)) return fail('Only fully grown fish can be sold');
  const price = Math.round(fishValue(f) * QUICK_SELL);
  S.money += price; S.earned += price;
  removeFishRefs(fid); G.dirty = true;
  return { ok: true, price };
}
function feedTank(tid, auto) {
  const t = getTank(tid), fs = fishIn(tid).filter(f => !isAdult(f));
  if (!fs.length) return fail('No growing fish here');
  if (t.fedUntil - S.time > FED_DURATION * 0.5) return fail('Already well fed');
  const cost = fs.length * FEED_COST_PER_FISH;
  if (!spend(cost)) return fail('Not enough money for food');
  t.fedUntil = S.time + FED_DURATION;
  return ok();
}

/* ---------- breeding ---------- */
function breedCooldown() { return BREED_COOLDOWN * Math.pow(0.85, S.breedUp.cooldown); }
function breedCheck(a, b) {
  if (!a || !b) return 'Pick two fish';
  if (a.id === b.id) return 'Pick two different fish';
  if (!isAdult(a) || !isAdult(b)) return 'Both fish must be fully grown';
  if (SPECIES[a.sp].w !== SPECIES[b.sp].w) return 'Fresh and saltwater fish cannot breed';
  if (a.ready > S.time) return fishName(a) + ' needs to rest';
  if (b.ready > S.time) return fishName(b) + ' needs to rest';
  return null;
}
function parentBonus(a, b, key) {
  const bonus = f => { const t = getTank(f.loc); return t ? tankBonus(t)[key] : 0; };
  return (bonus(a) + bonus(b)) / 2;
}
function breedOdds(a, b) {
  const sa = SPECIES[a.sp], sb = SPECIES[b.sp];
  const tierUp = clamp(BASE_TIERUP * (1 + 0.25 * S.breedUp.lineage) * (1 + parentBonus(a, b, 'tier')), 0, 0.6);
  const inh = clamp((BASE_INHERIT + 0.10 * S.breedUp.match) * (1 + parentBonus(a, b, 'inherit')), 0, 0.9);
  const modBonus = parentBonus(a, b, 'mod');
  const species = sa.id === sb.id ? [{ sp: sa.id, p: 1 }] : [{ sp: sa.id, p: 0.5 }, { sp: sb.id, p: 0.5 }];
  const mods = {};
  [a, b].forEach(f => f.mods.forEach(m => { mods[m] = 1 - (1 - (mods[m] || 0)) * (1 - inh); }));
  MODS_LIST.forEach(m => { mods[m.id] = 1 - (1 - (mods[m.id] || 0)) * (1 - clamp(m.p * (1 + modBonus), 0, 1)); });
  return { species, tierUp, inh, mods, eggs: 1 + S.breedUp.clutch };
}
function breedFish(aid, bid, boostId) {
  const a = getFish(aid), b = getFish(bid);
  const why = breedCheck(a, b);
  if (why) return fail(why);
  const odds = breedOdds(a, b), water = SPECIES[a.sp].w;
  const inh = odds.inh, mb = parentBonus(a, b, 'mod');
  const made = [];
  if (boostId) {
    if (!(S.items[boostId] > 0)) return fail('You have none of that mutagen');
    S.items[boostId]--;
  }
  for (let i = 0; i < odds.eggs; i++) {
    let sp = pick([a, b]).sp, up = false;
    const s = SPECIES[sp];
    if (s.t < 5 && Math.random() < odds.tierUp) { sp = pick(speciesOf(water, s.t + 1)).id; up = true; }
    let mods = [];
    [a, b].forEach(p => p.mods.forEach(m => { if (!mods.includes(m) && Math.random() < inh) mods.push(m); }));
    const inherited = mods.length;
    mods = rollMods(mods, mb);
    mods = applyBoost(mods, boostId);
    const egg = { id: 'e' + S.nextId++, water, tier: SPECIES[sp].t, bred: { sp, mods } };
    S.eggs.push(egg);
    made.push({ sp, mods, up, inherited });
  }
  const cd = breedCooldown();
  a.ready = b.ready = S.time + cd;
  S.bredCount++;
  G.dirty = true;
  return { ok: true, made };
}

/* ---------- store ---------- */
const CUSTOMER_NAMES = ['Ava', 'Ben', 'Chloe', 'Dmitri', 'Elena', 'Farid', 'Gina', 'Hugo', 'Iris', 'Jonas', 'Keiko', 'Liam', 'Mina', 'Noah', 'Olga', 'Pablo', 'Quinn', 'Rosa', 'Sven', 'Tara', 'Uma', 'Vic', 'Wren', 'Xavi', 'Yara', 'Zed'];
const CUSTOMER_FACES = ['🧑', '👩', '👨', '🧓', '👧', '👦', '🧔', '👩‍🦰', '👨‍🦳', '🧑‍🎤', '🧑‍🔬', '🧑‍🍳'];
function arrivalInterval() { return 16 / (1 + 0.3 * S.storeUp.ads); }
function spawnCustomer() {
  const fs = storeFish();
  if (!fs.length || S.customers.length >= customerCap()) return;
  const taken = new Set(S.customers.map(c => c.fishId));
  const avail = fs.filter(f => !taken.has(f.id));
  if (!avail.length) return;
  let type = 'browser';
  const r = Math.random();
  const modded = avail.filter(f => f.mods.length);
  const collectP = (0.05 + 0.04 * S.storeUp.collector);
  if (modded.length && r < collectP) type = 'collector';
  else if (r < collectP + 0.18) type = 'enthusiast';
  else if (r < collectP + 0.33) type = 'bargain';
  const f = type === 'collector' ? pick(modded) : pick(avail);
  const v = fishValue(f);
  const sign = 1 + 0.06 * S.storeUp.sign;
  let mult = { browser: rnd(0.8, 1.15), enthusiast: rnd(1.1, 1.45), bargain: rnd(0.55, 0.8), collector: rnd(1.4, 2.1) }[type];
  const offer = Math.max(1, Math.round(v * mult * sign));
  const pat = 40 + 10 * S.storeUp.seats;
  S.customers.push({
    id: 'c' + S.nextId++, name: pick(CUSTOMER_NAMES), face: pick(CUSTOMER_FACES), type, fishId: f.id,
    offer, pat, patMax: pat, age: 0,
  });
  G.dirty = true;
}
function acceptCustomer(cid) {
  const c = S.customers.find(x => x.id === cid);
  if (!c) return fail('Gone');
  const f = getFish(c.fishId);
  if (!f) { S.customers = S.customers.filter(x => x !== c); return fail('Fish gone'); }
  S.money += c.offer; S.earned += c.offer; S.sales++;
  S.bestValue = Math.max(S.bestValue || 0, c.offer);
  const before = level();
  removeFishRefs(f.id);
  G.dirty = true;
  const lv = level();
  if (lv > before) G.msg('Store level ' + lv + '! New items unlocked in the shop.', 'good');
  return { ok: true, offer: c.offer };
}
function declineCustomer(cid) { S.customers = S.customers.filter(c => c.id !== cid); return ok(); }
const cashierThreshold = () => [1.5, 0.95, 0.85, 0.75][S.storeUp.cashier];

/* ---------- simulation ---------- */
function growthRate(f, t) {
  const sp = SPECIES[f.sp];
  const base = 1 / GROW_TIME[sp.t];
  const b = tankBonus(t);
  const fed = t.fedUntil > S.time ? foodMult() : 1;
  return base * (1 + b.growth) * fed;
}
function matureFish(f, t) {
  f.g = 1; f.vb = tankBonus(t).value;
  G.msg(fishName(f) + ' is fully grown! (' + fmt(fishValue(f)) + ')', 'good');
  G.dirty = true;
}
function advanceGrowth(secs) {
  let n = 0;
  S.fish.forEach(f => {
    if (f.loc === 'store' || f.g >= 1) return;
    const t = getTank(f.loc); if (!t) return;
    f.g += growthRate({ sp: f.sp }, t) * secs / (t.fedUntil > S.time ? foodMult() : 1);
    if (f.g >= 1) { f.vb = tankBonus(t).value; f.g = 1; n++; }
  });
  return n;
}
function tick(dt) {
  S.time += dt;
  S.fish.forEach(f => {
    if (f.loc === 'store' || f.g >= 1) return;
    const t = getTank(f.loc); if (!t) return;
    f.g += growthRate(f, t) * dt;
    if (f.g >= 1) matureFish(f, t);
  });
  // auto feeders
  S.tanks.forEach(t => {
    if (t.up.feeder && t.fedUntil - S.time < 5 && S.money >= 5) feedTank(t.id, true);
  });
  // store
  S.nextCustomer -= dt;
  if (S.nextCustomer <= 0) { spawnCustomer(); S.nextCustomer = arrivalInterval() * rnd(0.7, 1.3); }
  for (const c of S.customers.slice()) {
    c.pat -= dt; c.age += dt;
    const f = getFish(c.fishId);
    if (!f || f.loc !== 'store') { S.customers = S.customers.filter(x => x !== c); G.dirty = true; continue; }
    if (c.pat <= 0) { S.customers = S.customers.filter(x => x !== c); G.dirty = true; continue; }
    if (S.storeUp.cashier && S.cashierOn && c.age > 1.5 && c.offer / fishValue(f) >= cashierThreshold()) acceptCustomer(c.id);
  }
}

/* ---------- formatting ---------- */
function fmt(n) {
  n = Math.round(n);
  const a = Math.abs(n);
  if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e4) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toLocaleString('en-US');
}
