/* A reasonable, active player. Runs inside the VM context. */
const BOT = {
  log: [], lastLvl: 1, income: [], seed: 1,
  eggBudgetFrac: 0.25,
};
function botBuyUpgrades() {
  // candidate list of [bucket, cost, label, fn]
  const c = [];
  const lv = level();
  for (const u of STORE_UPGRADES) { const l = S.storeUp[u.id]; if (l < u.max) c.push([u.id === 'cases' ? 0 : 1, u.cost(l), 'store:' + u.id + (l + 1), () => buyStoreUp(u.id)]); }
  for (const u of BREED_UPGRADES) { const l = S.breedUp[u.id]; if (l < u.max) c.push([2, u.cost(l), 'breed:' + u.id + (l + 1), () => buyBreedUp(u.id)]); }
  // tanks
  const slotC = hallSlotCost(); if (slotC != null) c.push([1, slotC, 'slot' + (S.hallSlots + 1), () => buyHallSlot()]);
  for (const tt of TANK_TYPES.filter(t => !t.ev && lv >= t.lvl)) { if (regularTanks().length < S.hallSlots) c.push([1, tt.price, 'tank:' + tt.id, () => buyTank(tt.id)]); }
  // tank trade-ins
  if (typeof tankNextInfo === 'function') for (const t of S.tanks) { const i = tankNextInfo(t); if (i && !i.locked) c.push([1, i.cost, 'upg:' + i.to.id, () => upgradeTankType(t.id)]); }
  for (const t of S.tanks) for (const u of TANK_UPGRADES) { const cost = tankUpgradeCost(t, u); if (cost != null) c.push([2, cost, 'tup:' + u.id + ':' + t.type, () => buyTankUpgrade(t.id, u.id)]); }
  if (S.food < FOOD.length - 1) c.push([1, FOOD[S.food + 1].price, 'food' + (S.food + 1), () => buyFood()]);
  for (const s of STAFF) { const l = S.staff[s.id]; if (l < 3) c.push([2, hireCost(s, l), 'staff:' + s.id + (l + 1), () => hireStaff(s.id)]); }
  for (const u of UNLOCKS) if (!S.unlocks[u.id]) c.push([3, u.price, 'unlock:' + u.id, () => buyUnlock(u.id)]);
  for (const n of RNODES) { const l = lab(n.id); if (l < n.max && researchUnlocked(n) && (S.rp || 0) >= rpCost(n, l)) c.push([2, n.cost(l), 'res:' + n.id + (l + 1), () => buyResearch(n.id)]); }
  for (const d of DECOR) if (!d.ev && !(S.decorInv[d.id] > 0) && !BOT.placed[d.id]) c.push([3, d.price, 'decor:' + d.id, () => { const r = buyDecor(d.id); if (r.ok) BOT.placed[d.id] = 1; return r; }]);
  for (const s of SKINS) if (!s.ev && !S.skins[s.id]) c.push([3, s.price, 'skin:' + s.id, () => buySkin(s.id)]);
  for (const h of HEROES) if (!S.heroes.some(x => x.kind === h.id)) c.push([3, h.price, 'hero:' + h.id, () => buyHero(h.id)]);
  c.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  // buy the cheapest item of the lowest bucket that we can afford, keeping a reserve for eggs/food
  const reserve = BOT.reserve();
  let bought = 0;
  for (const bucketMax of [1, 2, 3]) {
    const aff = c.filter(x => x[0] <= bucketMax && x[1] <= S.money - reserve).sort((a, b) => a[1] - b[1]);
    for (const it of aff) { if (it[1] > S.money - reserve) continue; const r = it[3](); if (r && r.ok !== false && !r.err) { BOT.log.push([S.time, level(), it[2], it[1], S.money]); BOT.nbuy[it[2]] = S.time; bought++; if (bought >= 6) return; } }
    if (bought) return;
  }
}
BOT.placed = {}; BOT.nbuy = {};
BOT.reserve = () => Math.min(S.money * 0.15, 50 + S.fish.length * 3 + eggCostForFreeSlots() * 0.2);
function eggCostForFreeSlots() { return 0; }
function botEggs() {
  // keep every tank populated: count free slots after existing eggs
  for (const t of S.tanks.slice()) {
    if (TANK_TYPE[t.type].ev) continue;
    const eggsFor = S.eggs.filter(e => !canHatchIn(e, t)).length;
    let free = tankFree(t) - eggsFor;
    if (free <= 0) continue;
    // pick best egg kind we can afford for this tank (highest rating-compatible tier)
    let cands = EGG_TYPES.filter(e => !e.ev && e.w === TANK_TYPE[t.type].w && e.t <= rating(t) && eggUnlocked(e.id)); const topT = Math.max(0, ...cands.map(e => e.t)); cands = cands.filter(e => e.t === topT && e.pm >= 1).sort(() => Math.random() - 0.5);
    for (const e of cands) {
      const price = eggPrice(e.id);
      // buy as many as fit within the egg budget fraction
      let n = Math.min(free, Math.floor(S.money * BOT.eggBudgetFrac / price));
      // do not buy expensive eggs when breeding supplies free fish
      if (n >= 1) { const r = buyEgg(e.id, n); if (r.ok) { free -= n; BOT.eggsBought = (BOT.eggsBought || 0) + n; BOT.eggSpend = (BOT.eggSpend || 0) + n * price; break; } }
    }
  }
}
function botBreed() {
  for (const water of ['fresh', 'salt']) {
    const ad = S.fish.filter(f => isAdult(f) && SPECIES[f.sp].w === water && f.loc !== 'store' && f.ready <= S.time && !SPECIES[f.sp].ev && !fishLocked(f));
    if (ad.length < 2) continue;
    // free tank space needed for the babies
    if (S.eggs.length > 6) continue;
    ad.sort((a, b) => (b.mods.length - a.mods.length) || fishValue(b) - fishValue(a));
    const a = ad[0], b = ad.find(x => x !== a && breedCheck(a, x) === null);
    if (b) breedFish(a.id, b.id, null);
  }
}
function botSellSurplus() {
  // keep: store cases + 2 best per water for breeding; sell the rest at the market only when tanks are crowded
  const inTanks = S.fish.filter(f => isAdult(f) && f.loc !== 'store' && !SPECIES[f.sp].ev && !fishLocked(f)).sort((a, b) => fishValue(b) - fishValue(a));
  const keepStore = Math.max(0, storeCap() - storeFish().length);
  const keep = new Set(inTanks.slice(0, keepStore + 4).map(f => f.id));
  for (const f of inTanks) {
    if (keep.has(f.id)) continue;
    const t = getTank(f.loc); if (!t) continue;
    if (tankFree(t) <= 1) { const r = sellMarket(f.id); if (r.ok) BOT.marketSold = (BOT.marketSold || 0) + 1; BOT.marketRev = (BOT.marketRev || 0) + (r.price || 0); }
  }
}
function botStep() {
  // wipe glass (free time cost) when dirty
  S.tanks.forEach(t => { if (wqOf(t) < 60) { t.wq = 100; S.stats.cleaned++; } });
  hatchAll(true);
  const fc = feedAllCost(); if (fc > 0 && S.money > fc * 3) feedAll(true);
  // swap weak display fish for much better adults waiting in the tanks, then fill free cases
  { const st = storeFish(), best = S.fish.filter(f => isAdult(f) && f.loc !== 'store' && !SPECIES[f.sp].ev && !reservedFish(f)).sort((a, b) => fishValue(b) * demandFactor(b) - fishValue(a) * demandFactor(a))[0];
    if (best && st.length >= storeCap()) { const worst = st.sort((a, b) => fishValue(a) * demandFactor(a) - fishValue(b) * demandFactor(b))[0];
      if (worst && fishValue(best) * demandFactor(best) > 2 * fishValue(worst) * demandFactor(worst)) { const t = S.tanks.find(t => !TANK_TYPE[t.type].ev && tankFree(t) > 0 && !canMoveTo(worst, t)); if (t) moveFish(worst.id, t.id); else sellMarket(worst.id); } } }
  fillStore();
  // accept customer offers that are fair
  for (const c of S.customers.slice()) { if (!c.ready) continue; const f = getFish(c.fishId); if (!f) continue; if (c.offer >= 0.4 * fishValue(f)) { const r = acceptCustomer(c.id); if (r.ok) BOT.custRev = (BOT.custRev || 0) + c.offer; } else if (c.pat < 6) declineCustomer(c.id); }
  botBreed(); botEggs(); botSellSurplus(); botBuyUpgrades();
}
function runSim(hours, opts) {
  opts = opts || {};
  const base = 1.7e12; let T = 0; const dt = opts.dt || 2, N = Math.round(hours * 3600 / dt), every = Math.max(1, Math.round(3 / dt));
  newState(); S.settings.daymode = 'auto'; S.g4.guideHide = true; for (const k in TAB_REQ) S.g4.seen[k] = true;
  const rows = []; let lastSales = 0, lastEarn = 0, lastRow = 0;
  for (let i = 0; i < N; i++) {
    T += dt; window.__fakeNow = base + T * 1000;
    tick(dt);
    if (i % every === 0) botStep();
    if (i % Math.round(600 / dt) === 0) { /* every 10 min */
      const dEarn = S.earned - lastEarn; lastEarn = S.earned;
      rows.push({ t: Math.round(T / 60), lvl: level(), money: Math.round(S.money), sales: S.sales, earnH: Math.round(dEarn * 6), tanks: S.tanks.length, fish: S.fish.length, cases: storeCap(), ads: S.storeUp.ads });
    }
    if (i % 15 === 0) { BOT.ms = BOT.ms || {}; const ad = S.fish.filter(f => f.g >= 1); const mk = (k, c) => { if (BOT.ms[k] == null && c) BOT.ms[k] = Math.round(T / 60); };
      mk('mod3', ad.some(f => f.mods.some(m => MODS[m].t >= 3 && !MODS[m].exp))); mk('mod4', ad.some(f => f.mods.some(m => MODS[m].t >= 4))); mk('mods3', ad.some(f => f.mods.length >= 3)); mk('mods4', ad.some(f => f.mods.length >= 4)); mk('mods5', ad.some(f => f.mods.length >= 5));
      mk('T3', ad.some(f => SPECIES[f.sp].t >= 3)); mk('T4', ad.some(f => SPECIES[f.sp].t >= 4)); mk('T5', ad.some(f => SPECIES[f.sp].t >= 5)); mk('gen10', ad.some(f => f.gen >= 10)); mk('gen30', ad.some(f => f.gen >= 30)); }
    if (level() > BOT.lastLvl) { BOT.lastLvl = level(); BOT.lvlAt = BOT.lvlAt || {}; BOT.lvlAt[level()] = Math.round(T / 60); BOT.lvlEarn = BOT.lvlEarn || {}; BOT.lvlEarn[level()] = Math.round(S.earned); BOT.lvlSpent = BOT.lvlSpent || {}; BOT.lvlSpent[level()] = Math.round(S.earned - S.money); }
  }
  return rows;
}

function canMoveTo(f, t) { const sp = SPECIES[f.sp]; return tankType(t).w !== sp.w || rating(t) < sp.t || tankFree(t) <= 0; }
