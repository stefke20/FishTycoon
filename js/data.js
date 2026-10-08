'use strict';
/* ===== Static game data ===== */

const TIER_NAMES = ['', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const TIER_COLORS = ['', '#9fb3c8', '#4cc9a0', '#4d9fff', '#b36bff', '#ffb830'];

const BASE_VALUE = [0, 18, 80, 320, 1300, 5500];
const EGG_PRICE = [0, 10, 55, 380, 2600, 19000]; // high-tier eggs cost more than the fish they hatch: breed instead!
const GROW_TIME = [0, 40, 80, 160, 320, 640]; // seconds at base speed
const SALT_VALUE_MULT = 1.5;
const SALT_EGG_MULT = 1.5;
const EGG_UNLOCK_LEVEL = [0, 1, 2, 3, 5, 7];
const SALT_EGG_UNLOCK_LEVEL = [0, 3, 4, 5, 6, 7];

const LEVELS = [0, 0, 10, 30, 80, 160, 300, 600, 1100, 2000, 3500]; // sales needed for level index
const MAX_LEVEL = LEVELS.length - 1;

// shape: round | slender | tall | eel ; pattern: none|stripes|spots|band|patch|belly
const SPECIES_LIST = [
  // ---- Freshwater T1
  { id: 'goldfish', n: 'Goldfish', t: 1, w: 'fresh', f: 'Pond', c: '#ffa600', c2: '#ffd166', sh: 'round', pt: 'belly', v: 1.1 },
  { id: 'minnow', n: 'Minnow', t: 1, w: 'fresh', f: 'Pond', c: '#9fb4c7', c2: '#dbe6f0', sh: 'slender', pt: 'belly', v: 0.8 },
  { id: 'comet', n: 'Comet Goldfish', t: 1, w: 'fresh', f: 'Pond', c: '#ff7043', c2: '#fff1e6', sh: 'slender', pt: 'patch', v: 1.0 },
  { id: 'danio', n: 'Zebra Danio', t: 1, w: 'fresh', f: 'Pond', c: '#8fa3b8', c2: '#2f3f5c', sh: 'slender', pt: 'hstripes', v: 0.85 },
  { id: 'guppy', n: 'Guppy', t: 1, w: 'fresh', f: 'Livebearer', c: '#ff9f43', c2: '#ffd8a8', sh: 'slender', pt: 'spots', v: 0.9 },
  { id: 'platy', n: 'Platy', t: 1, w: 'fresh', f: 'Livebearer', c: '#ff6b6b', c2: '#ffc9c9', sh: 'round', pt: 'none', v: 1.0 },
  { id: 'swordtail', n: 'Swordtail', t: 1, w: 'fresh', f: 'Livebearer', c: '#f06595', c2: '#2b2d42', sh: 'slender', pt: 'stripes', v: 1.05 },
  { id: 'mosquitofish', n: 'Mosquitofish', t: 1, w: 'fresh', f: 'Livebearer', c: '#9a9078', c2: '#cfc6aa', sh: 'round', pt: 'belly', v: 0.75 },
  // T2
  { id: 'betta', n: 'Betta', t: 2, w: 'fresh', f: 'Tropical', c: '#d62839', c2: '#7b2cbf', sh: 'round', pt: 'none', v: 1.15 },
  { id: 'neon', n: 'Neon Tetra', t: 2, w: 'fresh', f: 'Tropical', c: '#2a5fd1', c2: '#ff3b4f', sh: 'slender', pt: 'lateral', v: 0.85 },
  { id: 'rasbora', n: 'Harlequin Rasbora', t: 2, w: 'fresh', f: 'Tropical', c: '#ffa94d', c2: '#2b2d42', sh: 'round', pt: 'patch', v: 0.95 },
  { id: 'cherrybarb', n: 'Cherry Barb', t: 2, w: 'fresh', f: 'Tropical', c: '#b83a3a', c2: '#e8a0a0', sh: 'round', pt: 'belly', v: 0.95 },
  { id: 'angelfish', n: 'Angelfish', t: 2, w: 'fresh', f: 'Community', c: '#e9ecef', c2: '#343a40', sh: 'tall', pt: 'stripes', v: 1.1 },
  { id: 'molly', n: 'Black Molly', t: 2, w: 'fresh', f: 'Community', c: '#2b2d42', c2: '#8d99ae', sh: 'round', pt: 'none', v: 0.95 },
  { id: 'dwarfgourami', n: 'Dwarf Gourami', t: 2, w: 'fresh', f: 'Community', c: '#4dabf7', c2: '#ff6b6b', sh: 'tall', pt: 'stripes', v: 1.0 },
  { id: 'corydoras', n: 'Panda Corydoras', t: 2, w: 'fresh', f: 'Community', c: '#d9d2c0', c2: '#2b2b33', sh: 'slender', pt: 'patch', v: 0.9 },
  // T3
  { id: 'discus', n: 'Discus', t: 3, w: 'fresh', f: 'Cichlid', c: '#f4a261', c2: '#e76f51', sh: 'tall', pt: 'stripes', v: 1.15 },
  { id: 'oscar', n: 'Oscar', t: 3, w: 'fresh', f: 'Cichlid', c: '#6d4c41', c2: '#ff7043', sh: 'round', pt: 'patch', v: 0.95 },
  { id: 'flowerhorn', n: 'Flowerhorn', t: 3, w: 'fresh', f: 'Cichlid', c: '#ff4d6d', c2: '#ffb3c1', sh: 'puffer', pt: 'spots', v: 1.2 },
  { id: 'jewel', n: 'Jewel Cichlid', t: 3, w: 'fresh', f: 'Cichlid', c: '#c0392b', c2: '#4aa3c7', sh: 'round', pt: 'spots', v: 1.05 },
  { id: 'arowana', n: 'Silver Arowana', t: 3, w: 'fresh', f: 'Predator', c: '#bfc7d1', c2: '#f1f3f5', sh: 'eel', pt: 'belly', v: 0.9 },
  { id: 'snakehead', n: 'Snakehead', t: 3, w: 'fresh', f: 'Predator', c: '#6b705c', c2: '#ddbea9', sh: 'eel', pt: 'stripes', v: 0.95 },
  { id: 'piranha', n: 'Red-Belly Piranha', t: 3, w: 'fresh', f: 'Predator', c: '#adb5bd', c2: '#e63946', sh: 'round', pt: 'belly', v: 1.1 },
  { id: 'pike', n: 'Northern Pike', t: 3, w: 'fresh', f: 'Predator', c: '#5f7a4a', c2: '#d8d2a0', sh: 'eel', pt: 'spots', v: 1.0 },
  // T4
  { id: 'koi', n: 'Koi', t: 4, w: 'fresh', f: 'Ornamental', c: '#f8f9fa', c2: '#ff6b35', sh: 'slender', pt: 'patch', v: 1.1 },
  { id: 'gourami', n: 'Giant Gourami', t: 4, w: 'fresh', f: 'Ornamental', c: '#8ac926', c2: '#ffca3a', sh: 'tall', pt: 'stripes', v: 0.9 },
  { id: 'ranchu', n: 'Ranchu', t: 4, w: 'fresh', f: 'Ornamental', c: '#ff6b35', c2: '#fff3e0', sh: 'puffer', pt: 'belly', v: 1.05 },
  { id: 'showa', n: 'Showa Koi', t: 4, w: 'fresh', f: 'Ornamental', c: '#2a2a33', c2: '#e8663c', sh: 'slender', pt: 'patch', v: 1.15 },
  { id: 'arapaima', n: 'Arapaima', t: 4, w: 'fresh', f: 'Giant', c: '#b23a48', c2: '#5c6b73', sh: 'eel', pt: 'belly', v: 0.95 },
  { id: 'redtail', n: 'Redtail Catfish', t: 4, w: 'fresh', f: 'Giant', c: '#3d405b', c2: '#e07a5f', sh: 'eel', pt: 'belly', v: 1.0 },
  { id: 'gar', n: 'Alligator Gar', t: 4, w: 'fresh', f: 'Giant', c: '#6a994e', c2: '#bc9a6a', sh: 'eel', pt: 'spots', v: 1.0 },
  { id: 'pacu', n: 'Giant Pacu', t: 4, w: 'fresh', f: 'Giant', c: '#8f98a3', c2: '#c0392b', sh: 'round', pt: 'belly', v: 0.95 },
  // T5
  { id: 'celestialkoi', n: 'Celestial Koi', t: 5, w: 'fresh', f: 'Mythic', c: '#e0e7ff', c2: '#7c83fd', sh: 'slender', pt: 'patch', v: 1.15 },
  { id: 'jadedragon', n: 'Jade Dragonfish', t: 5, w: 'fresh', f: 'Mythic', c: '#2d9c7a', c2: '#ffd166', sh: 'eel', pt: 'stripes', v: 1.2 },
  { id: 'phoenixbetta', n: 'Phoenix Betta', t: 5, w: 'fresh', f: 'Mythic', c: '#ff5400', c2: '#ffbd00', sh: 'round', pt: 'none', v: 1.0 },
  { id: 'aurorad', n: 'Aurora Discus', t: 5, w: 'fresh', f: 'Mythic', c: '#4fc3c7', c2: '#b48cf0', sh: 'tall', pt: 'stripes', v: 1.2 },
  { id: 'goldarowana', n: 'Golden Arowana', t: 5, w: 'fresh', f: 'Royal', c: '#ffc300', c2: '#ff8800', sh: 'eel', pt: 'belly', v: 1.1 },
  { id: 'sturgeon', n: 'Beluga Sturgeon', t: 5, w: 'fresh', f: 'Royal', c: '#6b7a8a', c2: '#c9d1d9', sh: 'eel', pt: 'belly', v: 1.05 },
  { id: 'platinum', n: 'Platinum Arowana', t: 5, w: 'fresh', f: 'Royal', c: '#d6dde6', c2: '#9ab3d6', sh: 'eel', pt: 'belly', v: 1.15 },
  { id: 'eel', n: 'Electric Eel', t: 5, w: 'fresh', f: 'Royal', c: '#3a86ff', c2: '#ffd60a', sh: 'eel', pt: 'belly', v: 1.15 },
  // ---- Saltwater T1
  { id: 'damsel', n: 'Blue Damselfish', t: 1, w: 'salt', f: 'Reef Dweller', c: '#3a86ff', c2: '#8ecae6', sh: 'round', pt: 'belly', v: 0.9 },
  { id: 'blenny', n: 'Blenny', t: 1, w: 'salt', f: 'Reef Dweller', c: '#8d99ae', c2: '#edf2f4', sh: 'eel', pt: 'spots', v: 0.85 },
  { id: 'goby', n: 'Yellow Goby', t: 1, w: 'salt', f: 'Reef Dweller', c: '#ffd60a', c2: '#fff3b0', sh: 'slender', pt: 'belly', v: 1.0 },
  { id: 'yellowtail', n: 'Yellowtail Damsel', t: 1, w: 'salt', f: 'Reef Dweller', c: '#2f6fd8', c2: '#ffd23f', sh: 'round', pt: 'belly', v: 0.9 },
  { id: 'cardinal', n: 'Cardinalfish', t: 1, w: 'salt', f: 'Shoaler', c: '#ef476f', c2: '#ffd6e0', sh: 'round', pt: 'stripes', v: 1.0 },
  { id: 'anthias', n: 'Anthias', t: 1, w: 'salt', f: 'Shoaler', c: '#ff9a76', c2: '#ffe3d6', sh: 'slender', pt: 'belly', v: 1.0 },
  { id: 'firefish', n: 'Firefish', t: 1, w: 'salt', f: 'Shoaler', c: '#ff5d73', c2: '#fff1f2', sh: 'slender', pt: 'patch', v: 1.05 },
  { id: 'pajama', n: 'Pajama Cardinalfish', t: 1, w: 'salt', f: 'Shoaler', c: '#c9b6d9', c2: '#7a4a9a', sh: 'round', pt: 'spots', v: 0.95 },
  // T2
  { id: 'clown', n: 'Clownfish', t: 2, w: 'salt', f: 'Clown', c: '#ff7b00', c2: '#ffffff', sh: 'round', pt: 'band', v: 1.15 },
  { id: 'yellowtang', n: 'Yellow Tang', t: 2, w: 'salt', f: 'Clown', c: '#ffd60a', c2: '#fff3b0', sh: 'tall', pt: 'none', v: 1.0 },
  { id: 'tomato', n: 'Tomato Clownfish', t: 2, w: 'salt', f: 'Clown', c: '#e63946', c2: '#fff3e0', sh: 'round', pt: 'band', v: 1.1 },
  { id: 'cleaner', n: 'Cleaner Wrasse', t: 2, w: 'salt', f: 'Clown', c: '#3a6fd0', c2: '#1a1a22', sh: 'slender', pt: 'hstripes', v: 1.0 },
  { id: 'gramma', n: 'Royal Gramma', t: 2, w: 'salt', f: 'Gem', c: '#9d4edd', c2: '#ffd60a', sh: 'slender', pt: 'patch', v: 1.0 },
  { id: 'chromis', n: 'Green Chromis', t: 2, w: 'salt', f: 'Gem', c: '#80ed99', c2: '#d8f3dc', sh: 'round', pt: 'belly', v: 0.85 },
  { id: 'dottyback', n: 'Orchid Dottyback', t: 2, w: 'salt', f: 'Gem', c: '#c77dff', c2: '#ffd166', sh: 'slender', pt: 'belly', v: 1.0 },
  { id: 'sailfinblenny', n: 'Sailfin Blenny', t: 2, w: 'salt', f: 'Gem', c: '#6a8a5a', c2: '#d9a441', sh: 'eel', pt: 'spots', v: 0.95 },
  // T3
  { id: 'bluetang', n: 'Blue Tang', t: 3, w: 'salt', f: 'Showy', c: '#3a86ff', c2: '#ffd60a', sh: 'tall', pt: 'stripes', v: 1.1 },
  { id: 'mandarin', n: 'Mandarinfish', t: 3, w: 'salt', f: 'Showy', c: '#00b4d8', c2: '#ff7b00', sh: 'slender', pt: 'patch', v: 1.2 },
  { id: 'flameangel', n: 'Flame Angelfish', t: 3, w: 'salt', f: 'Showy', c: '#ff4d00', c2: '#1d3557', sh: 'tall', pt: 'stripes', v: 1.1 },
  { id: 'powderblue', n: 'Powder Blue Tang', t: 3, w: 'salt', f: 'Showy', c: '#7fc4ee', c2: '#ffe066', sh: 'tall', pt: 'belly', v: 1.1 },
  { id: 'lionfish', n: 'Lionfish', t: 3, w: 'salt', f: 'Hunter', c: '#9c3d2e', c2: '#f1e3d3', sh: 'round', pt: 'stripes', v: 1.15 },
  { id: 'trigger', n: 'Picasso Triggerfish', t: 3, w: 'salt', f: 'Hunter', c: '#2a9d8f', c2: '#e9c46a', sh: 'round', pt: 'spots', v: 0.9 },
  { id: 'porcupine', n: 'Porcupinefish', t: 3, w: 'salt', f: 'Hunter', c: '#e9c46a', c2: '#6d4c41', sh: 'puffer', pt: 'spots', v: 1.0 },
  { id: 'grouper', n: 'Panther Grouper', t: 3, w: 'salt', f: 'Hunter', c: '#b86a3a', c2: '#e8d0a0', sh: 'round', pt: 'spots', v: 1.0 },
  // T4
  { id: 'moorish', n: 'Moorish Idol', t: 4, w: 'salt', f: 'Angel', c: '#f1faee', c2: '#1d1d1d', sh: 'tall', pt: 'band', v: 1.1 },
  { id: 'emperor', n: 'Emperor Angelfish', t: 4, w: 'salt', f: 'Angel', c: '#1d3557', c2: '#ffd60a', sh: 'tall', pt: 'stripes', v: 1.15 },
  { id: 'queenangel', n: 'Queen Angelfish', t: 4, w: 'salt', f: 'Angel', c: '#4cc9f0', c2: '#ffd60a', sh: 'tall', pt: 'belly', v: 1.1 },
  { id: 'frenchangel', n: 'French Angelfish', t: 4, w: 'salt', f: 'Angel', c: '#2b2f3a', c2: '#f2c94c', sh: 'tall', pt: 'stripes', v: 1.1 },
  { id: 'tuskfish', n: 'Harlequin Tuskfish', t: 4, w: 'salt', f: 'Wrasse', c: '#f77f00', c2: '#4cc9f0', sh: 'slender', pt: 'stripes', v: 1.0 },
  { id: 'wrasse', n: 'Napoleon Wrasse', t: 4, w: 'salt', f: 'Wrasse', c: '#168aad', c2: '#99d98c', sh: 'eel', pt: 'spots', v: 0.95 },
  { id: 'moray', n: 'Dragon Moray', t: 4, w: 'salt', f: 'Wrasse', c: '#6a994e', c2: '#ffd60a', sh: 'eel', pt: 'spots', v: 1.05 },
  { id: 'barracuda', n: 'Great Barracuda', t: 4, w: 'salt', f: 'Wrasse', c: '#8aa0b0', c2: '#dfe8ee', sh: 'eel', pt: 'belly', v: 1.05 },
  // T5
  { id: 'seadragon', n: 'Leafy Sea Dragon', t: 5, w: 'salt', f: 'Deep', c: '#c9a227', c2: '#7a9e1e', sh: 'eel', pt: 'spots', v: 1.2 },
  { id: 'hammerhead', n: 'Hammerhead Shark', t: 5, w: 'salt', f: 'Deep', c: '#7d8a99', c2: '#e8eef2', sh: 'slender', pt: 'belly', v: 1.15 },
  { id: 'anglerfish', n: 'Lantern Anglerfish', t: 5, w: 'salt', f: 'Deep', c: '#3a0ca3', c2: '#ffd60a', sh: 'puffer', pt: 'spots', v: 1.15 },
  { id: 'oarfish', n: 'Giant Oarfish', t: 5, w: 'salt', f: 'Deep', c: '#c7d0da', c2: '#e04a4a', sh: 'eel', pt: 'belly', v: 1.0 },
  { id: 'parrot', n: 'Rainbow Parrotfish', t: 5, w: 'salt', f: 'Crown', c: '#06d6a0', c2: '#ef476f', sh: 'round', pt: 'stripes', v: 1.05 },
  { id: 'royalangel', n: 'Royal Angelfish', t: 5, w: 'salt', f: 'Crown', c: '#3a0ca3', c2: '#ffd60a', sh: 'tall', pt: 'stripes', v: 1.0 },
  { id: 'marlin', n: 'Blue Marlin', t: 5, w: 'salt', f: 'Crown', c: '#2f5fa8', c2: '#cfe3f5', sh: 'slender', pt: 'belly', v: 1.2 },
  { id: 'opah', n: 'Opah (Moonfish)', t: 5, w: 'salt', f: 'Crown', c: '#ff6b6b', c2: '#e9ecef', sh: 'puffer', pt: 'spots', v: 1.1 },
];
const SPECIES = {};
SPECIES_LIST.forEach(s => {
  s.value = Math.round(BASE_VALUE[s.t] * s.v * (s.w === 'salt' ? SALT_VALUE_MULT : 1));
  SPECIES[s.id] = s;
});
SPECIES._baby = { id: '_baby', n: 'Baby', t: 1, w: 'fresh', f: 'Baby', c: '#c2cdb4', c2: '#e8eddc', sh: 'slender', pt: 'none', v: 1, value: 0 };
const speciesOf = (water, tier) => SPECIES_LIST.filter(s => s.w === water && s.t === tier);

/* Egg types: one per family (3 species) + a cheaper random 'Mystery' egg per water/tier */
const EGG_TYPES = [];
const EGG_TYPE = {};
['fresh', 'salt'].forEach(w => {
  for (let t = 1; t <= 5; t++) {
    const fams = [...new Set(speciesOf(w, t).map(s => s.f))];
    fams.forEach(f => {
      const e = { id: w + t + '_' + f.toLowerCase().replace(/\W/g, ''), n: f + ' Egg', w, t, pool: speciesOf(w, t).filter(s => s.f === f).map(s => s.id), pm: 1 };
      EGG_TYPES.push(e); EGG_TYPE[e.id] = e;
    });
    const m = { id: w + t + '_mix', n: 'Mystery Egg', w, t, pool: speciesOf(w, t).map(s => s.id), pm: 0.8 };
    EGG_TYPES.push(m); EGG_TYPE[m.id] = m;
  }
});

/* Consumables: chance (flat, 0-1) that a hatch / breeding gets one extra random modifier */
const CONSUMABLES = [
  { id: 'mut1', n: 'Mutagen Drops', e: '🧪', boost: 0.05, price: 250 },
  { id: 'mut2', n: 'Mutagen Vial', e: '⚗️', boost: 0.15, price: 1000 },
  { id: 'mut3', n: 'Mutagen Elixir', e: '☣️', boost: 0.30, price: 4000 },
  { id: 'mut4', n: 'Mutagen Reactor', e: '🧬', boost: 0.50, price: 18000 },
  { id: 'mut5', n: 'Genesis Serum', e: '🌀', boost: 0.80, price: 75000 },
];
const CONSUMABLE = {};
CONSUMABLES.forEach(c => (CONSUMABLE[c.id] = c));

/* Modifiers: t = tier, m = value multiplier, p = base chance on hatch/breed, glow = css drop-shadow colour */
const MODS_LIST = [
  { id: 'pearl', n: 'Pearlescent', t: 1, m: 1.5, p: 0.026, glow: '#ffd6f5', icon: '🫧', d: 'A pearly shimmer sweeps across the body' },
  { id: 'spotted', n: 'Spotted', t: 1, m: 1.4, p: 0.026, glow: null, icon: '🔘', d: 'Bold white spots' },
  { id: 'striped', n: 'Striped', t: 1, m: 1.4, p: 0.026, glow: null, icon: '🦓', d: 'Dark racing stripes' },
  { id: 'dappled', n: 'Dappled', t: 1, m: 1.4, p: 0.026, glow: null, icon: '🌸', d: 'Soft pink blotches' },
  { id: 'marbled', n: 'Marbled', t: 1, m: 1.45, p: 0.026, glow: null, icon: '🪨', d: 'Swirling marble veins' },
  { id: 'fiery', n: 'Fiery', t: 2, m: 2.5, p: 0.01, glow: '#ff6a00', icon: '🔥', d: 'Burns with flickering flames' },
  { id: 'frosty', n: 'Frosty', t: 2, m: 2.5, p: 0.01, glow: '#7fdcff', icon: '❄️', d: 'Ice crystals and drifting snow' },
  { id: 'golden', n: 'Golden', t: 2, m: 2.5, p: 0.01, glow: '#ffd23f', icon: '✨', d: 'Gleaming gold with sparkles' },
  { id: 'glowing', n: 'Glowing', t: 2, m: 2.5, p: 0.01, glow: '#7dff6b', icon: '💡', d: 'Pulses with soft green light' },
  { id: 'electric', n: 'Electric', t: 2, m: 2.6, p: 0.009, glow: '#5ad8ff', icon: '⚡', d: 'Crackles with electric arcs' },
  { id: 'toxic', n: 'Toxic', t: 2, m: 2.5, p: 0.009, glow: '#9bff3a', icon: '☣️', d: 'Oozes bubbling toxins' },
  { id: 'aurora', n: 'Aurora', t: 2, m: 2.7, p: 0.008, glow: '#6bffc4', icon: '🌠', d: 'Northern-lights ribbons ripple over it' },
  { id: 'cosmic', n: 'Cosmic', t: 3, m: 6, p: 0.0025, glow: '#a259ff', icon: '🌌', d: 'A twinkling galaxy swirls inside' },
  { id: 'prismatic', n: 'Prismatic', t: 3, m: 6, p: 0.0025, glow: '#ffffff', icon: '🌈', d: 'Cycles through every colour' },
  { id: 'shadow', n: 'Shadow', t: 3, m: 6, p: 0.0025, glow: '#6a00ff', icon: '🌑', d: 'Trailing wisps of living shadow' },
  { id: 'celestial', n: 'Celestial', t: 3, m: 6.5, p: 0.002, glow: '#fff2b0', icon: '👼', d: 'A radiant halo and drifting motes of light' },
  { id: 'camo', n: 'Camo', t: 1, m: 1.4, p: 0.026, glow: null, icon: '🪖', d: 'Jungle camouflage blotches' },
  { id: 'bubbly', n: 'Bubbly', t: 1, m: 1.4, p: 0.026, glow: null, icon: '🫧', d: 'Translucent blue skin that blows bubbles' },
  { id: 'candy', n: 'Candy', t: 2, m: 2.4, p: 0.009, glow: '#ff9ad5', icon: '🍬', d: 'Pink-and-white swirls with sprinkles' },
  { id: 'ruby', n: 'Ruby', t: 2, m: 3, p: 0.007, glow: '#ff3050', icon: '♦️', d: 'Fins turn to glittering red rubies' },
  { id: 'emerald', n: 'Emerald', t: 2, m: 3, p: 0.007, glow: '#30e070', icon: '💚', d: 'Fins turn to glittering green emeralds' },
  { id: 'sapphire', n: 'Sapphire', t: 2, m: 3, p: 0.007, glow: '#4080ff', icon: '🔷', d: 'Fins turn to glittering blue sapphires' },
  { id: 'neon', n: 'Neon', t: 2, m: 2.7, p: 0.008, glow: '#ff40d0', icon: '💖', d: 'Dark body traced with buzzing neon lines' },
  { id: 'zombie', n: 'Zombie', t: 3, m: 5, p: 0.002, glow: null, icon: '🧟', d: 'Rotting flesh, chunks missing, dripping slime' },
  { id: 'skeleton', n: 'Skeleton', t: 3, m: 5.5, p: 0.002, glow: null, icon: '💀', d: 'Nothing left but bones' },
  { id: 'magma', n: 'Magma', t: 3, m: 6, p: 0.002, glow: '#ff5a10', icon: '🌋', d: 'Cooled lava crust with glowing cracks' },
  { id: 'ghost', n: 'Ghost', t: 3, m: 6, p: 0.002, glow: '#bfe4ff', icon: '👻', d: 'See-through and trailing spirit wisps' },
  { id: 'robot', n: 'Robot', t: 3, m: 5, p: 0.002, glow: null, icon: '🤖', d: 'Riveted steel plating and blinking LEDs' },
  { id: 'glitch', n: 'Glitch', t: 3, m: 6, p: 0.0018, glow: '#ff30d0', icon: '👾', d: 'Flickers, tears and shifts colour' },
  { id: 'diamond', n: 'Diamond', t: 4, m: 12, p: 0.0004, glow: '#d8f4ff', icon: '💎', d: 'Flawless crystal that throws rainbow flashes' },
  { id: 'phoenix', n: 'Phoenix', t: 4, m: 14, p: 0.0003, glow: '#ff8a20', icon: '🐦‍🔥', d: 'Wreathed in rebirth flames and trailing embers' },
];
const MODS = {};
MODS_LIST.forEach(m => (MODS[m.id] = m));
const MOD_TIER_COLORS = ['', '#9fb3c8', '#4cc9a0', '#ffb830', '#ff6ad5'];
const MOD_TIER_NAMES = ['', 'Common', 'Uncommon', 'Rare', 'Mythic'];

/* Tanks */
const TANK_TYPES = [
  { id: 'starter', n: 'Starter Tank', w: 'fresh', base: 1, cap: 4, price: 150, lvl: 1, mult: 1 },
  { id: 'medium', n: 'Medium Tank', w: 'fresh', base: 2, cap: 8, price: 900, lvl: 2, mult: 2.5 },
  { id: 'large', n: 'Large Tank', w: 'fresh', base: 3, cap: 12, price: 6500, lvl: 4, mult: 6 },
  { id: 'huge', n: 'Grand Aquarium', w: 'fresh', base: 4, cap: 20, price: 60000, lvl: 6, mult: 15 },
  { id: 'mega', n: 'Colossal Aquarium', w: 'fresh', base: 5, cap: 30, price: 450000, lvl: 8, mult: 40 },
  { id: 'reef_s', n: 'Reef Starter', w: 'salt', base: 1, cap: 6, price: 8000, lvl: 3, mult: 6 },
  { id: 'reef_m', n: 'Reef Tank', w: 'salt', base: 2, cap: 10, price: 28000, lvl: 4, mult: 14 },
  { id: 'reef_l', n: 'Large Reef', w: 'salt', base: 3, cap: 16, price: 110000, lvl: 6, mult: 35 },
  { id: 'reef_g', n: 'Grand Reef', w: 'salt', base: 4, cap: 26, price: 450000, lvl: 7, mult: 90 },
  { id: 'reef_x', n: 'Leviathan Reef', w: 'salt', base: 5, cap: 40, price: 2000000, lvl: 9, mult: 220 },
];
const TANK_TYPE = {};
TANK_TYPES.forEach(t => (TANK_TYPE[t.id] = t));
const START_HALL_SLOTS = 3;
const MAX_HALL_SLOTS = 12;
const hallSlotPrice = n => Math.round(500 * Math.pow(3, n - START_HALL_SLOTS)); // price of slot number n+1

/* Per-tank upgrades: cost = base * tank.mult */
const TANK_UPGRADES = [
  { id: 'filter', n: 'Water Filter', icon: '🧪', max: 2, costs: [250, 1100], desc: '+1 water rating & +5% growth per level' },
  { id: 'aerator', n: 'Aerator', icon: '🫧', max: 1, costs: [450], desc: '+1 water rating & +10% growth' },
  { id: 'light', n: 'Grow Lights', icon: '💡', max: 5, costs: [300, 1200, 4000, 14000, 45000], desc: '+15% modifier chance per level' },
  { id: 'feeder', n: 'Auto-Feeder', icon: '🍽️', max: 1, costs: [600], desc: 'Feeds the tank automatically (costs food money)' },
  { id: 'uv', n: 'UV Sterilizer', icon: '🔆', max: 3, costs: [800, 3000, 11000], desc: 'Water gets dirty 25% slower per level' },
  { id: 'heater', n: 'Thermostat Heater', icon: '🌡️', max: 4, costs: [500, 2000, 7500, 25000], desc: '+6% growth per level' },
  { id: 'spot', n: 'Showcase Lighting', icon: '🔦', max: 4, costs: [1500, 6000, 24000, 90000], desc: '+4% fish value per level' },
  { id: 'nest', n: 'Breeding Box', icon: '🪺', max: 3, costs: [2500, 9000, 32000], desc: 'Fish in this tank rest 12% less after breeding, per level' },
  { id: 'dna', n: 'Gene Scanner', icon: '🧬', max: 3, costs: [4000, 16000, 64000], desc: '+6% modifier inheritance per level for fish in this tank' },
];

/* Food */
const FOOD = [
  { n: 'Basic Flakes', mult: 2, price: 0 },
  { n: 'Fish Pellets', mult: 3, price: 250 },
  { n: 'Spirulina Blend', mult: 4, price: 1500 },
  { n: 'Live Brine Shrimp', mult: 6, price: 8000 },
  { n: 'Gourmet Krill', mult: 9, price: 40000 },
  { n: 'Ambrosia Feed', mult: 14, price: 180000 },
  { n: 'Phoenix Nectar', mult: 18, price: 700000 },
  { n: 'Leviathan Feast', mult: 24, price: 2500000 },
  { n: 'Cosmic Plankton', mult: 32, price: 10000000 },
];
const FED_DURATION = 45; // seconds a feeding lasts
const FEED_COST_PER_FISH = 1;

/* Decor: slot = bg | item ; w = both|fresh|salt ; b = bonuses {growth,value,mod,tier,inherit} */
const DECOR = [
  // plants
  { id: 'javafern', n: 'Java Fern', e: '🌿', k: 'plant', w: 'fresh', price: 40, b: { growth: 0.05 } },
  { id: 'anubias', n: 'Anubias', e: '🪴', k: 'plant', w: 'fresh', price: 70, b: { value: 0.04 } },
  { id: 'sword', n: 'Amazon Sword', e: '🌱', k: 'plant', w: 'fresh', price: 140, b: { growth: 0.08 } },
  { id: 'wisteria', n: 'Water Wisteria', e: '🍃', k: 'plant', w: 'fresh', price: 260, b: { mod: 0.10 } },
  { id: 'lotus', n: 'Sacred Lotus', e: '🪷', k: 'plant', w: 'fresh', price: 700, b: { value: 0.10 } },
  { id: 'seagrass', n: 'Sea Grass', e: '🌾', k: 'plant', w: 'salt', price: 120, b: { growth: 0.06 } },
  { id: 'kelp', n: 'Giant Kelp', e: '🎍', k: 'plant', w: 'salt', price: 400, b: { growth: 0.10, value: 0.03 } },
  { id: 'seafan', n: 'Sea Fan', e: '🪸', k: 'plant', w: 'salt', price: 900, b: { mod: 0.12 } },
  // rocks
  { id: 'pebbles', n: 'Pebble Pile', e: '🪨', k: 'rock', w: 'both', price: 50, b: { value: 0.03 } },
  { id: 'driftwood', n: 'Driftwood', e: '🪵', k: 'rock', w: 'both', price: 110, b: { growth: 0.05 } },
  { id: 'cave', n: 'Cosy Cave', e: '⛰️', k: 'rock', w: 'both', price: 240, b: { inherit: 0.10 } },
  { id: 'dragonstone', n: 'Dragon Stone', e: '🐉', k: 'rock', w: 'both', price: 600, b: { tier: 0.15 } },
  { id: 'obsidian', n: 'Obsidian Spire', e: '🗻', k: 'rock', w: 'both', price: 1500, b: { mod: 0.25 } },
  // accessories
  { id: 'bubbles', n: 'Bubble Wand', e: '🫧', k: 'acc', w: 'both', price: 90, b: { growth: 0.06 } },
  { id: 'chest', n: 'Treasure Chest', e: '🧰', k: 'acc', w: 'both', price: 350, b: { value: 0.08 } },
  { id: 'neon', n: 'Neon Sign', e: '🪩', k: 'acc', w: 'both', price: 450, b: { mod: 0.15 } },
  { id: 'castle', n: 'Mini Castle', e: '🏰', k: 'acc', w: 'both', price: 800, b: { tier: 0.20 } },
  { id: 'heart', n: 'Heart Statue', e: '💖', k: 'acc', w: 'both', price: 900, b: { inherit: 0.20 } },
  { id: 'ship', n: 'Sunken Ship', e: '🚢', k: 'acc', w: 'both', price: 1200, b: { value: 0.15 } },
  { id: 'brain', n: 'Brain Coral', e: '🧠', k: 'acc', w: 'salt', price: 500, b: { growth: 0.08, value: 0.04 } },
  { id: 'anemone', n: 'Anemone', e: '🐙', k: 'acc', w: 'salt', price: 1100, b: { tier: 0.18 } },
  // backgrounds
  { id: 'bg_blue', n: 'Deep Blue', e: '🌊', k: 'bg', w: 'both', price: 80, b: { growth: 0.03 }, css: 'linear-gradient(#0b3d6b,#04182f)' },
  { id: 'bg_forest', n: 'Forest Glade', e: '🌲', k: 'bg', w: 'fresh', price: 300, b: { growth: 0.08, value: 0.03 }, css: 'linear-gradient(#1d6b3a,#052b19)' },
  { id: 'bg_reef', n: 'Coral Reef', e: '🪸', k: 'bg', w: 'salt', price: 500, b: { growth: 0.08, value: 0.05 }, css: 'linear-gradient(#e56b6f,#355070)' },
  { id: 'bg_sunset', n: 'Sunset Lagoon', e: '🌅', k: 'bg', w: 'both', price: 800, b: { value: 0.10 }, css: 'linear-gradient(#ffb36b,#c0507a 55%,#2b2a5c)' },
  { id: 'bg_space', n: 'Deep Space', e: '🌌', k: 'bg', w: 'both', price: 2500, b: { mod: 0.20, value: 0.10 }, css: 'linear-gradient(#2a0f55,#05020f)' },
];
const DECOR_BY_ID = {};
DECOR.forEach(d => (DECOR_BY_ID[d.id] = d));
const ITEM_SLOTS = 4;
const SLOT_POS = [8, 31, 58, 82];

/* Tank skins (gravel colour + frame) */
const SKINS = [
  { id: 'classic', n: 'Classic Glass', price: 0, gravel: '#c9b98a', frame: '#3b4b63', b: {} },
  { id: 'blacksand', n: 'Black Sand', price: 250, gravel: '#2a2a33', frame: '#1f2430', b: { value: 0.02 } },
  { id: 'pink', n: 'Pink Sakura', price: 600, gravel: '#f2b5d4', frame: '#a94472', b: { growth: 0.03 } },
  { id: 'neonframe', n: 'Neon Frame', price: 1500, gravel: '#1b1b3a', frame: '#00f5d4', b: { mod: 0.05 } },
  { id: 'gold', n: 'Gilded Frame', price: 9000, gravel: '#e8d9a0', frame: '#d4a017', b: { value: 0.06 } },
  { id: 'jade', n: 'Jade Garden', price: 3500, gravel: '#9ac8a8', frame: '#2f7a5a', b: { growth: 0.05, value: 0.02 } },
  { id: 'obsidian', n: 'Obsidian Deluxe', price: 30000, gravel: '#0d0d12', frame: '#7b2cbf', b: { value: 0.05, growth: 0.05, mod: 0.05 } },
  { id: 'crystal', n: 'Crystal Palace', price: 90000, gravel: '#cfe8f4', frame: '#6ab8e8', b: { value: 0.08, growth: 0.06, mod: 0.05 } },
  { id: 'royal', n: 'Royal Court', price: 300000, gravel: '#3a1f5c', frame: '#e0b030', b: { value: 0.10, mod: 0.10, tier: 0.05 } },
  { id: 'celestial', n: 'Celestial Dome', price: 1000000, gravel: '#14183a', frame: '#9ad0ff', b: { value: 0.12, growth: 0.10, mod: 0.10, inherit: 0.08 } },
];
const SKIN = {};
SKINS.forEach(s => (SKIN[s.id] = s));

/* Store upgrades */
const STORE_UPGRADES = [
  { id: 'cases', n: 'Display Cases', icon: '🗄️', max: 9, cost: l => Math.round(250 * Math.pow(2.4, l)), desc: '+1 fish on display (more fish for customers to want)' },
  { id: 'ads', n: 'Advertising', icon: '📣', max: 12, cost: l => Math.round(300 * Math.pow(2.2, l)), desc: 'Customers arrive 22% more often per level' },
  { id: 'sign', n: 'Shop Sign & Decor', icon: '🪧', max: 10, cost: l => Math.round(400 * Math.pow(2.3, l)), desc: 'Customers offer +6% more per level' },
  { id: 'seats', n: 'Comfy Seating', icon: '🛋️', max: 8, cost: l => Math.round(250 * Math.pow(2.2, l)), desc: '+10s customer patience per level' },
  { id: 'counter', n: 'Bigger Counter', icon: '🧾', max: 6, cost: l => Math.round(600 * Math.pow(2.7, l)), desc: '+1 customer can be in the shop at once per level' },
  { id: 'cashier', n: 'Hire Cashier', icon: '🧑‍💼', max: 3, cost: l => [3000, 20000, 120000][l], desc: 'Auto-accepts offers of 95% / 85% / 75% of fish value or better' },
  { id: 'collector', n: "Collector's Club", icon: '🎩', max: 8, cost: l => Math.round(1500 * Math.pow(2.4, l)), desc: 'More collectors who pay big for modified fish' },
  { id: 'vip', n: 'VIP Lounge', icon: '🥂', max: 5, cost: l => Math.round(5000 * Math.pow(3, l)), desc: 'Wealthy VIP guests drop by (more often per level) and pay 2.5-4x for rare fish' },
  { id: 'quick', n: 'Express Checkout', icon: '⚡', max: 5, cost: l => Math.round(1200 * Math.pow(2.5, l)), desc: 'Customers finish browsing 12% faster per level' },
  { id: 'auction', n: 'Auction House', icon: '🔨', max: 5, cost: l => Math.round(4000 * Math.pow(3, l)), desc: 'Fish market pays +4% more of a fish\'s value per level' },
];
const BREED_UPGRADES = [
  { id: 'clutch', n: 'Breeding Nest', icon: '🪺', max: 5, cost: l => Math.round(1500 * Math.pow(3, l)), desc: '+1 egg per breeding' },
  { id: 'cooldown', n: 'Breeding Aid', icon: '⏳', max: 6, cost: l => Math.round(800 * Math.pow(2.7, l)), desc: 'Breeding cooldown -15% per level' },
  { id: 'match', n: 'Matchmaker', icon: '💘', max: 6, cost: l => Math.round(2000 * Math.pow(2.7, l)), desc: '+8% chance that each parent modifier is inherited, per level' },
  { id: 'lineage', n: 'Lineage Records', icon: '📜', max: 6, cost: l => Math.round(3000 * Math.pow(2.9, l)), desc: '+25% chance of a higher-tier offspring per level' },
  { id: 'mutation', n: 'Gene Splicer', icon: '🧫', max: 6, cost: l => Math.round(2500 * Math.pow(2.8, l)), desc: '+1.5% chance of one brand-new modifier on offspring, per level' },
  { id: 'warmer', n: 'Egg Warmer', icon: '🔥', max: 4, cost: l => Math.round(1800 * Math.pow(2.6, l)), desc: 'Fish hatch already 15% grown, per level' },
];
/* Research lab: permanent global upgrades */
const LAB = [
  { id: 'nutrition', n: 'Nutrition Science', icon: '🥗', max: 10, cost: l => Math.round(3000 * Math.pow(1.95, l)), desc: '+5% growth speed in every tank, per level' },
  { id: 'genetics', n: 'Genetics Lab', icon: '🔬', max: 10, cost: l => Math.round(4000 * Math.pow(2, l)), desc: '+8% modifier chance everywhere, per level' },
  { id: 'market', n: 'Market Research', icon: '📈', max: 10, cost: l => Math.round(5000 * Math.pow(2.05, l)), desc: '+3% value on every fish, per level' },
  { id: 'wholesale', n: 'Egg Wholesaler', icon: '📦', max: 10, cost: l => Math.round(3500 * Math.pow(2, l)), desc: 'Eggs cost 3% less, per level' },
  { id: 'chemistry', n: 'Water Chemistry', icon: '⚗️', max: 8, cost: l => Math.round(2500 * Math.pow(2.1, l)), desc: 'Water quality drops 7% slower, per level' },
  { id: 'bloodline', n: 'Genealogy Institute', icon: '🧬', max: 10, cost: l => Math.round(6000 * Math.pow(2, l)), desc: '+3% chance that each parent modifier is inherited, per level' },
  { id: 'evolution', n: 'Evolution Research', icon: '🦎', max: 8, cost: l => Math.round(8000 * Math.pow(2.2, l)), desc: '+2% chance of a higher-tier offspring, per level' },
  { id: 'nightshift', n: 'Night Shift', icon: '🌙', max: 8, cost: l => Math.round(2000 * Math.pow(2.2, l)), desc: 'Fish keep growing 1 more hour while you are away, per level' },
  { id: 'broker', n: 'Contract Broker', icon: '🤝', max: 5, cost: l => Math.round(3000 * Math.pow(2.4, l)), desc: 'Special orders pay 10% more and arrive faster, per level' },
  { id: 'automation', n: 'Automation Hub', icon: '🤖', max: 6, cost: l => Math.round(7000 * Math.pow(2.3, l)), desc: 'Staff work 8% faster and cost 5% less, per level' },
  { id: 'sponge', n: 'Pro Sponge', icon: '🧽', max: 5, cost: l => Math.round(500 * Math.pow(2.3, l)), desc: 'A bigger sponge that cleans more water per smudge, per level' },
];
const LAB_BY_ID = {}; LAB.forEach(u => (LAB_BY_ID[u.id] = u));
const BREED_COOLDOWN = 90;
const BASE_INHERIT = 0.45;   // chance that each parent modifier is passed on
const BASE_NEWMOD = 0.08;    // chance of one brand-new modifier on top
const BASE_TIERUP = 0.07;
const QUICK_SELL = 0.5;
