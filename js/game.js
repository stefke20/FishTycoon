'use strict';
/* ===== Game state & logic (no DOM access in here) ===== */

const SAVE_KEY = 'fishtycoon_save_v1';
const MAX_OFFLINE = 4 * 3600;
const maxOffline = () => MAX_OFFLINE + 3600 * (S && S.lab ? S.lab.nightshift || 0 : 0);
const lab = id => (S.lab && S.lab[id]) || 0;
let S = null; // game state
const G = { dirty: true, msg: () => {}, flash: () => {} };

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function newTank(typeId, n) {
  const t = TANK_TYPE[typeId];
  return {
    id: 't' + S.nextId++, type: typeId, name: n || t.n,
    up: Object.fromEntries(TANK_UPGRADES.map(u => [u.id, 0])),
    bg: null, slots: new Array(ITEM_SLOTS).fill(null),
    skin: 'classic', fedUntil: 0, wq: 100,
  };
}

function newState() {
  S = {
    v: 1, money: 100, sales: 0, earned: 0, nextId: 1, time: 0, savedAt: Date.now(),
    hallSlots: START_HALL_SLOTS, tanks: [], fish: [], eggs: [],
    decorInv: {}, items: Object.fromEntries(CONSUMABLES.map(c => [c.id, 0])), skins: { classic: true }, food: 0,
    storeUp: Object.fromEntries(STORE_UPGRADES.map(u => [u.id, 0])),
    breedUp: Object.fromEntries(BREED_UPGRADES.map(u => [u.id, 0])), lab: {}, staffPaused: {}, evBought: {}, charms: {}, hof: [], sanct: 0, titles: [],
    settings: { sound: true, fx: true, event: 'auto' }, customers: [], nextCustomer: 8,
    lineage: {}, book: { sp: {}, mods: {}, claimed: {} }, record: null, stats: { hatched: 0, marketSold: 0, contracts: 0, tokens: 0, cleaned: 0, fed: 0, spent: 0 }, ach: {},
    staff: { feeder: 0, aquarist: 0, handler: 0, hatcher: 0 }, staffT: {}, wageT: 0, unlocks: {}, contracts: [], nextContract: 40,
    heroes: [], tokens: {}, evSeen: {}, cashierOn: true, seenHelp: false, bredCount: 0, bestValue: 0,
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
    S.storeUp = Object.assign(Object.fromEntries(STORE_UPGRADES.map(u => [u.id, 0])), d.storeUp);
    S.settings = Object.assign({ sound: true, fx: true, event: 'auto' }, d.settings);
    S.stats = Object.assign({ hatched: 0, marketSold: 0, contracts: 0, tokens: 0, cleaned: 0, fed: 0, spent: 0 }, d.stats);
    S.book = Object.assign({ sp: {}, mods: {}, claimed: {} }, d.book);
    S.staff = Object.assign({ feeder: 0, aquarist: 0, handler: 0, hatcher: 0 }, d.staff);
    S.unlocks = Object.assign({}, d.unlocks);
    ['lineage', 'ach', 'staffT', 'tokens', 'evSeen', 'lab', 'staffPaused', 'evBought', 'charms'].forEach(k => { if (!S[k]) S[k] = {}; }); ['contracts', 'heroes', 'hof', 'titles'].forEach(k => { if (!S[k]) S[k] = []; });
    S.tanks.forEach(t => { if (t.wq == null) t.wq = 100; TANK_UPGRADES.forEach(u => { if (t.up[u.id] == null) t.up[u.id] = 0; }); });
    S.fish.forEach(f => { if (!f.name) f.name = defaultName(f.id); if (f.fav == null) f.fav = false; if (!S.lineage[f.id]) S.lineage[f.id] = { n: f.name, sp: f.sp, m: f.mods.slice(), p: f.parents || [], g: f.gen || 0 }; if (f.g >= 1) { if (!S.book.sp[f.sp]) S.book.sp[f.sp] = { n: 1, best: 0 }; f.mods.forEach(m => { if (!S.book.mods[m]) S.book.mods[m] = 1; }); } });
    S.items = Object.assign(Object.fromEntries(CONSUMABLES.map(c => [c.id, 0])), d.items);
    S.breedUp = Object.assign(Object.fromEntries(BREED_UPGRADES.map(u => [u.id, 0])), d.breedUp);
    const MIG = { stingray: 'sturgeon', mantaray: 'hammerhead' };
    S.fish.forEach(f => { if (MIG[f.sp]) f.sp = MIG[f.sp]; });
    S.eggs.forEach(e => { if (e.bred && MIG[e.bred.sp]) e.bred.sp = MIG[e.bred.sp]; });
    let gained = 0;
    if (offline) {
      const gap = clamp((Date.now() - (S.savedAt || Date.now())) / 1000, 0, maxOffline());
      if (gap > 30) gained = advanceGrowth(gap);
      S.customers = [];
      seedHof();
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
  const b = { growth: 0, value: 0, mod: 0, tier: 0, inherit: 0, wq: 0, auto: 0, cool: 0 };
  const add = o => { if (o) for (const k in o) b[k] += o[k]; };
  if (t.bg) add(DECOR_BY_ID[t.bg].b);
  t.slots.forEach(id => id && add(DECOR_BY_ID[id].b));
  add(SKIN[t.skin].b);
  const u = t.up;
  b.growth += 0.05 * u.filter + 0.10 * u.aerator + 0.06 * u.heater + 0.05 * lab('nutrition') + sanctGrowth();
  b.value += 0.04 * u.spot;
  b.mod += 0.15 * u.light + 0.08 * lab('genetics');
  b.inherit += 0.06 * u.dna;
  b.cool += 0.12 * u.nest;
  b.wq += 0.25 * u.uv + 0.07 * lab('chemistry');
  const hero = S.heroes.find(h => h.tank === t.id); if (hero && HERO[hero.kind]) add(HERO[hero.kind].b);
  return b;
}
const globalValueBonus = () => sanctValue() + 0.03 * lab('market') + EVENTS.reduce((a, e) => a + (S.charms[e.id] ? EVENT_CHARM_VALUE : 0), 0);
const wqValueMult = q => (q >= 80 ? 1 : 0.45 + 0.55 * Math.max(0, q) / 80);
/* value of a fish; nowq ignores the water-quality penalty (used for records) */
function fishValue(f, nowq) {
  let v = SPECIES[f.sp].value;
  f.mods.forEach(m => (v *= MODS[m].m));
  const t = f.loc && f.loc !== 'store' ? getTank(f.loc) : null;
  const vb = (t ? tankBonus(t).value : (f.vb || 0)) + globalValueBonus();
  return Math.round(v * (1 + vb) * (t && !nowq ? wqValueMult(wqOf(t)) : 1));
}
const previewValue = f => fishValue(f);
/* babies look identical and hide species and modifiers until they are fully grown */
function fishName(f) {
  if (f.g < 1) return TIER_NAMES[SPECIES[f.sp].t] + ' Baby';
  return f.mods.map(m => MODS[m].n).join(' ') + (f.mods.length ? ' ' : '') + SPECIES[f.sp].n;
}
const isAdult = f => f.g >= 1;

/* ---------- fish creation ---------- */
const waterMods = water => MODS_LIST.filter(m => !m.ev || 'ev_' + m.ev === water);
const maxTierOf = water => (water.startsWith('ev_') ? 3 : 5);
function rollMods(existing, bonus, water) {
  const mods = existing.slice();
  waterMods(water || 'fresh').forEach(m => {
    if (!mods.includes(m.id) && Math.random() < m.p * (1 + bonus)) mods.push(m.id);
  });
  return mods;
}
const NAME_POOL = ['Bubbles', 'Finley', 'Nemo', 'Goldie', 'Splash', 'Coral', 'Shelly', 'Marlin', 'Pebbles', 'Ripple', 'Sushi', 'Wanda', 'Biscuit', 'Neptune', 'Dory', 'Flash', 'Pearl', 'Mochi', 'Zippy', 'Captain', 'Gill', 'Fin Diesel', 'Moby', 'Squirt', 'Tide', 'Ziggy', 'Bruce', 'Sparkle', 'Nugget', 'Bubba', 'Pip', 'Mango', 'Ginger', 'Olive', 'Waffles', 'Jelly', 'Rocky', 'Misty', 'Doodle', 'Sunny', 'Comet', 'Poppy', 'Tango', 'Ollie', 'Skipper', 'Lulu', 'Boba', 'Kiwi', 'Atlas', 'Luna', 'Echo', 'Wasabi', 'Pickle', 'Maple', 'Basil', 'Cinder', 'Dash', 'Fern', 'Gizmo', 'Hazel'];
const defaultName = id => NAME_POOL[hash(id) % NAME_POOL.length];
function makeFish(sp, mods, loc, parents, gen) {
  const id = 'f' + S.nextId++, f = { id, sp, mods, g: 0, vb: 0, loc, ready: 0, name: pick(NAME_POOL), fav: false, parents: parents || [null, null], gen: gen || 0 };
  S.lineage[id] = { n: f.name, sp, m: mods.slice(), p: f.parents, g: f.gen };
  return f;
}
function discover(f) {
  const bk = S.book.sp[f.sp] || (S.book.sp[f.sp] = { n: 0, best: 0 }); bk.n++;
  f.mods.forEach(m => (S.book.mods[m] = (S.book.mods[m] || 0) + 1));
}
function tankFree(t) { return tankType(t).cap - fishIn(t.id).length; }

/* ---------- shop actions (return {ok, err}) ---------- */
const fail = err => ({ ok: false, err });
const ok = () => { G.dirty = true; return { ok: true }; };
function spend(n) { if (S.money < n) return false; S.money -= n; return true; }

const eggType = e => EGG_TYPE[e.kind] || EGG_TYPE[e.water + e.tier + '_mix'];
function eggPrice(kind) {
  const e = EGG_TYPE[kind];
  return Math.max(1, Math.round(EGG_PRICE[e.t] * (e.w === 'salt' ? SALT_EGG_MULT : 1) * e.pm * (1 - 0.03 * lab('wholesale'))));
}
const eggTokenCost = kind => EGG_TYPE[kind].tokens || 0;
const eggLevel = e => (e.ev ? 1 : e.w === 'salt' ? SALT_EGG_UNLOCK_LEVEL[e.t] : EGG_UNLOCK_LEVEL[e.t]);
const hasSaltTank = () => S.tanks.some(t => tankType(t).w === 'salt');
function eggUnlocked(kind) { const e = EGG_TYPE[kind]; if (e.ev) return eventActive(e.ev) && S.tanks.some(t => t.type === 'ev_' + e.ev); return level() >= eggLevel(e) && (e.w === 'fresh' || hasSaltTank()); }
function buyEgg(kind, qty) {
  qty = qty || 1;
  const e = EGG_TYPE[kind];
  if (!eggUnlocked(kind)) return fail('Not unlocked yet');
  if (e.ev) { const have = S.tokens[e.ev] || 0, cost = eggTokenCost(kind) * qty; if (have < cost) return fail('Not enough event tokens'); S.tokens[e.ev] = have - cost; }
  else if (!spend(eggPrice(kind) * qty)) return fail('Not enough money');
  for (let i = 0; i < qty; i++) S.eggs.push({ id: 'e' + S.nextId++, water: e.w, tier: e.t, kind, bred: null });
  return ok();
}
function buyConsumable(id) {
  const c = CONSUMABLE[id];
  if (!spend(c.price)) return fail('Not enough money');
  S.items[id]++; return ok();
}
/* Mutagen: flat chance for one extra random modifier (weighted by base rarity) */
function applyBoost(mods, boostId, water) {
  if (!boostId || Math.random() >= CONSUMABLE[boostId].boost) return mods;
  const pool = waterMods(water || 'fresh').filter(m => !mods.includes(m.id));
  if (!pool.length) return mods;
  let r = Math.random() * pool.reduce((a, m) => a + m.p, 0);
  for (const m of pool) { r -= m.p; if (r <= 0) { G.boosted = true; return mods.concat(m.id); } }
  return mods;
}
function buyTank(typeId) {
  const tt = TANK_TYPE[typeId];
  if (level() < tt.lvl) return fail('Reach store level ' + tt.lvl);
  if (regularTanks().length >= S.hallSlots) return fail('Your aquarium hall is full — buy another slot');
  if (!spend(tt.price)) return fail('Not enough money');
  S.tanks.push(newTank(typeId, tt.n + ' #' + (S.tanks.filter(t => t.type === typeId).length + 1)));
  return ok();
}
const regularTanks = () => S.tanks.filter(t => !TANK_TYPE[t.type].ev);
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
  else { sp = pick(eggType(egg).pool); mods = rollMods([], tankBonus(t).mod, egg.water); }
  G.boosted = false;
  if (boostId) {
    if (!(S.items[boostId] > 0)) return fail('You have none of that mutagen');
    S.items[boostId]--;
    mods = applyBoost(mods, boostId, egg.water);
  }
  S.eggs = S.eggs.filter(e => e !== egg);
  const f = makeFish(sp, mods, tid, egg.bred ? egg.bred.parents : null, egg.bred ? egg.bred.gen : 0);
  f.g = Math.min(0.6, 0.15 * S.breedUp.warmer);
  S.stats.hatched++;
  S.fish.push(f);
  G.hatched = f;
  return ok();
}
function moveFish(fid, loc) {
  const f = getFish(fid);
  if (!f) return fail('Missing');
  if (loc === 'store') {
    if (!isAdult(f)) return fail('Only fully grown fish can be displayed');
    if (SPECIES[f.sp].ev) return fail('Event fish can only be sold at the market for event tokens');
    if (storeFish().length >= storeCap()) return fail('Display cases are full');
  } else {
    const t = getTank(loc);
    if (!t) return fail('No tank');
    if (tankType(t).w !== SPECIES[f.sp].w) return fail('Wrong water type');
    if (rating(t) < SPECIES[f.sp].t) return fail('Needs water rating ' + SPECIES[f.sp].t);
    if (tankFree(t) <= 0) return fail('Tank is full');
  }
  if (loc === 'store') f.vb = f.loc !== 'store' && getTank(f.loc) ? tankBonus(getTank(f.loc)).value : (f.vb || 0);
  f.loc = loc; return ok();
}
function removeFishRefs(fid) {
  S.fish = S.fish.filter(f => f.id !== fid);
  S.customers = S.customers.filter(c => c.fishId !== fid);
}
const quickSell = () => QUICK_SELL + 0.04 * S.storeUp.auction;
function sellMarket(fid) {
  const f = getFish(fid);
  if (!f || !isAdult(f)) return fail('Only fully grown fish can be sold');
  if (f.fav) return fail('Remove the favourite star first');
  noteRecord(f); S.stats.marketSold++; const bk = S.book.sp[f.sp]; if (bk) bk.best = Math.max(bk.best, fishValue(f));
  let price = 0, tokens = 0;
  if (SPECIES[f.sp].ev) tokens = awardTokens(f);        // event fish pay tokens only, never money
  else { price = Math.round(fishValue(f) * quickSell()); S.money += price; S.earned += price; }
  removeFishRefs(fid); G.dirty = true;
  return { ok: true, price, tokens };
}
function feedTank(tid, auto) {
  const t = getTank(tid), fs = fishIn(tid).filter(f => !isAdult(f));
  if (!fs.length) return fail('No growing fish here');
  if (t.fedUntil - S.time > FED_DURATION * 0.5) return fail('Already well fed');
  const cost = fs.length * FEED_COST_PER_FISH;
  if (!spend(cost)) return fail('Not enough money for food');
  t.fedUntil = S.time + FED_DURATION; t.wq = Math.max(0, (t.wq == null ? 100 : t.wq) - 0.6 * fs.length * (1 - Math.min(0.8, tankBonus(t).wq))); S.stats.fed++;
  return ok();
}

/* ---------- quality-of-life actions ---------- */
function feedAllCost() { return S.tanks.reduce((a, t) => a + (t.fedUntil - S.time > FED_DURATION * 0.5 ? 0 : fishIn(t.id).filter(f => !isAdult(f)).length * FEED_COST_PER_FISH), 0); }
function feedAll(auto) {
  if (!auto && !S.unlocks.feedAll) return fail('Buy the Feeding Station in Shop → Management first');
  let n = 0;
  for (const t of S.tanks) { const r = feedTank(t.id); if (r.ok) n++; else if (r.err === 'Not enough money for food') return { ok: n > 0, err: r.err, n }; }
  return n ? { ok: true, n } : fail('Nothing needs feeding');
}
function fillStore() {
  const free = storeCap() - storeFish().length;
  if (free <= 0) return fail('Your display cases are full');
  const cand = S.fish.filter(f => isAdult(f) && f.loc !== 'store' && !f.fav && !SPECIES[f.sp].ev).sort((a, b) => fishValue(b) - fishValue(a)).slice(0, free);
  if (!cand.length) return fail('No fully grown fish to display');
  cand.forEach(f => (f.loc = 'store')); G.dirty = true; return { ok: true, n: cand.length };
}
function hatchAll(auto) {
  if (!auto && !S.unlocks.hatchAll) return fail('Buy the Hatchery Console in Shop → Management first');
  let n = 0;
  for (const e of S.eggs.slice()) {
    const t = S.tanks.filter(t => !canHatchIn(e, t)).sort((a, b) => rating(a) - rating(b) || tankFree(b) - tankFree(a))[0];
    if (t && hatchEgg(e.id, t.id).ok) n++;
  }
  return n ? { ok: true, n } : fail('No egg fits in any tank right now');
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
/* Every modifier a parent carries is passed on independently (so offspring get none, one or several of them),
   and there is a small extra chance of one brand-new modifier on top. */
function breedOdds(a, b) {
  const sa = SPECIES[a.sp], sb = SPECIES[b.sp], water = sa.w;
  const tierUp = clamp(BASE_TIERUP * (1 + 0.25 * S.breedUp.lineage) * (1 + parentBonus(a, b, 'tier')) + 0.02 * lab('evolution'), 0, 0.6);
  const inh = clamp((BASE_INHERIT + 0.08 * S.breedUp.match + 0.03 * lab('bloodline')) * (1 + parentBonus(a, b, 'inherit')), 0, 0.95);
  const fresh = clamp((BASE_NEWMOD + 0.015 * S.breedUp.mutation) * (1 + parentBonus(a, b, 'mod')), 0, 0.6);
  const species = sa.id === sb.id ? [{ sp: sa.id, p: 1 }] : [{ sp: sa.id, p: 0.5 }, { sp: sb.id, p: 0.5 }];
  const mods = {}, pool = waterMods(water), tot = pool.reduce((x, m) => x + m.p, 0);
  [a, b].forEach(f => f.mods.forEach(m => { mods[m] = 1 - (1 - (mods[m] || 0)) * (1 - inh); }));
  pool.forEach(m => { mods[m.id] = 1 - (1 - (mods[m.id] || 0)) * (1 - fresh * m.p / tot); });
  return { species, tierUp, inh, fresh, mods, eggs: 1 + S.breedUp.clutch };
}
function pickWeightedMod(water, have) {
  const pool = waterMods(water).filter(m => !have.includes(m.id)); if (!pool.length) return null;
  let r = Math.random() * pool.reduce((x, m) => x + m.p, 0);
  for (const m of pool) { r -= m.p; if (r <= 0) return m.id; }
  return pool[pool.length - 1].id;
}
function breedFish(aid, bid, boostId) {
  const a = getFish(aid), b = getFish(bid);
  const why = breedCheck(a, b);
  if (why) return fail(why);
  const odds = breedOdds(a, b), water = SPECIES[a.sp].w;
  const made = [];
  if (boostId) {
    if (!(S.items[boostId] > 0)) return fail('You have none of that mutagen');
    S.items[boostId]--;
  }
  for (let i = 0; i < odds.eggs; i++) {
    let sp = pick([a, b]).sp, up = false;
    const s = SPECIES[sp];
    if (s.t < maxTierOf(water) && Math.random() < odds.tierUp) { sp = pick(speciesOf(water, s.t + 1)).id; up = true; }
    let mods = [];
    [a, b].forEach(p => p.mods.forEach(m => { if (!mods.includes(m) && Math.random() < odds.inh) mods.push(m); }));
    const inherited = mods.length;
    let fresh = null;
    if (Math.random() < odds.fresh) { fresh = pickWeightedMod(water, mods); if (fresh) mods.push(fresh); }
    mods = applyBoost(mods, boostId, water);
    const egg = { id: 'e' + S.nextId++, water, tier: SPECIES[sp].t, bred: { sp, mods, parents: [a.id, b.id], gen: Math.max(a.gen || 0, b.gen || 0) + 1 } };
    S.eggs.push(egg);
    made.push({ sp, mods, up, inherited, fresh });
  }
  const cd = breedCooldown() * (1 - clamp(parentBonus(a, b, 'cool'), 0, 0.6));
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
  const rich = avail.filter(f => f.mods.length || SPECIES[f.sp].t >= 3);
  const collectP = (0.05 + 0.04 * S.storeUp.collector);
  if (S.storeUp.vip && rich.length && Math.random() < 0.04 * S.storeUp.vip) type = 'vip';
  else if (modded.length && r < collectP) type = 'collector';
  else if (r < collectP + 0.18) type = 'enthusiast';
  else if (r < collectP + 0.33) type = 'bargain';
  const f = type === 'vip' ? rich.sort((x, y) => fishValue(y) - fishValue(x))[Math.floor(Math.random() * Math.min(3, rich.length))] : type === 'collector' ? pick(modded) : pick(avail);
  const v = fishValue(f);
  const sign = 1 + 0.06 * S.storeUp.sign;
  let mult = { browser: rnd(0.8, 1.15), enthusiast: rnd(1.1, 1.45), bargain: rnd(0.55, 0.8), collector: rnd(1.4, 2.1), vip: rnd(2.5, 4) }[type];
  const offer = Math.max(1, Math.round(v * mult * sign));
  const pat = 40 + 10 * S.storeUp.seats, browse = rnd(7, 14) * (1 - 0.12 * S.storeUp.quick);
  S.customers.push({
    id: 'c' + S.nextId++, name: pick(CUSTOMER_NAMES), face: pick(CUSTOMER_FACES), type, fishId: f.id,
    offer, pat, patMax: pat, age: 0, browse, ready: false,
  });
  G.dirty = true;
}
function acceptCustomer(cid) {
  const c = S.customers.find(x => x.id === cid);
  if (!c) return fail('Gone');
  const f = getFish(c.fishId);
  if (!f) { S.customers = S.customers.filter(x => x !== c); return fail('Fish gone'); }
  noteRecord(f); awardTokens(f); const bk = S.book.sp[f.sp]; if (bk) bk.best = Math.max(bk.best, fishValue(f));
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
const wqOf = t => (t.wq == null ? 100 : t.wq);
const wqGrowth = t => { const q = wqOf(t); return (q >= 70 ? 1 : 0.35 + 0.65 * q / 70) * (q < 20 ? 0.6 : 1); };
function growthRate(f, t) {
  const sp = SPECIES[f.sp];
  const base = 1 / GROW_TIME[sp.t];
  const b = tankBonus(t);
  const fed = t.fedUntil > S.time || b.auto ? foodMult() : 1;
  return base * (1 + b.growth) * fed * wqGrowth(t);
}
function matureFish(f, t) {
  f.g = 1; f.vb = tankBonus(t).value; discover(f); noteRecord(f);
  G.msg(`${f.name} grew up into a ${fishName(f)}!` + (SPECIES[f.sp].ev ? ` (${tokenReward(f)} tokens)` : ` (${fmt(fishValue(f))})`), f.mods.length ? 'gold' : 'good'); if (G.sfx) G.sfx(f.mods.length ? 'good' : 'pop');
  G.dirty = true;
}
function advanceGrowth(secs) {
  let n = 0;
  S.tanks.forEach(t => { t.wq = Math.max(30, wqOf(t) - Math.min(secs, 3600) * 0.01 * (1 - Math.min(0.8, tankBonus(t).wq))); });
  S.fish.forEach(f => {
    if (f.loc === 'store' || f.g >= 1) return;
    const t = getTank(f.loc); if (!t) return;
    f.g += growthRate({ sp: f.sp }, t) * secs / (t.fedUntil > S.time ? foodMult() : 1);
    if (f.g >= 1) { f.vb = tankBonus(t).value; f.g = 1; n++; discover(f); noteRecord(f); }
  });
  return n;
}
function tick(dt) {
  S.time += dt;
  tickExtras(dt);
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
    c.age += dt;
    if (!c.ready) { c.browse -= dt; if (c.browse <= 0) { c.ready = true; G.dirty = true; } } else c.pat -= dt;
    const f = getFish(c.fishId);
    if (!f || f.loc !== 'store') { S.customers = S.customers.filter(x => x !== c); G.dirty = true; continue; }
    if (c.pat <= 0) { S.customers = S.customers.filter(x => x !== c); G.dirty = true; continue; }
    if (c.ready && S.storeUp.cashier && S.cashierOn && c.patMax - c.pat > 2 && c.offer / fishValue(f) >= cashierThreshold()) acceptCustomer(c.id);
  }
}

/* ---------- formatting ---------- */
function fmt(n) {
  n = Math.round(n);
  const a = Math.abs(n);
  if (a >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e4) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toLocaleString('en-US');
}
