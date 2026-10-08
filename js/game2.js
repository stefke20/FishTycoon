'use strict';
/* ===== Extended game systems: water quality, staff, contracts, collection, achievements, heroes, events ===== */

/* ---------- heroes ---------- */
const HEROES = [
  { id: 'cleaner', n: 'Captain Clean', price: 90000, b: { wq: 0.6 }, d: 'Cleans as he swims — water quality falls 60% slower in his tank.' },
  { id: 'nurse', n: 'Nana the Nurse Shark', price: 160000, b: { growth: 0.35 }, d: 'Watches over the babies: +35% growth for every growing fish in her tank.' },
  { id: 'sagekoi', n: 'Sage Koi', price: 240000, b: { mod: 0.25, tier: 0.08 }, d: 'Wise and lucky: +25% modifier chance and +8% tier-up chance.' },
  { id: 'octo', n: 'Octavia the Octopus', price: 320000, b: { auto: 1, wq: 0.3 }, d: 'Keeps the tank permanently fed, and feeding makes far less mess.' },
  { id: 'turtle', n: 'Old Shellby', price: 420000, b: { value: 0.15, growth: 0.1 }, d: 'A calm elder turtle: +15% fish value and +10% growth.' },
  { id: 'jelly', n: 'Moon Jelly', price: 700000, b: { tier: 0.2 }, d: 'Drifts and glows: +20% chance of higher-tier offspring.' },
  { id: 'dragoneel', n: 'Jade Dragon Eel', price: 900000, b: { inherit: 0.25 }, d: 'An ancient bloodline keeper: +25% modifier inheritance.' },
];
const HERO = {}; HEROES.forEach(h => (HERO[h.id] = h));
function buyHero(kind) {
  const h = HERO[kind];
  if (S.heroes.some(x => x.kind === kind)) return fail('You already own this hero');
  if (!spend(h.price)) return fail('Not enough money');
  S.heroes.push({ id: 'H' + S.nextId++, kind }); return ok();
}
function assignHero(hid, tid) {
  const h = S.heroes.find(x => x.id === hid); if (!h) return fail('Missing');
  if (tid) S.heroes.forEach(o => { if (o !== h && o.tank === tid) o.tank = null; });
  h.tank = tid || null; return ok();
}
const heroIn = tid => S.heroes.find(h => h.tank === tid);

/* ---------- favourites, names, lineage ---------- */
function toggleFav(fid) { const f = getFish(fid); if (!f) return fail('Missing'); f.fav = !f.fav; return ok(); }
function renameFish(fid, name) { const f = getFish(fid); if (!f) return fail('Missing'); f.name = name.trim().slice(0, 20) || f.name; if (S.lineage[fid]) S.lineage[fid].n = f.name; return ok(); }
function lineageTree(id, depth) {
  const r = S.lineage[id]; if (!r) return null;
  return { id, n: r.n, sp: r.sp, m: r.m, g: r.g, alive: !!getFish(id), parents: depth > 0 ? (r.p || []).map(p => (p ? lineageTree(p, depth - 1) : null)) : [] };
}

/* ---------- water quality ---------- */
/* Smudges on the glass mirror the water quality: [quality, number of smudges]. Below 10% the glass is covered in algae. */
const DIRT_PTS = [[100, 0], [85, 0], [75, 3], [50, 12], [25, 30], [10, 55], [0, 90]];
function dirtCount(q) {
  for (let i = 0; i < DIRT_PTS.length - 1; i++) { const [q0, n0] = DIRT_PTS[i], [q1, n1] = DIRT_PTS[i + 1]; if (q <= q0 && q >= q1) return n0 + (n1 - n0) * (q0 - q) / (q0 - q1); }
  return q < 0 ? 90 : 0;
}
function qualityForDirt(n) {
  for (let i = 0; i < DIRT_PTS.length - 1; i++) { const [q0, n0] = DIRT_PTS[i], [q1, n1] = DIRT_PTS[i + 1]; if (n >= n0 && n <= n1 && n1 > n0) return q0 - (q0 - q1) * (n - n0) / (n1 - n0); }
  return n <= 0 ? 100 : 0;
}
/* wiping a smudge: the water gets cleaner so that the number of smudges matches the quality again */
function wipedSmudge(tid, remaining) {
  const t = getTank(tid); if (!t) return;
  t.wq = Math.min(100, Math.max(wqOf(t), qualityForDirt(remaining)) + 0.9 * lab('sponge'));
  if (remaining <= 0 && wqOf(t) < 97) t.wq = 100;
  if (remaining <= 0) S.stats.cleaned++;
  G.dirty = true;
}
const cleanCost = t => Math.round((8 + 4 * fishIn(t.id).length) * Math.sqrt(tankType(t).mult));
function cleanTank(tid) {
  const t = getTank(tid); if (!t) return fail('Missing');
  if (wqOf(t) > 97) return fail('The water is already crystal clear');
  const c = cleanCost(t); if (!spend(c)) return fail('Not enough money');
  t.wq = 100; S.stats.cleaned++; return ok();
}
function cleanAll() {
  if (!S.unlocks.cleanAll) return fail('Buy the Water Station in Shop → Management first');
  let n = 0; for (const t of S.tanks) if (wqOf(t) < 97 && fishIn(t.id).length) { const r = cleanTank(t.id); if (r.ok) n++; else if (r.err !== 'The water is already crystal clear') return { ok: n > 0, err: r.err, n }; }
  return n ? { ok: true, n } : fail('All the water is already clean');
}
const cleanAllCost = () => S.tanks.reduce((a, t) => a + (wqOf(t) < 97 && fishIn(t.id).length ? cleanCost(t) : 0), 0);
function wqLabel(q) { return q >= 85 ? 'Crystal clear' : q >= 65 ? 'Clean' : q >= 40 ? 'Cloudy' : q >= 20 ? 'Murky' : q >= 10 ? 'Dirty' : 'Algae-covered'; }
function wqColor(q) { return q >= 65 ? '#4fe0a0' : q >= 40 ? '#ffc24a' : '#ff6b78'; }
function tickWater(dt) {
  S.tanks.forEach(t => {
    const n = fishIn(t.id).length; if (!n) { t.wq = Math.min(100, wqOf(t) + dt * 0.05); return; }
    const b = tankBonus(t), rate = 0.07 * (n / tankType(t).cap) / (1 + 0.7 * t.up.filter + 0.4 * t.up.aerator) * (1 - Math.min(0.85, b.wq));
    t.wq = Math.max(0, wqOf(t) - rate * dt);
  });
}

/* ---------- staff ---------- */
const STAFF = [
  { id: 'feeder', n: 'Feeder', icon: '🍤', d: 'Feeds every tank automatically.', hire: [6000, 40000, 250000], wage: [30, 100, 320], every: [90, 60, 35] },
  { id: 'aquarist', n: 'Aquarist', icon: '🧪', d: 'Changes the water in tanks that get dirty. Higher levels clean earlier.', hire: [8000, 55000, 300000], wage: [40, 120, 360], every: [60, 40, 25], thresh: [45, 60, 75] },
  { id: 'handler', n: 'Display Handler', icon: '🪣', d: 'Puts your best non-favourite adult fish into free display cases.', hire: [7000, 45000, 280000], wage: [30, 100, 300], every: [60, 40, 25] },
  { id: 'hatcher', n: 'Hatchery Tech', icon: '🥚', d: 'Hatches your eggs for you.', hire: [10000, 70000, 400000], wage: [40, 130, 380], every: [90, 60, 40] },
];
const STAFF_BY_ID = {}; STAFF.forEach(s => (STAFF_BY_ID[s.id] = s));
const staffActive = id => S.staff[id] > 0 && !S.staffPaused[id];
const staffWage = () => Math.round(STAFF.reduce((a, s) => a + (staffActive(s.id) ? s.wage[S.staff[s.id] - 1] : 0), 0) * (1 - 0.05 * lab('automation')));
function hireStaff(id) {
  const s = STAFF_BY_ID[id], l = S.staff[id];
  if (l >= 3) return fail('Maxed'); if (!spend(s.hire[l])) return fail('Not enough money');
  S.staff[id]++; return ok();
}
function pauseStaff(id) { if (!S.staff[id]) return fail('Not hired'); S.staffPaused[id] = !S.staffPaused[id]; return ok(); }
function tickStaff(dt) {
  S.wageT += dt;
  if (S.wageT >= 60) { S.wageT = 0; const w = staffWage(); if (w) { if (S.money >= w) { S.money -= w; S.stats.spent += w; S.unpaid = false; } else if (!S.unpaid) { S.unpaid = true; G.msg('Not enough money to pay your staff — they are on strike! (You can pause them in Shop → Management.)', 'bad'); } } }
  if (S.unpaid && S.money < staffWage()) return;
  const speed = 1 + 0.08 * lab('automation');
  for (const s of STAFF) {
    const l = S.staff[s.id]; if (!l || S.staffPaused[s.id]) continue;
    const t = (S.staffT[s.id] = (S.staffT[s.id] || 0) + dt * speed); if (t < s.every[l - 1]) continue; S.staffT[s.id] = 0;
    if (s.id === 'feeder') feedAll(true);
    else if (s.id === 'aquarist') S.tanks.forEach(tk => { if (wqOf(tk) < s.thresh[l - 1] && fishIn(tk.id).length) cleanTank(tk.id); });
    else if (s.id === 'handler') fillStore();
    else if (s.id === 'hatcher') hatchAll(true);
  }
}
const UNLOCKS = [
  { id: 'feedAll', n: 'Feeding Station', icon: '🍽️', d: 'Unlocks the Feed all button in the Aquarium Hall.', price: 15000 },
  { id: 'hatchAll', n: 'Hatchery Console', icon: '🥚', d: 'Unlocks the Hatch all button in the Inventory.', price: 25000 },
  { id: 'cleanAll', n: 'Water Station', icon: '🚿', d: 'Unlocks Clean all tanks in the Aquarium Hall.', price: 40000 },
  { id: 'bulkSell', n: 'Market Broker', icon: '💼', d: 'Unlocks Sell all (with filters) in the Inventory — sells every non-favourite adult you are looking at.', price: 60000 },
  { id: 'autoPair', n: 'Matchmaking Service', icon: '💞', d: 'Unlocks the Suggest pair button in Breeding, which picks the best two fish for stacking modifiers.', price: 90000 },
];
function buyUnlock(id) { const u = UNLOCKS.find(x => x.id === id); if (S.unlocks[id]) return fail('Already owned'); if (!spend(u.price)) return fail('Not enough money'); S.unlocks[id] = true; return ok(); }
/* research lab */
function buyLab(id) { const u = LAB_BY_ID[id], l = lab(id); if (l >= u.max) return fail('Maxed'); if (!spend(u.cost(l))) return fail('Not enough money'); S.lab[id] = l + 1; return ok(); }
/* sell every non-favourite adult in a list (bulk sell) */
function sellMany(ids) {
  if (!S.unlocks.bulkSell) return fail('Buy the Market Broker in Shop → Management first');
  let n = 0, money = 0, tokens = 0;
  for (const id of ids) { const f = getFish(id); if (!f || !isAdult(f) || f.fav) continue; const r = sellMarket(id); if (r.ok) { n++; money += r.price; tokens += r.tokens || 0; } }
  return n ? { ok: true, n, money, tokens } : fail('Nothing to sell');
}
/* suggest the two compatible fish that carry the most modifiers between them */
function suggestPair() {
  if (!S.unlocks.autoPair) return null;
  const ad = S.fish.filter(f => isAdult(f) && f.ready <= S.time);
  let best = null, bs = -1;
  for (let i = 0; i < ad.length; i++) for (let j = i + 1; j < ad.length; j++) {
    if (breedCheck(ad[i], ad[j])) continue;
    const u = new Set(ad[i].mods.concat(ad[j].mods)).size, sc = u * 1000 + Math.min(1e6, fishValue(ad[i]) + fishValue(ad[j])) / 1e3 + (ad[i].sp === ad[j].sp ? 0 : 5);
    if (sc > bs) { bs = sc; best = [ad[i].id, ad[j].id]; }
  }
  return best;
}

/* ---------- records, hall of fame, tokens ---------- */
function noteHof(f) {
  if (SPECIES[f.sp].ev || f.g < 1) return;
  const v = fishValue(f, true), e = { id: f.id, name: f.name, label: fishName(f), sp: f.sp, mods: f.mods.slice(), value: v, gen: f.gen || 0 };
  const i = S.hof.findIndex(x => x.id === f.id);
  if (i >= 0) { if (v > S.hof[i].value) S.hof[i] = e; else { S.hof[i].name = f.name; return; } }
  else S.hof.push(e);
  S.hof.sort((a, b) => b.value - a.value); S.hof.length = Math.min(S.hof.length, 20);
}
function seedHof() { S.fish.forEach(f => { if (f.g >= 1) noteHof(f); }); }
function noteRecord(f) {
  if (SPECIES[f.sp].ev || f.g < 1) return;
  noteHof(f);
  const v = fishValue(f, true);
  if (!S.record || v > S.record.value) {
    const had = S.record; S.record = { value: v, name: f.name, label: fishName(f), sp: f.sp, mods: f.mods.slice(), gen: f.gen || 0 };
    if (had && v > had.value * 1.15) G.msg(`New record fish: ${f.name} the ${fishName(f)} (${fmt(v)})`, 'gold');
  }
}
const tokenReward = f => { const s = SPECIES[f.sp]; if (!s.ev) return 0; const t = f.loc && f.loc !== 'store' ? getTank(f.loc) : null; return Math.max(1, Math.round(TOKEN_BASE[s.t] * (1 + 0.6 * f.mods.length) * (t ? wqValueMult(wqOf(t)) : 1))); };
function awardTokens(f) { const k = tokenReward(f); if (!k) return 0; const ev = SPECIES[f.sp].ev; S.tokens[ev] = (S.tokens[ev] || 0) + k; S.stats.tokens += k; G.msg(`+${k} ${EVENT[ev].short} tokens`, 'gold'); return k; }

/* ---------- events ---------- */
function eventActive(id) { const o = S.settings.event; return o === 'all' || o === id || eventStatus(EVENT[id]).active; }
const activeEvents = () => EVENTS.filter(e => eventActive(e.id));
const eventTank = id => S.tanks.find(t => t.type === 'ev_' + id);
function claimEventTank(id) {
  if (!eventActive(id)) return fail('This event is not running'); if (eventTank(id)) return fail('You already have this tank');
  const t = newTank('ev_' + id, EVENT[id].tank); t.skin = 'sk_' + id; t.bg = 'bg_' + id; S.skins['sk_' + id] = true; S.tanks.push(t); return ok();
}
const evYear = () => new Date().getFullYear();
function evItemId(id, kind) { return { skin: 'sk_', bg: 'bg_', decor: 'dc_', trophy: 'tr_' }[kind] + id; }
function buyEventItem(id, kind) {
  const cost = EVENT_COST[kind], key = id + ':' + kind;
  if (kind === 'skin' && S.skins['sk_' + id]) return fail('Already owned');
  if (kind === 'charm' && S.charms[id]) return fail('Already owned');
  if ((S.tokens[id] || 0) < cost) return fail('Not enough tokens');
  S.tokens[id] -= cost;
  if (kind === 'skin') S.skins['sk_' + id] = true;
  else if (kind === 'charm') S.charms[id] = 1;
  else if (kind === 'kit') S.items.mut4 = (S.items.mut4 || 0) + 3;
  else if (kind === 'crate') for (let i = 0; i < 2; i++) { const w = hasSaltTank() && i ? 'salt' : 'fresh'; S.eggs.push({ id: 'e' + S.nextId++, water: w, tier: 4, kind: w + '4_mix', bred: null }); }
  else { const did = evItemId(id, kind); S.decorInv[did] = (S.decorInv[did] || 0) + 1; }
  S.evBought[key] = (S.evBought[key] || 0) + 1;
  return ok();
}
/* every event grants a few welcome tokens the first time you see it running in a given year */
function tickEventWelcome() {
  for (const ev of EVENTS) {
    if (!eventActive(ev.id)) continue; const k = ev.id + evYear(); if (S.evSeen[k]) continue;
    S.evSeen[k] = 1; S.tokens[ev.id] = (S.tokens[ev.id] || 0) + EVENT_WELCOME_TOKENS;
    G.msg(`${ev.n} has started! You received ${EVENT_WELCOME_TOKENS} ${ev.short} tokens.`, 'gold'); G.dirty = true;
  }
}

/* ---------- contracts ---------- */
function maxSpeciesTier() { const l = level(); return l >= 7 ? 5 : l >= 5 ? 4 : l >= 3 ? 3 : l >= 2 ? 2 : 1; }
function contractSpec(c) {
  if (c.sp) return SPECIES[c.sp].n + (c.mod ? ' with ' + MODS[c.mod].n : '');
  if (c.tier) return `Any tier ${c.tier} ${c.water === 'salt' ? 'saltwater' : 'freshwater'} fish`;
  if (c.mod2) return `A fish with ${MODS[c.mod].n} and ${MODS[c.mod2].n}`;
  return `A fish with the ${MODS[c.mod].n} modifier`;
}
function contractMatches(c, f) {
  if (!isAdult(f)) return false; const s = SPECIES[f.sp];
  if (s.ev) return false;
  if (c.sp && f.sp !== c.sp) return false;
  if (c.tier && (s.t !== c.tier || s.w !== c.water)) return false;
  if (c.mod && !f.mods.includes(c.mod)) return false;
  if (c.mod2 && !f.mods.includes(c.mod2)) return false;
  return true;
}
function genContract() {
  const lv = level(), maxT = maxSpeciesTier(), waters = ['fresh'].concat(hasSaltTank() ? ['salt'] : []);
  const modPool = MODS_LIST.filter(m => !m.ev && m.t <= (lv < 4 ? 2 : lv < 6 ? 3 : 4));
  const kind = pick(lv < 2 ? ['species', 'tier'] : lv < 4 ? ['species', 'tier', 'mod'] : ['species', 'tier', 'mod', 'combo', 'mod2']);
  const c = { id: 'k' + S.nextId++, left: 900 + Math.round(rnd(0, 600)) };
  let base = 0;
  if (kind === 'species') { const s = pick(SPECIES_LIST.filter(s => !s.ev && s.t <= maxT && waters.includes(s.w))); c.sp = s.id; base = s.value; }
  else if (kind === 'tier') { c.water = pick(waters); c.tier = Math.max(1, Math.min(maxT, 1 + Math.floor(Math.random() * maxT))); base = avgValue(speciesOf(c.water, c.tier).map(s => s.id)); }
  else if (kind === 'mod') { const m = pick(modPool); c.mod = m.id; base = 80 * BASE_VALUE[Math.max(1, Math.min(maxT, m.t + 1))] / 80 * m.m; }
  else if (kind === 'combo') { const s = pick(SPECIES_LIST.filter(s => !s.ev && s.t <= maxT && waters.includes(s.w))), m = pick(modPool); c.sp = s.id; c.mod = m.id; base = s.value * m.m; }
  else { const m1 = pick(modPool); let m2 = pick(modPool); while (m2.id === m1.id) m2 = pick(modPool); c.mod = m1.id; c.mod2 = m2.id; base = BASE_VALUE[Math.min(maxT, 2)] * m1.m * m2.m; }
  c.reward = Math.round(base * rnd(1.7, 2.8) * (1 + 0.1 * lab('broker')) / 5) * 5 + 20; c.rep = 1 + Math.floor(Math.random() * 3) + (c.mod2 ? 2 : 0);
  return c;
}
function avgValue(ids) { return ids.reduce((a, id) => a + SPECIES[id].value, 0) / ids.length; }
function fulfillContract(cid, fid) {
  const c = S.contracts.find(x => x.id === cid), f = getFish(fid);
  if (!c || !f) return fail('Missing'); if (!contractMatches(c, f)) return fail('That fish does not match');
  noteRecord(f); S.money += c.reward; S.earned += c.reward; S.sales += c.rep; S.stats.contracts++;
  removeFishRefs(fid); S.contracts = S.contracts.filter(x => x !== c); G.dirty = true; return { ok: true, reward: c.reward };
}
function tickContracts(dt) {
  S.contracts.forEach(c => (c.left -= dt));
  const before = S.contracts.length; S.contracts = S.contracts.filter(c => c.left > 0); if (S.contracts.length !== before) G.dirty = true;
  if (level() < 2 || S.contracts.length >= 3) return;
  S.nextContract -= dt;
  if (S.nextContract <= 0) { S.contracts.push(genContract()); S.nextContract = (80 + Math.random() * 80) / (1 + 0.15 * lab('broker')); G.dirty = true; G.msg('New special order from a customer!', 'gold'); }
}

/* ---------- collection book ---------- */
const BOOK_MILESTONES = [{ n: 10, reward: 2500 }, { n: 25, reward: 15000 }, { n: 50, reward: 100000 }, { n: 80, reward: 600000 }];
const bookCount = () => SPECIES_LIST.filter(s => !s.ev && S.book.sp[s.id]).length;
const bookTotal = () => SPECIES_LIST.filter(s => !s.ev).length;
function claimBook(n) { const m = BOOK_MILESTONES.find(x => x.n === n); if (!m || S.book.claimed[n] || bookCount() < n) return fail('Not available'); S.book.claimed[n] = true; S.money += m.reward; S.earned += m.reward; return ok(); }

/* ---------- achievements ---------- */
const maxGen = () => S.fish.reduce((a, f) => Math.max(a, f.gen || 0), 0);
const ACHIEVEMENTS = [
  { id: 's10', n: 'Open for Business', d: 'Make 10 sales', goal: 10, val: () => S.sales, reward: 100 },
  { id: 's100', n: 'Busy Shop', d: 'Make 100 sales', goal: 100, val: () => S.sales, reward: 1500 },
  { id: 's500', n: 'Fish Emporium', d: 'Make 500 sales', goal: 500, val: () => S.sales, reward: 20000 },
  { id: 's2500', n: 'Aquatic Empire', d: 'Make 2,500 sales', goal: 2500, val: () => S.sales, reward: 250000 },
  { id: 'e10k', n: 'Pocket Change', d: 'Earn $10,000 in total', goal: 10000, val: () => S.earned, reward: 500 },
  { id: 'e1m', n: 'Millionaire', d: 'Earn $1,000,000 in total', goal: 1e6, val: () => S.earned, reward: 50000 },
  { id: 'e100m', n: 'Tycoon', d: 'Earn $100,000,000 in total', goal: 1e8, val: () => S.earned, reward: 5e6 },
  { id: 'sp10', n: 'Collector', d: 'Discover 10 species', goal: 10, val: bookCount, reward: 1000 },
  { id: 'sp40', n: 'Naturalist', d: 'Discover 40 species', goal: 40, val: bookCount, reward: 25000 },
  { id: 'spall', n: 'Completionist', d: 'Discover every regular species', goal: SPECIES_LIST.filter(s => !s.ev).length, val: bookCount, reward: 500000 },
  { id: 'm5', n: 'Mutant', d: 'Discover 5 modifiers', goal: 5, val: () => Object.keys(S.book.mods).filter(m => !MODS[m].ev).length, reward: 2000 },
  { id: 'm20', n: 'Gene Splicer', d: 'Discover 20 modifiers', goal: 20, val: () => Object.keys(S.book.mods).filter(m => !MODS[m].ev).length, reward: 60000 },
  { id: 'mall', n: 'Mutation Master', d: 'Discover every regular modifier', goal: MODS_LIST.filter(m => !m.ev).length, val: () => Object.keys(S.book.mods).filter(m => !MODS[m].ev).length, reward: 1e6 },
  { id: 'b1', n: 'First Litter', d: 'Breed fish for the first time', goal: 1, val: () => S.bredCount, reward: 200 },
  { id: 'b50', n: 'Matchmaker', d: 'Breed fish 50 times', goal: 50, val: () => S.bredCount, reward: 12000 },
  { id: 'b250', n: 'Breeding Dynasty', d: 'Breed fish 250 times', goal: 250, val: () => S.bredCount, reward: 150000 },
  { id: 'g5', n: 'Family Tree', d: 'Own a fish of generation 5', goal: 5, val: maxGen, reward: 8000 },
  { id: 'g12', n: 'Ancient Bloodline', d: 'Own a fish of generation 12', goal: 12, val: maxGen, reward: 200000 },
  { id: 'st3', n: 'Stack Attack', d: 'Own a fish with 3 modifiers', goal: 3, val: () => S.fish.reduce((a, f) => Math.max(a, f.g >= 1 ? f.mods.length : 0), 0), reward: 15000 },
  { id: 'st6', n: 'Overloaded', d: 'Own a fish with 6 modifiers', goal: 6, val: () => S.fish.reduce((a, f) => Math.max(a, f.g >= 1 ? f.mods.length : 0), 0), reward: 400000 },
  { id: 't5', n: 'Legendary Catch', d: 'Hatch a tier 5 fish', goal: 1, val: () => S.fish.filter(f => f.g >= 1 && SPECIES[f.sp].t === 5).length, reward: 30000 },
  { id: 'c1', n: 'Special Delivery', d: 'Complete a special order', goal: 1, val: () => S.stats.contracts, reward: 500 },
  { id: 'c25', n: 'Reliable Supplier', d: 'Complete 25 special orders', goal: 25, val: () => S.stats.contracts, reward: 80000 },
  { id: 'h1', n: 'Bodyguard', d: 'Own a hero fish', goal: 1, val: () => S.heroes.length, reward: 10000 },
  { id: 'h4', n: 'Justice League', d: 'Own 4 hero fish', goal: 4, val: () => S.heroes.length, reward: 300000 },
  { id: 'sf1', n: 'Hired Help', d: 'Hire a staff member', goal: 1, val: () => Object.values(S.staff).filter(Boolean).length, reward: 2000 },
  { id: 'sf4', n: 'Full Crew', d: 'Hire all four kinds of staff', goal: 4, val: () => Object.values(S.staff).filter(Boolean).length, reward: 60000 },
  { id: 'tk', n: 'Festive Spirit', d: 'Earn 100 event tokens', goal: 100, val: () => S.stats.tokens, reward: 25000 },
  { id: 'cl', n: 'Squeaky Clean', d: 'Clean tank water 20 times', goal: 20, val: () => S.stats.cleaned, reward: 3000 },
  { id: 'rc1', n: 'Prize Fish', d: 'Own a fish worth $1,000', goal: 1000, val: () => (S.record ? S.record.value : 0), reward: 2000 },
  { id: 'rc100', n: 'Show Champion', d: 'Own a fish worth $100,000', goal: 1e5, val: () => (S.record ? S.record.value : 0), reward: 100000 },
  { id: 'rc10m', n: 'Priceless', d: 'Own a fish worth $10,000,000', goal: 1e7, val: () => (S.record ? S.record.value : 0), reward: 5e6 },
  { id: 'l5', n: 'Rising Star', d: 'Reach store level 5', goal: 5, val: level, reward: 5000 },
  { id: 'l7', n: 'Master Aquarist', d: 'Reach the maximum store level', goal: MAX_LEVEL, val: level, reward: 400000 },
  { id: 'sanct', n: 'Ocean Legend', d: 'Complete the Great Sanctuary', goal: 5, val: () => S.sanct, reward: 20e6 },
  { id: 'fav5', n: 'Pet Lover', d: 'Favourite 5 fish', goal: 5, val: () => S.fish.filter(f => f.fav).length, reward: 2500 },
];
function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (S.ach[a.id]) continue;
    if (a.val() >= a.goal) { S.ach[a.id] = 1; S.money += a.reward; G.msg(`Achievement: ${a.n} (+${fmt(a.reward)})`, 'gold'); G.sfx && G.sfx('level'); G.dirty = true; }
  }
}

/* ---------- end-game: the Great Sanctuary ---------- */
const maxMods = () => S.fish.reduce((a, f) => Math.max(a, f.g >= 1 ? f.mods.length : 0), 0);
const regMods = () => Object.keys(S.book.mods).filter(m => !MODS[m].ev).length;
const SANCT = [
  { n: 'Foundations', cost: 5e6, reqT: 'Discover 40 species', req: () => bookCount() >= 40, bonus: { value: 0.10 }, d: 'Lay the foundations of your life\'s work.' },
  { n: 'The Grand Hall', cost: 25e6, reqT: 'Own a fully grown fish with 4 modifiers', req: () => maxMods() >= 4, bonus: { value: 0.10, growth: 0.10 }, d: 'A hall worthy of the finest bloodlines.' },
  { n: 'The Living Reef', cost: 100e6, reqT: 'Own a generation-10 fish and 3 hero fish', req: () => maxGen() >= 10 && S.heroes.length >= 3, bonus: { value: 0.15 }, d: 'A vast reef that cleans, feeds and protects itself.' },
  { n: 'The Deep Vault', cost: 500e6, reqT: 'Own a $10M fish and discover 25 modifiers', req: () => (S.record ? S.record.value : 0) >= 1e7 && regMods() >= 25, bonus: { value: 0.20 }, d: 'Store the rarest genes on Earth.' },
  { n: 'The Great Sanctuary', cost: 2e9, reqT: 'Discover every species and own every hero', req: () => bookCount() >= bookTotal() && S.heroes.length >= HEROES.length, bonus: { value: 0.25 }, d: 'The crowning achievement: a sanctuary for every fish in the sea.' },
];
const sanctValue = () => SANCT.slice(0, S.sanct).reduce((a, x) => a + (x.bonus.value || 0), 0);
const sanctGrowth = () => SANCT.slice(0, S.sanct).reduce((a, x) => a + (x.bonus.growth || 0), 0);
function buildSanct() {
  const st = SANCT[S.sanct]; if (!st) return fail('Complete');
  if (!st.req()) return fail('Requirement not met: ' + st.reqT);
  if (!spend(st.cost)) return fail('Not enough money');
  S.sanct++; if (S.sanct >= SANCT.length && !S.titles.includes('Ocean Legend')) S.titles.push('Ocean Legend'); return ok();
}

/* ---------- tick ---------- */
let _achT = 0, _evT = 99;
function tickExtras(dt) {
  tickWater(dt); tickStaff(dt); tickContracts(dt); _evT += dt; if (_evT > 3) { _evT = 0; tickEventWelcome(); }
  _achT += dt; if (_achT > 2) { _achT = 0; checkAchievements(); }
}
