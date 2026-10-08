'use strict';
/* ===== Expeditions: locations, wild species and wild modifiers (registered into the global tables) ===== */

/* pos = place on the sea map [x, z]; mod = the modifier that is only found there */
const LOCATIONS = [
  { id: 'lagoon', n: 'Coral Lagoon', w: 'salt', lvl: 3, dur: 150, cost: 400, danger: 0.03, pos: [84, 236], color: '#46d8d0', icon: '🏝️', mod: 'reefglow', d: 'Warm turquoise shallows ringed by living coral.' },
  { id: 'mangrove', n: 'Mangrove Swamp', w: 'fresh', lvl: 3, dur: 180, cost: 600, danger: 0.04, pos: [348, 262], color: '#6fbf5a', icon: '🌿', mod: 'mudskin', d: 'Tangled roots, brackish creeks and strange walking fish.' },
  { id: 'kelp', n: 'Kelp Forest', w: 'salt', lvl: 4, dur: 240, cost: 1800, danger: 0.05, pos: [64, 132], color: '#3fae6a', icon: '🌊', mod: 'kelpwrap', d: 'Towering golden kelp swaying in cold green water.' },
  { id: 'amazon', n: 'Amazon River', w: 'fresh', lvl: 4, dur: 300, cost: 3500, danger: 0.07, pos: [366, 150], color: '#8ac34a', icon: '🌴', mod: 'jungle', d: 'A winding jungle river full of giants and oddities.' },
  { id: 'arctic', n: 'Arctic Ice Shelf', w: 'salt', lvl: 6, dur: 480, cost: 14000, danger: 0.10, pos: [200, 40], color: '#bfe8ff', icon: '🧊', mod: 'glacial', d: 'Drifting ice under a pale sun. Cold, quiet and rich.' },
  { id: 'trench', n: 'Deep Trench', w: 'salt', lvl: 7, dur: 720, cost: 60000, danger: 0.14, pos: [138, 156], color: '#5a50d0', icon: '🌑', mod: 'abyssal', d: 'A bottomless dark where things glow on their own.' },
  { id: 'vents', n: 'Volcanic Vents', w: 'salt', lvl: 8, dur: 1000, cost: 220000, danger: 0.16, pos: [316, 48], color: '#ff6a2a', icon: '🌋', mod: 'ember', d: 'Boiling chimneys on the seabed. Dangerous and rewarding.' },
  { id: 'sunken', n: 'Sunken City', w: 'salt', lvl: 9, dur: 1500, cost: 900000, danger: 0.18, pos: [244, 176], color: '#e8c25a', icon: '🏛️', mod: 'ancient', d: 'Drowned temples and ancient guardians that never left.' },
];
const LOCATION = {}; LOCATIONS.forEach(l => (LOCATION[l.id] = l));

/* [location, id, name, tier, c, c2, shape, pattern, value-factor, archetype] */
const EXP_SPECIES = [
  ['lagoon', 'lagoonwrasse', 'Rainbow Lagoon Wrasse', 1, '#2ec4b6', '#ffbf69', 'slender', 'hstripes', 1.0, 'wrasse'],
  ['lagoon', 'cowfish', 'Longhorn Cowfish', 2, '#f2d16b', '#2b3a67', 'puffer', 'spots', 1.05, 'urchin'],
  ['lagoon', 'lagoonhorse', 'Lagoon Seahorse', 2, '#ff9f45', '#ffe3b0', 'eel', 'belly', 1.1, 'seadragon'],
  ['lagoon', 'butterfly', 'Copperband Butterflyfish', 3, '#fff3b0', '#e07b00', 'tall', 'stripes', 1.1, 'moorish'],
  ['mangrove', 'mudskipper', 'Mudskipper', 1, '#8a7a5a', '#4aa0c0', 'eel', 'spots', 0.9, 'blenny'],
  ['mangrove', 'archerfish', 'Archerfish', 2, '#d8d4a0', '#2a2a30', 'slender', 'band', 1.0, 'tetra'],
  ['mangrove', 'walkingcat', 'Walking Catfish', 2, '#6a5a4a', '#c8b898', 'eel', 'belly', 0.95, 'catfish'],
  ['mangrove', 'mangrovejack', 'Mangrove Jack', 3, '#c0392b', '#f0c8a0', 'round', 'belly', 1.05, 'cichlid'],
  ['mangrove', 'tarpon', 'Silver Tarpon', 3, '#d4dce6', '#8a9bb0', 'slender', 'belly', 1.1, 'arowana'],
  ['kelp', 'garibaldi', 'Garibaldi', 2, '#ff7b00', '#ffb347', 'round', 'none', 1.1, 'round'],
  ['kelp', 'sheephead', 'California Sheephead', 3, '#d62828', '#222222', 'round', 'band', 1.05, 'napoleon'],
  ['kelp', 'wolfeel', 'Kelp Wolf Eel', 3, '#7a8a6a', '#c9c9a0', 'eel', 'spots', 1.0, 'moray'],
  ['kelp', 'sunfish', 'Ocean Sunfish', 4, '#a8b4c0', '#e8eef2', 'puffer', 'belly', 1.15, 'opah'],
  ['kelp', 'seabass', 'Giant Sea Bass', 4, '#4a5560', '#8a98a4', 'round', 'spots', 1.0, 'grouper'],
  ['amazon', 'silverdollar', 'Silver Dollar', 2, '#d8e0e8', '#8aa0b8', 'round', 'spots', 0.95, 'piranha'],
  ['amazon', 'peacockbass', 'Peacock Bass', 3, '#3fae6a', '#ffd23f', 'round', 'band', 1.1, 'cichlid'],
  ['amazon', 'ghostknife', 'Black Ghost Knifefish', 3, '#1d1d24', '#ffffff', 'eel', 'band', 1.05, 'snakehead'],
  ['amazon', 'tigershovel', 'Tiger Shovelnose Catfish', 4, '#d8d2b0', '#2a2a2a', 'eel', 'stripes', 1.1, 'catfish'],
  ['amazon', 'altum', 'Altum Angelfish', 4, '#e8dcb0', '#c0392b', 'tall', 'stripes', 1.15, 'angel'],
  ['amazon', 'payara', 'Vampire Payara', 5, '#b8c4d0', '#f2f2f2', 'eel', 'belly', 1.2, 'arowana'],
  ['arctic', 'snowcod', 'Snow Cod', 2, '#cfd8e0', '#6a7a8a', 'round', 'spots', 0.95, 'grouper'],
  ['arctic', 'lumpsucker', 'Lumpsucker', 3, '#a0c0d8', '#f0a050', 'puffer', 'spots', 1.0, 'urchin'],
  ['arctic', 'arcticchar', 'Arctic Char', 3, '#4a6a8a', '#ff8a3a', 'slender', 'spots', 1.05, 'koi'],
  ['arctic', 'icefish', 'Crocodile Icefish', 4, '#e8f4fa', '#8ab4d0', 'eel', 'stripes', 1.1, 'snakehead'],
  ['arctic', 'greenland', 'Greenland Shark', 5, '#5a6a78', '#aab8c4', 'slender', 'belly', 1.25, 'nurseshark'],
  ['trench', 'lanternfish', 'Lanternfish', 3, '#1a2a4a', '#4af0e0', 'slender', 'spots', 1.0, 'tetra'],
  ['trench', 'viperfish', 'Viperfish', 4, '#1a3a4a', '#6af0d0', 'eel', 'spots', 1.05, 'barracuda'],
  ['trench', 'fangtooth', 'Fangtooth', 4, '#3a3028', '#e8e0c0', 'puffer', 'belly', 1.0, 'anglerfish'],
  ['trench', 'gulper', 'Gulper Eel', 5, '#14141c', '#c03a8a', 'eel', 'belly', 1.2, 'eel'],
  ['trench', 'barreleye', 'Barreleye', 5, '#c8e0e8', '#3aa860', 'puffer', 'patch', 1.15, 'opah'],
  ['trench', 'coelacanth', 'Coelacanth', 5, '#3a5a9a', '#c8d8f0', 'round', 'spots', 1.25, 'sturgeon'],
  ['vents', 'ventgoby', 'Vent Goby', 3, '#a83a2a', '#ffb347', 'slender', 'belly', 1.0, 'tetra'],
  ['vents', 'emberblenny', 'Ember Blenny', 3, '#4a3a3a', '#ff6a2a', 'eel', 'stripes', 1.0, 'blenny'],
  ['vents', 'magmatang', 'Magma Tang', 4, '#2a2428', '#ff7a1a', 'tall', 'stripes', 1.1, 'tang'],
  ['vents', 'lavaeel', 'Lava Eel', 4, '#3a2a2a', '#ff4a1a', 'eel', 'spots', 1.1, 'moray'],
  ['vents', 'brimstone', 'Brimstone Angelfish', 5, '#e8c020', '#c0301a', 'tall', 'stripes', 1.25, 'marangel'],
  ['sunken', 'relicangel', 'Relic Angelfish', 4, '#4aa8a0', '#e8c25a', 'tall', 'stripes', 1.15, 'marangel'],
  ['sunken', 'pearlhorse', 'Pearl Seahorse', 4, '#f4ecdc', '#c8a8e8', 'eel', 'belly', 1.2, 'seadragon'],
  ['sunken', 'templearowana', 'Temple Guardian Arowana', 5, '#e8c25a', '#3aa89a', 'eel', 'belly', 1.3, 'arowana'],
  ['sunken', 'atlantiskoi', 'Atlantis Koi', 5, '#f8f4e0', '#3a8ad0', 'slender', 'patch', 1.3, 'koi'],
  ['sunken', 'siren', 'Siren Eel', 5, '#2a6a9a', '#e8c25a', 'eel', 'stripes', 1.25, 'eel'],
];
/* [location, id, name, tier, mult, chance, glow, icon, description] — only found on expeditions (and then passed on by breeding) */
const EXP_MODS = [
  ['lagoon', 'reefglow', 'Reef-Glow', 2, 4, 0.05, '#ff7aa0', '🪸', 'Coral-pink patches that pulse with soft light'],
  ['mangrove', 'mudskin', 'Mud-Skinned', 1, 2.2, 0.06, null, '🟤', 'Speckled with river mud and moss'],
  ['kelp', 'kelpwrap', 'Kelp-Wrapped', 2, 4, 0.05, '#4cd070', '🌱', 'Ribbons of golden-green kelp drift around it'],
  ['amazon', 'jungle', 'Jungle-Painted', 2, 4.5, 0.05, null, '🍃', 'Leaf-print camouflage of the rainforest'],
  ['arctic', 'glacial', 'Glacial', 3, 7, 0.035, '#bfe8ff', '🧊', 'Frozen crystal scales that glitter like ice'],
  ['trench', 'abyssal', 'Abyssal', 3, 8, 0.03, '#40f0d0', '🔦', 'Pitch black, speckled with living lights'],
  ['vents', 'ember', 'Ember-Forged', 3, 8, 0.03, '#ff7a30', '🔥', 'Forged in the vents: dark crust, glowing veins'],
  ['sunken', 'ancient', 'Ancient', 3, 9, 0.03, '#e8c25a', '🗿', 'Gold-inlaid with the runes of a lost city'],
];
const EXP_VALUE_MULT = 1.25;
const EXP_SUPPLIES = [
  { n: 'Basic supplies', mult: 1, luck: 0, safe: 0 },
  { n: 'Well-stocked', mult: 2.2, luck: 0.15, safe: 0.4 },
  { n: 'Deluxe expedition', mult: 5, luck: 0.35, safe: 0.7 },
];
const EXP_UPGRADES = [
  { id: 'hull', n: 'Reinforced Hull', icon: '⚓', max: 8, cost: l => Math.round(1500 * Math.pow(2.2, l)), desc: 'Boats sail 8% faster per level' },
  { id: 'crew', n: 'Veteran Crew', icon: '🧑‍✈️', max: 8, cost: l => Math.round(2500 * Math.pow(2.3, l)), desc: 'Better odds of rare fish: +12% weight on higher tiers, per level' },
  { id: 'nets', n: 'Deep-Sea Nets', icon: '🕸️', max: 6, cost: l => Math.round(4000 * Math.pow(2.6, l)), desc: '+1 catch for every 2 levels' },
  { id: 'sonar', n: 'Fish Finder Sonar', icon: '📡', max: 5, cost: l => Math.round(6000 * Math.pow(2.8, l)), desc: '+15% chance of the location\'s special modifier, per level' },
  { id: 'safety', n: 'Storm Shelter', icon: '🛟', max: 5, cost: l => Math.round(3000 * Math.pow(2.5, l)), desc: 'Storms and accidents are 12% less likely, per level' },
];
const EXP_BOAT_COSTS = [0, 25000, 150000, 800000];

(function registerExpeditions() {
  EXP_SPECIES.forEach(([loc, id, n, t, c, c2, sh, pt, v, arch]) => {
    const L = LOCATION[loc], s = { id, n, t, w: L.w, f: L.n, c, c2, sh, pt, v, exp: loc };
    s.value = Math.round(BASE_VALUE[t] * v * (L.w === 'salt' ? SALT_VALUE_MULT : 1) * EXP_VALUE_MULT);
    SPECIES_LIST.push(s); SPECIES[id] = s; ARCH_OF[id] = arch;
  });
  EXP_MODS.forEach(([loc, id, n, t, m, p, glow, icon, d]) => { const o = { id, n, t, m, p, glow, icon, d, exp: loc }; MODS_LIST.push(o); MODS[id] = o; });
})();
