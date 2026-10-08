'use strict';
/* ===== UI ===== */

const Sfx = {
  ctx: null,
  play(kind) {
    if (!S || !S.settings || !S.settings.sound) return;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const c = this.ctx; if (c.state === 'suspended') c.resume();
      const seq = { sale: [[880, 0.07], [1320, 0.13]], pop: [[420, 0.05], [660, 0.08]], buy: [[640, 0.05]], good: [[520, 0.07], [660, 0.07], [880, 0.12]], level: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.22]], err: [[190, 0.12]] }[kind]; if (!seq) return;
      let t = c.currentTime;
      seq.forEach(([f, d]) => { const o = c.createOscillator(), g = c.createGain(); o.type = kind === 'err' ? 'sawtooth' : 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.9; });
    } catch (e) {}
  },
};
const UI = { tab: 'store', qty: 1, sort: 'value', onlyMods: false, tankId: null, shopCat: 'eggs', upTank: null, sel: [], modal: null, lastBreed: null, boost: null };
const $ = s => document.querySelector(s);
const pct = x => { const v = x * 100; return (v < 10 && v > 0 ? v.toFixed(1) : Math.round(v)) + '%'; };
let mouseDown = false;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tierBadge = t => `<span class="tier" style="background:${TIER_COLORS[t]}">${TIER_NAMES[t]}</span>`;
const modChips = mods => mods.map(m => `<span class="chip m${MODS[m].t}" title="${esc(MODS[m].d)} · ${MOD_TIER_NAMES[MODS[m].t]} · x${MODS[m].m} value">${MODS[m].icon} ${MODS[m].n}</span>`).join('');
const btn = (label, act, data, cls, dis) => `<button class="btn ${cls || ''} ${dis ? 'off' : ''}" data-act="${act}" ${Object.entries(data || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')} ${dis ? 'aria-disabled="true"' : ''}>${label}</button>`;
const mult = n => (Math.round(n * 100) / 100) + 'x';
const ico = (e, s) => `<span class="eico" style="${s ? `width:${s * 1.5}px;height:${s * 1.5}px;font-size:${s}px` : ''}">${e}</span>`;
const pill = (l, v) => `<span class="pill">${l ? l + ' ' : ''}<b>${v}</b></span>`;
const waterTag = w => `<span class="wt ${w}">${w === 'salt' ? 'Saltwater' : 'Freshwater'}</span>`;
const SVG = {
  store: '<path d="M3 9l1.6-5h14.8L21 9M3 9h18v2a3 3 0 01-6 0 3 3 0 01-6 0 3 3 0 01-6 0V9zM5 14v6h14v-6"/>',
  hall: '<path d="M2 12c3-5 8-6 12-3l4-3v12l-4-3c-4 3-9 2-12-3z"/><circle cx="8" cy="11" r="1"/>',
  breed: '<path d="M12 21s-8-5.3-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.7-8 11-8 11z"/>',
  shop: '<path d="M5 8h14l-1 12H6L5 8zM9 8a3 3 0 016 0"/>',
  inv: '<path d="M3 7l9-4 9 4v10l-9 4-9-4V7zM3 7l9 4 9-4M12 11v10"/>',
  menu: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
};
const pageHead = (title, sub, actions) => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;

function bonusText(b) {
  const names = { growth: 'growth', value: 'value', mod: 'modifier chance', tier: 'tier-up chance', inherit: 'inheritance' };
  const out = Object.keys(b || {}).filter(k => b[k]).map(k => `+${Math.round(b[k] * 100)}% ${names[k]}`);
  return out.length ? out.join(' · ') : 'cosmetic only';
}
const eggTitle = e => e.bred ? 'Bred Egg' : eggType(e).n;
const sceneHTML = (t, mini) => `<canvas class="tankscene ${mini ? 'mini' : ''}" data-tank="${t.id}" data-mini="${mini ? 1 : 0}"></canvas>`;

const SORTS = { value: 'Value', tier: 'Tier', mods: 'Modifiers', name: 'Name', growth: 'Growth' };
function sortFish(list) {
  const f = list.slice(); if (UI.onlyMods) { const m = f.filter(x => x.mods.length); f.length = 0; f.push(...m); }
  const key = { value: x => -fishValue(x), tier: x => -SPECIES[x.sp].t * 1000 - fishValue(x) / 1e6, mods: x => -x.mods.length * 1e6 - fishValue(x), name: x => 0, growth: x => -x.g }[UI.sort];
  return f.sort((a, b) => UI.sort === 'name' ? fishName(a).localeCompare(fishName(b)) : key(a) - key(b));
}
const sortBar = () => `<div class="row" style="margin-bottom:12px"><span class="dim small">Sort</span><div class="seg" style="margin:0">${Object.entries(SORTS).map(([k, l]) => `<button class="${UI.sort === k ? 'on' : ''}" data-act="sortBy" data-x="${k}">${l}</button>`).join('')}</div><button class="boost-chip ${UI.onlyMods ? 'on' : ''}" data-act="onlyMods">Modified only</button></div>`;
const zoomCtl = () => `<div class="zoomctl"><button data-act="zoom" data-x="in" title="Zoom in (+)">＋</button><button data-act="zoom" data-x="out" title="Zoom out (−)">－</button><button data-act="zoom" data-x="reset" title="Reset view (0)">⟲</button></div><div class="zoomhint">Scroll to zoom · drag to pan · double-click to reset</div>`;

/* ---------- chrome ---------- */
function renderHeader() {
  const tabs = [['store', 'Store'], ['hall', 'Aquariums'], ['breed', 'Breeding'], ['shop', 'Shop'], ['inv', 'Inventory'], ['menu', 'Menu']];
  $('#tabs').innerHTML = tabs.map(([id, l]) => {
    const n = id === 'store' ? S.customers.length : id === 'inv' ? S.eggs.length : 0;
    return `<button class="${UI.tab === id ? 'on' : ''}" data-act="tab" data-x="${id}"><svg viewBox="0 0 24 24">${SVG[id]}</svg><span>${l}</span>${n ? `<span class="badge">${n}</span>` : ''}</button>`;
  }).join('');
  if (!$('#logoimg').firstChild) $('#logoimg').innerHTML = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2ad4c0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${SVG.hall}</svg>`;
}
function renderStats() {
  const nl = nextLevelAt(), lv = level();
  const prog = nl ? (S.sales - LEVELS[lv]) / (nl - LEVELS[lv]) : 1;
  $('#stats').innerHTML = `<div class="lbl">Balance</div><div class="money">${fmt(S.money)}</div><div class="lvl"><span>Store level ${lv}</span><span>${nl ? S.sales + ' / ' + nl : 'MAX'}</span></div><div class="bar"><i style="width:${Math.round(prog * 100)}%"></i></div>`;
}

/* ---------- STORE ---------- */
function viewStore() {
  const fs = storeFish(), cap = storeCap();
  let h = pageHead('Your Store', `Display fully grown fish in your cases and customers will make offers. Click a tank in the shop to manage it.`,
    `${S.storeUp.cashier ? `<span class="pill">Cashier ${btn(S.cashierOn ? 'ON' : 'OFF', 'cashier', {}, 'sm')} <b>≥ ${Math.round(cashierThreshold() * 100)}%</b></span>` : ''}${storeCap() > fs.length ? btn('Auto-fill cases', 'fillStore') : ''}${btn('Upgrade store', 'goStoreUp', {}, 'pri')}`);
  h += `<div class="scenewrap" style="position:relative"><canvas class="storescene"></canvas>${zoomCtl()}</div>`;
  h += `<div class="stats" style="margin-top:16px">${pill('Sales', S.sales)}${pill('Total earned', fmt(S.earned))}${pill('Best sale', fmt(S.bestValue || 0))}${pill('Next customer', '~' + Math.round(arrivalInterval()) + 's')}${pill('Display cases', fs.length + '/' + cap)}</div>`;
  h += `<div class="two"><div><h3>Customers · ${S.customers.length}</h3>`;
  if (!fs.length) h += `<div class="empty">Your cases are empty — put fully grown fish on display.</div>`;
  else if (!S.customers.length) h += `<div class="empty">Waiting for customers… Advertising brings more.</div>`;
  for (const c of S.customers) {
    const f = getFish(c.fishId); if (!f) continue;
    const v = fishValue(f), r = c.offer / v, cols = ['#7ec8ff', '#ffb870', '#9be8b0', '#d6a8ff', '#ffa8c8'];
    const desc = { browser: 'Just browsing', enthusiast: `Really wants a ${SPECIES[f.sp].n}`, bargain: 'Hunting for a bargain', collector: 'Collector — loves modified fish' }[c.type];
    h += `<div class="card cust"><div class="av" style="background:${cols[hash(c.id) % 5]}">${c.name[0]}</div>
      <div class="grow"><b>${c.name}</b> <span class="dim">· ${desc}</span><div class="small dim">wants ${esc(fishName(f))}</div><div class="bar pat" style="margin-top:7px;max-width:200px"><i data-pat="${c.id}" style="width:${Math.max(0, c.pat / c.patMax * 100)}%"></i></div></div>
      <div style="text-align:right"><div class="offer ${r >= 1 ? 'good' : r < 0.8 ? 'badc' : ''}">${fmt(c.offer)}</div><div class="small dim">${Math.round(r * 100)}% of ${fmt(v)}</div></div>
      <div class="row" style="gap:6px;flex-wrap:nowrap">${btn('Accept', 'accept', { x: c.id }, 'pri')}${btn('✕', 'decline', { x: c.id }, 'sm bad')}</div></div>`;
  }
  h += `</div><div><h3>Display cases</h3><div class="casegrid">`;
  for (const f of fs) h += `<div class="casecard"><div data-act="openFish" data-x="${f.id}" style="cursor:pointer">${fishSVG(f.sp, f.mods, 70)}</div><div class="grow" style="min-width:0"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(fishName(f))}</div><div class="gold small">${fmt(fishValue(f))}</div></div>${btn('Take back', 'unstore', { x: f.id }, 'sm ghost')}</div>`;
  for (let i = fs.length; i < cap; i++) h += `<div class="casecard emptyc" data-act="storeAdd">＋ Add a fish</div>`;
  return h + `</div></div></div>`;
}

/* ---------- HALL ---------- */
function viewHall() {
  const sc = hallSlotCost();
  let h = pageHead('Aquarium Hall', 'Every tank you own. Open one to feed, decorate and hatch eggs.', btn(`Feed all · ${fmt(feedAllCost())}`, 'feedAll', {}, '', feedAllCost() === 0) + (sc != null ? btn(`Expand hall · ${fmt(sc)}`, 'buySlot', {}, 'pri', S.money < sc) : ''));
  h += `<div class="stats">${pill('Tanks', S.tanks.length + '/' + S.hallSlots)}${pill('Fish', S.fish.length)}</div><div class="grid halls">`;
  for (const t of S.tanks) {
    const tt = tankType(t), fs = fishIn(t.id), grow = fs.filter(f => !isAdult(f)).length;
    h += `<div class="card click" data-act="openTank" data-x="${t.id}"><div class="scenewrap">${sceneHTML(t, true)}</div>
      <div class="row" style="margin-top:12px"><b class="grow">${esc(t.name)}</b>${waterTag(tt.w)}</div>
      <div class="small dim" style="margin-top:2px">${fs.length}/${tt.cap} fish · ${grow} growing · ${fs.length - grow} adult · rating ${rating(t)}</div></div>`;
  }
  for (let i = S.tanks.length; i < S.hallSlots; i++) h += `<div class="empty" style="display:flex;align-items:center;justify-content:center;min-height:200px;cursor:pointer" data-act="goTanks"><div><div style="font-size:26px">＋</div>Empty slot<br><span class="small">Buy a tank in the shop</span></div></div>`;
  return h + '</div>';
}

function viewTank() {
  const t = getTank(UI.tankId);
  if (!t) { UI.tankId = null; return viewHall(); }
  const tt = tankType(t), fs = fishIn(t.id), b = tankBonus(t), fed = t.fedUntil > S.time, growing = fs.filter(f => !isAdult(f)).length;
  let h = pageHead(esc(t.name), `${tt.n} · ${tt.cap} fish capacity`, `${btn('← All tanks', 'backHall', {}, 'ghost')}${btn('Rename', 'rename', { x: t.id })}`);
  h += `<div class="stats">${waterTag(tt.w)}${pill('Fish', fs.length + '/' + tt.cap)}${pill('Water rating', rating(t) + ' (tier ≤ ' + rating(t) + ')')}${pill('Growth', mult(1 + b.growth))}${pill('Value', '+' + Math.round(b.value * 100) + '%')}${pill('Mutation', '+' + Math.round(b.mod * 100) + '%')}${pill('Tier-up', '+' + Math.round(b.tier * 100) + '%')}${pill('Inheritance', '+' + Math.round(b.inherit * 100) + '%')}</div>`;
  h += `<div class="scenewrap" style="position:relative">${sceneHTML(t, false)}${zoomCtl()}</div>`;
  h += `<div class="row" style="margin-top:16px">${btn(`Feed · ${fmt(growing * FEED_COST_PER_FISH)} · ×${foodMult()} growth`, 'feed', { x: t.id }, 'pri', !growing)}
    <span class="dim small" data-fed="${t.id}">${fed ? 'Well fed — ' + Math.ceil(t.fedUntil - S.time) + 's left' : 'Hungry — feeding speeds up growth'}</span><span class="grow"></span>
    ${btn('Hatch an egg', 'hatchHere', { x: t.id })}${btn('Tank upgrades', 'goUpgrades', { x: t.id })}</div>`;
  h += `<h3>Decorations</h3><div class="slots"><div class="slot ${t.bg ? 'full' : ''}" data-act="slotPick" data-x="${t.id}" data-y="bg">${t.bg ? decorPic(DECOR_BY_ID[t.bg], 52) : '<span style="font-size:22px">＋</span>'}${t.bg ? DECOR_BY_ID[t.bg].n : 'Background'}</div>`;
  t.slots.forEach((id, i) => { const d = id && DECOR_BY_ID[id]; h += `<div class="slot ${d ? 'full' : ''}" data-act="slotPick" data-x="${t.id}" data-y="${i}">${d ? decorPic(d, 56) : '<span style="font-size:22px">＋</span>'}${d ? d.n : 'Empty'}</div>`; });
  h += `</div><div class="row" style="margin-top:12px"><span class="dim small">Skin</span><select data-change="skin" data-x="${t.id}">${SKINS.filter(s => S.skins[s.id]).map(s => `<option value="${s.id}" ${t.skin === s.id ? 'selected' : ''}>${s.n}</option>`).join('')}</select></div>`;
  h += `<h3>Fish</h3><div class="list">`;
  if (!fs.length) h += `<div class="dim" style="padding:16px">No fish yet.</div>`;
  for (const f of fs) h += fishRow(f);
  return h + '</div>';
}
function fishRow(f) {
  const sp = SPECIES[f.sp];
  return `<div class="fishrow" data-act="openFish" data-x="${f.id}"><div class="pic">${fishSVG(f.sp, f.mods, 78)}</div>
    <div class="grow"><b>${esc(fishName(f))}</b> ${tierBadge(sp.t)}<div>${modChips(f.mods)}</div>
    ${isAdult(f) ? '<span class="good small">Fully grown</span>' : `<div class="bar"><i data-gbar="${f.id}" style="width:${Math.round(f.g * 100)}%"></i></div>`}</div>
    <div class="gold" style="font-weight:600">${fmt(previewValue(f))}</div></div>`;
}

/* ---------- mutagen picker ---------- */
function boostPicker() {
  const sel = UI.boost && S.items[UI.boost] > 0 ? UI.boost : null; UI.boost = sel;
  return `<div class="boost"><span class="dim small">Mutagen</span><button class="${!sel ? 'on' : ''}" data-act="setBoost" data-x="">None</button>${CONSUMABLES.map(c => `<button class="${sel === c.id ? 'on' : ''}" data-act="setBoost" data-x="${c.id}" ${S.items[c.id] ? '' : 'disabled'}>${c.e} +${Math.round(c.boost * 100)}% ×${S.items[c.id]}</button>`).join('')}</div>`;
}

/* ---------- BREEDING ---------- */
function viewBreed() {
  const adults = S.fish.filter(isAdult);
  UI.sel = UI.sel.filter(id => getFish(id) && isAdult(getFish(id)));
  const a = getFish(UI.sel[0]), b = getFish(UI.sel[1]);
  const water = a ? SPECIES[a.sp].w : null;
  let h = pageHead('Breeding', 'Pair two fully grown fish of the same water type. Offspring can be a higher tier and inherit — and stack — modifiers. Each modifier can only be applied once.');
  const slot = (f, label) => `<div class="card parent ${f ? '' : 'flat'}" ${f ? '' : 'style="border-style:dashed"'}>${f ? `${fishSVG(f.sp, f.mods, 190)}<div><b>${esc(fishName(f))}</b> ${tierBadge(SPECIES[f.sp].t)}</div><div>${modChips(f.mods)}</div>${btn('Remove', 'breedSel', { x: f.id }, 'sm ghost')}` : `<span class="dim">${label}<br><span class="small">select a fish below</span></span>`}</div>`;
  h += `<div class="parents">${slot(a, 'Parent A')}<div style="align-self:center;font-size:30px;color:var(--accent)">♥</div>${slot(b, 'Parent B')}</div>`;
  if (a && b) {
    const why = breedCheck(a, b), o = breedOdds(a, b);
    h += `<div class="card"><div class="row"><b>Offspring odds</b><span class="dim small">${o.eggs} egg${o.eggs > 1 ? 's' : ''} per breeding</span></div><div class="stats" style="margin:10px 0">`;
    h += o.species.map(s => pill(SPECIES[s.sp].n, pct(s.p))).join('') + pill('Higher tier', pct(o.tierUp)) + `</div>`;
    const ml = Object.entries(o.mods).filter(([id, p]) => p >= 0.02).sort((x, y) => y[1] - x[1]);
    h += `<div class="dim small" style="margin-bottom:4px">Modifier chances</div><div>${ml.map(([id, p]) => `<span class="chip m${MODS[id].t}">${MODS[id].icon} ${MODS[id].n} ${pct(p)}</span>`).join('') || '<span class="dim small">none likely</span>'}</div>`;
    h += `<div class="row" style="margin-top:14px">${boostPicker()}<span class="grow"></span>${why ? `<span class="badc small">${why}</span>` : ''}${btn('Breed', 'breedGo', {}, 'pri', !!why)}</div></div>`;
  }
  if (UI.lastBreed) {
    h += `<div class="card" style="margin-top:14px;border-color:rgba(255,194,74,.5)"><b>Last breeding produced</b>${UI.lastBreed.map(m => `<div class="row" style="margin-top:8px">${eggArt({ ...EGG_TYPE[SPECIES[m.sp].w + SPECIES[m.sp].t + '_mix'], bred: true }, 36)} ${m.up ? '<b class="gold">▲ Higher tier</b>' : ''} <b>${SPECIES[m.sp].n}</b> ${tierBadge(SPECIES[m.sp].t)} ${modChips(m.mods)}</div>`).join('')}<div class="small dim" style="margin-top:8px">Eggs are in your inventory — hatch them in a tank with enough water rating.</div></div>`;
  }
  h += `<h3>Adult fish</h3>${sortBar()}`;
  if (!adults.length) h += `<div class="empty">No fully grown fish yet.</div>`;
  h += `<div class="grid sm pick">`;
  for (const f of sortFish(adults)) {
    const selected = UI.sel.includes(f.id), cd = f.ready - S.time;
    const incompatible = water && !selected && SPECIES[f.sp].w !== water;
    h += `<div class="card click ${selected ? 'sel' : ''} ${incompatible ? 'dis' : ''}" data-act="breedSel" data-x="${f.id}">${fishSVG(f.sp, f.mods, 130)}<b>${esc(fishName(f))}</b><div>${modChips(f.mods)}</div>
      <div class="small ${cd > 0 ? 'badc' : 'good'}" data-cd="${f.id}">${cd > 0 ? 'Resting ' + Math.ceil(cd) + 's' : 'Ready'}</div><div class="small dim">${f.loc === 'store' ? 'In store' : esc(getTank(f.loc).name)}</div></div>`;
  }
  return h + '</div>';
}

/* ---------- SHOP ---------- */
function item(icon, name, desc, price, label, act, data, opts) {
  opts = opts || {};
  return `<div class="item ${opts.locked ? 'locked' : ''}"><div class="ic">${icon}</div><div class="grow"><b>${name}</b> ${opts.badge || ''}<div class="small dim" style="margin-top:2px">${desc}</div></div>
    ${opts.locked ? `<span class="small dim">Locked · ${opts.locked}</span>` : opts.maxed ? '<span class="good small" style="font-weight:600">Maxed</span>' : btn(`${label || 'Buy'} · ${fmt(price)}`, act, data, 'pri', S.money < price)}</div>`;
}
function avgValue(ids) { return ids.reduce((a, id) => a + SPECIES[id].value, 0) / ids.length; }
function viewShop() {
  const cats = [['eggs', 'Eggs'], ['consumables', 'Mutagens'], ['tanks', 'Tanks'], ['upgrades', 'Tank Upgrades'], ['decor', 'Decorations'], ['food', 'Food'], ['skins', 'Skins'], ['store', 'Store'], ['breeding', 'Breeding']];
  let h = pageHead('Shop', 'Eggs, tanks, decorations and upgrades.') + `<div class="seg">${cats.map(([id, l]) => `<button class="${UI.shopCat === id ? 'on' : ''}" data-act="shopCat" data-x="${id}">${l}</button>`).join('')}</div>`;
  const lv = level();
  switch (UI.shopCat) {
    case 'eggs': {
      h += `<div class="row" style="margin-bottom:6px"><span class="dim small">Quantity</span><div class="seg" style="margin:0">${[1, 5, 10].map(q => `<button class="${UI.qty === q ? 'on' : ''}" data-act="setQty" data-x="${q}">×${q}</button>`).join('')}</div></div>`;
      for (const water of ['fresh', 'salt']) {
        h += `<h3>${water === 'fresh' ? 'Freshwater' : 'Saltwater'} eggs</h3>`;
        if (water === 'salt' && !hasSaltTank()) h += `<div class="empty">You need a saltwater tank first (Tanks tab — unlocks at store level 3).</div>`;
        for (let tier = 1; tier <= 5; tier++) {
          const need = water === 'salt' ? SALT_EGG_UNLOCK_LEVEL[tier] : EGG_UNLOCK_LEVEL[tier];
          h += `<div class="tierhead">${tierBadge(tier)}<span class="dim small">water rating ${tier}+${lv < need ? ' · locked until store level ' + need : ''}</span></div><div class="grid sm">`;
          for (const e of EGG_TYPES.filter(e => e.w === water && e.t === tier)) {
            const locked = lv < need || (water === 'salt' && !hasSaltTank()), price = eggPrice(e.id) * UI.qty;
            h += `<div class="card egg ${locked ? 'locked' : ''}"><div class="top">${eggArt(e, 56)}<div class="grow"><b>${e.n}</b><div class="small dim">${e.pool.length} species · avg ${fmt(avgValue(e.pool))}</div></div></div>
              <div class="small dim">${e.pool.map(id => SPECIES[id].n).join(', ')}</div>${btn(`Buy${UI.qty > 1 ? ' ×' + UI.qty : ''} · ${fmt(price)}`, locked ? 'noop' : 'buyEgg', { x: e.id }, 'pri', !locked && S.money < price)}</div>`;
          }
          h += `</div>`;
        }
      }
      break;
    }
    case 'consumables': {
      h += `<p class="lead">Mutagens give a flat chance of one extra random modifier when you hatch an egg or breed two fish. Select one in the hatch dialog or on the Breeding page.</p>`;
      for (const c of CONSUMABLES) h += item(ico(c.e, 30), c.n, `+${Math.round(c.boost * 100)}% chance of an extra mutation per use (once per hatch, or per egg of a breeding)`, c.price, 'Buy', 'buyConsumable', { x: c.id }, { badge: S.items[c.id] ? `<span class="pill">owned <b>${S.items[c.id]}</b></span>` : '' });
      break;
    }
    case 'tanks': {
      h += `<div class="stats">${pill('Hall slots', S.tanks.length + '/' + S.hallSlots)}${hallSlotCost() != null ? btn(`Buy a slot · ${fmt(hallSlotCost())}`, 'buySlot', {}, 'sm pri', S.money < hallSlotCost()) : ''}<span class="dim small">You keep all your old tanks.</span></div>`;
      for (const tt of TANK_TYPES) h += item(tankIcon(tt.id, 84), tt.n, `${tt.w === 'salt' ? 'Saltwater' : 'Freshwater'} · holds ${tt.cap} fish · base water rating ${tt.base} (up to ${tt.base + 3} with upgrades)`, tt.price, 'Buy', 'buyTank', { x: tt.id }, { locked: lv < tt.lvl ? 'store level ' + tt.lvl : null });
      break;
    }
    case 'upgrades': {
      if (!UI.upTank || !getTank(UI.upTank)) UI.upTank = S.tanks[0].id;
      const t = getTank(UI.upTank);
      h += `<div class="row" style="margin-bottom:14px"><span class="dim">Tank</span><select data-change="upTank">${S.tanks.map(x => `<option value="${x.id}" ${x.id === t.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><span class="dim small">Water rating ${rating(t)} · cost scales with tank size</span></div>`;
      for (const u of TANK_UPGRADES) { const c = tankUpgradeCost(t, u); h += item(ico(u.icon, 28), `${u.n} <span class="dim small">Lv ${t.up[u.id]}/${u.max}</span>`, u.desc, c, 'Upgrade', 'tup', { x: t.id, y: u.id }, { maxed: c == null }); }
      break;
    }
    case 'decor': {
      for (const [k, label] of [['plant', 'Plants'], ['rock', 'Rocks'], ['acc', 'Accessories'], ['bg', 'Backgrounds']]) {
        h += `<h3>${label}</h3>`;
        for (const d of DECOR.filter(d => d.k === k)) h += item(decorPic(d, 76), d.n + (d.w === 'both' ? '' : ` <span class="wt ${d.w}" style="margin-left:6px">${d.w === 'salt' ? 'salt only' : 'fresh only'}</span>`), bonusText(d.b), d.price, 'Buy', 'buyDecor', { x: d.id }, { badge: S.decorInv[d.id] ? `<span class="pill">owned <b>${S.decorInv[d.id]}</b></span>` : '' });
      }
      break;
    }
    case 'food': {
      h += `<p class="lead">Feeding makes fish grow faster for ${FED_DURATION}s. Current: <b>${FOOD[S.food].n}</b> (×${foodMult()}).</p>`;
      FOOD.forEach((f, i) => { if (i === 0) return; h += item(ico('🍤', 28), f.n, `Feeding multiplies growth speed by ×${f.mult}`, f.price, 'Buy', 'buyFood', {}, { maxed: S.food >= i, locked: i > S.food + 1 ? 'buy the previous food first' : null }); });
      break;
    }
    case 'skins': {
      for (const s of SKINS) h += item(`<span class="eico" style="background:linear-gradient(135deg,${s.frame},${s.gravel})"></span>`, s.n, bonusText(s.b) + " — apply from a tank's page", s.price, 'Buy', 'buySkin', { x: s.id }, { maxed: !!S.skins[s.id] });
      break;
    }
    case 'store': {
      for (const u of STORE_UPGRADES) { const l = S.storeUp[u.id]; h += item(ico(u.icon, 28), `${u.n} <span class="dim small">Lv ${l}/${u.max}</span>`, u.desc, l >= u.max ? null : u.cost(l), 'Upgrade', 'sup', { x: u.id }, { maxed: l >= u.max }); }
      break;
    }
    case 'breeding': {
      for (const u of BREED_UPGRADES) { const l = S.breedUp[u.id]; h += item(ico(u.icon, 28), `${u.n} <span class="dim small">Lv ${l}/${u.max}</span>`, u.desc, l >= u.max ? null : u.cost(l), 'Upgrade', 'bup', { x: u.id }, { maxed: l >= u.max }); }
      break;
    }
  }
  return h;
}

/* ---------- INVENTORY ---------- */
function viewInv() {
  let h = pageHead('Inventory', 'Eggs, mutagens, spare decorations and every fish you own.') + `<h3>Eggs · ${S.eggs.length}</h3>`;
  if (!S.eggs.length) h += `<div class="empty">No eggs. Buy some in the shop or breed your fish.</div>`;
  h += S.eggs.length ? `<div class="row" style="margin-bottom:10px">${btn('Hatch all', 'hatchAll', {}, 'pri sm')}<span class="dim small">Puts each egg in the lowest-rated tank that fits it.</span></div>` : '';
  h += `<div class="grid sm">`;
  for (const e of S.eggs) h += `<div class="card row">${eggArt(e, 58)}<div class="grow"><b>${eggTitle(e)}</b><div>${tierBadge(e.tier)} ${waterTag(e.water)}</div></div>${btn('Hatch', 'hatchPick', { x: e.id }, 'pri sm')}</div>`;
  h += `</div><h3>Mutagens</h3><div class="stats">${CONSUMABLES.map(c => `<span class="pill">${c.e} ${c.n} <b>×${S.items[c.id]}</b> <span class="small">+${Math.round(c.boost * 100)}%</span></span>`).join('')}</div>`;
  h += `<h3>Decorations</h3>`;
  const owned = DECOR.filter(d => S.decorInv[d.id] > 0);
  if (!owned.length) h += `<div class="empty">No spare decorations. Buy some, then place them from a tank's page.</div>`;
  h += `<div class="grid sm">${owned.map(d => `<div class="card row">${decorPic(d, 64)}<div><b>${d.n}</b> ×${S.decorInv[d.id]}<div class="small dim">${bonusText(d.b)}</div></div></div>`).join('')}</div>`;
  h += `<h3>All fish · ${S.fish.length}</h3>${sortBar()}<div class="list">${sortFish(S.fish).map(f => fishRow(f)).join('') || '<div class="dim" style="padding:16px">None</div>'}</div>`;
  return h;
}

/* ---------- MENU ---------- */
function viewMenu() {
  return pageHead('Menu', 'Saves happen automatically every 10 seconds. Fish keep growing while you are away (up to 4 hours).') +
    `<div class="row">${btn('Save now', 'save', {}, 'pri')}${btn('How to play', 'help')}${btn('Export save', 'export')}${btn('Import save', 'import')}${btn('Reset game', 'reset', {}, 'bad')}</div>
  <h3>Settings</h3><div class="row"><button class="boost-chip ${S.settings.sound ? 'on' : ''}" data-act="setting" data-x="sound">Sound effects: ${S.settings.sound ? 'On' : 'Off'}</button><button class="boost-chip ${S.settings.fx ? 'on' : ''}" data-act="setting" data-x="fx">Modifier particle effects: ${S.settings.fx ? 'On' : 'Off'}</button></div><div class="dim small" style="margin-top:8px">Shortcuts: 1–6 switch pages · + / − zoom the tank or store · 0 resets the view · Esc closes dialogs</div><h3>Statistics</h3><div class="stats">${pill('Fish owned', S.fish.length)}${pill('Times bred', S.bredCount)}${pill('Total earned', fmt(S.earned))}${pill('Play time', Math.round(S.time / 60) + ' min')}</div>
  <h3>Modifiers</h3><div class="card">${MODS_LIST.map(m => `<div class="row" style="padding:5px 0"><span class="chip m${m.t}" style="min-width:128px">${m.icon} ${m.n}</span><span class="dim small grow">${m.d}</span><span class="gold small">×${m.m}</span></div>`).join('')}</div>`;
}

/* ---------- MODALS ---------- */
function tankRow(t, why, act, data, label) {
  return `<div class="item" style="${why ? 'opacity:.5' : ''}"><div class="grow"><b>${esc(t.name)}</b><div class="small dim">${waterTag(tankType(t).w)} · ${fishIn(t.id).length}/${tankType(t).cap} fish · rating ${rating(t)}</div></div>${why ? `<span class="dim small">${why}</span>` : btn(label, act, data, 'pri sm')}</div>`;
}
function modalHTML() {
  const m = UI.modal; if (!m) return '';
  let h = `<div class="mbox"><button class="x" data-act="closeModal">✕</button>`;
  switch (m.type) {
    case 'fish': {
      const f = getFish(m.id); if (!f) { UI.modal = null; return ''; }
      const sp = SPECIES[f.sp], adult = isAdult(f);
      h += `<h2>${esc(fishName(f))}</h2><div style="display:flex;justify-content:center;padding:6px 0 14px">${fishSVG(f.sp, f.mods, 360)}</div>
        <div class="stats">${tierBadge(sp.t)}${waterTag(sp.w)}${pill('Base', fmt(sp.value))}${pill('Value', fmt(previewValue(f)))}</div>
        ${f.mods.length ? `<div class="mod-info">${f.mods.map(x => `<div><span class="chip m${MODS[x].t}">${MODS[x].icon} ${MODS[x].n}</span>${MODS[x].d} <b class="gold" style="margin-left:auto">×${MODS[x].m}</b></div>`).join('')}</div>` : '<p class="dim">No modifiers.</p>'}
        <p>${adult ? '<span class="good">Fully grown</span>' : `Growing: <span data-gtext="${f.id}">${Math.round(f.g * 100)}</span>%`} <span class="dim small"> · ${f.loc === 'store' ? 'In the store' : esc(getTank(f.loc).name)}</span></p>
        <div class="row" style="margin-top:16px">`;
      if (adult) {
        h += f.loc === 'store' ? btn('Back to a tank', 'fishPickTank', { x: f.id }) : btn('Put in store', 'toStore', { x: f.id }, 'pri') + btn('Move tank', 'fishPickTank', { x: f.id });
        h += btn('Breed', 'breedWith', { x: f.id }) + btn(`Sell to market · ${fmt(fishValue(f) * QUICK_SELL)}`, 'sellMarket', { x: f.id }, 'bad');
      } else h += btn('Move tank', 'fishPickTank', { x: f.id });
      h += `</div>`; break;
    }
    case 'pickTank': {
      const f = getFish(m.id), sp = SPECIES[f.sp];
      h += `<h2>Move ${esc(fishName(f))}</h2>` + S.tanks.map(t => {
        let why = null;
        if (t.id === f.loc) why = 'Already here'; else if (tankType(t).w !== sp.w) why = 'Wrong water'; else if (rating(t) < sp.t) why = 'Needs rating ' + sp.t; else if (tankFree(t) <= 0) why = 'Full';
        return tankRow(t, why, 'moveTo', { x: f.id, y: t.id }, 'Move');
      }).join(''); break;
    }
    case 'hatchTank': {
      const e = S.eggs.find(x => x.id === m.id);
      if (!e) { UI.modal = null; return ''; }
      h += `<h2>Hatch ${eggTitle(e)}</h2><div style="margin-bottom:14px">${boostPicker()}</div>` + S.tanks.map(t => tankRow(t, canHatchIn(e, t), 'hatch', { x: e.id, y: t.id }, 'Hatch')).join(''); break;
    }
    case 'hatchEgg': {
      const t = getTank(m.id);
      h += `<h2>Hatch an egg in ${esc(t.name)}</h2><div style="margin-bottom:14px">${boostPicker()}</div>`;
      const eggs = S.eggs.filter(e => !canHatchIn(e, t));
      h += eggs.length ? eggs.map(e => `<div class="item"><div class="ic" style="width:60px">${eggArt(e, 48)}</div><div class="grow"><b>${eggTitle(e)}</b> ${tierBadge(e.tier)}</div>${btn('Hatch', 'hatch', { x: e.id, y: t.id }, 'pri sm')}</div>`).join('') : '<p class="dim">No suitable eggs (check water type, rating and free space).</p>'; break;
    }
    case 'storeAdd': {
      const list = S.fish.filter(f => isAdult(f) && f.loc !== 'store');
      h += `<h2>Put a fish on display</h2>` + (list.length ? list.map(f => `<div class="item"><div style="width:84px">${fishSVG(f.sp, f.mods, 80)}</div><div class="grow"><b>${esc(fishName(f))}</b><div>${modChips(f.mods)}</div></div><span class="gold">${fmt(fishValue(f))}</span>${btn('Display', 'toStore', { x: f.id }, 'pri sm')}</div>`).join('') : '<p class="dim">You have no fully grown fish outside the store yet. Feed your growing fish!</p>'); break;
    }
    case 'slot': {
      const t = getTank(m.id), isBg = m.slot === 'bg';
      const cur = isBg ? t.bg : t.slots[m.slot];
      h += `<h2>${isBg ? 'Background' : 'Decoration'} · ${esc(t.name)}</h2>`;
      if (cur) h += `<div class="item"><div class="ic" style="width:70px">${decorPic(DECOR_BY_ID[cur], 56)}</div><div class="grow"><b>${DECOR_BY_ID[cur].n}</b> <span class="dim small">equipped</span></div>${btn('Remove', 'slotClear', { x: t.id, y: m.slot }, 'bad sm')}</div>`;
      const list = DECOR.filter(d => (d.k === 'bg') === isBg && S.decorInv[d.id] > 0 && decorFits(d, t));
      h += list.length ? list.map(d => `<div class="item"><div class="ic" style="width:70px">${decorPic(d, 56)}</div><div class="grow"><b>${d.n}</b> ×${S.decorInv[d.id]}<div class="small dim">${bonusText(d.b)}</div></div>${btn('Place', 'slotSet', { x: t.id, y: m.slot, z: d.id }, 'pri sm')}</div>`).join('') : '<p class="dim">Nothing suitable in your inventory — visit Shop → Decorations.</p>'; break;
    }
    case 'help': {
      h += `<h2>How to play</h2>
      <p><b>1.</b> Open <b>Inventory</b> and hatch your two starter eggs. Baby fish must <b>grow</b> — press <b>Feed</b> in the tank to speed it up.</p>
      <p><b>2.</b> Put fully grown fish on display in your <b>Store</b>. Customers make offers — accept good ones, decline lowballs, or hire a cashier.</p>
      <p><b>3.</b> Spend profits in the <b>Shop</b>: higher-tier eggs, bigger tanks (saltwater later), filters, decorations, food and store upgrades.</p>
      <p><b>4.</b> Fish need a tank with enough <b>water rating</b> (tank size + filter + aerator) for their tier.</p>
      <p><b>5.</b> <b>Breed</b> two adults: offspring may be a higher tier and can inherit and stack modifiers (each only once). <b>Mutagens</b> add extra mutation chance.</p>
      <p><b>6.</b> Sales raise your store level, unlocking rarer eggs, big tanks and saltwater.</p><div class="row" style="margin-top:14px">${btn("Let's go", 'closeModal', {}, 'pri')}</div>`; break;
    }
    case 'text': { h += `<h2>${esc(m.title)}</h2><textarea id="txt" style="width:100%;height:160px;background:#0a1626;color:#cfe;border:1px solid var(--line2);border-radius:10px;padding:10px;user-select:text" ${m.ro ? 'readonly' : ''}>${esc(m.text || '')}</textarea><div class="row" style="margin-top:10px">${m.ro ? '' : btn('Load', 'doImport', {}, 'pri')}${btn('Close', 'closeModal')}</div>`; break; }
  }
  return h + '</div>';
}

/* ---------- render ---------- */
function render() {
  G.dirty = false;
  const view = $('#view'), st = view.scrollTop;
  renderHeader(); renderStats();
  view.innerHTML = { store: viewStore, hall: () => (UI.tankId ? viewTank() : viewHall()), breed: viewBreed, shop: viewShop, inv: viewInv, menu: viewMenu }[UI.tab]();
  view.scrollTop = st;
  const mo = $('#modal');
  if (UI.modal) { const keep = mo.firstChild && mo.firstChild.scrollTop; mo.innerHTML = modalHTML(); mo.classList.toggle('hidden', !UI.modal); if (mo.firstChild && keep) mo.firstChild.scrollTop = keep; } else { mo.classList.add('hidden'); mo.innerHTML = ''; }
  Scenes.bind(id => { UI.modal = { type: 'fish', id }; render(); });
}

function toast(text, type) {
  if (type === 'bad') Sfx.play('err');
  const d = document.createElement('div'); d.className = 'toast ' + (type || ''); d.textContent = text;
  $('#toasts').appendChild(d); setTimeout(() => d.remove(), 4200);
}
function res(r) { if (r && r.ok === false) toast(r.err, 'bad'); G.dirty = true; return r; }
const activeBoost = () => (UI.boost && S.items[UI.boost] > 0 ? UI.boost : null);

/* ---------- actions ---------- */
const ACT = {
  zoom: d => { const sc = Scenes.list.find(x => x.zp); if (!sc) return false; if (d.x === 'reset') sc.zp.reset(); else sc.zp.zoomAt(d.x === 'in' ? 1.3 : 1 / 1.3, 0, 0); return false; },
  feedAll: () => { const r = feedAll(); res(r); if (r.ok) toast(`Fed ${r.n} tank${r.n > 1 ? 's' : ''}`, 'good'); },
  fillStore: () => { const r = fillStore(); res(r); if (r.ok) { toast(`Put ${r.n} fish on display`, 'good'); Sfx.play('pop'); } },
  hatchAll: () => { const r = hatchAll(); res(r); if (r.ok) { toast(`Hatched ${r.n} egg${r.n > 1 ? 's' : ''}`, 'good'); Sfx.play('pop'); } },
  sortBy: d => { UI.sort = d.x; }, onlyMods: () => { UI.onlyMods = !UI.onlyMods; }, setQty: d => { UI.qty = +d.x; },
  setting: d => { S.settings[d.x] = !S.settings[d.x]; G.lowFx = !S.settings.fx; if (d.x === 'sound' && S.settings.sound) Sfx.play('good'); },
  noop: () => toast('Locked — reach a higher store level / get a saltwater tank', 'bad'),
  tab: d => { UI.tab = d.x; if (d.x !== 'hall') UI.tankId = null; },
  openTank: d => { UI.tankId = d.x; UI.tab = 'hall'; },
  backHall: () => { UI.tankId = null; },
  goTanks: () => { UI.shopCat = 'tanks'; UI.tab = 'shop'; },
  goStoreUp: () => { UI.shopCat = 'store'; UI.tab = 'shop'; },
  goUpgrades: d => { UI.upTank = d.x; UI.shopCat = 'upgrades'; UI.tab = 'shop'; },
  shopCat: d => { UI.shopCat = d.x; },
  buySlot: () => res(buyHallSlot()),
  buyEgg: d => { const r = res(buyEgg(d.x, UI.qty)); if (r.ok) { toast(UI.qty > 1 ? `${UI.qty} eggs added to your inventory` : 'Egg added to your inventory'); Sfx.play('buy'); } },
  buyConsumable: d => { const r = res(buyConsumable(d.x)); if (r.ok) toast(CONSUMABLE[d.x].n + ' added to your inventory', 'good'); },
  setBoost: d => { UI.boost = d.x || null; },
  buyTank: d => res(buyTank(d.x)),
  tup: d => res(buyTankUpgrade(d.x, d.y)),
  buyDecor: d => res(buyDecor(d.x)),
  buySkin: d => res(buySkin(d.x)),
  buyFood: () => res(buyFood()),
  sup: d => res(buyStoreUp(d.x)),
  bup: d => res(buyBreedUp(d.x)),
  feed: d => res(feedTank(d.x)),
  rename: d => { const t = getTank(d.x); const n = prompt('Tank name', t.name); if (n && n.trim()) t.name = n.trim().slice(0, 24); },
  openFish: d => { UI.modal = { type: 'fish', id: d.x }; },
  closeModal: () => { UI.modal = null; },
  help: () => { UI.modal = { type: 'help' }; },
  fishPickTank: d => { UI.modal = { type: 'pickTank', id: d.x }; },
  moveTo: d => { const r = res(moveFish(d.x, d.y)); if (r.ok) UI.modal = { type: 'fish', id: d.x }; },
  toStore: d => { const r = res(moveFish(d.x, 'store')); if (r.ok) UI.modal = null; },
  unstore: d => { UI.modal = { type: 'pickTank', id: d.x }; },
  storeAdd: () => { UI.modal = { type: 'storeAdd' }; },
  sellMarket: d => { const r = res(sellMarket(d.x)); if (r.ok) { toast('Sold to the fish market for ' + fmt(r.price), 'gold'); UI.modal = null; } },
  accept: d => { const r = res(acceptCustomer(d.x)); if (r.ok) { toast('Sold for ' + fmt(r.offer), 'gold'); Sfx.play('sale'); } },
  decline: d => res(declineCustomer(d.x)),
  cashier: () => { S.cashierOn = !S.cashierOn; },
  hatchPick: d => { UI.modal = { type: 'hatchTank', id: d.x }; },
  hatchHere: d => { UI.modal = { type: 'hatchEgg', id: d.x }; },
  hatch: d => {
    const r = res(hatchEgg(d.x, d.y, activeBoost()));
    if (r.ok) {
      const f = G.hatched;
      toast(`Hatched a ${fishName(f)}!` + (f.mods.length ? ' ✨' : ''), f.mods.length ? 'gold' : 'good');
      Sfx.play(f.mods.length ? 'good' : 'pop');
      if (G.boosted) toast('The mutagen caused a mutation!', 'gold');
      UI.modal = null;
    }
  },
  slotPick: d => { UI.modal = { type: 'slot', id: d.x, slot: d.y === 'bg' ? 'bg' : +d.y }; },
  slotSet: d => { const r = res(placeDecor(d.x, d.y === 'bg' ? 'bg' : +d.y, d.z)); if (r.ok) UI.modal = null; },
  slotClear: d => { res(removeDecor(d.x, d.y === 'bg' ? 'bg' : +d.y)); UI.modal = null; },
  breedSel: d => { const i = UI.sel.indexOf(d.x); if (i >= 0) UI.sel.splice(i, 1); else if (UI.sel.length < 2) UI.sel.push(d.x); else UI.sel[1] = d.x; },
  breedWith: d => { UI.sel = [d.x]; UI.tab = 'breed'; UI.tankId = null; UI.modal = null; },
  breedGo: () => {
    const r = res(breedFish(UI.sel[0], UI.sel[1], activeBoost()));
    if (r.ok) { UI.lastBreed = r.made; toast('Breeding successful!', 'good'); if (r.made.some(m => m.mods.length)) toast('✨ A modifier was passed on!', 'gold'); }
  },
  save: () => { saveGame(); toast('Game saved', 'good'); },
  export: () => { UI.modal = { type: 'text', title: 'Export save', text: exportSave(), ro: true }; },
  import: () => { UI.modal = { type: 'text', title: 'Import save (paste data)', text: '' }; },
  doImport: () => { const r = importSave($('#txt').value, false); toast(r.error ? 'Import failed' : 'Save loaded', r.error ? 'bad' : 'good'); UI.modal = null; UI.tankId = null; saveGame(); },
  reset: () => { if (confirm('Delete all progress and start over?')) { resetGame(); UI.tankId = null; UI.sel = []; UI.tab = 'store'; UI.lastBreed = null; UI.modal = { type: 'help' }; } },
};

document.addEventListener('mousedown', () => (mouseDown = true));
document.addEventListener('mouseup', () => (mouseDown = false));
document.addEventListener('click', e => {
  if (e.target.id === 'modal') { UI.modal = null; render(); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.getAttribute('aria-disabled')) { toast('Not enough money', 'bad'); return; }
  const fn = ACT[el.dataset.act];
  if (fn) { const r = fn(el.dataset); if (r !== false) render(); }
});
document.addEventListener('change', e => {
  const k = e.target.dataset.change; if (!k) return;
  if (k === 'skin') res(applySkin(e.target.dataset.x, e.target.value));
  if (k === 'upTank') UI.upTank = e.target.value;
  render();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && UI.modal) { UI.modal = null; render(); return; }
  if (e.target.matches && e.target.matches('textarea,input,select') || e.ctrlKey || e.metaKey || e.altKey) return;
  const tabs = ['store', 'hall', 'breed', 'shop', 'inv', 'menu'];
  if (e.key >= '1' && e.key <= '6') { UI.tab = tabs[+e.key - 1]; if (UI.tab !== 'hall') UI.tankId = null; render(); }
  else if (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '_' || e.key === '0') { const sc = Scenes.list.find(x => x.zp); if (!sc) return; if (e.key === '0') sc.zp.reset(); else sc.zp.zoomAt(e.key === '+' || e.key === '=' ? 1.25 : 0.8, 0, 0); e.preventDefault(); }
});

/* ---------- live updates ---------- */
function live() {
  const mo = $('.money'); if (mo) mo.textContent = fmt(S.money);
  document.querySelectorAll('[data-grow]').forEach(el => { const f = getFish(el.dataset.grow); if (f) el.style.transform = `scale(${(0.45 + 0.55 * Math.min(1, f.g)).toFixed(3)})`; });
  document.querySelectorAll('[data-gbar]').forEach(el => { const f = getFish(el.dataset.gbar); if (f) el.style.width = Math.round(f.g * 100) + '%'; });
  document.querySelectorAll('[data-gtext]').forEach(el => { const f = getFish(el.dataset.gtext); if (f) el.textContent = Math.round(f.g * 100); });
  document.querySelectorAll('[data-pat]').forEach(el => { const c = S.customers.find(x => x.id === el.dataset.pat); if (c) el.style.width = Math.max(0, c.pat / c.patMax * 100) + '%'; });
  document.querySelectorAll('[data-cd]').forEach(el => { const f = getFish(el.dataset.cd); if (!f) return; const cd = f.ready - S.time; el.textContent = cd > 0 ? 'Resting ' + Math.ceil(cd) + 's' : 'Ready'; el.className = 'small ' + (cd > 0 ? 'badc' : 'good'); });
  document.querySelectorAll('[data-fed]').forEach(el => { const t = getTank(el.dataset.fed); if (t) el.textContent = t.fedUntil > S.time ? 'Well fed — ' + Math.ceil(t.fedUntil - S.time) + 's left' : 'Hungry — feeding speeds up growth'; });
}

/* ---------- boot ---------- */
G.msg = (t, ty) => { toast(t, ty); if (/Store level/.test(t)) Sfx.play('level'); };
G.lowFx = false;
function boot() {
  const r = loadGame(); G.lowFx = !S.settings.fx;
  if (r.away > 60) toast(`Welcome back! Your fish kept growing for ${Math.round(r.away / 60)} min` + (r.matured ? ` — ${r.matured} reached adulthood.` : '.'), 'good');
  if (!S.seenHelp) { UI.modal = { type: 'help' }; S.seenHelp = true; }
  render();
  let last = performance.now(), lastMoney = S.money, saveT = 0, renderT = 0;
  setInterval(() => {
    const now = performance.now(), dt = Math.min(1, (now - last) / 1000); last = now;
    tick(dt); live();
    saveT += dt; renderT += dt;
    if (saveT > 10) { saveT = 0; saveGame(); }
    const moneyChanged = S.money !== lastMoney; lastMoney = S.money;
    const affordView = UI.tab === 'shop' || UI.tab === 'inv';
    if ((G.dirty || (moneyChanged && affordView) || renderT > 5) && !mouseDown && !document.activeElement.matches('textarea,select')) { renderT = 0; render(); }
  }, 250);
  window.addEventListener('beforeunload', saveGame);
}
boot();
