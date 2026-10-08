'use strict';
/* ===== Expeditions, fish shows & tournaments, daily quests and login streaks ===== */

const nowMs = () => (typeof window !== 'undefined' && window.__fakeNow) || Date.now();
const todayStr = () => { const d = new Date(nowMs()); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const dayDiff = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
const fmtDur = sec => { sec = Math.max(0, Math.ceil(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}:${String(s).padStart(2, '0')}`; };

/* ---------- state ---------- */
function ensureG3() {
  S.exp = Object.assign({ slots: 1, up: {}, boats: [], log: [], caught: 0 }, S.exp);
  EXP_UPGRADES.forEach(u => { if (S.exp.up[u.id] == null) S.exp.up[u.id] = 0; });
  while (S.exp.boats.length < S.exp.slots) S.exp.boats.push(null);
  S.camp = Object.assign({ done: {} }, S.camp); if (S.rp == null) S.rp = 3; S.rpTotal = S.rpTotal || 0; S.rpFunded = S.rpFunded || 0;
  S.shows = Object.assign({ fame: 0, leagues: {}, last: {}, log: [], tourney: null, wins: 0 }, S.shows);
  S.daily = Object.assign({ date: '', quests: [], bonus: false }, S.daily);
  S.streak = Object.assign({ days: 0, best: 0, last: '', claimed: '', shields: 0 }, S.streak);
  ['wiped', 'showsEntered', 'showWins', 'exps', 'catches', 'matured', 'tourneys'].forEach(k => { if (S.stats[k] == null) S.stats[k] = 0; });
  S.fish.forEach(f => { if (!f.medals) f.medals = { g: 0, s: 0, b: 0 }; });
}

/* ================= EXPEDITIONS ================= */
const expUp = id => (S.exp.up[id] || 0);
const expDuration = l => l.dur * Math.pow(0.92, expUp('hull')) * Math.max(0.4, 1 - 0.06 * lab('navigation')) * (1 - Math.min(0.5, campPerk('exp')));                       // seconds
const expCost = (l, sup) => Math.round(l.cost * EXP_SUPPLIES[sup].mult * Math.max(0.4, 1 - 0.08 * lab('provisions')));
const expUnlocked = l => level() >= l.lvl;
const boatProgress = b => Math.max(0, Math.min(1, (nowMs() - b.start) / b.dur));
const boatReady = b => !!b && nowMs() >= b.start + b.dur;
function buyExpUpgrade(id) { const u = EXP_UPGRADES.find(x => x.id === id), l = expUp(id); if (l >= u.max) return fail('Maxed'); if (!spend(u.cost(l))) return fail('Not enough money'); S.exp.up[id] = l + 1; return ok(); }
function buyBoat() { if (S.exp.slots >= EXP_BOAT_COSTS.length) return fail('You have the maximum number of boats'); const c = EXP_BOAT_COSTS[S.exp.slots]; if (!spend(c)) return fail('Not enough money'); S.exp.slots++; S.exp.boats.push(null); return ok(); }
function sendExpedition(locId, sup) {
  const l = LOCATION[locId]; if (!l) return fail('Unknown place');
  if (!expUnlocked(l)) return fail('Reach store level ' + l.lvl + ' to sail there');
  const slot = S.exp.boats.findIndex(b => !b); if (slot < 0) return fail('All your boats are busy');
  if (!spend(expCost(l, sup))) return fail('Not enough money for supplies');
  S.exp.boats[slot] = { loc: locId, sup, start: nowMs(), dur: expDuration(l) * 1000, seed: Math.random() };
  S.stats.exps++; return ok();
}
function rollExpedition(b) {
  const l = LOCATION[b.loc], sup = EXP_SUPPLIES[b.sup], luck = 0.12 * expUp('crew') + sup.luck + (lab('legend') ? 0.4 : 0), bm = 1 + 0.25 * lab('bounty');
  const danger = l.danger * Math.pow(0.88, expUp('safety')) * (1 - sup.safe), storm = !lab('legend') && Math.random() < danger;
  let n = 2 + (Math.random() < 0.5 ? 1 : 0) + Math.floor(expUp('nets') / 2) + Math.floor(lab('cartography') / 3) + b.sup;
  if (storm) n = Math.floor(n / 2);
  const pool = SPECIES_LIST.filter(s => s.exp === l.id), w = s => (1 / Math.pow(s.t, 1.5)) * (1 + luck * (s.t - 1)), tot = pool.reduce((a, s) => a + w(s), 0);
  const catches = [];
  for (let i = 0; i < n; i++) {
    let r = Math.random() * tot, sp = pool[pool.length - 1]; for (const s of pool) { r -= w(s); if (r <= 0) { sp = s; break; } }
    let mods = rollMods([], 0.08 * lab('genetics'), sp.w);
    if (Math.random() < MODS[l.mod].p * (1 + 0.15 * expUp('sonar') + sup.luck) * 1.5) mods.push(l.mod);
    catches.push({ sp: sp.id, mods });
  }
  const loot = { cash: 0, items: {} };
  if (!storm && Math.random() < 0.18 * bm) loot.cash = Math.round(l.cost * (1 + Math.random() * 1.8));
  if (!storm && Math.random() < 0.14 * bm) { const id = l.lvl >= 7 ? 'mut3' : l.lvl >= 4 ? 'mut2' : 'mut1'; loot.items[id] = 1; }
  if (!storm && Math.random() < 0.04 + 0.01 * b.sup) loot.items.mut4 = 1;
  return { loc: l.id, sup: b.sup, storm, catches, loot };
}
function collectExpedition(slot) {
  const b = S.exp.boats[slot]; if (!b) return fail('No boat'); if (!boatReady(b)) return fail('The boat is still at sea');
  const res = rollExpedition(b), eggs = [];
  res.catches.forEach(c => { const sp = SPECIES[c.sp], egg = { id: 'e' + S.nextId++, water: sp.w, tier: sp.t, wild: b.loc, bred: { sp: c.sp, mods: c.mods, parents: [null, null], gen: 0 } }; S.eggs.push(egg); eggs.push(egg); });
  S.money += res.loot.cash; for (const k in res.loot.items) S.items[k] = (S.items[k] || 0) + res.loot.items[k];
  S.exp.boats[slot] = null; S.exp.caught += res.catches.length; S.stats.catches += res.catches.length;
  gainRP(1 + Math.floor(res.catches.length / 2)); S.exp.log.unshift({ t: nowMs(), loc: b.loc, n: res.catches.length, storm: res.storm, cash: res.loot.cash }); S.exp.log.length = Math.min(S.exp.log.length, 10);
  G.dirty = true; return { ok: true, res, eggs };
}
function tickExp() {
  S.exp.boats.forEach(b => { if (b && !b.notified && boatReady(b)) { b.notified = true; G.msg(`Your boat is back from ${LOCATION[b.loc].n}! Unload the catch on the Expeditions page.`, 'gold'); G.dirty = true; } });
}
const boatsReady = () => S.exp.boats.filter(boatReady).length;

/* ================= SHOWS & TOURNAMENTS ================= */
const LEAGUES = [
  { id: 'local', n: 'Local Fair', icon: '🎪', lvl: 2, fame: 0, fee: 50, period: 300, base: 260, prizes: [700, 280, 110], fameP: [30, 15, 6], tiers: [1, 2], mods: 1 },
  { id: 'regional', n: 'Regional Expo', icon: '🏟️', lvl: 4, fame: 150, fee: 700, period: 420, base: 430, prizes: [9000, 3500, 1400], fameP: [60, 30, 12], tiers: [2, 3], mods: 1 },
  { id: 'national', n: 'National Championship', icon: '🏆', lvl: 6, fame: 800, fee: 9000, period: 600, base: 630, prizes: [140000, 55000, 22000], fameP: [120, 60, 24], tiers: [3, 4], mods: 2 },
  { id: 'intl', n: 'International Aqua-Gala', icon: '🌍', lvl: 8, fame: 3500, fee: 110000, period: 900, base: 830, prizes: [2e6, 8e5, 3.2e5], fameP: [250, 120, 50], tiers: [4, 5], mods: 3 },
  { id: 'world', n: 'World Aquatic Grand Prix', icon: '👑', lvl: 10, fame: 15000, fee: 1.5e6, period: 1200, base: 1010, prizes: [3.2e7, 1.3e7, 5.2e6], fameP: [600, 300, 120], tiers: [5, 5], mods: 4 },
];
const LEAGUE = {}; LEAGUES.forEach(l => (LEAGUE[l.id] = l));
const SHOW_CATS = {
  grand: { n: 'Grand Champion', icon: '🏅', d: 'The most valuable fish wins.' },
  mods: { n: 'Modifier Marvel', icon: '✨', d: 'The most spectacular modifiers win.' },
  rare: { n: 'Rare Breed', icon: '💎', d: 'Rarity and tier decide.' },
  pedigree: { n: 'Bloodline Cup', icon: '📜', d: 'Generations of careful breeding.' },
  fresh: { n: 'Freshwater Cup', icon: '🌿', d: 'Grand Champion — freshwater fish only.' },
  salt: { n: 'Reef Cup', icon: '🪸', d: 'Grand Champion — saltwater fish only.' },
};
const FAME_RANKS = [[0, 'Hobbyist'], [100, 'Local Star'], [500, 'Regional Favourite'], [2000, 'National Celebrity'], [8000, 'International Icon'], [30000, 'Living Legend']];
const fameRank = () => { let r = 0; FAME_RANKS.forEach(([n], i) => { if (S.shows.fame >= n) r = i; }); return r; };
const fameBonus = () => 0.01 * fameRank();
const medalBonus = f => (f.medals ? Math.min(0.6, 0.05 * f.medals.g + 0.025 * f.medals.s + 0.012 * f.medals.b) : 0);
const leagueOpen = l => level() >= l.lvl && S.shows.fame >= l.fame;
const fishLocked = f => Object.values(S.shows.leagues).some(sh => sh && sh.entries.includes(f.id));
function showScore(f, cat) {
  const sp = SPECIES[f.sp], v = fishValue(f, true), wt = [0, 1, 2, 4, 8], sm = 1 + 0.04 * lab('grooming') + (lab('champion') ? 0.1 : 0) + campPerk('show');
  switch (cat) {
    case 'mods': return Math.round(sm * (70 * f.mods.reduce((a, m) => a + wt[MODS[m].t], 0) + 15 * sp.t));
    case 'rare': return Math.round(sm * (sp.t * 140 + 40 * Math.log10(1 + v)));
    case 'pedigree': return Math.round(sm * ((f.gen || 0) * 45 + 25 * f.mods.length + sp.t * 30));
    default: return Math.round(sm * 120 * Math.log10(1 + v));
  }
}
function showEligible(f, cat) {
  if (!isAdult(f)) return 'Still growing'; if (f.loc === 'store') return 'Take it out of the store first'; if (fishLocked(f)) return 'Already entered';
  if (cat === 'fresh' && SPECIES[f.sp].w !== 'fresh') return 'Freshwater fish only'; if (cat === 'salt' && SPECIES[f.sp].w !== 'salt') return 'Saltwater fish only';
  return null;
}
const RIVAL_NAMES = ['Aqua Annie', 'Captain Finn', 'Dr. Gill', 'Madame Coral', 'Old Man Pike', 'Kelp Kelly', 'Sir Bubbles', 'Lady Marlin', 'Tank Tony', 'Pearl Pat', 'Reef Ranger', 'Guppy Gus', 'Professor Fin', 'Nemo Nick', 'Splash Sam', 'Mrs. Minnow'];
function rivalFish(L, scoreMult) {
  const tiers = L.tiers, t = tiers[0] + Math.floor(Math.random() * (tiers[1] - tiers[0] + 1)), w = Math.random() < 0.5 ? 'fresh' : 'salt';
  const pool = SPECIES_LIST.filter(s => !s.ev && !s.exp && s.w === w && s.t === t), sp = pick(pool.length ? pool : SPECIES_LIST.filter(s => !s.ev && !s.exp && s.t === t));
  const mods = []; const regs = MODS_LIST.filter(m => !m.ev && !m.exp); for (let i = 0; i < Math.floor(Math.random() * (L.mods + 1)); i++) { const m = pick(regs); if (!mods.includes(m.id)) mods.push(m.id); }
  return { name: pick(RIVAL_NAMES), sp: sp.id, mods, score: Math.round(L.base * scoreMult) };
}
function newShow(L) {
  const cats = Object.keys(SHOW_CATS), rivals = []; const cat = pick(cats);
  for (let i = 0; i < 7; i++) rivals.push(rivalFish(L, 0.55 + Math.random() * 0.7));
  return { id: 's' + S.nextId++, league: L.id, cat, closes: nowMs() + L.period * 1000, rivals, entries: [] };
}
function ensureShows() { LEAGUES.forEach(L => { if (leagueOpen(L) && !S.shows.leagues[L.id]) S.shows.leagues[L.id] = newShow(L); }); }
function enterShow(leagueId, fid) {
  const sh = S.shows.leagues[leagueId], L = LEAGUE[leagueId], f = getFish(fid); if (!sh || !f) return fail('Missing');
  const why = showEligible(f, sh.cat); if (why) return fail(why);
  if (sh.entries.length >= 3) return fail('You can enter at most 3 fish per show');
  if (!spend(L.fee)) return fail('Not enough money for the entry fee');
  sh.entries.push(fid); S.stats.showsEntered++; return ok();
}
function resolveShow(sh) {
  const L = LEAGUE[sh.league], mood = () => 0.93 + Math.random() * 0.14, all = [];
  sh.rivals.forEach(r => all.push({ name: r.name, sp: r.sp, mods: r.mods, score: Math.round(r.score * mood()), you: false }));
  sh.entries.forEach(id => { const f = getFish(id); if (f) all.push({ name: f.name, sp: f.sp, mods: f.mods.slice(), score: Math.round(showScore(f, sh.cat) * mood()), you: true, fishId: id }); });
  all.sort((a, b) => b.score - a.score); all.forEach((r, i) => (r.place = i + 1));
  let money = 0, fame = 0, wins = 0;
  all.filter(r => r.you).forEach(r => {
    const f = getFish(r.fishId); fame += 2;
    if (r.place <= 3 && f) { money += L.prizes[r.place - 1]; fame += L.fameP[r.place - 1]; f.medals[['g', 's', 'b'][r.place - 1]]++; if (r.place === 1) wins++; }
  });
  money = Math.round(money * (1 + 0.08 * lab('sponsors'))); fame = Math.round(fame * (1 + 0.1 * lab('press')));
  S.money += money; S.earned += money; S.shows.fame += fame; S.shows.wins += wins; S.stats.showWins += wins; if (wins && lab('champion')) S.items.mut4 = (S.items.mut4 || 0) + wins;
  gainRP(sh.entries.length + all.filter(r => r.you && r.place <= 3).reduce((a, r) => a + [6, 4, 3][r.place - 1], 0));
  const rec = { league: sh.league, cat: sh.cat, t: nowMs(), results: all.slice(0, 8), money, fame, entered: sh.entries.length };
  S.shows.last[sh.league] = rec;
  if (sh.entries.length) { S.shows.log.unshift(rec); S.shows.log.length = Math.min(S.shows.log.length, 12); const best = Math.min(...all.filter(r => r.you).map(r => r.place)); G.msg(`${L.n}: your best fish placed #${best}!` + (money ? ` Prize ${fmt(money)}.` : ''), best === 1 ? 'gold' : 'good'); if (G.sfx) G.sfx(best <= 3 ? 'level' : 'pop'); G.showResult = sh.league; }
  G.dirty = true;
}
function tickShows() {
  ensureShows();
  for (const id in S.shows.leagues) {
    let sh = S.shows.leagues[id], guard = 0;
    while (sh && nowMs() >= sh.closes && guard++ < 3) { resolveShow(sh); sh = S.shows.leagues[id] = newShow(LEAGUE[id]); }
  }
}
/* head-to-head tournament: three rounds, each in a different category, and every fish can only fight once */
function startTourney(leagueId) {
  const L = LEAGUE[leagueId]; if (!L || !leagueOpen(L)) return fail('That league is not open yet');
  if (S.shows.tourney && S.shows.tourney.state === 'active') return fail('You are already in a tournament');
  const fee = L.fee * 3; if (!spend(fee)) return fail('Not enough money for the entry fee');
  const cats = ['grand', 'mods', 'rare', 'pedigree'].sort(() => Math.random() - 0.5).slice(0, 3);
  S.shows.tourney = { league: leagueId, fee, r: 0, used: [], state: 'active', log: [], rounds: cats.map((cat, i) => ({ cat, rival: rivalFish(L, [0.8, 1.0, 1.2][i] * (0.96 + Math.random() * 0.08)) })) };
  S.stats.tourneys++; return ok();
}
function tourneyFight(fid) {
  const T = S.shows.tourney; if (!T || T.state !== 'active') return fail('No tournament running');
  const f = getFish(fid); if (!f) return fail('Missing'); if (T.used.includes(fid)) return fail('That fish already fought in this tournament');
  const why = showEligible(f, 'grand'); if (why) return fail(why);
  const L = LEAGUE[T.league], rd = T.rounds[T.r], mine = Math.round(showScore(f, rd.cat) * (0.9 + Math.random() * 0.2)), theirs = Math.round(rd.rival.score * (0.9 + Math.random() * 0.2)), won = mine >= theirs;
  T.used.push(fid); T.log.push({ r: T.r, cat: rd.cat, fish: f.name, sp: f.sp, mods: f.mods.slice(), mine, rival: rd.rival, theirs, won });
  if (!won) { T.state = 'lost'; const back = Math.round(T.fee * 0.15 * T.r); S.money += back; T.prize = back; G.dirty = true; return { ok: true, won, mine, theirs, over: true }; }
  T.r++;
  if (T.r >= 3) { T.state = 'won'; const money = Math.round(L.prizes[0] * 3 * (1 + 0.08 * lab('sponsors'))), fame = Math.round(L.fameP[0] * 3 * (1 + 0.1 * lab('press'))); gainRP(10); S.money += money; S.earned += money; S.shows.fame += fame; S.shows.wins++; S.stats.showWins++; S.stats.tourneyWins = (S.stats.tourneyWins || 0) + 1; f.medals.g++; T.prize = money; T.fame = fame; }
  G.dirty = true; return { ok: true, won, mine, theirs, over: T.state !== 'active' };
}
function dismissTourney() { S.shows.tourney = null; return ok(); }

/* ================= DAILY QUESTS & STREAKS ================= */
const DAILY_MONEY = [0, 150, 400, 1200, 4000, 15000, 60000, 250000, 900000, 3e6, 1e7];
const DAILY_TYPES = {
  sell: { t: n => `Sell ${n} fish`, stat: () => S.sales + S.stats.marketSold, goal: L => 3 + L, min: 1 },
  hatch: { t: n => `Hatch ${n} egg${n > 1 ? 's' : ''}`, stat: () => S.stats.hatched, goal: L => 3 + L, min: 1 },
  grow: { t: n => `Raise ${n} fish to adulthood`, stat: () => S.stats.matured, goal: L => 2 + Math.floor(L / 2), min: 1 },
  breed: { t: n => `Breed fish ${n} time${n > 1 ? 's' : ''}`, stat: () => S.bredCount, goal: L => 2 + Math.floor(L / 3), min: 2 },
  earn: { t: n => `Earn ${fmt(n)}`, stat: () => S.earned, goal: L => Math.round(DAILY_MONEY[L] * 6), min: 1 },
  feed: { t: n => `Feed your fish ${n} times`, stat: () => S.stats.fed, goal: L => 4 + L, min: 1 },
  wipe: { t: n => `Wipe ${n} smudges off the glass`, stat: () => S.stats.wiped, goal: L => 5 + L * 2, min: 1 },
  show: { t: n => `Enter a fish in a show`, stat: () => S.stats.showsEntered, goal: () => 1, min: 2 },
  exp: { t: n => `Send an expedition`, stat: () => S.stats.exps, goal: () => 1, min: 3 },
  contract: { t: n => `Deliver a special order`, stat: () => S.stats.contracts, goal: () => 1, min: 2 },
};
const streakMult = () => 1 + Math.min(1, 0.04 * S.streak.days);
const STREAK_MILESTONES = [[7, 0.01], [14, 0.01], [30, 0.02], [60, 0.02], [100, 0.04]];
const streakBonus = () => STREAK_MILESTONES.reduce((a, [d, b]) => a + (S.streak.best >= d ? b : 0), 0);
function bestEggKind() { const L = level(), t = L >= 7 ? 5 : L >= 5 ? 4 : L >= 3 ? 3 : L >= 2 ? 2 : 1; return 'fresh' + t + '_mix'; }
function giveEggs(n, kind) { const e = EGG_TYPE[kind || bestEggKind()]; for (let i = 0; i < n; i++) S.eggs.push({ id: 'e' + S.nextId++, water: e.w, tier: e.t, kind: e.id, bred: null }); }
function newDaily(today) {
  const L = Math.max(1, Math.min(10, level())), types = Object.keys(DAILY_TYPES).filter(k => DAILY_TYPES[k].min <= L).sort(() => Math.random() - 0.5).slice(0, 3);
  return { date: today, bonus: false, quests: types.map(k => { const T = DAILY_TYPES[k]; return { type: k, goal: T.goal(L), base: T.stat(), reward: Math.round(DAILY_MONEY[L] * (0.8 + Math.random() * 0.6)), claimed: false }; }) };
}
const questProgress = q => Math.max(0, Math.min(q.goal, DAILY_TYPES[q.type].stat() - q.base));
function updateDaily() {
  const today = todayStr(); if (S.daily.date === today) return false;
  const st = S.streak;
  if (!st.last) st.days = 1;
  else { const d = dayDiff(st.last, today); if (d === 1) st.days++; else if (d === 2 && st.shields > 0) { st.shields--; st.days++; } else if (d > 1) st.days = 1; else if (d < 0) st.days = Math.max(1, st.days); }
  st.last = today; st.best = Math.max(st.best, st.days); S.daily = newDaily(today); G.dirty = true; return true;
}
const loginClaimable = () => S.streak.claimed !== todayStr();
const questsClaimable = () => S.daily.quests.filter(q => !q.claimed && questProgress(q) >= q.goal).length + (!S.daily.bonus && S.daily.quests.length && S.daily.quests.every(q => q.claimed) ? 1 : 0);
const LOGIN_REWARDS = [
  { t: m => `${fmt(m * 1.5)}`, f: m => { S.money += m * 1.5; } },
  { t: () => '2 Mutagen Drops', f: () => { S.items.mut1 += 2; } },
  { t: m => `${fmt(m * 3)}`, f: m => { S.money += m * 3; } },
  { t: () => '2 eggs', f: () => giveEggs(2) },
  { t: () => '2 Mutagen Vials', f: () => { S.items.mut2 += 2; } },
  { t: m => `${fmt(m * 6)} + Streak Shield`, f: m => { S.money += m * 6; S.streak.shields++; } },
  { t: m => `Mutagen Reactor + 3 eggs + ${fmt(m * 12)}`, f: m => { S.items.mut4++; giveEggs(3); S.money += m * 12; } },
];
function claimLogin() {
  if (!loginClaimable()) return fail('Already claimed today'); const m = DAILY_MONEY[Math.max(1, Math.min(10, level()))] * streakMult(), day = (S.streak.days - 1) % 7;
  LOGIN_REWARDS[day].f(m); gainRP(1); S.streak.claimed = todayStr(); G.dirty = true; return { ok: true, day, text: LOGIN_REWARDS[day].t(m) };
}
function claimQuest(i) {
  const q = S.daily.quests[i]; if (!q || q.claimed) return fail('Nothing to claim'); if (questProgress(q) < q.goal) return fail('Not finished yet');
  const r = Math.round(q.reward * streakMult()); q.claimed = true; gainRP(1); S.money += r; G.dirty = true; return { ok: true, reward: r };
}
function claimDailyBonus() {
  if (S.daily.bonus || !S.daily.quests.every(q => q.claimed)) return fail('Finish all three quests first');
  S.daily.bonus = true; gainRP(3); S.items.mut3++; giveEggs(2); S.money += Math.round(DAILY_MONEY[Math.max(1, level())] * 2 * streakMult()); G.dirty = true; return { ok: true };
}

/* ---------- tick ---------- */
let _g3T = 99;
let _g3Sig = '';
function tickG3(dt) {
  _g3T += dt; if (_g3T < 1) return; _g3T = 0;
  tickExp(); tickShows(); updateDaily(); flushRP();
  const sig = questsClaimable() + '|' + loginClaimable(); if (sig !== _g3Sig) { _g3Sig = sig; G.dirty = true; }
}
