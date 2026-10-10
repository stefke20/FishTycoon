'use strict';
/* ===== The story: twelve short chapters told on illustrated cards. A chapter arrives when you reach its milestone. ===== */

const STORY_CAST = {
  barnaby: { n: 'Uncle Barnaby', c: '#e0b86a', tag: 'letter' },
  finch: { n: 'Reginald Finch', c: '#b8a0ff', tag: 'rival' },
  gill: { n: 'Old Gill', c: '#ff9a52', tag: 'guardian' },
  narr: { n: '', c: '#8da6c0', tag: '' },
};
/* art = a key of STORY_ART (story3d.js); sky = the colour behind the picture */
const CHAPTERS = [
  { id: 'prologue', n: 'A Letter from Uncle Barnaby', hint: 'Start your shop', when: () => S.seenHelp, reward: () => ({ money: 75, items: { mut1: 1 } }), sky: ['#2a4a6a', '#0d1b2e'],
    cards: [
      { art: 'letter', who: 'barnaby', t: 'My dear heir — if you are reading this, I have finally taken the boat I am always going on about and sailed off to find the end of the ocean. The shop is yours.' },
      { art: 'shop', who: 'barnaby', t: 'It is not much: a drafty storefront, a starter tank that only leaks a little, and a till that sticks on the number seven. But it has the best customers in town, and the best fish in the world — you just have to grow them.' },
      { art: 'tank', who: 'barnaby', t: 'Two eggs are waiting in the box. Hatch them in the tank, feed the babies, and when they grow up put them in the display cases. Customers will do the rest. And wipe the glass! — B.' },
    ] },
  { id: 'firstsale', n: 'Open for Business', hint: 'Make your first sale', when: () => S.sales >= 1, reward: () => ({ money: 100 }), sky: ['#5a7a9a', '#1a2a3e'],
    cards: [
      { art: 'till', who: 'narr', t: 'The little bell above the door jingles and a stranger counts coins into your hand. Your first sale! The till sticks on the seven, exactly as promised.' },
      { art: 'tank', who: 'barnaby', t: '(You can almost hear him.) “Every empire begins with one happy customer. Now find another.”' },
    ] },
  { id: 'rival', n: 'A Rival Arrives', hint: 'Reach store level 2', when: () => level() >= 2, reward: () => ({ rp: 2 }), sky: ['#3a3a5a', '#12121e'],
    cards: [
      { art: 'rival', who: 'finch', t: 'Charming little shop! Barnaby’s old place, isn’t it? Finch & Fins has had its eye on this corner for years. I give it a month. Perhaps two, if the tank doesn’t leak.' },
      { art: 'rival', who: 'narr', t: 'He tips his top hat, leaves a card that smells of expensive soap, and glides out into the street.' },
      { art: 'shop', who: 'narr', t: 'A month? You have a better plan. A shop is only as good as its fish.' },
    ] },
  { id: 'journal', n: 'Barnaby’s Journal', hint: 'Breed two fish', when: () => S.bredCount >= 1, reward: () => ({ items: { mut1: 2 } }), sky: ['#4a3a2a', '#1a120a'],
    cards: [
      { art: 'journal', who: 'barnaby', t: 'Entry fourteen: fish remember. A stripe, a shimmer, a spark — a modifier can be handed from parent to child. Pair the right fish and the family grows stranger and finer with every generation.' },
      { art: 'family', who: 'barnaby', t: 'But mind this: five is the most any fish can carry. Beyond that even the water gets nervous. Choose your favourites carefully.' },
    ] },
  { id: 'fair', n: 'The Fair', hint: 'Enter a fish in a show', when: () => (S.stats.showsEntered || 0) >= 1, reward: () => ({ money: Math.round(DAILY_MONEY[Math.max(1, level())] * 1.5) }), sky: ['#6a4a7a', '#1e1228'],
    cards: [
      { art: 'fair', who: 'narr', t: 'Bunting, brass music and a judges’ table. Your fish takes its place in the show tank, fins spread wide.' },
      { art: 'rival', who: 'finch', t: 'Not bad. Not good enough, of course — but not bad. See you at the Regional Expo, little shop.' },
    ] },
  { id: 'charts', n: 'The Charts on the Wall', hint: 'Reach store level 4', when: () => level() >= 4, reward: () => ({ rp: 3 }), sky: ['#2a5a6a', '#0a1a22'],
    cards: [
      { art: 'map', who: 'narr', t: 'Behind the counter hangs a faded sea chart you never noticed: twelve islands, each ringed with Barnaby’s crabbed handwriting.' },
      { art: 'map', who: 'barnaby', t: 'Every island is ruled by a guardian fish. They cannot be argued with, bribed or bullied. They respect only a fish bred exactly as they demand. Start with Old Gill, at Lilypad Pond.' },
    ] },
  { id: 'bottle', n: 'Message in a Bottle', hint: 'Send a boat on an expedition', when: () => (S.stats.exps || 0) >= 1, reward: () => ({ items: { mut2: 1 } }), sky: ['#2a6a8a', '#081826'],
    cards: [
      { art: 'bottle', who: 'narr', t: 'Your boat returns with a surprise tangled in the nets: a corked bottle, sun-bleached, with a scrap of paper inside.' },
      { art: 'bottle', who: 'barnaby', t: 'Alive and well! Found the Coral Gate — the water is the colour of a sapphire. Tell Finch I said hello. P.S. The fish out here have opinions.' },
    ] },
  { id: 'home', n: 'A Place to Call Home', hint: 'Build the garden pond', when: () => estLvl('garden') >= 1, reward: () => ({ money: Math.round(DAILY_MONEY[Math.max(1, level())] * 3) }), sky: ['#4a7a4a', '#10201a'],
    cards: [
      { art: 'garden', who: 'narr', t: 'A pond, a bench and a few stubborn koi. It is not the grand aquarium Barnaby dreamed of — but it is a start.' },
      { art: 'garden', who: 'barnaby', t: 'Home is where the fish retire. Give your champions somewhere beautiful to spend their old age.' },
    ] },
  { id: 'guardian', n: 'The First Guardian', hint: 'Beat the first campaign boss', when: () => !!(S.camp && S.camp.done && S.camp.done[0]), reward: () => ({ rp: 2, items: { mut2: 1 } }), sky: ['#2a7a5a', '#08201a'],
    cards: [
      { art: 'boss', who: 'gill', t: 'Striped, strong and swimming well. Barnaby’s heir, are you? He bred a stripe like that once. Pass, little breeder. The sea has more to teach you.' },
      { art: 'map', who: 'narr', t: 'Eleven guardians remain. The ocean is wide.' },
    ] },
  { id: 'offer', n: 'Finch’s Offer', hint: 'Reach store level 7', when: () => level() >= 7, reward: () => ({ money: Math.round(DAILY_MONEY[Math.max(1, level())] * 4) }), sky: ['#5a3a3a', '#1a0e0e'],
    cards: [
      { art: 'rival', who: 'finch', t: 'Level seven! I am almost impressed. Let us be civilised: I will buy the whole operation — shop, fish, that dreadful till. Name a figure.' },
      { art: 'letter', who: 'narr', t: 'You think of the letter, the leaky tank, the till that sticks on seven.' },
      { art: 'shop', who: 'narr', t: '“No,” you say. Finch smiles like a man who has just found a worthy opponent.' },
    ] },
  { id: 'glass', n: 'Beneath the Glass', hint: 'Open the Aquarium Gallery', when: () => estLvl('gallery') >= 1, reward: () => ({ rp: 3 }), sky: ['#1a5a8a', '#06142a'],
    cards: [
      { art: 'gallery', who: 'narr', t: 'The first visitors step into the glass tunnel and gasp as your champions glide overhead.' },
      { art: 'gallery', who: 'barnaby', t: 'I always wanted to walk under them. Look up for me, will you?' },
    ] },
  { id: 'sanct', n: 'A Sanctuary for Every Fish', hint: 'Reach the maximum store level', when: () => level() >= MAX_LEVEL || S.sanct >= 1, reward: () => ({ money: Math.round(DAILY_MONEY[Math.max(1, level())] * 6) }), sky: ['#3a5a8a', '#0a1428'],
    cards: [
      { art: 'sanct', who: 'barnaby', t: 'My last letter, I promise. Build the Great Sanctuary — a place where every species and every hero swims free. That was always the point of it all. Not the money.' },
      { art: 'sanct', who: 'narr', t: 'The plans are on the last page of the Stats book. It will take everything you have learned.' },
    ] },
  { id: 'legend', n: 'Ocean Legend', hint: 'Complete the Great Sanctuary', when: () => S.sanct >= SANCT.length, reward: () => ({ money: Math.round(DAILY_MONEY[Math.max(1, level())] * 12), rp: 10 }), title: 'Storyteller', sky: ['#6a5a9a', '#14102a'],
    cards: [
      { art: 'sanct', who: 'narr', t: 'The doors swing open. Every species you ever raised glides past a crowd of thousands, and for a moment the whole hall is silent.' },
      { art: 'rival', who: 'finch', t: 'Finch & Fins closes on Friday. I wondered… that is… do you need a salesman? I am extremely good with customers.' },
      { art: 'letter', who: 'barnaby', t: 'Well done, my heir. The shop was always yours — the sea was always ours. Keep the glass clean. — B.' },
    ] },
];
const CHAPTER = {}; CHAPTERS.forEach(c => (CHAPTER[c.id] = c));

function ensureG7() {
  const fresh = !S.story;
  S.story = Object.assign({ done: {}, queue: [], journal: [], nextAt: 0 }, S.story);
  if (fresh && (S.sales > 0 || S.fish.length > 0 || S.time > 60)) S.story.nextAt = 30;   // an older save: drip the backlog in slowly
}
const storyQueued = id => S.story.queue.includes(id);
function tickStory() {
  if (!S.seenHelp || S.time < S.story.nextAt || S.story.queue.length) return;
  for (const c of CHAPTERS) {
    if (S.story.done[c.id] || storyQueued(c.id)) continue;
    let ok = false; try { ok = c.when(); } catch (e) {}
    if (ok) { S.story.queue.push(c.id); S.story.nextAt = S.time + (c.id === 'prologue' ? 1 : 50); G.dirty = true; return; }
  }
}
/* open a chapter: marks it read, pays the reward and returns the reward text (once) */
function startChapter(id, replay) {
  const c = CHAPTER[id]; if (!c) return null;
  S.story.queue = S.story.queue.filter(x => x !== id);
  if (replay || S.story.done[id]) return null;
  S.story.done[id] = true; S.story.journal.push({ id, at: Date.now() });
  const r = c.reward ? c.reward() : null; if (r) giveReward(r); if (c.title && S.titles && !S.titles.includes(c.title)) S.titles.push(c.title);
  G.dirty = true; return r ? rewardText(r) : null;
}
