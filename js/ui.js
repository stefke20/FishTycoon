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
const UI = { tab: 'store', qty: 1, sort: 'value', onlyMods: false, tankId: null, shopCat: 'eggs', upTank: null, sel: [], modal: null, lastBreed: null, boost: null, selFish: null, filterTank: 'all', filterTag: 'all', homeTip: null, eggSort: 'tier', eggTier: 'all', eggWater: 'all', bgroup: 'tank', bmore: {}, bq: '' };
const $ = s => document.querySelector(s);
const pct = x => { const v = x * 100; return (v < 10 && v > 0 ? v.toFixed(1) : Math.round(v)) + '%'; };
let mouseDown = false;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tierBadge = t => `<span class="tier" style="background:${TIER_COLORS[t]}">${TIER_NAMES[t]}</span>`;
const modChips = mods => mods.map(m => `<span class="chip m${MODS[m].t}" title="${esc(MODS[m].d)} · ${MOD_TIER_NAMES[MODS[m].t]} · +${Math.round((MODS[m].m - 1) * 100)}% value">${MODS[m].icon} ${MODS[m].n}</span>`).join('');
const btn = (label, act, data, cls, dis) => `<button class="btn ${cls || ''} ${dis ? 'off' : ''}" data-act="${act}" ${Object.entries(data || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')} ${dis ? 'aria-disabled="true"' : ''}>${label}</button>`;
/* fish pictures & labels hide species and modifiers while a fish is still a baby */
const fishPic = (f, px) => (f.g >= 1 ? fishSVG(f.sp, f.mods, px) : fishSVG('_baby', [], px));
const fishChips = f => (f.g >= 1 ? modChips(f.mods) : '');
const isEv = f => !!SPECIES[f.sp].ev;
const worthText = f => (f.g < 1 ? '' : isEv(f) ? `🎟 ${tokenReward(f)} tokens` : fmt(fishValue(f)));
const mult = n => (Math.round(n * 100) / 100) + 'x';
const ico = (e, s) => `<span class="eico" style="${s ? `width:${s * 1.5}px;height:${s * 1.5}px;font-size:${s}px` : ''}">${e}</span>`;
const pill = (l, v) => `<span class="pill">${l ? l + ' ' : ''}<b>${v}</b></span>`;
const waterTag = w => waterTag2(w);
const SVG = {
  store: '<path d="M3 9l1.6-5h14.8L21 9M3 9h18v2a3 3 0 01-6 0 3 3 0 01-6 0 3 3 0 01-6 0V9zM5 14v6h14v-6"/>',
  hall: '<path d="M2 12c3-5 8-6 12-3l4-3v12l-4-3c-4 3-9 2-12-3z"/><circle cx="8" cy="11" r="1"/>',
  breed: '<path d="M12 21s-8-5.3-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.7-8 11-8 11z"/>',
  shop: '<path d="M5 8h14l-1 12H6L5 8zM9 8a3 3 0 016 0"/>',
  inv: '<path d="M3 7l9-4 9 4v10l-9 4-9-4V7zM3 7l9 4 9-4M12 11v10"/>',
  book: '<path d="M4 4h12a3 3 0 013 3v13H7a3 3 0 01-3-3V4zM4 17a3 3 0 013-3h12"/>',
  ev: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3z"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  home: '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
  camp: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  research: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3M8 15h8"/>',
  exp: '<path d="M12 3v13M12 4c4 2 6 6 6 11h-6M12 7c-4 2-6 5-6 9h6M3 19c3 2 6 2 9 0s6-2 9 0"/>',
  shows: '<path d="M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M12 14v4M8 21h8M10 18h4"/>',
  daily: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 15l2.5 2.5L16 13"/>',
  menu: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
};
const pageHead = (title, sub, actions) => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;

function bonusText(b) {
  const names = { growth: 'growth', value: 'value', mod: 'modifier chance', tier: 'tier-up chance', inherit: 'inheritance' };
  const out = Object.keys(b || {}).filter(k => b[k]).map(k => `+${Math.round(b[k] * 100)}% ${names[k]}`);
  return out.length ? out.join(' · ') : 'cosmetic only';
}
const eggTitle = e => e.wild ? 'Wild Egg · ' + LOCATION[e.wild].n : e.bred ? 'Bred Egg' : eggType(e).n;
const sceneHTML = (t, mini) => `<canvas class="tankscene ${mini ? 'mini' : ''}" data-tank="${t.id}" data-mini="${mini ? 1 : 0}"></canvas>`;

const SORTS = { value: 'Value', tier: 'Tier', mods: 'Modifiers', name: 'Name', growth: 'Growth' };
function sortFish(list) {
  let f = list.slice();
  if (UI.onlyMods) f = f.filter(x => x.g >= 1 && x.mods.length);
  if (UI.onlyFav) f = f.filter(x => x.fav);
  if (UI.filterTank !== 'all') f = f.filter(x => x.loc === UI.filterTank);
  if (UI.filterTag && UI.filterTag !== 'all') f = f.filter(x => (UI.filterTag === 'none' ? !x.tag : x.tag === UI.filterTag));
  const val = x => (x.g >= 1 ? fishValue(x) : -1), key = { value: x => -val(x), tier: x => -(x.g >= 1 ? SPECIES[x.sp].t : 0) * 1e9 - val(x), mods: x => -(x.g >= 1 ? x.mods.length : 0) * 1e12 - val(x), name: x => 0, growth: x => -x.g }[UI.sort];
  return f.sort((a, b) => UI.sort === 'name' ? fishName(a).localeCompare(fishName(b)) : key(a) - key(b));
}
const tankFilter = () => `<select data-change="filterTank" title="Show only the fish in one aquarium"><option value="all">All aquariums</option><option value="store" ${UI.filterTank === 'store' ? 'selected' : ''}>Store display</option>${S.tanks.map(t => `<option value="${t.id}" ${UI.filterTank === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>`;
const sortBar = () => { if (UI.filterTank !== 'all' && UI.filterTank !== 'store' && !getTank(UI.filterTank)) UI.filterTank = 'all'; return `<div class="row" style="margin-bottom:12px"><span class="dim small">Aquarium</span>${tankFilter()}<span class="dim small">Sort</span><div class="seg" style="margin:0">${Object.entries(SORTS).map(([k, l]) => `<button class="${UI.sort === k ? 'on' : ''}" data-act="sortBy" data-x="${k}">${l}</button>`).join('')}</div><button class="boost-chip ${UI.onlyMods ? 'on' : ''}" data-act="onlyMods">Modified only</button><button class="boost-chip ${UI.onlyFav ? 'on' : ''}" data-act="onlyFav">★ Favourites</button>${tagFilter()}</div>`; };
const zoomCtl = (tank, home) => `<div class="zoomctl">${tank ? '<button data-act="cam" data-x="rotL" title="Rotate left">↺</button><button data-act="cam" data-x="rotR" title="Rotate right">↻</button><button data-act="cam" data-x="tilt" title="Change camera angle">⇅</button><button data-act="cam" data-x="photo" title="Save a picture">📷</button>' : ''}<button data-act="zoom" data-x="in" title="Zoom in (+)">＋</button><button data-act="zoom" data-x="out" title="Zoom out (−)">－</button><button data-act="zoom" data-x="reset" title="Reset view (0)">⟲</button></div><div class="zoomhint">${home ? 'Scroll to zoom' : 'Scroll to zoom · drag to pan · double-click to reset'}${tank ? ' · ↺ ↻ rotate' : ''}</div>`;

/* ---------- chrome ---------- */
const TABS = [['store', 'Store'], ['home', 'Home'], ['hall', 'Aquariums'], ['breed', 'Breeding'], ['camp', 'Campaign'], ['exp', 'Expeditions'], ['shows', 'Fish Shows'], ['shop', 'Shop'], ['inv', 'Inventory'], ['research', 'Research'], ['book', 'Collection'], ['daily', 'Daily'], ['ev', 'Events'], ['stats', 'Stats'], ['menu', 'Menu']];
function renderHeader() {
  const tabs = visibleTabs();
  $('#tabs').innerHTML = tabs.map(([id, l]) => {
    const n = id === 'store' ? S.customers.filter(c => c.ready).length + S.contracts.length + guideClaimable() : id === 'inv' ? S.eggs.length : id === 'ev' ? activeEvents().length : id === 'exp' ? boatsReady() : id === 'research' ? RNODES.filter(n => researchUnlocked(n) && lab(n.id) < n.max && (S.rp || 0) >= rpCost(n, lab(n.id)) && S.money >= n.cost(lab(n.id))).length : id === 'camp' ? (CAMPAIGN[campCur()] && campCandidates(CAMPAIGN[campCur()].spec).some(x => x.full) ? 1 : 0) : id === 'daily' ? (loginClaimable() ? 1 : 0) + questsClaimable() : 0;
    return `<button class="${UI.tab === id ? 'on' : ''}" data-act="tab" data-x="${id}"><svg viewBox="0 0 24 24">${SVG[id]}</svg><span>${l}</span>${S.g4.fresh[id] ? '<span class="badge new">NEW</span>' : n ? `<span class="badge">${n}</span>` : ''}</button>`;
  }).join('') + nextUnlockHint();
  if (!$('#logoimg').firstChild) $('#logoimg').innerHTML = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2ad4c0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${SVG.hall}</svg>`;
}
function renderStats() {
  const nl = nextLevelAt(), lv = level();
  const prog = nl ? (S.sales - LEVELS[lv]) / (nl - LEVELS[lv]) : 1;
  $('#stats').innerHTML = `<div class="lbl">Balance</div><div class="money">${fmt(S.money)}</div><div class="lvl"><span>Store level ${lv}</span><span>${nl ? S.sales + ' / ' + nl : 'MAX'}</span></div><div class="bar"><i style="width:${Math.round(prog * 100)}%"></i></div><div class="clk" data-clockpill>${clockPillHTML()}</div>`;
}

/* ---------- STORE ---------- */
function viewStore() {
  const fs = storeFish(), cap = storeCap();
  let h = pageHead('Your Store', `Display fully grown fish in your cases and customers will make offers. Click a tank in the shop to manage it.`,
    `${S.storeUp.cashier ? `<span class="pill">Cashier ${btn(S.cashierOn ? 'ON' : 'OFF', 'cashier', {}, 'sm')} <b>≥ ${Math.round(cashierThreshold() * 100)}%</b></span>` : ''}${storeCap() > fs.length ? btn('Auto-fill cases', 'fillStore') : ''}${btn('Upgrade store', 'goStoreUp', {}, 'pri')}`);
  h += `<div class="scenewrap" style="position:relative"><canvas class="storescene"></canvas>${zoomCtl()}</div>`;
  h += `<div class="stats" style="margin-top:16px">${pill('Sales', S.sales)}${pill('Total earned', fmt(S.earned))}${pill('Best sale', fmt(S.bestValue || 0))}${clockPill() + pill('Next customer', '~' + Math.round(arrivalInterval()) + 's')}${pill('Display cases', fs.length + '/' + cap)}</div>`;
  h += guideCard() + fold('store:record', 'Most valuable fish yet', recordCard(false), true);
  const ready = S.customers.filter(c => c.ready), browsing = S.customers.length - ready.length;
  h += `<div class="two"><div><h3>Customers at the counter · ${ready.length}${browsing ? ` <span class="dim small" style="font-weight:400">(+${browsing} still browsing)</span>` : ''}</h3>`;
  if (!fs.length) h += `<div class="empty">Your cases are empty — put fully grown fish on display.</div>`;
  else if (!ready.length) h += `<div class="empty">${browsing ? 'Customers are browsing your tanks — they will come to the counter when they want to buy.' : 'Waiting for customers… Advertising brings more.'}</div>`;
  for (const c of ready) {
    const f = getFish(c.fishId); if (!f) continue;
    const v = fishValue(f), r = c.offer / v, cols = ['#7ec8ff', '#ffb870', '#9be8b0', '#d6a8ff', '#ffa8c8'];
    const desc = { vip: 'VIP guest — pays a premium', browser: 'Just browsing', enthusiast: `Really wants a ${SPECIES[f.sp].n}`, bargain: 'Hunting for a bargain', collector: 'Collector — loves modified fish' }[c.type];
    h += `<div class="card cust"><div class="av" style="background:${cols[hash(c.id) % 5]}">${c.name[0]}</div>
      <div class="grow"><b>${c.name}</b> <span class="dim">· ${desc}</span><div class="small dim">wants ${esc(f.name)} · ${esc(fishName(f))}</div><div class="bar pat" style="margin-top:7px;max-width:200px"><i data-pat="${c.id}" style="width:${Math.max(0, c.pat / c.patMax * 100)}%"></i></div></div>
      <div style="text-align:right"><div class="offer ${r >= 1 ? 'good' : r < 0.8 ? 'badc' : ''}">${fmt(c.offer)}</div><div class="small dim">${Math.round(r * 100)}% of ${fmt(v)}</div></div>
      <div class="row" style="gap:6px;flex-wrap:nowrap">${btn('Accept', 'accept', { x: c.id }, 'pri')}${btn('✕', 'decline', { x: c.id }, 'sm bad')}</div></div>`;
  }
  h += `</div><div><h3>Display cases</h3><div class="casegrid">`;
  for (const f of fs) h += `<div class="casecard"><div data-act="openFish" data-x="${f.id}" style="cursor:pointer">${fishPic(f, 70)}</div><div class="grow" style="min-width:0"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.fav ? '<span class="gold">★</span> ' : ''}${esc(f.name)}${tagDot(f)}</div><div class="small dim" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(fishName(f))}</div><div class="gold small">${fmt(fishValue(f))}</div></div>${btn('Take back', 'unstore', { x: f.id }, 'sm ghost')}</div>`;
  for (let i = fs.length; i < cap; i++) h += `<div class="casecard emptyc" data-act="storeAdd">＋ Add a fish</div>`;
  return h + `</div>${contractsPanel()}</div></div>`;
}

/* ---------- HALL ---------- */
/* eggs you can drag onto an aquarium (in the hall, or in a tank page) */
function viewHall() {
  const sc = hallSlotCost(), dirty = S.tanks.filter(t => wqOf(t) < 97 && fishIn(t.id).length).length;
  let h = pageHead('Aquarium Hall', 'Every tank you own. Open one to feed, decorate and clean it — or drag an egg from the tray onto a tank to hatch it.', (S.unlocks.feedAll ? btn(`Feed all · ${fmt(feedAllCost())}`, 'feedAll', {}, '', feedAllCost() === 0) : btn('🔒 Feed all', 'goMgmt', {}, 'ghost')) + (S.unlocks.cleanAll ? btn(`Clean all · ${fmt(cleanAllCost())}`, 'cleanAll', {}, '', !dirty) : btn('🔒 Clean all', 'goMgmt', {}, 'ghost')) + btn(UI.hallCompact ? '▦ Card view' : '☰ Compact list', 'hallCompact', {}, 'ghost') + (sc != null ? btn(`Expand hall · ${fmt(sc)}`, 'buySlot', {}, 'pri', S.money < sc) : ''));
  h += `<div class="stats">${pill('Tanks', regularTanks().length + '/' + S.hallSlots)}${pill('Fish', S.fish.length)}${pill('Heroes', S.heroes.length)}${pill('Eggs', S.eggs.length)}<select data-change="hallFilter" title="Filter tanks"><option value="all">All tanks</option>${[['fresh', 'Freshwater'], ['salt', 'Saltwater'], ['dirty', 'Needs cleaning'], ['growing', 'Has growing fish'], ['space', 'Has free space']].map(([k, l]) => `<option value="${k}" ${UI.hallFilter === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>${eggTray(null)}`;
  const hf = { fresh: t => tankType(t).w === 'fresh', salt: t => tankType(t).w === 'salt', dirty: t => wqOf(t) < 75 && fishIn(t.id).length, growing: t => fishIn(t.id).some(f => !isAdult(f)), space: t => tankFree(t) > 0 }[UI.hallFilter] || (() => true), hallTanks = S.tanks.filter(hf);
  if (UI.hallCompact) return h + `<div style="margin-top:14px">${hallTanks.map(hallCompactRow).join('') || '<div class="empty">No tanks match this filter.</div>'}</div>`;
  h += `<div class="grid halls" style="margin-top:14px">`;
  for (const t of hallTanks) {
    const tt = tankType(t), fs = fishIn(t.id), grow = fs.filter(f => !isAdult(f)).length;
    h += `<div class="card click" data-act="openTank" data-x="${t.id}" data-droptank="${t.id}"><div class="scenewrap">${sceneHTML(t, true)}</div>
      <div class="row" style="margin-top:12px"><b class="grow">${esc(t.name)}</b>${t.sale ? '<span class="tagchip" style="--tc:#ff9a52">SALE</span>' : ''}${waterTag(tt.w)}</div>
      <div class="small dim" style="margin-top:2px">${fs.length}/${tankCap(t)} fish · ${grow} growing · rating ${rating(t)}${heroIn(t.id) ? ' · ★ ' + HERO[heroIn(t.id).kind].n : ''}</div><div class="row" style="margin-top:8px;gap:8px"><span class="small dim">Water</span><div class="grow">${wqBar(t)}</div><span class="small" style="color:${wqColor(wqOf(t))}">${wqLabel(wqOf(t))}</span></div></div>`;
  }
  if (!UI.hallFilter || UI.hallFilter === 'all') for (let i = regularTanks().length; i < S.hallSlots; i++) h += `<div class="empty" style="display:flex;align-items:center;justify-content:center;min-height:200px;cursor:pointer" data-act="goTanks"><div><div style="font-size:26px">＋</div>Empty slot<br><span class="small">Buy a tank in the shop</span></div></div>`;
  return h + '</div>';
}

/* ---- the selected fish: actions shared by the tank sidebar and the fish dialog ---- */
function fishActions(f) {
  const adult = isAdult(f); let h = `<div class="row" style="margin-top:12px;gap:8px">`;
  if (adult) {
    h += (f.loc === 'store' ? btn('Back to a tank', 'fishPickTank', { x: f.id }) : (isEv(f) ? '' : btn('Put in store', 'toStore', { x: f.id }, 'pri')) + btn('Move tank', 'fishPickTank', { x: f.id }));
    h += btn('Breed', 'breedWith', { x: f.id }) + btn(f.fav ? '★ Protected' : isEv(f) ? `Sell · 🎟 ${tokenReward(f)}` : `Sell · ${fmt(marketPrice(f))}`, 'sellMarket', { x: f.id }, 'bad', f.fav);
  } else h += btn('Move tank', 'fishPickTank', { x: f.id });
  return h + `</div><div class="row" style="margin-top:8px;gap:8px">${btn(f.fav ? '★ Favourited' : '☆ Favourite', 'toggleFav', { x: f.id }, f.fav ? 'sm gold-btn' : 'sm')}${btn('Rename', 'renameFish', { x: f.id }, 'sm')}${btn('Family tree', 'openTree', { x: f.id }, 'sm')}</div>` + tagBar(f);
}
function selPanel(t) {
  const f = getFish(UI.selFish);
  if (!f || f.loc !== t.id) { UI.selFish = null; return `<div class="selpanel dim small">Click a fish in the aquarium or in the list to select it. Then you can sell, breed or move it.</div>`; }
  const sp = SPECIES[f.sp], adult = isAdult(f);
  return `<div class="selpanel"><div class="row" style="align-items:flex-start;gap:12px"><div style="width:120px;flex:none">${fishPic(f, 120)}</div><div class="grow" style="min-width:0">${fishTitle(f)}<div style="margin:4px 0">${adult ? tierBadge(sp.t) + ' ' + genChip(f) : '<span class="chip m1">Baby</span>'}</div><div>${fishChips(f)}${medalChips(f)}</div>${adult ? `<div class="gold" style="font-weight:700;margin-top:4px">${worthText(f)}</div>` : `<div class="bar" style="margin-top:6px"><i data-gbar="${f.id}" style="width:${Math.round(f.g * 100)}%"></i></div><div class="small dim" style="margin-top:3px">Growing: <span data-gtext="${f.id}">${Math.round(f.g * 100)}</span>% — what it is gets revealed when fully grown</div>`}</div></div>${fishActions(f)}<div class="row" style="margin-top:8px">${btn('Details', 'openFish', { x: f.id }, 'sm ghost')}${btn('Deselect', 'selFish', { x: f.id }, 'sm ghost')}</div></div>`;
}
function tankFishRow(f) {
  const adult = isAdult(f);
  return `<div class="tfrow ${UI.selFish === f.id ? 'sel' : ''}" data-act="selFish" data-x="${f.id}"><div class="tfpic">${fishPic(f, 56)}</div><div class="grow" style="min-width:0"><div class="tfname">${f.fav ? '<span class="gold">★</span> ' : ''}${esc(f.name)}${tagDot(f)}</div><div class="small dim tfsub">${adult ? esc(fishName(f)) : `Baby · <span data-gtext="${f.id}">${Math.round(f.g * 100)}</span>%`}</div></div><div class="gold small" style="white-space:nowrap">${adult ? worthText(f) : ''}</div></div>`;
}
function viewTank() {
  const t = getTank(UI.tankId);
  if (!t) { UI.tankId = null; return viewHall(); }
  const tt = tankType(t), fs = fishIn(t.id), b = tankBonus(t), fed = t.fedUntil > S.time, growing = fs.filter(f => !isAdult(f)).length, q = wqOf(t), vm = wqValueMult(q);
  let h = pageHead(esc(t.name), `${tt.n} · ${tankCap(t)} fish capacity`, `${tankNav(t)}${btn('← All tanks', 'backHall', {}, 'ghost')}${tt.ev ? '' : btn(t.sale ? '🏷 Sale tank ✓' : '🏷 Sale tank', 'tankSale', { x: t.id }, t.sale ? 'gold-btn' : '')}${btn('Rename', 'rename', { x: t.id })}`);
  h += `<div class="stats">${waterTag(tt.w)}${pill('Fish', fs.length + '/' + tankCap(t))}${pill('Water rating', rating(t) + ' (tier ≤ ' + rating(t) + ')')}${pill('Water quality', `<span data-wqtext="${t.id}" style="color:${wqColor(q)}">${wqLabel(q)} ${Math.round(q)}%</span>`)}${vm < 1 ? pill('Dirty water', `<span class="badc">−${Math.round((1 - vm) * 100)}% value</span>`) : ''}${pill('Growth', mult(1 + b.growth))}${pill('Value', '+' + Math.round(b.value * 100) + '%')}${pill('Mutation', '+' + Math.round(b.mod * 100) + '%')}${pill('Tier-up', '+' + Math.round(b.tier * 100) + '%')}${pill('Inheritance', '+' + Math.round(b.inherit * 100) + '%')}</div>`;
  h += `<div class="tankwrap"><div class="tankmain"><div class="scenewrap" data-droptank="${t.id}" style="position:relative">${sceneHTML(t, false)}${zoomCtl(true)}</div>`;
  h += `<div class="row" style="margin-top:16px">${btn(`Feed · ${fmt(growing * FEED_COST_PER_FISH)} · ×${foodMult()} growth`, 'feed', { x: t.id }, 'pri', !growing)}
    <span class="dim small" data-fed="${t.id}">${fed ? 'Well fed — ' + Math.ceil(t.fedUntil - S.time) + 's left' : 'Hungry — feeding speeds up growth'}</span><span class="grow"></span>
    ${btn(`Change water · ${fmt(cleanCost(t))}`, 'cleanTank', { x: t.id }, '', q > 97)}${btn('Hatch an egg', 'hatchHere', { x: t.id })}${btn('Tank upgrades', 'goUpgrades', { x: t.id })}</div>${q < 75 ? `<div class="warn">⚠ The glass is getting dirty (${wqLabel(q).toLowerCase()}) — fish grow slower and are worth ${Math.round((1 - vm) * 100)}% less. Wipe the smudges with the sponge, change the water, or upgrade the filter, UV sterilizer and aerator.</div>` : ''}`;
  let dec = `<div class="slots"><div class="slot ${t.bg ? 'full' : ''}" data-act="slotPick" data-x="${t.id}" data-y="bg">${t.bg ? decorPic(DECOR_BY_ID[t.bg], 52) : '<span style="font-size:22px">＋</span>'}${t.bg ? DECOR_BY_ID[t.bg].n : 'Background'}</div>`;
  t.slots.forEach((id, i) => { const d = id && DECOR_BY_ID[id]; dec += `<div class="slot ${d ? 'full' : ''}" data-act="slotPick" data-x="${t.id}" data-y="${i}">${d ? decorPic(d, 56) : '<span style="font-size:22px">＋</span>'}${d ? d.n : 'Empty'}</div>`; });
  dec += `</div><div class="row" style="margin-top:12px"><span class="dim small">Skin</span><select data-change="skin" data-x="${t.id}">${SKINS.filter(s => S.skins[s.id]).map(s => `<option value="${s.id}" ${t.skin === s.id ? 'selected' : ''}>${s.n}</option>`).join('')}</select></div>`;
  h += fold('tank:decor', 'Decorations & skin', dec, true, `${(t.bg ? 1 : 0) + t.slots.filter(Boolean).length} placed`) + fold('tank:hero', 'Hero fish', heroPanel(t).replace('<h3>Hero fish</h3>', ''), false, heroIn(t.id) ? HERO[heroIn(t.id).kind].n : 'none') + fold('tank:mgmt', 'Tank size & selling', tankMgmt(t), false, tt.n) + `</div>`;
  const list = fs.slice().sort((a, c) => (isAdult(a) - isAdult(c)) || fishValue(c) - fishValue(a));
  h += `<aside class="tankside">${eggTray(t)}<div class="spongebox"><div class="spongetool" data-drag="sponge" title="Drag the sponge over the glass">🧽</div><div class="grow"><b>Sponge</b><div class="small dim">Drag it over the smudges on the glass to wipe them away${lab('sponge') ? ` (Pro Sponge ${lab('sponge')})` : ''}.</div><div class="wq" style="margin-top:6px"><div class="bar"><i data-wq="${t.id}" style="width:${Math.round(q)}%;background:${wqColor(q)}"></i></div></div></div></div><h3 style="margin:14px 0 8px">Fish in this tank · ${fs.length}</h3>${selPanel(t)}<div class="tflist">${list.length ? list.map(tankFishRow).join('') : '<div class="dim" style="padding:14px">No fish yet — drag an egg onto the aquarium.</div>'}</div></aside></div>`;
  return h;
}
function fishRow(f) {
  const sp = SPECIES[f.sp], adult = isAdult(f), sellable = adult && !f.fav && UI.tab === 'inv';
  return `<div class="fishrow" data-act="openFish" data-x="${f.id}"><div class="pic">${fishPic(f, 78)}</div>
    <div class="grow">${fishTitle(f)} ${adult ? tierBadge(sp.t) + ' ' + genChip(f) : ''}<div>${fishChips(f)}${medalChips(f)}</div><div class="small dim">${f.loc === 'store' ? 'In store' : esc((getTank(f.loc) || { name: '?' }).name)}</div>
    ${adult ? '<span class="good small">Fully grown</span>' : `<div class="bar"><i data-gbar="${f.id}" style="width:${Math.round(f.g * 100)}%"></i></div>`}</div>
    <div class="gold" style="font-weight:600">${adult ? worthText(f) : '<span class="dim small">???</span>'}</div>${sellable ? btn(isEv(f) ? 'Sell' : `Sell ${fmt(marketPrice(f))}`, 'sellRow', { x: f.id }, 'sm bad') : ''}</div>`;
}

/* ---------- mutagen picker ---------- */
function boostPicker() {
  const sel = UI.boost && S.items[UI.boost] > 0 ? UI.boost : null; UI.boost = sel;
  return `<div class="boost"><span class="dim small">Mutagen</span><button class="${!sel ? 'on' : ''}" data-act="setBoost" data-x="">None</button>${CONSUMABLES.map(c => `<button class="${sel === c.id ? 'on' : ''}" data-act="setBoost" data-x="${c.id}" ${S.items[c.id] ? '' : 'disabled'}>${c.e} +${Math.round(c.boost * 100)}% ×${S.items[c.id]}</button>`).join('')}</div>`;
}

/* ---------- BREEDING ---------- */
/* ---------- SHOP ---------- */
function item(icon, name, desc, price, label, act, data, opts) {
  opts = opts || {};
  return `<div class="item ${opts.locked ? 'locked' : ''}"><div class="ic">${icon}</div><div class="grow"><b>${name}</b> ${opts.badge || ''}<div class="small dim" style="margin-top:2px">${desc}</div></div>
    ${opts.locked ? `<span class="small dim">Locked · ${opts.locked}</span>` : opts.maxed ? '<span class="good small" style="font-weight:600">Maxed</span>' : btn(`${label || 'Buy'} · ${fmt(price)}`, act, data, 'pri', S.money < price)}</div>`;
}
function avgValue(ids) { return ids.reduce((a, id) => a + SPECIES[id].value, 0) / ids.length; }
function viewShop() {
  const cats = [['eggs', 'Eggs'], ['consumables', 'Mutagens'], ['tanks', 'Tanks'], ['upgrades', 'Tank Upgrades'], ['decor', 'Decorations'], ['food', 'Food'], ['skins', 'Skins'], ['store', 'Store'], ['breeding', 'Breeding'], ['mgmt', 'Management'], ['heroes', 'Hero Fish']];
  let h = pageHead('Shop', 'Eggs, tanks, decorations and upgrades.') + `<div class="seg">${cats.map(([id, l]) => `<button class="${UI.shopCat === id ? 'on' : ''}" data-act="shopCat" data-x="${id}">${l}</button>`).join('')}</div>`;
  const lv = level();
  switch (UI.shopCat) {
    case 'eggs': {
      h += `<div class="row" style="margin-bottom:6px"><span class="dim small">Quantity</span><div class="seg" style="margin:0">${[1, 5, 10].map(q => `<button class="${UI.qty === q ? 'on' : ''}" data-act="setQty" data-x="${q}">×${q}</button>`).join('')}</div></div>`;
      for (const water of ['fresh', 'salt']) {
        h += `<h3>${water === 'fresh' ? 'Freshwater' : 'Saltwater'} eggs</h3>`;
        if (water === 'salt' && !hasSaltTank()) h += `<div class="empty">You need a saltwater tank first (Tanks tab — unlocks at store level 3).</div>`;
        const topT = [1, 2, 3, 4, 5].filter(t => lv >= (water === 'salt' ? SALT_EGG_UNLOCK_LEVEL[t] : EGG_UNLOCK_LEVEL[t])).pop() || 1;
        for (let tier = 1; tier <= 5; tier++) {
          const need = water === 'salt' ? SALT_EGG_UNLOCK_LEVEL[tier] : EGG_UNLOCK_LEVEL[tier];
          let body = `<div class="grid sm">`;
          for (const e of EGG_TYPES.filter(e => !e.ev && e.w === water && e.t === tier)) {
            const locked = lv < need || (water === 'salt' && !hasSaltTank()), price = eggPrice(e.id) * UI.qty;
            body += `<div class="card egg ${locked ? 'locked' : ''}"><div class="top">${eggArt(e, 56)}<div class="grow"><b>${e.n}</b><div class="small dim">${e.pool.length} species · avg ${fmt(avgValue(e.pool))}</div></div></div>
              <div class="small dim">${e.pool.map(id => SPECIES[id].n).join(', ')}</div>${btn(`Buy${UI.qty > 1 ? ' ×' + UI.qty : ''} · ${fmt(price)}`, locked ? 'noop' : 'buyEgg', { x: e.id }, 'pri', !locked && S.money < price)}</div>`;
          }
          h += fold('shop:egg:' + water + tier, tierBadge(tier), body + `</div>`, lv >= need && tier >= topT - 1, `water rating ${tier}+${lv < need ? ' · locked until store level ' + need : ''}`);
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
      h += fold('shop:mytanks', 'Your tanks — upgrade or sell back', myTanksPanel(), false, S.tanks.length + ' tanks');
      h += `<div class="stats">${pill('Hall slots', regularTanks().length + '/' + S.hallSlots)}${hallSlotCost() != null ? btn(`Buy a slot · ${fmt(hallSlotCost())}`, 'buySlot', {}, 'sm pri', S.money < hallSlotCost()) : ''}<span class="dim small">You keep all your old tanks.</span></div>`;
      for (const tt of TANK_TYPES.filter(x => !x.ev)) h += item(tankIcon(tt.id, 84), tt.n, `${tt.w === 'salt' ? 'Saltwater' : 'Freshwater'} · holds ${tt.cap} fish · base water rating ${tt.base} (up to ${tt.base + 2} with filters)`, tt.price, 'Buy', 'buyTank', { x: tt.id }, { locked: lv < tt.lvl ? 'store level ' + tt.lvl : null });
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
        let body = '';
        for (const d of DECOR.filter(d => d.k === k && !d.ev)) body += item(decorPic(d, 76), d.n + (d.w === 'both' ? '' : ` <span class="wt ${d.w}" style="margin-left:6px">${d.w === 'salt' ? 'salt only' : 'fresh only'}</span>`), bonusText(d.b), d.price, 'Buy', 'buyDecor', { x: d.id }, { badge: S.decorInv[d.id] ? `<span class="pill">owned <b>${S.decorInv[d.id]}</b></span>` : '' });
        h += fold('shop:decor:' + k, label, body, k === 'plant');
      }
      break;
    }
    case 'food': {
      h += `<p class="lead">Feeding makes fish grow faster for ${Math.round(fedDur())}s. Current: <b>${FOOD[S.food].n}</b> (×${foodMult()}).</p>`;
      FOOD.forEach((f, i) => { if (i === 0) return; h += item(ico('🍤', 28), f.n, `Feeding multiplies growth speed by ×${f.mult}`, f.price, 'Buy', 'buyFood', {}, { maxed: S.food >= i, locked: i > S.food + 1 ? 'buy the previous food first' : null }); });
      break;
    }
    case 'skins': {
      for (const s of SKINS.filter(x => !x.ev)) h += item(`<span class="eico" style="background:linear-gradient(135deg,${s.frame},${s.gravel})"></span>`, s.n, bonusText(s.b) + " — apply from a tank's page", s.price, 'Buy', 'buySkin', { x: s.id }, { maxed: !!S.skins[s.id] });
      break;
    }
    case 'store': {
      for (const u of STORE_UPGRADES) { const l = S.storeUp[u.id]; h += item(ico(u.icon, 28), `${u.n} <span class="dim small">Lv ${l}/${u.max}</span>`, u.desc, l >= u.max ? null : u.cost(l), 'Upgrade', 'sup', { x: u.id }, { maxed: l >= u.max }); }
      break;
    }
    case 'mgmt': h += viewMgmt(); break;
    case 'heroes': h += viewHeroes(); break;
    case 'breeding': {
      for (const u of BREED_UPGRADES) { const l = S.breedUp[u.id]; h += item(ico(u.icon, 28), `${u.n} <span class="dim small">Lv ${l}/${u.max}</span>`, u.desc, l >= u.max ? null : u.cost(l), 'Upgrade', 'bup', { x: u.id }, { maxed: l >= u.max }); }
      break;
    }
  }
  return h;
}

/* ---------- INVENTORY ---------- */
/* ---------- MENU ---------- */
function viewMenu() {
  const settings = `<div class="row"><button class="boost-chip ${S.settings.sound ? 'on' : ''}" data-act="setting" data-x="sound">Sound effects: ${S.settings.sound ? 'On' : 'Off'}</button><button class="boost-chip ${S.settings.fx ? 'on' : ''}" data-act="setting" data-x="fx">Modifier particle effects: ${S.settings.fx ? 'On' : 'Off'}</button></div><div class="row" style="margin-top:12px"><span class="dim small">Seasonal events</span><select data-change="evPreview"><option value="auto" ${S.settings.event === 'auto' ? 'selected' : ''}>Real calendar dates</option><option value="all" ${S.settings.event === 'all' ? 'selected' : ''}>Preview: all events active</option>${EVENTS.map(e => `<option value="${e.id}" ${S.settings.event === e.id ? 'selected' : ''}>Preview: ${e.n}</option>`).join('')}</select></div>${daymodeRow()}<div class="dim small" style="margin-top:8px">Shortcuts: 1–9 switch pages · + / − zoom the tank or store · 0 resets the view · ← → switch tank · Esc closes dialogs</div>`;
  const stats = `<div class="stats">${pill('Fish owned', S.fish.length)}${pill('Times bred', S.bredCount)}${pill('Total earned', fmt(S.earned))}${pill('Play time', Math.round(S.time / 60) + ' min')}</div>`;
  const mods = `<div class="card">${MODS_LIST.map(m => `<div class="row" style="padding:5px 0"><span class="chip m${m.t}" style="min-width:128px">${m.icon} ${m.n}</span><span class="dim small grow">${m.d}</span><span class="gold small">+${Math.round((m.m - 1) * 100)}%</span></div>`).join('')}</div>`;
  return pageHead('Menu', 'Saves happen automatically every 10 seconds. Fish keep growing while you are away (up to 4 hours).') +
    `<div class="row">${btn('Save now', 'save', {}, 'pri')}${btn('How to play', 'help')}${btn('Export save', 'export')}${btn('Import save', 'import')}${btn('Reset game', 'reset', {}, 'bad')}</div>` +
    fold('menu:settings', 'Settings', settings, true) + fold('menu:stats', 'Statistics', stats, false) + fold('menu:version', 'Version ' + GAME_VERSION + ' & changelog', versionCard(), false) + fold('menu:mods', 'Modifier list', mods, false, MODS_LIST.length + ' modifiers');
}

/* ---------- MODALS ---------- */
function tankRow(t, why, act, data, label) {
  return `<div class="item" style="${why ? 'opacity:.5' : ''}"><div class="grow"><b>${esc(t.name)}</b><div class="small dim">${waterTag(tankType(t).w)} · ${fishIn(t.id).length}/${tankCap(t)} fish · rating ${rating(t)}</div></div>${why ? `<span class="dim small">${why}</span>` : btn(label, act, data, 'pri sm')}</div>`;
}
function modalHTML() {
  const m = UI.modal; if (!m) return '';
  let h = `<div class="mbox"><button class="x" data-act="closeModal">✕</button>`;
  switch (m.type) {
    case 'fish': {
      const f = getFish(m.id); if (!f) { UI.modal = null; return ''; }
      const sp = SPECIES[f.sp], adult = isAdult(f);
      h += `<h2>${esc(f.name)} ${f.fav ? '<span class="gold">★</span>' : ''} <span class="dim" style="font-size:15px;font-weight:500">${esc(fishName(f))}</span></h2><div style="display:flex;justify-content:center;padding:6px 0 14px">${fishPic(f, 360)}</div>`;
      if (adult) {
        h += `<div class="stats">${tierBadge(sp.t)}${waterTag(sp.w)}${pill('Base', fmt(sp.value))}${pill(isEv(f) ? 'Worth' : 'Value', isEv(f) ? '🎟 ' + tokenReward(f) + ' tokens' : fmt(fishValue(f)))}${pill('Generation', f.gen || 0)}</div>
        ${f.mods.length ? `<div class="mod-info">${f.mods.map(x => `<div><span class="chip m${MODS[x].t}">${MODS[x].icon} ${MODS[x].n}</span>${MODS[x].d} <b class="gold" style="margin-left:auto">+${Math.round((MODS[x].m - 1) * 100)}%</b></div>`).join('')}</div>` : '<p class="dim">No modifiers.</p>'}
        <p><span class="good">Fully grown</span> <span class="dim small"> · ${f.loc === 'store' ? 'In the store' : esc(getTank(f.loc).name)}</span></p>`;
      } else h += `<div class="stats"><span class="chip m1">${TIER_NAMES[sp.t]} baby</span>${waterTag(sp.w)}${pill('Generation', f.gen || 0)}</div><p>Growing: <span data-gtext="${f.id}">${Math.round(f.g * 100)}</span>% <span class="dim small"> · ${esc(getTank(f.loc).name)}</span></p><div class="bar"><i data-gbar="${f.id}" style="width:${Math.round(f.g * 100)}%"></i></div><p class="dim small">All babies look alike. Its species and any modifiers are revealed when it is fully grown.</p>`;
      h += fishActions(f); break;
    }
    case 'tree': h += treeModal(m.id); break;
    case 'expResult': h += expResultModal(m.r); break;
    case 'showEnter': h += showEnterModal(m.id); break;
    case 'tourneyPick': h += tourneyModal(); break;
    case 'daily': h += dailyModal(); break;
    case 'bossWin': h += bossWinModal(m.idx, m.fid); break;
    case 'hero': h += heroModal(m.id); break;
    case 'contract': h += contractModal(m.id); break;
    case 'newFeature': h += newFeatureModal(m); break;
    case 'away': h += awayModal(); break;
    case 'rulesPrev': h += rulesPreviewModal(); break;
    case 'planner': h += plannerModal(); break;
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
      const list = S.fish.filter(f => isAdult(f) && f.loc !== 'store' && !isEv(f));
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
      <p><b>1.</b> Open the <b>Aquariums</b> page, open your tank and <b>drag an egg</b> from the tray onto the aquarium to hatch it. Every baby looks the same — what it really is (and any modifiers) is revealed when it has grown up. Press <b>Feed</b> to speed that up.</p>
      <p><b>2.</b> Put fully grown fish on display in your <b>Store</b>. Customers wander around your tanks and come to the counter with an offer bubble — accept good ones, decline lowballs, or hire a cashier.</p>
      <p><b>3.</b> Keep the glass clean: smudges appear as the <b>water quality</b> drops, and dirty water makes your fish worth less. Drag the <b>sponge</b> over the glass to wipe it.</p>
      <p><b>4.</b> Spend profits in the <b>Shop</b>: tanks, filters, decorations, food, store and breeding upgrades, research, staff and hero fish. High-tier eggs cost more than the fish they hatch — <b>breed</b> instead!</p>
      <p><b>5.</b> <b>Breed</b> two adults: every modifier the parents carry can be passed on (none, one or several) with a small chance of a brand-new one, so modifiers stack over generations.</p>
      <p><b>6.</b> Send boats on <b>Expeditions</b> for wild eggs of exclusive fish, enter your best fish in <b>Fish Shows</b> and tournaments for medals (permanent value) and fame, and check the <b>Daily</b> page for quests and your login streak. Spend research points on the <b>Research</b> tree, and challenge the boss fish of the <b>Ocean Campaign</b> by breeding exactly what they demand.</p>
      <p><b>7.</b> Tag fish (Breeding stock, Boss candidate…) so filters and auto-rules know what to keep, and use the <b>Planner</b> on the Breeding page to find the cheapest route to a target fish. Home, Shows, Expeditions, Research and the Campaign unlock as your store levels up. Your 20 most valuable fish ever live in the big aquarium at <b>Home</b>. The end-game goal is to build <b>The Great Sanctuary</b> (Stats page).</p><div class="row" style="margin-top:14px">${btn("Let's go", 'closeModal', {}, 'pri')}</div>`; break;
    }
    case 'text': { h += `<h2>${esc(m.title)}</h2><textarea id="txt" style="width:100%;height:160px;background:#0a1626;color:#cfe;border:1px solid var(--line2);border-radius:10px;padding:10px;user-select:text" ${m.ro ? 'readonly' : ''}>${esc(m.text || '')}</textarea><div class="row" style="margin-top:10px">${m.ro ? '' : btn('Load', 'doImport', {}, 'pri')}${btn('Close', 'closeModal')}</div>`; break; }
  }
  return h + '</div>';
}

/* ---------- render ---------- */
function render() {
  G.dirty = false;
  if (G.showResult) { UI.showLeague = G.showResult; UI.showResult = true; G.showResult = null; }
  if (!tabOpen(UI.tab)) UI.tab = 'store';
  const view = $('#view'), st = view.scrollTop;
  renderHeader(); renderStats();
  view.innerHTML = { store: viewStore, home: viewHome, exp: viewExp, camp: viewCampaign, research: viewResearch, shows: viewShows, daily: viewDaily, hall: () => (UI.tankId ? viewTank() : viewHall()), breed: viewBreed, shop: viewShop, inv: viewInv, book: viewCollection, ev: viewEvents, stats: viewStats, menu: viewMenu }[UI.tab]();
  view.scrollTop = st;
  const mo = $('#modal');
  if (UI.modal) { const keep = mo.firstChild && mo.firstChild.scrollTop; mo.innerHTML = modalHTML(); mo.classList.toggle('hidden', !UI.modal); if (mo.firstChild && keep) mo.firstChild.scrollTop = keep; } else { mo.classList.add('hidden'); mo.innerHTML = ''; }
  if (UI.tab === 'research') drawResearchLines();
  Scenes.bind(id => { UI.selFish = id; render(); }, id => { UI.modal = { type: 'hero', id }; render(); }, id => { UI.modal = { type: 'fish', id }; render(); });
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
  cam: d => { const sc = Scenes.list.find(x => x.zp && !x.people); if (!sc) return false; const v = sc.zp.v; if (d.x === 'rotL') { v.yaw--; v.px = v.py = 0; } else if (d.x === 'rotR') { v.yaw++; v.px = v.py = 0; } else if (d.x === 'tilt') { const L = [0.45, 0.78, 1.3, 2.4], i = L.findIndex(t => Math.abs(t - v.tilt) < 0.05); v.tilt = L[((i < 0 ? 1 : i) + 1) % L.length]; } else if (d.x === 'photo') { sc.photo(); toast('Picture saved to your downloads', 'good'); } return false; },
  expLoc: d => { UI.expLoc = d.x; },
  expSend: d => { const r = res(sendExpedition(d.x, +d.y)); if (r.ok) { toast('Your boat set sail for ' + LOCATION[d.x].n, 'good'); Sfx.play('buy'); } },
  expCollect: d => { const r = collectExpedition(+d.x); if (r.ok) { UI.modal = { type: 'expResult', r }; Sfx.play(r.res.storm ? 'err' : 'good'); G.dirty = true; } else res(r); },
  buyBoat: () => res(buyBoat()),
  expUp: d => { const r = res(buyExpUpgrade(d.x)); if (r.ok) Sfx.play('buy'); },
  showLeague: d => { UI.showLeague = d.x; UI.showResult = false; },
  showView: d => { UI.showResult = d.x === 'result'; },
  showEnterPick: d => { UI.modal = { type: 'showEnter', id: d.x }; },
  showEnter: d => { const r = res(enterShow(d.x, d.y)); if (r.ok) { toast('Fish entered — good luck!', 'good'); Sfx.play('buy'); if (S.shows.leagues[d.x].entries.length >= 3) UI.modal = null; } },
  tourneyStart: d => { const r = res(startTourney(d.x)); if (r.ok) { Sfx.play('buy'); UI.modal = { type: 'tourneyPick' }; } },
  tourneyPick: () => { UI.modal = { type: 'tourneyPick' }; },
  tourneyFight: d => { const r = res(tourneyFight(d.y)); if (r.ok) { toast(r.won ? `Round won! ${r.mine} vs ${r.theirs}` : `Round lost… ${r.mine} vs ${r.theirs}`, r.won ? 'gold' : 'bad'); Sfx.play(r.won ? 'level' : 'err'); UI.modal = null; } },
  tourneyDismiss: () => res(dismissTourney()),
  claimLogin: () => { const r = res(claimLogin()); if (r.ok) { toast('Day ' + (r.day + 1) + ' reward: ' + r.text, 'gold'); Sfx.play('level'); UI.modal = null; } },
  claimQuest: d => { const r = res(claimQuest(+d.x)); if (r.ok) { toast('Quest reward +' + fmt(r.reward), 'gold'); Sfx.play('sale'); } },
  claimDailyBonus: () => { const r = res(claimDailyBonus()); if (r.ok) { toast('Bonus chest opened!', 'gold'); Sfx.play('level'); } },
  goDaily: () => { UI.tab = 'daily'; UI.modal = null; },
  selFish: d => { UI.selFish = UI.selFish === d.x ? null : d.x; },
  sellRow: d => { const r = res(sellMarket(d.x)); if (r.ok) { Sfx.play('sale'); toast(r.tokens ? `Sold for ${r.tokens} tokens` : 'Sold for ' + fmt(r.price), 'gold'); } },
  sellAll: () => { const ids = sortFish(S.fish).filter(f => isAdult(f) && !f.fav && !tagKept(f)).map(f => f.id); if (!ids.length) return false; const val = marketTotal(ids.map(getFish).filter(f => !isEv(f))); if (!confirm(`Sell ${ids.length} fish for about ${fmt(val)}? Favourites, protected tags and growing fish are kept.`)) return false; const r = res(sellMany(ids)); if (r.ok) { Sfx.play('sale'); toast(`Sold ${r.n} fish for ${fmt(r.money)}` + (r.tokens ? ` and ${r.tokens} tokens` : ''), 'gold'); } },
  cleanAll: () => { const r = res(cleanAll()); if (r.ok) { toast(`Cleaned ${r.n} tank${r.n > 1 ? 's' : ''}`, 'good'); Sfx.play('pop'); } },
  research: d => { const r = res(buyResearch(d.x)); if (r.ok) { toast(RNODE[d.x].n + ' researched', 'good'); Sfx.play('level'); } },
  fundRP: () => { const r = res(fundResearch()); if (r.ok) { toast('+1 research point', 'good'); Sfx.play('buy'); } },
  rbranch: d => { UI.rbranch = d.x; },
  campSel: d => { UI.campSel = +d.x; },
  campNext: d => { UI.campSel = Math.min(+d.x, CAMPAIGN.length - 1); UI.modal = null; },
  bossFight: d => { const r = res(fightBoss(+d.x, d.y)); if (r.ok) { Sfx.play('level'); UI.modal = { type: 'bossWin', idx: +d.x, fid: d.y }; } },
  pauseStaff: d => res(pauseStaff(d.x)),
  suggestPair: () => { const p = suggestPair(); if (p) UI.sel = p; else toast('No compatible pair is ready right now', 'bad'); },
  goMgmt: () => { UI.shopCat = 'mgmt'; UI.tab = 'shop'; },
  onlyFav: () => { UI.onlyFav = !UI.onlyFav; },
  toggleFav: d => res(toggleFav(d.x)),
  renameFish: d => { const f = getFish(d.x); const n = prompt('Name this fish', f.name); if (n && n.trim()) res(renameFish(d.x, n)); },
  openTree: d => { UI.modal = { type: 'tree', id: d.x }; },
  buyHero: d => { const r = res(buyHero(d.x)); if (r.ok) { toast(HERO[d.x].n + ' joined your aquarium!', 'gold'); Sfx.play('level'); } },
  unassignHero: d => { res(assignHero(d.x, null)); UI.modal = null; },
  cleanTank: d => { const r = res(cleanTank(d.x)); if (r.ok) { toast('Water changed — crystal clear', 'good'); Sfx.play('pop'); } },
  hire: d => { const r = res(hireStaff(d.x)); if (r.ok) toast(STAFF_BY_ID[d.x].n + ' hired', 'good'); },
  buyUnlock: d => res(buyUnlock(d.x)),
  buildSanct: () => { const r = res(buildSanct()); if (r.ok) { toast(S.sanct >= SANCT.length ? '🏛️ You completed the Great Sanctuary — Ocean Legend!' : 'Sanctuary stage built!', 'gold'); Sfx.play('level'); } },
  claimBook: d => { const r = res(claimBook(+d.x)); if (r.ok) { toast('Reward claimed', 'gold'); Sfx.play('level'); } },
  bookTab: d => { UI.bookTab = d.x; },
  evClaim: d => { const r = res(claimEventTank(d.x)); if (r.ok) toast('Event tank added to your hall', 'gold'); },
  evBuy: d => { const r = res(buyEventItem(d.x, d.y)); if (r.ok) { toast('Purchased with event tokens', 'gold'); Sfx.play('buy'); } },
  openContract: d => { UI.modal = { type: 'contract', id: d.x }; },
  deliver: d => { const r = res(fulfillContract(d.x, d.y)); if (r.ok) { toast('Special order delivered: +' + fmt(r.reward), 'gold'); Sfx.play('sale'); UI.modal = null; } },
  zoom: d => { const sc = Scenes.list.find(x => x.zp); if (!sc) return false; if (d.x === 'reset') sc.zp.reset(); else sc.zp.zoomAt(d.x === 'in' ? 1.3 : 1 / 1.3, 0, 0); return false; },
  feedAll: () => { const r = feedAll(); res(r); if (r.ok) toast(`Fed ${r.n} tank${r.n > 1 ? 's' : ''}`, 'good'); },
  fillStore: () => { const r = fillStore(); res(r); if (r.ok) { toast(`Put ${r.n} fish on display`, 'good'); Sfx.play('pop'); } },
  hatchAll: () => { const r = hatchAll(); res(r); if (r.ok) { toast(`Hatched ${r.n} egg${r.n > 1 ? 's' : ''}`, 'good'); Sfx.play('pop'); } },
  sortBy: d => { UI.sort = d.x; }, onlyMods: () => { UI.onlyMods = !UI.onlyMods; }, setQty: d => { UI.qty = +d.x; },
  setting: d => { S.settings[d.x] = !S.settings[d.x]; G.lowFx = !S.settings.fx; if (d.x === 'sound' && S.settings.sound) Sfx.play('good'); },
  noop: () => toast('Locked — reach a higher store level / get a saltwater tank', 'bad'),
  tab: d => { UI.tab = d.x; delete S.g4.fresh[d.x]; if (d.x !== 'hall') UI.tankId = null; },
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
  sellMarket: d => { const r = res(sellMarket(d.x)); if (r.ok) { toast(r.tokens ? `Sold for ${r.tokens} event tokens` : 'Sold to the fish market for ' + fmt(r.price), 'gold'); Sfx.play('sale'); UI.modal = null; UI.selFish = null; } },
  accept: d => { const r = res(acceptCustomer(d.x)); if (r.ok) { toast('Sold for ' + fmt(r.offer), 'gold'); Sfx.play('sale'); } },
  decline: d => res(declineCustomer(d.x)),
  cashier: () => { S.cashierOn = !S.cashierOn; },
  hatchPick: d => { UI.modal = { type: 'hatchTank', id: d.x }; },
  hatchHere: d => { UI.modal = { type: 'hatchEgg', id: d.x }; },
  hatch: d => { const r = hatchWith(d.x, d.y); if (r) UI.modal = null; },
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
  reset: () => { if (confirm('Delete all progress and start over?')) { resetGame(); UI.tankId = null; UI.sel = []; UI.tab = 'store'; UI.lastBreed = null; G.awayRep = null; UI.modal = { type: 'help' }; } },
};

function hatchWith(eggId, tankId) {
  const r = res(hatchEgg(eggId, tankId, activeBoost()));
  if (r.ok) { const f = G.hatched; toast(`Hatched a ${fishName(f)}! It will reveal what it is when it has grown up.`, 'good'); Sfx.play('pop'); if (G.boosted) toast('The mutagen was absorbed by the egg…', 'good'); }
  return r.ok;
}
document.addEventListener('mousedown', () => (mouseDown = true));
document.addEventListener('mouseup', () => (mouseDown = false));
document.addEventListener('click', e => {
  if (e.target.id === 'modal') { UI.modal = null; render(); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.getAttribute('aria-disabled')) { toast(/[$🎟]/.test(el.textContent) ? 'Not enough money or tokens' : 'Not available right now', 'bad'); return; }
  const fn = ACT[el.dataset.act] || ACT4[el.dataset.act];
  if (fn) { const r = fn(el.dataset); if (r !== false) render(); }
});
document.addEventListener('change', e => {
  const k = e.target.dataset.change; if (!k) return;
  if (changeG4(e)) { render(); return; }
  if (k === 'skin') res(applySkin(e.target.dataset.x, e.target.value));
  if (k === 'hallFilter') UI.hallFilter = e.target.value;
  if (k === 'upTank') UI.upTank = e.target.value;
  if (k === 'filterTank') UI.filterTank = e.target.value;
  if (k === 'assignHero') res(assignHero(e.target.dataset.x, null)), e.target.value && res(assignHero(e.target.dataset.x, e.target.value));
  if (k === 'assignHeroHere') { const hid = e.target.value; if (hid) res(assignHero(hid, e.target.dataset.x)); else { const h = heroIn(e.target.dataset.x); if (h) res(assignHero(h.id, null)); } }
  if (k === 'evPreview') { S.settings.event = e.target.value; G.dirty = true; }
  render();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && UI.modal) { UI.modal = null; render(); return; }
  if (e.target.matches && e.target.matches('textarea,input,select') || e.ctrlKey || e.metaKey || e.altKey) return;
  if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && UI.tab === 'hall' && UI.tankId && !UI.modal) { ACT4.tankStep({ x: e.key === 'ArrowLeft' ? '-1' : '1' }); render(); e.preventDefault(); return; }
  const tabs = visibleTabs().map(t => t[0]);
  if (e.key >= '1' && e.key <= '9') { UI.tab = tabs[+e.key - 1]; if (UI.tab !== 'hall') UI.tankId = null; render(); }
  else if (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '_' || e.key === '0') { const sc = Scenes.list.find(x => x.zp); if (!sc) return; if (e.key === '0') sc.zp.reset(); else sc.zp.zoomAt(e.key === '+' || e.key === '=' ? 1.25 : 0.8, 0, 0); e.preventDefault(); }
});

/* ---------- drag & drop: eggs onto aquariums, the sponge over the glass ---------- */
const DRAG = { kind: null, id: null, ghost: null, lastX: 0, lastY: 0, hover: null };
function dropTarget(x, y) { const el = document.elementFromPoint(x, y); return el ? el.closest('[data-droptank]') : null; }
function dragMark(el, cls) { document.querySelectorAll('.dropok,.dropbad').forEach(n => n.classList.remove('dropok', 'dropbad')); if (el) el.classList.add(cls); }
document.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  const el = e.target.closest('[data-drag]'); if (!el) return;
  e.preventDefault();
  DRAG.kind = el.dataset.drag; DRAG.id = el.dataset.id; DRAG.lastX = e.clientX; DRAG.lastY = e.clientY;
  const g = document.createElement('div'); g.className = 'dragghost ' + DRAG.kind; g.innerHTML = DRAG.kind === 'sponge' ? '🧽' : el.firstElementChild.outerHTML;
  document.body.appendChild(g); DRAG.ghost = g; g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; document.body.classList.add('dragging');
});
document.addEventListener('mousemove', e => {
  if (!DRAG.ghost) return;
  DRAG.ghost.style.left = e.clientX + 'px'; DRAG.ghost.style.top = e.clientY + 'px';
  if (DRAG.kind === 'egg') {
    const t = dropTarget(e.clientX, e.clientY), tank = t && getTank(t.dataset.droptank), egg = S.eggs.find(x => x.id === DRAG.id);
    DRAG.hover = tank ? tank.id : null; dragMark(t, tank && egg && !canHatchIn(egg, tank) ? 'dropok' : 'dropbad'); if (!tank) dragMark(null);
  } else if (DRAG.kind === 'sponge') {
    const sc = Scenes.list.find(x => !x.mini && x.scrub); if (!sc) return;
    const r = sc.cv.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { const n = sc.scrub(e.clientX, e.clientY, Math.hypot(e.clientX - DRAG.lastX, e.clientY - DRAG.lastY)); if (n) Sfx.play('pop'); DRAG.ghost.classList.add('wiping'); } else DRAG.ghost.classList.remove('wiping');
  }
  DRAG.lastX = e.clientX; DRAG.lastY = e.clientY;
});
document.addEventListener('mouseup', e => {
  if (!DRAG.ghost) return;
  const kind = DRAG.kind, id = DRAG.id, hover = DRAG.hover;
  DRAG.ghost.remove(); DRAG.ghost = null; DRAG.kind = null; DRAG.hover = null; document.body.classList.remove('dragging'); dragMark(null);
  if (kind === 'egg' && hover) {
    const egg = S.eggs.find(x => x.id === id), tank = getTank(hover), why = egg && tank ? canHatchIn(egg, tank) : 'Missing';
    if (why) toast(why, 'bad'); else hatchWith(id, hover);
  }
  mouseDown = false; G.dirty = true;
});

/* ---------- live updates ---------- */
function live() {
  liveG4();
  const mo = $('.money'); if (mo) mo.textContent = fmt(S.money);
  document.querySelectorAll('[data-grow]').forEach(el => { const f = getFish(el.dataset.grow); if (f) el.style.transform = `scale(${(0.45 + 0.55 * Math.min(1, f.g)).toFixed(3)})`; });
  document.querySelectorAll('[data-gbar]').forEach(el => { const f = getFish(el.dataset.gbar); if (f) el.style.width = Math.round(f.g * 100) + '%'; });
  document.querySelectorAll('[data-gtext]').forEach(el => { const f = getFish(el.dataset.gtext); if (f) el.textContent = Math.round(f.g * 100); });
  document.querySelectorAll('[data-pat]').forEach(el => { const c = S.customers.find(x => x.id === el.dataset.pat); if (c) el.style.width = Math.max(0, c.pat / c.patMax * 100) + '%'; });
  document.querySelectorAll('[data-cd]').forEach(el => { const f = getFish(el.dataset.cd); if (!f) return; const cd = f.ready - S.time; el.textContent = cd > 0 ? 'Resting ' + Math.ceil(cd) + 's' : 'Ready'; el.className = 'small ' + (cd > 0 ? 'badc' : 'good'); });
  document.querySelectorAll('[data-ctl]').forEach(el => { const c = S.contracts.find(x => x.id === el.dataset.ctl); if (c) el.textContent = mmss(c.left); });
  document.querySelectorAll('[data-wq]').forEach(el => { const t = getTank(el.dataset.wq); if (t) { el.style.width = Math.round(wqOf(t)) + '%'; el.style.background = wqColor(wqOf(t)); } });
  document.querySelectorAll('[data-wqtext]').forEach(el => { const t = getTank(el.dataset.wqtext); if (t) { el.textContent = wqLabel(wqOf(t)) + ' ' + Math.round(wqOf(t)) + '%'; el.style.color = wqColor(wqOf(t)); } });
  document.querySelectorAll('[data-boat]').forEach(el => { const b = S.exp.boats[+el.dataset.boat]; if (b) el.style.width = Math.round(boatProgress(b) * 100) + '%'; });
  document.querySelectorAll('[data-boateta]').forEach(el => { const b = S.exp.boats[+el.dataset.boateta]; if (b && !boatReady(b)) el.textContent = 'Returns in ' + fmtDur((1 - boatProgress(b)) * b.dur / 1000); });
  document.querySelectorAll('[data-showt]').forEach(el => { const sh = S.shows.leagues[el.dataset.showt]; if (sh) el.textContent = 'closes in ' + fmtDur((sh.closes - nowMs()) / 1000); });
  document.querySelectorAll('[data-quest]').forEach(el => { const q = S.daily.quests[+el.dataset.quest]; if (q) el.style.width = questProgress(q) / q.goal * 100 + '%'; });
  document.querySelectorAll('[data-questt]').forEach(el => { const q = S.daily.quests[+el.dataset.questt]; if (q) el.textContent = q.type === 'earn' ? fmt(questProgress(q)) + ' / ' + fmt(q.goal) : questProgress(q) + ' / ' + q.goal; });
  document.querySelectorAll('[data-fed]').forEach(el => { const t = getTank(el.dataset.fed); if (t) el.textContent = t.fedUntil > S.time ? 'Well fed — ' + Math.ceil(t.fedUntil - S.time) + 's left' : 'Hungry — feeding speeds up growth'; });
}

/* ---------- boot ---------- */
G.sfx = k => Sfx.play(k);
G.msg = (t, ty) => { toast(t, ty); if (/Store level/.test(t)) Sfx.play('level'); };
G.lowFx = false;
function boot() {
  document.title = 'Fish Tycoon v' + GAME_VERSION;
  const r = loadGame(); G.lowFx = !S.settings.fx;
  updateDaily(); ensureShows();
  if (S.staff.handler > 0 && !hasSaleTank()) toast('Your Display Handler now only sells fish from Sale tanks — open a tank and mark one as a Sale tank.', 'gold');
  G.awayRep = S.seenHelp ? buildAway(r) : null;
  if (!S.seenHelp) { UI.modal = { type: 'help' }; S.seenHelp = true; } else if (G.awayRep) UI.modal = { type: 'away' }; else if (loginClaimable()) UI.modal = { type: 'daily' };
  render();
  let last = performance.now(), lastMoney = S.money, saveT = 0, renderT = 0;
  setInterval(() => {
    const now = performance.now(), dt = Math.min(1, (now - last) / 1000); last = now;
    tick(dt); live(); if (checkPopups()) G.dirty = true;
    saveT += dt; renderT += dt;
    if (saveT > 10) { saveT = 0; saveGame(); }
    const moneyChanged = S.money !== lastMoney; lastMoney = S.money;
    const affordView = UI.tab === 'shop' || UI.tab === 'inv';
    if ((G.dirty || (moneyChanged && affordView) || renderT > 5) && !mouseDown && !document.activeElement.matches('textarea,select,input')) { renderT = 0; render(); }
  }, 250);
  window.addEventListener('beforeunload', saveGame);
}
boot();
