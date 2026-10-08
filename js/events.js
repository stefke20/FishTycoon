'use strict';
/* ===== Seasonal events: data is registered into the global tables from data.js ===== */

const EVENTS = [
  { id: 'valentine', n: "Valentine's Hearts", short: 'Valentine', from: [2, 7], to: [2, 21], color: '#ff6a9a', icon: '💝', tank: "Cupid's Cove", gravel: '#e8b8c8', frame: '#b8325a' },
  { id: 'stpat', n: "St. Patrick's Lagoon", short: 'Lucky', from: [3, 10], to: [3, 24], color: '#4fd070', icon: '☘️', tank: "Leprechaun's Lagoon", gravel: '#b8d8a0', frame: '#2f8f4a' },
  { id: 'spring', n: 'Spring Bloom', short: 'Spring', from: [4, 1], to: [4, 21], color: '#f0a8d8', icon: '🌸', tank: 'Blossom Pond', gravel: '#e8d8b8', frame: '#c070a8' },
  { id: 'summer', n: 'Summer Splash', short: 'Summer', from: [7, 1], to: [7, 31], color: '#ffc83a', icon: '🏖️', tank: 'Sunny Shallows', gravel: '#f0dca0', frame: '#e08a2a' },
  { id: 'halloween', n: 'Haunted Harvest', short: 'Haunted', from: [10, 1], to: [11, 2], color: '#ff8a1e', icon: '🎃', tank: 'Haunted Hollow', gravel: '#4a3a50', frame: '#ff8a1e' },
  { id: 'winter', n: 'Winter Wonderland', short: 'Winter', from: [12, 10], to: [1, 3], color: '#8ad4ff', icon: '🎄', tank: "Santa's Snow Globe", gravel: '#e8f0f8', frame: '#c0303a' },
];
const EVENT = {};
EVENTS.forEach(e => (EVENT[e.id] = e));

/* [evId, speciesId, name, tier, c, c2, shape, pattern, value-factor, archetype] */
const EVENT_SPECIES = [
  ['stpat', 'shamrock', 'Shamrock Tetra', 1, '#2f9e5a', '#d8f2cc', 'slender', 'hstripes', 1.0, 'tetra'],
  ['stpat', 'cloverguppy', 'Clover Guppy', 1, '#4cb86c', '#f0f8d8', 'slender', 'spots', 1.0, 'guppy'],
  ['stpat', 'leprechaun', 'Leprechaun Betta', 2, '#2f8f4a', '#f09a1e', 'round', 'none', 1.1, 'betta'],
  ['stpat', 'rainbowtrout', 'Rainbow Trout', 2, '#c8d8c0', '#f0b030', 'slender', 'patch', 1.0, 'koi'],
  ['stpat', 'goldpot', 'Pot-o-Gold Arowana', 3, '#d9a521', '#2f8f4a', 'eel', 'belly', 1.15, 'arowana'],
  ['valentine', 'rosebetta', 'Rose Betta', 1, '#d83a62', '#f08aa8', 'round', 'none', 1.0, 'betta'],
  ['valentine', 'hearttetra', 'Heart Tetra', 1, '#e86a8a', '#ffd0dc', 'slender', 'stripes', 1.0, 'tetra'],
  ['valentine', 'candyheart', 'Candy Heart Guppy', 2, '#f2a0c0', '#ffe0ec', 'slender', 'spots', 1.05, 'guppy'],
  ['valentine', 'cupidangel', 'Cupid Angelfish', 2, '#f5e6ec', '#d83a62', 'tall', 'stripes', 1.1, 'angel'],
  ['valentine', 'sweetdiscus', 'Sweetheart Discus', 3, '#e0527a', '#ffb0c8', 'tall', 'stripes', 1.15, 'discus'],
  ['spring', 'bunnygold', 'Bunny Goldfish', 1, '#f4d6e0', '#ffffff', 'round', 'belly', 1.0, 'goldfish'],
  ['spring', 'daffodil', 'Daffodil Guppy', 1, '#f2d03a', '#fff4a0', 'slender', 'belly', 1.0, 'guppy'],
  ['spring', 'eggtetra', 'Painted Egg Tetra', 2, '#a0d8e8', '#f0a0d0', 'slender', 'spots', 1.05, 'tetra'],
  ['spring', 'blossomkoi', 'Blossom Koi', 2, '#f8f0f4', '#f08ab0', 'slender', 'patch', 1.1, 'koi'],
  ['spring', 'pastelDiscus', 'Pastel Discus', 3, '#b8e0c8', '#e0b8f0', 'tall', 'stripes', 1.15, 'discus'],
  ['summer', 'sunnydamsel', 'Sunny Damselfish', 1, '#ffcc2a', '#ff9a1e', 'round', 'belly', 1.0, 'round'],
  ['summer', 'beachpuffer', 'Beach Ball Puffer', 1, '#ff5a5a', '#4aa8ff', 'puffer', 'stripes', 1.0, 'urchin'],
  ['summer', 'coconut', 'Coconut Molly', 2, '#8a5a34', '#f4ead0', 'round', 'belly', 1.0, 'platy'],
  ['summer', 'tropicparrot', 'Tropic Parrotfish', 2, '#22c8b0', '#ff8a3a', 'round', 'stripes', 1.1, 'parrot'],
  ['summer', 'pinetrigger', 'Pineapple Triggerfish', 3, '#f0c030', '#4a8a3a', 'round', 'spots', 1.15, 'trigger'],
  ['halloween', 'jackpuffer', 'Jack-o-Lantern Puffer', 1, '#ff8a1e', '#2a1a10', 'puffer', 'spots', 1.0, 'urchin'],
  ['halloween', 'vampiretetra', 'Vampire Tetra', 1, '#2a1a30', '#c0203a', 'slender', 'belly', 1.0, 'tetra'],
  ['halloween', 'witchbetta', 'Witch Betta', 2, '#5a2a8a', '#6ac040', 'round', 'none', 1.1, 'betta'],
  ['halloween', 'mummyeel', 'Mummy Eel', 2, '#d8d0b0', '#8a8068', 'eel', 'stripes', 1.0, 'eel'],
  ['halloween', 'phantomkoi', 'Phantom Koi', 3, '#e8e0f8', '#6a4aa0', 'slender', 'patch', 1.15, 'koi'],
  ['winter', 'santabetta', 'Santa Betta', 1, '#d02a2a', '#f8f8f8', 'round', 'none', 1.0, 'betta'],
  ['winter', 'gingerbread', 'Gingerbread Tetra', 1, '#a86a34', '#f8f0e0', 'slender', 'hstripes', 1.0, 'tetra'],
  ['winter', 'snowangel', 'Snowflake Angelfish', 2, '#e8f4ff', '#5aa8e8', 'tall', 'stripes', 1.1, 'angel'],
  ['winter', 'reindeer', 'Reindeer Oscar', 2, '#8a5a34', '#d02a2a', 'round', 'patch', 1.0, 'cichlid'],
  ['winter', 'frostarowana', 'Frost Arowana', 3, '#bfe4f8', '#ffffff', 'eel', 'belly', 1.15, 'arowana'],
];
/* [evId, id, name, tier, mult, chance, glow, icon, description] */
const EVENT_MODS = [
  ['stpat', 'lucky', 'Lucky Charm', 1, 3, 0.07, '#5fe08a', '☘️', 'Shimmering green with drifting four-leaf clovers'],
  ['stpat', 'potgold', 'Pot of Gold', 2, 8, 0.016, '#ffd23f', '🪙', 'Solid gold, trailing a shower of coins'],
  ['valentine', 'lovestruck', 'Lovestruck', 1, 3, 0.07, '#ff6a9a', '💘', 'Blushing pink, floating hearts'],
  ['valentine', 'cupid', "Cupid's Blessing", 2, 8, 0.016, '#ffd0e0', '💝', 'Rose-gold with a halo of arrows and sparkles'],
  ['spring', 'blossom', 'Blossom', 1, 3, 0.07, '#ffb0d8', '🌸', 'Petal-pink and shedding cherry blossoms'],
  ['spring', 'dyed', 'Easter-Dyed', 2, 8, 0.016, '#c0a0ff', '🥚', 'Pastel stripes, dots and zigzags'],
  ['summer', 'sunkissed', 'Sun-kissed', 1, 3, 0.07, '#ffc83a', '☀️', 'Warm tan with sun glints'],
  ['summer', 'splash', 'Splashy', 2, 8, 0.016, '#6ad0ff', '💦', 'Glossy blue with flying water droplets'],
  ['halloween', 'pumpkinlit', 'Pumpkin-lit', 1, 3, 0.07, '#ff8a1e', '🎃', 'Glows from within like a jack-o-lantern'],
  ['halloween', 'haunted', 'Haunted', 2, 8, 0.016, '#b080ff', '🕯️', 'Translucent, circled by spirits'],
  ['winter', 'candycane', 'Candy Cane', 1, 3, 0.07, '#ff5a5a', '🍭', 'Red-and-white spiral stripes'],
  ['winter', 'festive', 'Festive Lights', 2, 8, 0.016, '#fff0a0', '🎄', 'Strung with twinkling fairy lights'],
];
/* skins / backgrounds / decor bought with event tokens: [evId, kind, name, tokens] */
const EVENT_SHOP = {
  stpat: { skin: ['Emerald Isle Frame', 80], bg: ['Rainbow Meadow', 110], decor: ['Pot of Gold', 160, '🪙'] },
  valentine: { skin: ['Rosewood Frame', 80], bg: ['Heart Balloons', 110], decor: ['Rose Arch', 160, '🌹'] },
  spring: { skin: ['Blossom Frame', 80], bg: ['Cherry Orchard', 110], decor: ['Easter Basket', 160, '🧺'] },
  summer: { skin: ['Driftwood Frame', 80], bg: ['Beach Sunset', 110], decor: ['Sandcastle & Umbrella', 160, '🏖️'] },
  halloween: { skin: ['Cursed Frame', 80], bg: ['Graveyard Moon', 110], decor: ['Jack-o-Lantern', 160, '🎃'] },
  winter: { skin: ['Candy Cane Frame', 80], bg: ['Snowy Village', 110], decor: ['Christmas Tree', 160, '🎄'] },
};
const EVENT_BASE_VALUE_MULT = 1.3, EVENT_EGG_MULT = 1.6;
const TOKEN_BASE = [0, 2, 6, 16];

/* ---- register into the global tables ---- */
(function registerEvents() {
  EVENT_SPECIES.forEach(([ev, id, n, t, c, c2, sh, pt, v, arch]) => {
    const s = { id, n, t, w: 'ev_' + ev, f: EVENT[ev].short, c, c2, sh, pt, v, ev };
    s.value = Math.round(BASE_VALUE[t] * v * EVENT_BASE_VALUE_MULT);
    SPECIES_LIST.push(s); SPECIES[id] = s;
  });
  EVENT_MODS.forEach(([ev, id, n, t, m, p, glow, icon, d]) => { const o = { id, n, t, m, p, glow, icon, d, ev }; MODS_LIST.push(o); MODS[id] = o; });
  EVENTS.forEach(ev => {
    const w = 'ev_' + ev.id;
    TANK_TYPES.push({ id: w, n: ev.tank, w, base: 3, cap: 12, price: 0, lvl: 99, mult: 8, ev: ev.id }); TANK_TYPE[w] = TANK_TYPES[TANK_TYPES.length - 1];
    for (let t = 1; t <= 3; t++) {
      const pool = SPECIES_LIST.filter(s => s.w === w && s.t === t).map(s => s.id);
      const e = { id: w + t + '_mix', n: ev.short + ' Egg', w, t, pool, pm: EVENT_EGG_MULT, ev: ev.id };
      EGG_TYPES.push(e); EGG_TYPE[e.id] = e;
    }
    const sh = EVENT_SHOP[ev.id];
    const sk = { id: 'sk_' + ev.id, n: sh.skin[0], price: 0, tokens: sh.skin[1], gravel: ev.gravel, frame: ev.frame, b: { value: 0.06, growth: 0.03 }, ev: ev.id };
    SKINS.push(sk); SKIN[sk.id] = sk;
    const bg = { id: 'bg_' + ev.id, n: sh.bg[0], e: ev.icon, k: 'bg', w: 'both', price: 0, tokens: sh.bg[1], b: { value: 0.1, mod: 0.1 }, css: '', ev: ev.id };
    const dc = { id: 'dc_' + ev.id, n: sh.decor[0], e: sh.decor[2], k: 'acc', w: 'both', price: 0, tokens: sh.decor[1], b: { mod: 0.15, tier: 0.12 }, ev: ev.id };
    DECOR.push(bg, dc); DECOR_BY_ID[bg.id] = bg; DECOR_BY_ID[dc.id] = dc;
  });
})();

/* ---- calendar ---- */
function eventWindow(ev, year) { // returns [start, end] Date for the occurrence that ends in/after this year's window
  const a = ev.from, b = ev.to, wrap = b[0] < a[0];
  return [new Date(year, a[0] - 1, a[1]), new Date(wrap ? year + 1 : year, b[0] - 1, b[1], 23, 59, 59)];
}
function eventStatus(ev, now) {
  now = now || new Date();
  for (const y of [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]) {
    const [s, e] = eventWindow(ev, y);
    if (now >= s && now <= e) return { active: true, start: s, end: e, daysLeft: Math.ceil((e - now) / 86400000) };
  }
  let best = null;
  for (const y of [now.getFullYear(), now.getFullYear() + 1]) { const [s] = eventWindow(ev, y); if (s > now && (!best || s < best)) best = s; }
  return { active: false, start: best, daysTo: Math.ceil((best - now) / 86400000) };
}
