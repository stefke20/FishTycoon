'use strict';
/* ===== Research tree: six branches, research points (RP) + money, keystone capstones ===== */

const RBRANCHES = [
  { id: 'husb', n: 'Husbandry', icon: '🌱', color: '#4fe0a0', d: 'Faster growth, cleaner water, bigger tanks.' },
  { id: 'gene', n: 'Genetics', icon: '🧬', color: '#b08cff', d: 'Mutations, inheritance and tier-ups.' },
  { id: 'shop', n: 'Commerce', icon: '💰', color: '#ffc24a', d: 'Prices, customers and contracts.' },
  { id: 'exp', n: 'Exploration', icon: '⛵', color: '#4ad8f0', d: 'Faster, cheaper, richer expeditions.' },
  { id: 'show', n: 'Showmanship', icon: '🏆', color: '#ff7aa8', d: 'Higher scores, more fame, bigger prizes.' },
  { id: 'mgmt', n: 'Management', icon: '📋', color: '#6aa8ff', d: 'Staff, wages and time away.' },
];
const RBRANCH = {}; RBRANCHES.forEach(b => (RBRANCH[b.id] = b));
const RP_ROW = [1, 2, 4, 7, 12];            // base research-point cost per row
const MONEY_ROW = [3000, 8000, 22000, 70000, 0];
const rc = (m, g) => l => Math.round(m * Math.pow(g, l));
/* b branch · row depth · req [[node, level]] · key = keystone (single level, special rule) */
const RNODES = [
  // ---- Husbandry
  { id: 'nutrition', b: 'husb', row: 0, n: 'Nutrition Science', icon: '🥗', max: 10, cost: rc(3000, 1.95), desc: '+5% growth speed in every tank, per level' },
  { id: 'sponge', b: 'husb', row: 0, n: 'Pro Sponge', icon: '🧽', max: 5, cost: rc(500, 2.3), desc: 'A bigger sponge that cleans more water per smudge, per level' },
  { id: 'metabolism', b: 'husb', row: 1, n: 'Slow Metabolism', icon: '⏳', max: 5, cost: rc(6000, 2.1), req: [['nutrition', 2]], desc: 'A feeding lasts 10% longer, per level' },
  { id: 'chemistry', b: 'husb', row: 1, n: 'Water Chemistry', icon: '⚗️', max: 8, cost: rc(2500, 2.1), req: [['nutrition', 2]], desc: 'Water quality drops 7% slower, per level' },
  { id: 'biofilter', b: 'husb', row: 2, n: 'Living Biofilter', icon: '🪸', max: 5, cost: rc(18000, 2.3), req: [['chemistry', 3]], desc: 'Tanks slowly clean themselves while the water is above 15%, per level' },
  { id: 'ecosystem', b: 'husb', row: 2, n: 'Balanced Ecosystem', icon: '🐠', max: 4, cost: rc(40000, 3), req: [['metabolism', 2], ['chemistry', 2]], desc: '+1 fish capacity in every tank, per level' },
  { id: 'paradise', b: 'husb', row: 3, key: true, n: 'Aquatic Paradise', icon: '🏝️', max: 1, cost: () => 2500000, rp: 14, req: [['ecosystem', 2], ['biofilter', 2]], desc: 'KEYSTONE: every tank counts as having +1 water rating' },
  // ---- Genetics
  { id: 'genetics', b: 'gene', row: 0, n: 'Genetics Lab', icon: '🔬', max: 10, cost: rc(4000, 2), desc: '+8% modifier chance everywhere, per level' },
  { id: 'bloodline', b: 'gene', row: 1, n: 'Genealogy Institute', icon: '📜', max: 10, cost: rc(6000, 2), req: [['genetics', 2]], desc: '+3% chance that each parent modifier is inherited, per level' },
  { id: 'evolution', b: 'gene', row: 1, n: 'Evolution Research', icon: '🦎', max: 8, cost: rc(8000, 2.2), req: [['genetics', 2]], desc: '+2% chance of a higher-tier offspring, per level' },
  { id: 'splicing', b: 'gene', row: 1, n: 'Gene Splicing', icon: '✂️', max: 5, cost: rc(9000, 2.2), req: [['genetics', 3]], desc: '+1% chance of a brand-new modifier on offspring, per level' },
  { id: 'cloning', b: 'gene', row: 2, n: 'Cloning Vats', icon: '🧫', max: 4, cost: rc(30000, 3), req: [['bloodline', 2], ['splicing', 1]], desc: '+1 egg per breeding for every 2 levels' },
  { id: 'epigenetics', b: 'gene', row: 2, n: 'Epigenetics', icon: '🌀', max: 5, cost: rc(22000, 2.3), req: [['bloodline', 3]], desc: 'Breeding cooldown 8% shorter, per level' },
  { id: 'mutagenesis', b: 'gene', row: 2, n: 'Mutagenesis', icon: '☣️', max: 5, cost: rc(25000, 2.4), req: [['splicing', 2]], desc: 'Mutagens are 10% stronger, per level' },
  { id: 'prodigy', b: 'gene', row: 2, n: 'Prodigy Program', icon: '🎓', max: 5, cost: rc(20000, 2.3), req: [['evolution', 3]], desc: 'Bred babies hatch 8% grown, per level' },
  { id: 'chimera', b: 'gene', row: 3, key: true, n: 'Chimera Lab', icon: '🐉', max: 1, cost: () => 3000000, rp: 15, req: [['cloning', 1], ['mutagenesis', 2], ['prodigy', 1]], desc: 'KEYSTONE: offspring always inherit at least one parent modifier, if the parents have any' },
  // ---- Commerce
  { id: 'market', b: 'shop', row: 0, n: 'Market Research', icon: '📈', max: 10, cost: rc(5000, 2.05), desc: '+3% value on every fish, per level' },
  { id: 'wholesale', b: 'shop', row: 1, n: 'Egg Wholesaler', icon: '📦', max: 10, cost: rc(3500, 2), req: [['market', 1]], desc: 'Eggs cost 3% less, per level' },
  { id: 'broker', b: 'shop', row: 1, n: 'Contract Broker', icon: '🤝', max: 5, cost: rc(3000, 2.4), req: [['market', 1]], desc: 'Special orders pay 10% more and arrive faster, per level' },
  { id: 'marketing', b: 'shop', row: 1, n: 'Marketing Campaign', icon: '📣', max: 8, cost: rc(8000, 2.1), req: [['market', 2]], desc: 'Customers arrive 8% more often, per level' },
  { id: 'negotiation', b: 'shop', row: 1, n: 'Negotiation Training', icon: '🗣️', max: 8, cost: rc(10000, 2.15), req: [['market', 2]], desc: 'Customers offer 3% more, per level' },
  { id: 'appraisal', b: 'shop', row: 2, n: 'Expert Appraisal', icon: '🔎', max: 6, cost: rc(25000, 2.3), req: [['negotiation', 2]], desc: 'The fish market pays 2% more, per level' },
  { id: 'loyalty', b: 'shop', row: 2, n: 'Loyalty Programme', icon: '🎟️', max: 6, cost: rc(20000, 2.2), req: [['marketing', 2]], desc: 'Customers wait 4 seconds longer, per level' },
  { id: 'tycoon', b: 'shop', row: 3, key: true, n: 'Retail Tycoon', icon: '🎩', max: 1, cost: () => 2000000, rp: 12, req: [['appraisal', 2], ['loyalty', 2], ['broker', 2]], desc: 'KEYSTONE: customers offer 15% more' },
  // ---- Exploration
  { id: 'navigation', b: 'exp', row: 0, n: 'Navigation Charts', icon: '🧭', max: 6, cost: rc(5000, 2.2), desc: 'Boats sail 6% faster, per level' },
  { id: 'provisions', b: 'exp', row: 1, n: 'Bulk Provisions', icon: '🥫', max: 5, cost: rc(9000, 2.2), req: [['navigation', 2]], desc: 'Supplies cost 8% less, per level' },
  { id: 'cartography', b: 'exp', row: 1, n: 'Cartography', icon: '🗺️', max: 6, cost: rc(15000, 2.4), req: [['navigation', 2]], desc: '+1 catch for every 3 levels' },
  { id: 'bounty', b: 'exp', row: 2, n: 'Treasure Hunters', icon: '💎', max: 5, cost: rc(30000, 2.4), req: [['provisions', 2]], desc: 'Treasure and mutagens turn up 25% more often, per level' },
  { id: 'legend', b: 'exp', row: 3, key: true, n: 'Legendary Captain', icon: '⚓', max: 1, cost: () => 3000000, rp: 14, req: [['cartography', 3], ['bounty', 2]], desc: 'KEYSTONE: your boats never meet storms, and rare fish are far more likely' },
  // ---- Showmanship
  { id: 'grooming', b: 'show', row: 0, n: 'Fin Grooming', icon: '💅', max: 8, cost: rc(6000, 2.2), desc: 'Your show scores are 4% higher, per level' },
  { id: 'scouting', b: 'show', row: 1, n: 'Rival Scouting', icon: '🔭', max: 2, cost: rc(9000, 3), req: [['grooming', 1]], desc: 'Level 1 shows the range of rival scores, level 2 shows every rival score' },
  { id: 'press', b: 'show', row: 1, n: 'Press Office', icon: '📰', max: 6, cost: rc(12000, 2.2), req: [['grooming', 2]], desc: '+10% fame from every show, per level' },
  { id: 'sponsors', b: 'show', row: 1, n: 'Sponsorships', icon: '🏷️', max: 6, cost: rc(14000, 2.3), req: [['grooming', 2]], desc: 'Show and tournament prizes are 8% bigger, per level' },
  { id: 'champion', b: 'show', row: 3, key: true, n: 'Grand Champion Circuit', icon: '👑', max: 1, cost: () => 2500000, rp: 12, req: [['press', 2], ['sponsors', 2]], desc: 'KEYSTONE: +10% show scores, and every show win brings a Mutagen Reactor' },
  // ---- Management
  { id: 'nightshift', b: 'mgmt', row: 0, n: 'Night Shift', icon: '🌙', max: 8, cost: rc(2000, 2.2), desc: 'Fish keep growing 1 more hour while you are away, per level' },
  { id: 'automation', b: 'mgmt', row: 1, n: 'Automation Hub', icon: '🤖', max: 6, cost: rc(7000, 2.3), req: [['nightshift', 1]], desc: 'Staff work 8% faster, per level' },
  { id: 'accounting', b: 'mgmt', row: 1, n: 'Accounting', icon: '🧮', max: 6, cost: rc(8000, 2.2), req: [['nightshift', 2]], desc: 'Staff wages are 8% lower, per level' },
  { id: 'hr', b: 'mgmt', row: 2, n: 'Human Resources', icon: '🧑‍💼', max: 5, cost: rc(18000, 2.4), req: [['automation', 2]], desc: 'Hiring and upgrading staff costs 10% less, per level' },
  { id: 'ceo', b: 'mgmt', row: 3, key: true, n: 'Chief Executive', icon: '🏢', max: 1, cost: () => 3000000, rp: 14, req: [['automation', 3], ['accounting', 2], ['hr', 1]], desc: 'KEYSTONE: staff work 30% faster and wages are halved' },
];
const RNODE = {}; RNODES.forEach(n => (RNODE[n.id] = n));
const LAB_BY_ID = RNODE;     // old name used by older code
const rpCost = (n, l) => (n.key ? n.rp : Math.ceil(RP_ROW[n.row] * (1 + 0.5 * l)));
const researchUnlocked = n => (lab(n.id) > 0) || !n.req || n.req.every(([id, lv]) => lab(id) >= lv);
const researchMissing = n => (n.req || []).filter(([id, lv]) => lab(id) < lv);

/* ---- research points ---- */
let _rpQueue = 0;
function gainRP(n) { if (!n) return; S.rp = (S.rp || 0) + n; S.rpTotal = (S.rpTotal || 0) + n; _rpQueue += n; }
function flushRP() { if (_rpQueue > 0) { G.msg(`+${_rpQueue} research point${_rpQueue > 1 ? 's' : ''}`, 'good'); _rpQueue = 0; G.dirty = true; } }
const fundCost = () => Math.round(2500 * Math.pow(1.3, S.rpFunded || 0));
function fundResearch() { const c = fundCost(); if (!spend(c)) return fail('Not enough money'); S.rpFunded = (S.rpFunded || 0) + 1; S.rp += 1; S.rpTotal = (S.rpTotal || 0) + 1; return ok(); }
function buyResearch(id) {
  const n = RNODE[id], l = lab(id); if (!n) return fail('Unknown');
  if (l >= n.max) return fail('Maxed'); if (!researchUnlocked(n)) return fail('Research the prerequisites first');
  const rp = rpCost(n, l), money = n.cost(l);
  if ((S.rp || 0) < rp) return fail(`Needs ${rp} research points`); if (!spend(money)) return fail('Not enough money');
  S.rp -= rp; S.lab[id] = l + 1; return ok();
}
const buyLab = buyResearch;

/* ---------- UI ---------- */
function researchNode(n) {
  const l = lab(n.id), open = researchUnlocked(n), maxed = l >= n.max, rp = rpCost(n, l), money = n.cost(l), miss = researchMissing(n);
  const can = open && !maxed && (S.rp || 0) >= rp && S.money >= money;
  const pips = n.max <= 10 ? Array.from({ length: n.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('') : '';
  return `<div class="rnode ${n.key ? 'key' : ''} ${maxed ? 'maxed' : open ? 'open' : 'locked'}" data-node="${n.id}" data-req="${(n.req || []).map(r => r[0]).join(',')}" style="--bc:${RBRANCH[n.b].color}">
    <div class="rhead"><span class="ric">${n.icon}</span><div class="grow"><b>${n.n}</b><div class="pips">${pips}</div></div><span class="small ${maxed ? 'gold' : 'dim'}">${l}/${n.max}</span></div>
    <div class="small dim rdesc">${n.desc}</div>
    ${maxed ? '<div class="good small" style="font-weight:600">★ Mastered</div>' : open ? `<div class="rcost"><span class="${(S.rp || 0) >= rp ? '' : 'badc'}">🔬 ${rp} RP</span><span class="${S.money >= money ? 'gold' : 'badc'}">${fmt(money)}</span></div>${btn(l ? 'Upgrade' : 'Research', 'research', { x: n.id }, can ? 'pri sm' : 'sm', !can)}` : `<div class="small badc">🔒 Needs ${miss.map(([id, lv]) => RNODE[id].n + ' ' + lv).join(', ')}</div>`}
  </div>`;
}
function viewResearch() {
  if (!UI.rbranch || !RBRANCH[UI.rbranch]) UI.rbranch = 'husb';
  const b = RBRANCH[UI.rbranch], nodes = RNODES.filter(n => n.b === b.id), rows = [...new Set(nodes.map(n => n.row))].sort((x, y) => x - y);
  const done = RNODES.reduce((a, n) => a + lab(n.id), 0), total = RNODES.reduce((a, n) => a + n.max, 0);
  let h = pageHead('Research', 'Spend research points (RP) and money to unlock permanent upgrades. Earn RP by discovering species and modifiers, winning shows, returning from expeditions, finishing daily quests and defeating campaign bosses.', `${pill('Research points', '🔬 ' + (S.rp || 0))}${pill('Researched', done + '/' + total)}${btn(`Fund research · ${fmt(fundCost())} → +1 RP`, 'fundRP', {}, 'sm', S.money < fundCost())}`);
  h += `<div class="seg" style="flex-wrap:wrap">${RBRANCHES.map(x => { const ns = RNODES.filter(n => n.b === x.id), d = ns.reduce((a, n) => a + lab(n.id), 0), t = ns.reduce((a, n) => a + n.max, 0); return `<button class="${UI.rbranch === x.id ? 'on' : ''}" data-act="rbranch" data-x="${x.id}">${x.icon} ${x.n} <span class="dim small">${d}/${t}</span></button>`; }).join('')}</div>`;
  h += `<div class="dim small" style="margin-bottom:10px">${b.d}</div><div class="rtree" id="rtree" style="--bc:${b.color}"><svg class="rlines" id="rlines"></svg>${rows.map(r => `<div class="rrow">${nodes.filter(n => n.row === r).map(researchNode).join('')}</div>`).join('')}</div>`;
  return h;
}
/* draw the connecting lines after the page is rendered */
function drawResearchLines() {
  const tree = document.getElementById('rtree'), svg = document.getElementById('rlines'); if (!tree || !svg) return;
  const tr = tree.getBoundingClientRect(); svg.setAttribute('width', tr.width); svg.setAttribute('height', tr.height); let d = '';
  tree.querySelectorAll('[data-node]').forEach(el => {
    const reqs = (el.dataset.req || '').split(',').filter(Boolean), cr = el.getBoundingClientRect();
    reqs.forEach(id => { const p = tree.querySelector(`[data-node="${id}"]`); if (!p) return; const pr = p.getBoundingClientRect(), x1 = pr.left + pr.width / 2 - tr.left, y1 = pr.bottom - tr.top, x2 = cr.left + cr.width / 2 - tr.left, y2 = cr.top - tr.top, my = (y1 + y2) / 2, ok = lab(id) > 0; d += `<path d="M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}" class="${ok ? 'on' : ''}"/>`; });
  });
  svg.innerHTML = d;
}
