'use strict';
/* ===== Your estate: the living room, a garden with a pond and an aquarium gallery with a glass tunnel, each in three levels =====
   Hall of Fame fish live here: the top 20 in the living-room aquarium, the next freshwater fish in the garden pond and the
   next saltwater fish in the gallery. Every upgrade level gives a small permanent perk. */

const ESTATE = [
  { id: 'living', n: 'Living Room', icon: '🛋️', perk: 'value', perkText: 'fish value',
    levels: [{ n: 'Cosy Lounge', req: 1, cost: 0, perk: 0 }, { n: "Collector's Lounge", req: 4, cost: 20000, perk: 0.03 }, { n: 'Grand Salon', req: 7, cost: 5e6, perk: 0.07 }],
    d: 'Your living room with the big display aquarium: the 20 most valuable fish you ever owned.' },
  { id: 'garden', n: 'Garden & Pond', icon: '🌳', perk: 'growth', perkText: 'growth in every tank',
    levels: [{ n: 'Koi Pond', req: 5, cost: 60000, perk: 0.03 }, { n: 'Water Garden', req: 7, cost: 3e6, perk: 0.07 }, { n: 'Zen Retreat', req: 9, cost: 60e6, perk: 0.12 }],
    d: 'A garden with a pond where your best freshwater fish retire. Bridge, waterfall and a gazebo come with the upgrades.' },
  { id: 'gallery', n: 'Aquarium Gallery', icon: '🐋', perk: 'mod', perkText: 'modifier chance everywhere',
    levels: [{ n: 'Glass Tunnel', req: 6, cost: 400000, perk: 0.04 }, { n: 'Twin Tunnels', req: 8, cost: 25e6, perk: 0.08 }, { n: 'Deep Dome', req: 10, cost: 300e6, perk: 0.14 }],
    d: 'A public gallery with a walk-through glass tunnel. Visitors stroll under your best saltwater fish.' },
];
const ESTATE_BY_ID = {}; ESTATE.forEach(a => (ESTATE_BY_ID[a.id] = a));
const HOF_MAX = 60;

function ensureG5() {
  S.estate = Object.assign({ lvl: {} }, S.estate);
  ESTATE.forEach(a => { if (S.estate.lvl[a.id] == null) S.estate.lvl[a.id] = a.id === 'living' ? 1 : 0; });
}
const estLvl = id => (S.estate && S.estate.lvl[id]) || 0;
function estatePerk(key) { let v = 0; if (!S || !S.estate) return 0; ESTATE.forEach(a => { const l = estLvl(a.id); if (a.perk === key && l > 0) v += a.levels[l - 1].perk; }); return v; }
/* what the next upgrade of an area needs */
function estNext(id) {
  const a = ESTATE_BY_ID[id], l = estLvl(id); if (l >= a.levels.length) return null;
  const nx = a.levels[l]; return { to: l + 1, name: nx.n, cost: nx.cost, req: nx.req, locked: level() < nx.req, perk: nx.perk, first: l === 0 };
}
function buyEstate(id) {
  const nx = estNext(id); if (!nx) return fail('Already fully upgraded');
  if (nx.locked) return fail('Reach store level ' + nx.req + ' first');
  if (!spend(nx.cost)) return fail('Not enough money');
  S.estate.lvl[id] = nx.to; G.dirty = true; if (typeof G.estateUp === 'function') G.estateUp(id, nx.to);
  return { ok: true, area: id, lvl: nx.to };
}
/* the Hall of Fame split over the venues */
function hofFor(area) {
  const all = S.hof || [];
  if (area === 'living') return all.slice(0, 20);
  const rest = all.slice(20), want = area === 'garden' ? 'fresh' : 'salt';
  return rest.filter(e => SPECIES[e.sp] && SPECIES[e.sp].w === want).slice(0, 16);
}
