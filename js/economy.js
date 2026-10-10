'use strict';
/* ===== Price curve =====
   The price lists in data.js / game2.js / research.js / expdata.js are written as "base" numbers. This file stretches the
   mid and late ones so that what you can buy keeps pace with what the store earns (balanced with a bot-player simulation:
   cheap things stay cheap, everything from ~$3,000 up is multiplied by up to PRICE_TOP, so a late-game store that earns tens
   of millions an hour still has meaningful things to save up for).
   Not touched: egg prices (they are tied to fish values), expedition trip costs, and rewards. */
const PRICE_LO = 3000, PRICE_HI = 500000, PRICE_TOP = 40;
function priceGain(n) {
  if (n <= PRICE_LO) return 1;
  const t = Math.min(1, Math.log(n / PRICE_LO) / Math.log(PRICE_HI / PRICE_LO)), s = t * t * (3 - 2 * t);
  return 1 + (PRICE_TOP - 1) * s;
}
function px(n) {
  if (!(n > PRICE_LO)) return n;
  const v = n * priceGain(n), mag = Math.pow(10, Math.floor(Math.log10(v)) - 2);   // keep three significant digits
  return Math.round(v / mag) * mag;
}
(function applyPriceCurve() {
  if (window.__pricesCurved) return; window.__pricesCurved = true;
  const arr = a => a.forEach((v, i) => (a[i] = px(v)));
  TANK_TYPES.forEach(t => (t.price = px(t.price)));
  // per-tank upgrade costs are curved after the tank-size multiplier — see tankUpCostAt()
  FOOD.forEach(f => (f.price = px(f.price)));
  DECOR.forEach(d => (d.price = px(d.price)));
  SKINS.forEach(s => (s.price = px(s.price)));
  CONSUMABLES.forEach(c => (c.price = px(c.price)));
  [STORE_UPGRADES, BREED_UPGRADES, EXP_UPGRADES].forEach(list => list.forEach(u => { const f = u.cost; u.cost = l => px(f(l)); }));
  HEROES.forEach(h => (h.price = px(h.price)));
  STAFF.forEach(s => arr(s.hire));
  UNLOCKS.forEach(u => (u.price = px(u.price)));
  RNODES.forEach(n => { const f = n.cost; n.cost = l => px(f(l)); });
  arr(EXP_BOAT_COSTS);
  const hs = hallSlotPrice; hallSlotPrice = n => px(hs(n));
})();
