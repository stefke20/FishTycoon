'use strict';
/* ===== Static game data ===== */

const TIER_NAMES = ['', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const TIER_COLORS = ['', '#9fb3c8', '#4cc9a0', '#4d9fff', '#b36bff', '#ffb830'];

const BASE_VALUE = [0, 18, 80, 320, 1300, 5500];
const EGG_PRICE = [0, 10, 45, 180, 750, 3200];
const GROW_TIME = [0, 40, 80, 160, 320, 640]; // seconds at base speed
const SALT_VALUE_MULT = 1.5;
const SALT_EGG_MULT = 1.4;
const EGG_UNLOCK_LEVEL = [0, 1, 2, 3, 5, 7];
const SALT_EGG_UNLOCK_LEVEL = [0, 3, 4, 5, 6, 7];

const LEVELS = [0, 0, 10, 30, 80, 160, 300, 600]; // sales needed for level index

// shape: round | slender | tall | eel ; pattern: none|stripes|spots|band|patch|belly
const SPECIES_LIST = [
  // ---- Freshwater
  { id: 'guppy', n: 'Guppy', t: 1, w: 'fresh', c: '#ff9f43', c2: '#ffd8a8', sh: 'slender', pt: 'spots', v: 0.9 },
  { id: 'goldfish', n: 'Goldfish', t: 1, w: 'fresh', c: '#ffa600', c2: '#ffd166', sh: 'round', pt: 'belly', v: 1.1 },
  { id: 'minnow', n: 'Minnow', t: 1, w: 'fresh', c: '#9fb4c7', c2: '#dbe6f0', sh: 'slender', pt: 'belly', v: 0.8 },
  { id: 'platy', n: 'Platy', t: 1, w: 'fresh', c: '#ff6b6b', c2: '#ffc9c9', sh: 'round', pt: 'none', v: 1.0 },
  { id: 'betta', n: 'Betta', t: 2, w: 'fresh', c: '#d62839', c2: '#7b2cbf', sh: 'round', pt: 'none', v: 1.15 },
  { id: 'neon', n: 'Neon Tetra', t: 2, w: 'fresh', c: '#2ec4b6', c2: '#ff4d6d', sh: 'slender', pt: 'stripes', v: 0.85 },
  { id: 'angelfish', n: 'Angelfish', t: 2, w: 'fresh', c: '#e9ecef', c2: '#343a40', sh: 'tall', pt: 'stripes', v: 1.1 },
  { id: 'molly', n: 'Black Molly', t: 2, w: 'fresh', c: '#2b2d42', c2: '#8d99ae', sh: 'round', pt: 'none', v: 0.95 },
  { id: 'discus', n: 'Discus', t: 3, w: 'fresh', c: '#f4a261', c2: '#e76f51', sh: 'tall', pt: 'stripes', v: 1.15 },
  { id: 'oscar', n: 'Oscar', t: 3, w: 'fresh', c: '#6d4c41', c2: '#ff7043', sh: 'round', pt: 'patch', v: 0.95 },
  { id: 'flowerhorn', n: 'Flowerhorn', t: 3, w: 'fresh', c: '#ff4d6d', c2: '#ffb3c1', sh: 'round', pt: 'spots', v: 1.2 },
  { id: 'arowana', n: 'Silver Arowana', t: 3, w: 'fresh', c: '#bfc7d1', c2: '#f1f3f5', sh: 'eel', pt: 'belly', v: 0.9 },
  { id: 'koi', n: 'Koi', t: 4, w: 'fresh', c: '#f8f9fa', c2: '#ff6b35', sh: 'slender', pt: 'patch', v: 1.1 },
  { id: 'arapaima', n: 'Arapaima', t: 4, w: 'fresh', c: '#b23a48', c2: '#5c6b73', sh: 'eel', pt: 'belly', v: 0.95 },
  { id: 'gourami', n: 'Giant Gourami', t: 4, w: 'fresh', c: '#8ac926', c2: '#ffca3a', sh: 'tall', pt: 'stripes', v: 0.9 },
  { id: 'redtail', n: 'Redtail Catfish', t: 4, w: 'fresh', c: '#3d405b', c2: '#e07a5f', sh: 'eel', pt: 'belly', v: 1.0 },
  { id: 'celestialkoi', n: 'Celestial Koi', t: 5, w: 'fresh', c: '#e0e7ff', c2: '#7c83fd', sh: 'slender', pt: 'patch', v: 1.15 },
  { id: 'jadedragon', n: 'Jade Dragonfish', t: 5, w: 'fresh', c: '#2d9c7a', c2: '#ffd166', sh: 'eel', pt: 'stripes', v: 1.2 },
  { id: 'goldarowana', n: 'Golden Arowana', t: 5, w: 'fresh', c: '#ffc300', c2: '#ff8800', sh: 'eel', pt: 'belly', v: 1.1 },
  { id: 'phoenixbetta', n: 'Phoenix Betta', t: 5, w: 'fresh', c: '#ff5400', c2: '#ffbd00', sh: 'round', pt: 'none', v: 1.0 },
  // ---- Saltwater
  { id: 'damsel', n: 'Blue Damselfish', t: 1, w: 'salt', c: '#3a86ff', c2: '#8ecae6', sh: 'round', pt: 'belly', v: 0.9 },
  { id: 'blenny', n: 'Blenny', t: 1, w: 'salt', c: '#8d99ae', c2: '#edf2f4', sh: 'eel', pt: 'spots', v: 0.85 },
  { id: 'cardinal', n: 'Cardinalfish', t: 1, w: 'salt', c: '#ef476f', c2: '#ffd6e0', sh: 'round', pt: 'stripes', v: 1.0 },
  { id: 'goby', n: 'Yellow Goby', t: 1, w: 'salt', c: '#ffd60a', c2: '#fff3b0', sh: 'slender', pt: 'belly', v: 1.0 },
  { id: 'clown', n: 'Clownfish', t: 2, w: 'salt', c: '#ff7b00', c2: '#ffffff', sh: 'round', pt: 'band', v: 1.15 },
  { id: 'yellowtang', n: 'Yellow Tang', t: 2, w: 'salt', c: '#ffd60a', c2: '#fff3b0', sh: 'tall', pt: 'none', v: 1.0 },
  { id: 'gramma', n: 'Royal Gramma', t: 2, w: 'salt', c: '#9d4edd', c2: '#ffd60a', sh: 'slender', pt: 'patch', v: 1.0 },
  { id: 'chromis', n: 'Green Chromis', t: 2, w: 'salt', c: '#80ed99', c2: '#d8f3dc', sh: 'round', pt: 'belly', v: 0.85 },
  { id: 'bluetang', n: 'Blue Tang', t: 3, w: 'salt', c: '#3a86ff', c2: '#ffd60a', sh: 'tall', pt: 'stripes', v: 1.1 },
  { id: 'lionfish', n: 'Lionfish', t: 3, w: 'salt', c: '#9c3d2e', c2: '#f1e3d3', sh: 'round', pt: 'stripes', v: 1.15 },
  { id: 'mandarin', n: 'Mandarinfish', t: 3, w: 'salt', c: '#00b4d8', c2: '#ff7b00', sh: 'slender', pt: 'patch', v: 1.2 },
  { id: 'trigger', n: 'Picasso Triggerfish', t: 3, w: 'salt', c: '#2a9d8f', c2: '#e9c46a', sh: 'round', pt: 'spots', v: 0.9 },
  { id: 'moorish', n: 'Moorish Idol', t: 4, w: 'salt', c: '#f1faee', c2: '#1d1d1d', sh: 'tall', pt: 'band', v: 1.1 },
  { id: 'emperor', n: 'Emperor Angelfish', t: 4, w: 'salt', c: '#1d3557', c2: '#ffd60a', sh: 'tall', pt: 'stripes', v: 1.15 },
  { id: 'tuskfish', n: 'Harlequin Tuskfish', t: 4, w: 'salt', c: '#f77f00', c2: '#4cc9f0', sh: 'slender', pt: 'stripes', v: 1.0 },
  { id: 'wrasse', n: 'Napoleon Wrasse', t: 4, w: 'salt', c: '#168aad', c2: '#99d98c', sh: 'eel', pt: 'spots', v: 0.95 },
  { id: 'seadragon', n: 'Leafy Sea Dragon', t: 5, w: 'salt', c: '#c9a227', c2: '#7a9e1e', sh: 'eel', pt: 'spots', v: 1.2 },
  { id: 'parrot', n: 'Rainbow Parrotfish', t: 5, w: 'salt', c: '#06d6a0', c2: '#ef476f', sh: 'round', pt: 'stripes', v: 1.05 },
  { id: 'mantaray', n: 'Reef Manta', t: 5, w: 'salt', c: '#264653', c2: '#e9f5f9', sh: 'tall', pt: 'belly', v: 1.1 },
  { id: 'royalangel', n: 'Royal Angelfish', t: 5, w: 'salt', c: '#3a0ca3', c2: '#ffd60a', sh: 'tall', pt: 'stripes', v: 1.0 },
];
const SPECIES = {};
SPECIES_LIST.forEach(s => {
  s.value = Math.round(BASE_VALUE[s.t] * s.v * (s.w === 'salt' ? SALT_VALUE_MULT : 1));
  SPECIES[s.id] = s;
});
const speciesOf = (water, tier) => SPECIES_LIST.filter(s => s.w === water && s.t === tier);

/* Modifiers: t = tier, m = value multiplier, p = base chance on hatch/breed, glow = css drop-shadow colour */
const MODS_LIST = [
  { id: 'pearl', n: 'Pearlescent', t: 1, m: 1.5, p: 0.04, glow: null, icon: '🫧' },
  { id: 'spotted', n: 'Spotted', t: 1, m: 1.4, p: 0.04, glow: null, icon: '🔘' },
  { id: 'striped', n: 'Striped', t: 1, m: 1.4, p: 0.04, glow: null, icon: '🦓' },
  { id: 'dappled', n: 'Dappled', t: 1, m: 1.4, p: 0.04, glow: null, icon: '🌸' },
  { id: 'fiery', n: 'Fiery', t: 2, m: 2.5, p: 0.012, glow: '#ff6a00', icon: '🔥' },
  { id: 'frosty', n: 'Frosty', t: 2, m: 2.5, p: 0.012, glow: '#7fdcff', icon: '❄️' },
  { id: 'golden', n: 'Golden', t: 2, m: 2.5, p: 0.012, glow: '#ffd23f', icon: '✨' },
  { id: 'glowing', n: 'Glowing', t: 2, m: 2.5, p: 0.012, glow: '#7dff6b', icon: '💡' },
  { id: 'cosmic', n: 'Cosmic', t: 3, m: 6, p: 0.003, glow: '#a259ff', icon: '🌌' },
  { id: 'prismatic', n: 'Prismatic', t: 3, m: 6, p: 0.003, glow: '#ffffff', icon: '🌈' },
  { id: 'shadow', n: 'Shadow', t: 3, m: 6, p: 0.003, glow: '#6a00ff', icon: '🌑' },
];
const MODS = {};
MODS_LIST.forEach(m => (MODS[m.id] = m));
const MOD_TIER_COLORS = ['', '#9fb3c8', '#4cc9a0', '#ffb830'];

/* Tanks */
const TANK_TYPES = [
  { id: 'starter', n: 'Starter Tank', w: 'fresh', base: 1, cap: 4, price: 150, lvl: 1, mult: 1 },
  { id: 'medium', n: 'Medium Tank', w: 'fresh', base: 2, cap: 8, price: 500, lvl: 2, mult: 2.5 },
  { id: 'large', n: 'Large Tank', w: 'fresh', base: 3, cap: 12, price: 3000, lvl: 4, mult: 6 },
  { id: 'huge', n: 'Grand Aquarium', w: 'fresh', base: 4, cap: 20, price: 15000, lvl: 6, mult: 15 },
  { id: 'reef_s', n: 'Reef Starter', w: 'salt', base: 1, cap: 6, price: 3500, lvl: 3, mult: 6 },
  { id: 'reef_m', n: 'Reef Tank', w: 'salt', base: 2, cap: 10, price: 11000, lvl: 4, mult: 14 },
  { id: 'reef_l', n: 'Large Reef', w: 'salt', base: 3, cap: 16, price: 40000, lvl: 6, mult: 35 },
  { id: 'reef_g', n: 'Grand Reef', w: 'salt', base: 4, cap: 26, price: 140000, lvl: 7, mult: 90 },
];
const TANK_TYPE = {};
TANK_TYPES.forEach(t => (TANK_TYPE[t.id] = t));
const START_HALL_SLOTS = 3;
const MAX_HALL_SLOTS = 10;
const hallSlotPrice = n => Math.round(300 * Math.pow(2.6, n - START_HALL_SLOTS)); // price of slot number n+1

/* Per-tank upgrades: cost = base * tank.mult */
const TANK_UPGRADES = [
  { id: 'filter', n: 'Water Filter', icon: '🧪', max: 2, costs: [200, 900], desc: '+1 water rating & +5% growth per level' },
  { id: 'aerator', n: 'Aerator', icon: '🫧', max: 1, costs: [350], desc: '+1 water rating & +10% growth' },
  { id: 'light', n: 'Grow Lights', icon: '💡', max: 3, costs: [300, 1200, 4000], desc: '+15% modifier chance per level' },
  { id: 'feeder', n: 'Auto-Feeder', icon: '🍽️', max: 1, costs: [500], desc: 'Feeds the tank automatically (costs food money)' },
];

/* Food */
const FOOD = [
  { n: 'Basic Flakes', mult: 2, price: 0 },
  { n: 'Fish Pellets', mult: 3, price: 150 },
  { n: 'Spirulina Blend', mult: 4, price: 700 },
  { n: 'Live Brine Shrimp', mult: 6, price: 3000 },
  { n: 'Gourmet Krill', mult: 9, price: 12000 },
  { n: 'Ambrosia Feed', mult: 14, price: 50000 },
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
  { id: 'gold', n: 'Gilded Frame', price: 6000, gravel: '#e8d9a0', frame: '#d4a017', b: { value: 0.06 } },
  { id: 'obsidian', n: 'Obsidian Deluxe', price: 20000, gravel: '#0d0d12', frame: '#7b2cbf', b: { value: 0.05, growth: 0.05, mod: 0.05 } },
];
const SKIN = {};
SKINS.forEach(s => (SKIN[s.id] = s));

/* Store upgrades */
const STORE_UPGRADES = [
  { id: 'cases', n: 'Display Cases', icon: '🗄️', max: 9, cost: l => Math.round(100 * Math.pow(2.2, l)), desc: '+1 fish on display (more fish for customers to want)' },
  { id: 'ads', n: 'Advertising', icon: '📣', max: 8, cost: l => Math.round(200 * Math.pow(2.3, l)), desc: 'Customers arrive 30% more often per level' },
  { id: 'sign', n: 'Shop Sign & Decor', icon: '🪧', max: 8, cost: l => Math.round(300 * Math.pow(2.4, l)), desc: 'Customers offer +6% more per level' },
  { id: 'seats', n: 'Comfy Seating', icon: '🛋️', max: 5, cost: l => Math.round(150 * Math.pow(2.3, l)), desc: '+10s customer patience per level' },
  { id: 'counter', n: 'Bigger Counter', icon: '🧾', max: 4, cost: l => Math.round(400 * Math.pow(2.6, l)), desc: '+1 customer can queue per level' },
  { id: 'cashier', n: 'Hire Cashier', icon: '🧑‍💼', max: 3, cost: l => [1500, 8000, 40000][l], desc: 'Auto-accepts offers of 95% / 85% / 75% of fish value or better' },
  { id: 'collector', n: "Collector's Club", icon: '🎩', max: 5, cost: l => Math.round(1000 * Math.pow(2.5, l)), desc: 'More collectors who pay big for modified fish' },
];
const BREED_UPGRADES = [
  { id: 'clutch', n: 'Breeding Nest', icon: '🪺', max: 3, cost: l => Math.round(800 * Math.pow(3, l)), desc: '+1 egg per breeding' },
  { id: 'cooldown', n: 'Breeding Aid', icon: '⏳', max: 4, cost: l => Math.round(500 * Math.pow(2.8, l)), desc: 'Breeding cooldown -15% per level' },
  { id: 'match', n: 'Matchmaker', icon: '💘', max: 4, cost: l => Math.round(1200 * Math.pow(2.8, l)), desc: '+10% modifier inheritance chance per level' },
  { id: 'lineage', n: 'Lineage Records', icon: '📜', max: 4, cost: l => Math.round(2000 * Math.pow(3, l)), desc: '+25% chance of a higher-tier offspring per level' },
];
const BREED_COOLDOWN = 90;
const BASE_INHERIT = 0.30;
const BASE_TIERUP = 0.07;
const QUICK_SELL = 0.5;
