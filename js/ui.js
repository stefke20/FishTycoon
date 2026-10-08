'use strict';
/* ===== UI ===== */

const UI = { tab: 'store', tankId: null, shopCat: 'eggs', upTank: null, sel: [], modal: null, lastBreed: null };
const $ = s => document.querySelector(s);
const pct = x => { const v = x * 100; return (v < 10 && v > 0 ? v.toFixed(1) : Math.round(v)) + '%'; };
let mouseDown = false;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tierBadge = t => `<span class="tier" style="background:${TIER_COLORS[t]}">T${t} ${TIER_NAMES[t]}</span>`;
const modChips = mods => mods.map(m => `<span class="chip m${MODS[m].t}" title="x${MODS[m].m} value">${MODS[m].icon} ${MODS[m].n}</span>`).join('');
const btn = (label, act, data, cls, dis) => `<button class="btn ${cls || ''} ${dis ? 'off' : ''}" data-act="${act}" ${Object.entries(data || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')} ${dis ? 'aria-disabled="true"' : ''}>${label}</button>`;
const mult = n => (Math.round(n * 100) / 100) + 'x';

function bonusText(b) {
  const names = { growth: 'growth', value: 'value', mod: 'modifier chance', tier: 'tier-up chance', inherit: 'inheritance' };
  const out = Object.keys(b || {}).filter(k => b[k]).map(k => `+${Math.round(b[k] * 100)}% ${names[k]}`);
  return out.length ? out.join(', ') : 'cosmetic only';
}

/* ---------- scene ---------- */
function sceneHTML(t, mini) {
  const tt = tankType(t), skin = SKIN[t.skin], fs = fishIn(t.id);
  const bgCss = t.bg ? `background:${DECOR_BY_ID[t.bg].css};` : '';
  const now = performance.now() / 1000;
  let h = `<div class="scene ${tt.w} ${mini ? 'mini' : ''}" style="--frame:${skin.frame};--gravel:${skin.gravel};${bgCss}">`;
  for (let i = 0; i < (mini ? 3 : 8); i++) h += `<span class="bub" style="left:${(hash(t.id + i) % 90) + 4}%;animation-delay:-${(i * 1.7) % 7}s;animation-duration:${6 + (i % 4)}s"></span>`;
  h += `<div class="gravel"></div>`;
  t.slots.forEach((id, i) => { if (id) h += `<span class="dec" style="left:${SLOT_POS[i]}%">${DECOR_BY_ID[id].e}</span>`; });
  fs.forEach(f => {
    const sp = SPECIES[f.sp], hs = hash(f.id);
    const base = (34 + 15 * sp.t) * (mini ? 0.55 : 1);
    const dur = 16 + (hs % 14);
    const top = 12 + (hs >> 4) % 46;
    const delay = -((now + hs % 100) % dur);
    const sc = 0.4 + 0.6 * Math.min(1, f.g);
    h += `<div class="swimmer" ${mini ? '' : `data-act="openFish" data-x="${f.id}"`} style="top:${top}%;--dur:${dur}s;--w:${Math.round(base)}px;animation-delay:${delay.toFixed(2)}s">
      <span data-grow="${f.id}" style="display:inline-block;transform:scale(${sc.toFixed(3)})" title="${esc(fishName(f))}">${fishSVG(f.sp, f.mods, Math.round(base), f.id)}</span></div>`;
  });
  if (!fs.length) h += `<div class="empty">Empty tank — hatch an egg from your inventory!</div>`;
  return h + '</div>';
}

/* ---------- header ---------- */
function renderHeader() {
  const tabs = [['store', '🏪 Store'], ['hall', '🐠 Aquariums'], ['breed', '💞 Breeding'], ['shop', '🛒 Shop'], ['inv', '🎒 Inventory'], ['menu', '⚙️ Menu']];
  $('#tabs').innerHTML = tabs.map(([id, l]) => `<button class="${UI.tab === id ? 'on' : ''}" data-act="tab" data-x="${id}">${l}${id === 'store' && S.customers.length ? ` <span class="sw">${S.customers.length}</span>` : ''}${id === 'inv' && S.eggs.length ? ` <span class="sw">${S.eggs.length}</span>` : ''}</button>`).join('');
}
function renderStats() {
  const nl = nextLevelAt(), lv = level();
  const prog = nl ? (S.sales - LEVELS[lv]) / (nl - LEVELS[lv]) : 1;
  $('#stats').innerHTML = `<div class="lvl">Store level ${lv}${nl ? ` · ${S.sales}/${nl} sales` : ' · MAX'}<div class="bar"><i style="width:${Math.round(prog * 100)}%"></i></div></div><div class="money">${fmt(S.money)}</div>`;
}

/* ---------- STORE ---------- */
function viewStore() {
  const fs = storeFish(), cap = storeCap();
  let h = `<h2>🏪 Your Store</h2><div class="kv"><div>Sales: <b>${S.sales}</b></div><div>Total earned: <b>${fmt(S.earned)}</b></div><div>Best sale: <b>${fmt(S.bestValue || 0)}</b></div><div>Customers arrive every ~${Math.round(arrivalInterval())}s</div>${S.storeUp.cashier ? `<div>Cashier: ${btn(S.cashierOn ? 'ON' : 'OFF', 'cashier', {}, 'sm')} (auto-accepts ≥ ${Math.round(cashierThreshold() * 100)}%)</div>` : ''}</div>`;
  h += `<h3>Display cases (${fs.length}/${cap})</h3><div class="cases">`;
  for (const f of fs) {
    h += `<div class="case"><div data-act="openFish" data-x="${f.id}" style="cursor:pointer">${fishSVG(f.sp, f.mods, 96, 's' + f.id)}</div>
      <div><b>${esc(fishName(f))}</b><br>${tierBadge(SPECIES[f.sp].t)}<br><span class="gold">${fmt(fishValue(f))}</span></div>
      ${btn('Take back', 'unstore', { x: f.id }, 'sm')}</div>`;
  }
  for (let i = fs.length; i < cap; i++) h += `<div class="case empty" data-act="storeAdd"><div style="font-size:30px">＋</div>Add a fish</div>`;
  h += `</div><h3>Customers</h3>`;
  if (!fs.length) h += `<div class="card dim">Your cases are empty — put fully grown fish on display and customers will start to show up.</div>`;
  else if (!S.customers.length) h += `<div class="card dim">Waiting for customers… (upgrade Advertising in the shop to attract more)</div>`;
  for (const c of S.customers) {
    const f = getFish(c.fishId); if (!f) continue;
    const v = fishValue(f), r = c.offer / v;
    const desc = { browser: 'Just browsing for a nice fish.', enthusiast: `Really wants a <b>${SPECIES[f.sp].n}</b>!`, bargain: 'Hunting for a bargain…', collector: '🎩 <b>Collector</b> — loves modified fish.' }[c.type];
    h += `<div class="card cust"><div class="face">${c.face}</div><div style="width:84px;text-align:center">${fishSVG(f.sp, f.mods, 80, 'c' + c.id)}</div>
      <div style="flex:1"><b>${c.name}</b> <span class="dim small">wants</span> <b>${esc(fishName(f))}</b><br><span class="dim small">${desc}</span>
      <div class="bar pat" style="margin-top:6px;width:200px"><i data-pat="${c.id}" style="width:${Math.max(0, c.pat / c.patMax * 100)}%"></i></div></div>
      <div style="text-align:right"><div class="offer ${r >= 1 ? 'good' : r < 0.8 ? 'badc' : ''}">${fmt(c.offer)}</div><div class="small dim">${Math.round(r * 100)}% of ${fmt(v)}</div></div>
      <div>${btn('Accept', 'accept', { x: c.id }, 'pri')} ${btn('✕', 'decline', { x: c.id }, 'sm bad')}</div></div>`;
  }
  return h;
}

/* ---------- HALL ---------- */
function viewHall() {
  let h = `<h2>🐠 Aquarium Hall <span class="dim small">(${S.tanks.length}/${S.hallSlots} slots)</span></h2><div class="grid">`;
  for (const t of S.tanks) {
    const tt = tankType(t), fs = fishIn(t.id), grow = fs.filter(f => !isAdult(f)).length;
    h += `<div class="card click" data-act="openTank" data-x="${t.id}">${sceneHTML(t, true)}
      <div style="margin-top:8px"><b>${esc(t.name)}</b> <span class="dim small">${tt.w === 'salt' ? '🧂 Saltwater' : '💧 Freshwater'}</span></div>
      <div class="small dim">Fish ${fs.length}/${tt.cap} · ${grow} growing · ${fs.length - grow} adult · Water rating ${rating(t)}</div></div>`;
  }
  for (let i = S.tanks.length; i < S.hallSlots; i++) h += `<div class="card click" style="display:flex;align-items:center;justify-content:center;min-height:200px;color:var(--dim)" data-act="tab" data-x="shop"><div style="text-align:center"><div style="font-size:34px">＋</div>Empty slot<br>Buy a tank in the Shop</div></div>`;
  const sc = hallSlotCost();
  h += `</div><div style="margin-top:16px">${sc != null ? btn(`Expand hall: +1 slot (${fmt(sc)})`, 'buySlot', {}, 'pri', S.money < sc) : '<span class="dim">Hall is at maximum size.</span>'}</div>`;
  return h;
}

function viewTank() {
  const t = getTank(UI.tankId);
  if (!t) { UI.tankId = null; return viewHall(); }
  const tt = tankType(t), fs = fishIn(t.id), b = tankBonus(t), fed = t.fedUntil > S.time;
  let h = `<div class="row">${btn('← Hall', 'backHall')}<h2 style="margin:0">${esc(t.name)}</h2>${btn('✏️', 'rename', { x: t.id }, 'sm')}
    <span class="dim">${tt.w === 'salt' ? '🧂 Saltwater' : '💧 Freshwater'} · ${tt.n} · Fish ${fs.length}/${tt.cap} · Water rating <b>${rating(t)}</b> (supports up to tier ${rating(t)})</span></div>`;
  h += `<div style="margin:12px 0">${sceneHTML(t, false)}</div>`;
  const growing = fs.filter(f => !isAdult(f)).length;
  h += `<div class="row">${btn(`🍤 Feed (${fmt(growing * FEED_COST_PER_FISH)}) — ${FOOD[S.food].n} ×${foodMult()} growth`, 'feed', { x: t.id }, 'pri', !growing)}
    <span class="dim small" data-fed="${t.id}">${fed ? '🍽️ Well fed: ' + Math.ceil(t.fedUntil - S.time) + 's left' : 'Hungry — feeding speeds up growth'}</span>
    ${btn('🥚 Hatch an egg', 'hatchHere', { x: t.id })} ${btn('⬆️ Upgrades', 'goUpgrades', { x: t.id })}</div>`;
  h += `<div class="kv"><div>Growth ${mult(1 + b.growth)}</div><div>Value +${Math.round(b.value * 100)}%</div><div>Modifier chance +${Math.round(b.mod * 100)}%</div><div>Tier-up +${Math.round(b.tier * 100)}%</div><div>Inheritance +${Math.round(b.inherit * 100)}%</div></div>`;
  h += `<h3>Decorations</h3><div class="slots"><div class="slot" data-act="slotPick" data-x="${t.id}" data-y="bg"><div class="e">${t.bg ? DECOR_BY_ID[t.bg].e : '🖼️'}</div>${t.bg ? DECOR_BY_ID[t.bg].n : 'Background'}</div>`;
  t.slots.forEach((id, i) => { const d = id && DECOR_BY_ID[id]; h += `<div class="slot" data-act="slotPick" data-x="${t.id}" data-y="${i}"><div class="e">${d ? d.e : '＋'}</div>${d ? d.n : 'Decoration'}</div>`; });
  h += `</div><div class="row"><span class="dim small">Skin:</span><select data-change="skin" data-x="${t.id}">${SKINS.filter(s => S.skins[s.id]).map(s => `<option value="${s.id}" ${t.skin === s.id ? 'selected' : ''}>${s.n}</option>`).join('')}</select></div>`;
  h += `<h3>Fish</h3><div class="card" style="padding:0">`;
  if (!fs.length) h += `<div class="dim" style="padding:12px">No fish yet.</div>`;
  for (const f of fs) h += fishRow(f);
  return h + '</div>';
}
function fishRow(f, extra) {
  const sp = SPECIES[f.sp];
  return `<div class="fishrow" data-act="openFish" data-x="${f.id}"><div class="pic">${fishSVG(f.sp, f.mods, 60, 'r' + f.id + (extra || ''))}</div>
    <div class="info"><b>${esc(fishName(f))}</b> ${tierBadge(sp.t)}<br>${modChips(f.mods)}
    ${isAdult(f) ? '<span class="good small">Fully grown</span>' : `<div class="bar"><i data-gbar="${f.id}" style="width:${Math.round(f.g * 100)}%"></i></div>`}</div>
    <div class="gold">${fmt(previewValue(f))}</div></div>`;
}

/* ---------- BREEDING ---------- */
function viewBreed() {
  const adults = S.fish.filter(isAdult);
  UI.sel = UI.sel.filter(id => getFish(id) && isAdult(getFish(id)));
  const a = getFish(UI.sel[0]), b = getFish(UI.sel[1]);
  const water = a ? SPECIES[a.sp].w : null;
  let h = `<h2>💞 Breeding</h2><p class="dim">Pick two fully grown fish of the same water type. They produce eggs (inventory) that may carry traits of either parent, a chance at a higher-tier species, and inherited + stacked modifiers. Each modifier can only be applied once per fish.</p>`;
  const slot = (f, label) => `<div class="card parent">${f ? `${fishSVG(f.sp, f.mods, 120, 'p' + f.id)}<div><b>${esc(fishName(f))}</b> ${tierBadge(SPECIES[f.sp].t)}</div><div>${modChips(f.mods)}</div>${btn('Remove', 'breedSel', { x: f.id }, 'sm')}` : `<div class="dim" style="padding-top:40px">${label}<br>Select a fish below</div>`}</div>`;
  h += `<div class="parents">${slot(a, 'Parent A')}<div style="align-self:center;font-size:32px">💞</div>${slot(b, 'Parent B')}</div>`;
  if (a && b) {
    const why = breedCheck(a, b), o = breedOdds(a, b);
    h += `<div class="card" style="margin-top:12px"><b>Offspring odds</b> <span class="dim small">(${o.eggs} egg${o.eggs > 1 ? 's' : ''} per breeding)</span><div class="kv">`;
    h += o.species.map(s => `<div>${SPECIES[s.sp].n}: <b>${pct(s.p)}</b></div>`).join('');
    h += `<div>Higher-tier chance: <b>${pct(o.tierUp)}</b></div></div>`;
    const ml = Object.entries(o.mods).filter(([id, p]) => p >= 0.02).sort((x, y) => y[1] - x[1]);
    h += `<div class="small dim">Modifier chances:</div><div>${ml.map(([id, p]) => `<span class="chip m${MODS[id].t}">${MODS[id].icon} ${MODS[id].n} ${pct(p)}</span>`).join('') || '<span class="dim small">none likely</span>'}</div>`;
    h += `<div style="margin-top:10px">${why ? `<span class="badc">${why}</span> ` : ''}${btn('💞 Breed!', 'breedGo', {}, 'pri', !!why)}</div></div>`;
  }
  if (UI.lastBreed) {
    h += `<div class="card" style="margin-top:12px;border-color:var(--accent2)"><b>🥚 Last breeding produced:</b>${UI.lastBreed.map(m => `<div>${m.up ? '⬆️ <b class="gold">Higher tier!</b> ' : ''}Egg → <b>${SPECIES[m.sp].n}</b> ${tierBadge(SPECIES[m.sp].t)} ${modChips(m.mods)}</div>`).join('')}<div class="small dim">It's in your inventory — hatch it into a tank with enough water rating.</div></div>`;
  }
  h += `<h3>Adult fish</h3>`;
  if (!adults.length) h += `<div class="card dim">No fully grown fish yet.</div>`;
  h += `<div class="pick">`;
  for (const f of adults) {
    const selected = UI.sel.includes(f.id), cd = f.ready - S.time;
    const incompatible = water && !selected && SPECIES[f.sp].w !== water;
    h += `<div class="card click ${selected ? 'sel' : ''} ${incompatible ? 'dis' : ''}" data-act="breedSel" data-x="${f.id}">${fishSVG(f.sp, f.mods, 90, 'b' + f.id)}<div><b>${esc(fishName(f))}</b></div><div>${modChips(f.mods)}</div>
      <div class="small ${cd > 0 ? 'badc' : 'good'}" data-cd="${f.id}">${cd > 0 ? '💤 Rests ' + Math.ceil(cd) + 's' : 'Ready'}</div><div class="small dim">${f.loc === 'store' ? 'In store' : esc(getTank(f.loc).name)}</div></div>`;
  }
  return h + '</div>';
}

/* ---------- SHOP ---------- */
function item(ic, name, desc, price, label, act, data, opts) {
  opts = opts || {};
  return `<div class="item ${opts.locked ? 'locked' : ''}"><div class="ic">${ic}</div><div class="tx"><b>${name}</b> ${opts.badge || ''}<div class="small dim">${desc}</div></div>
    <div style="text-align:right">${price != null ? `<div class="gold">${fmt(price)}</div>` : ''}${opts.locked ? `<div class="small dim">🔒 ${opts.locked}</div>` : opts.maxed ? '<div class="good small">MAX</div>' : btn(label || 'Buy', act, data, 'pri', S.money < price)}</div></div>`;
}
function viewShop() {
  const cats = [['eggs', '🥚 Eggs'], ['tanks', '🐟 Tanks'], ['upgrades', '⬆️ Tank Upgrades'], ['decor', '🌿 Decorations'], ['food', '🍤 Food'], ['skins', '🎨 Skins'], ['store', '🏪 Store Upgrades'], ['breeding', '💞 Breeding']];
  let h = `<h2>🛒 Shop</h2><div class="cats">${cats.map(([id, l]) => `<button class="${UI.shopCat === id ? 'on' : ''}" data-act="shopCat" data-x="${id}">${l}</button>`).join('')}</div>`;
  const lv = level();
  switch (UI.shopCat) {
    case 'eggs': {
      for (const water of ['fresh', 'salt']) {
        h += `<h3>${water === 'fresh' ? '💧 Freshwater' : '🧂 Saltwater'} eggs</h3>`;
        if (water === 'salt' && !S.tanks.some(t => tankType(t).w === 'salt')) h += `<div class="card dim" style="margin-bottom:8px">You need a saltwater tank before you can buy saltwater eggs (Tanks tab, unlocks at store level 3).</div>`;
        for (let tier = 1; tier <= 5; tier++) {
          const unl = lv >= (water === 'salt' ? SALT_EGG_UNLOCK_LEVEL[tier] : EGG_UNLOCK_LEVEL[tier]);
          const have = water === 'fresh' || S.tanks.some(t => tankType(t).w === 'salt');
          const names = speciesOf(water, tier).map(s => s.n).join(', ');
          const p = eggPrice(water, tier);
          h += item(water === 'fresh' ? '🥚' : '🪺', `${TIER_NAMES[tier]} ${water === 'fresh' ? 'Freshwater' : 'Saltwater'} Egg`, `Tier ${tier} · needs water rating ${tier} · hatches: ${names} · sells ~${fmt(SPECIES_LIST.filter(s => s.w === water && s.t === tier).reduce((a, s) => a + s.value, 0) / 4)}`, p, 'Buy', 'buyEgg', { x: water, y: tier },
            { locked: !unl ? 'Store level ' + (water === 'salt' ? SALT_EGG_UNLOCK_LEVEL[tier] : EGG_UNLOCK_LEVEL[tier]) : !have ? 'Needs saltwater tank' : null, badge: tierBadge(tier) });
        }
      }
      break;
    }
    case 'tanks': {
      h += `<p class="dim">Hall slots: ${S.tanks.length}/${S.hallSlots}. ${hallSlotCost() != null ? btn(`Buy slot (${fmt(hallSlotCost())})`, 'buySlot', {}, 'sm pri', S.money < hallSlotCost()) : ''} You keep all your old tanks.</p>`;
      for (const tt of TANK_TYPES) h += item(tt.w === 'salt' ? '🪸' : '🐠', tt.n, `${tt.w === 'salt' ? 'Saltwater' : 'Freshwater'} · holds ${tt.cap} fish · base water rating ${tt.base} (upgradeable up to ${tt.base + 3})`, tt.price, 'Buy', 'buyTank', { x: tt.id }, { locked: lv < tt.lvl ? 'Store level ' + tt.lvl : null });
      break;
    }
    case 'upgrades': {
      if (!UI.upTank || !getTank(UI.upTank)) UI.upTank = S.tanks[0].id;
      const t = getTank(UI.upTank);
      h += `<div class="row" style="margin-bottom:10px">Tank: <select data-change="upTank">${S.tanks.map(x => `<option value="${x.id}" ${x.id === t.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><span class="dim">Water rating ${rating(t)} · cost scales with tank size</span></div>`;
      for (const u of TANK_UPGRADES) { const c = tankUpgradeCost(t, u); h += item(u.icon, `${u.n} <span class="dim small">Lv ${t.up[u.id]}/${u.max}</span>`, u.desc, c, 'Upgrade', 'tup', { x: t.id, y: u.id }, { maxed: c == null }); }
      break;
    }
    case 'decor': {
      for (const [k, label] of [['plant', '🌿 Plants'], ['rock', '🪨 Rocks'], ['acc', '🧰 Accessories'], ['bg', '🖼️ Backgrounds']]) {
        h += `<h3>${label}</h3>`;
        for (const d of DECOR.filter(d => d.k === k)) h += item(d.e, d.n + ` <span class="dim small">${d.w === 'both' ? '' : d.w === 'salt' ? '🧂 salt only' : '💧 fresh only'}</span>`, bonusText(d.b), d.price, 'Buy', 'buyDecor', { x: d.id }, { badge: S.decorInv[d.id] ? `<span class="sw">owned ${S.decorInv[d.id]}</span>` : '' });
      }
      break;
    }
    case 'food': {
      h += `<p class="dim">Feeding makes fish grow faster for ${FED_DURATION}s. Better food = bigger multiplier. Current: <b>${FOOD[S.food].n}</b> (×${foodMult()}).</p>`;
      FOOD.forEach((f, i) => { if (i === 0) return; h += item('🍤', f.n, `Feeding multiplies growth speed by ×${f.mult}`, f.price, 'Buy', 'buyFood', {}, { maxed: S.food >= i, locked: i > S.food + 1 ? 'Buy previous food first' : null }); });
      break;
    }
    case 'skins': {
      for (const s of SKINS) h += item('🎨', s.n, bonusText(s.b) + ' — apply from a tank\'s page', s.price, 'Buy', 'buySkin', { x: s.id }, { maxed: !!S.skins[s.id] });
      break;
    }
    case 'store': {
      for (const u of STORE_UPGRADES) { const l = S.storeUp[u.id]; h += item(u.icon, `${u.n} <span class="dim small">Lv ${l}/${u.max}</span>`, u.desc, l >= u.max ? null : u.cost(l), 'Upgrade', 'sup', { x: u.id }, { maxed: l >= u.max }); }
      break;
    }
    case 'breeding': {
      for (const u of BREED_UPGRADES) { const l = S.breedUp[u.id]; h += item(u.icon, `${u.n} <span class="dim small">Lv ${l}/${u.max}</span>`, u.desc, l >= u.max ? null : u.cost(l), 'Upgrade', 'bup', { x: u.id }, { maxed: l >= u.max }); }
      break;
    }
  }
  return h;
}

/* ---------- INVENTORY ---------- */
function viewInv() {
  let h = `<h2>🎒 Inventory</h2><h3>Eggs (${S.eggs.length})</h3>`;
  if (!S.eggs.length) h += `<div class="card dim">No eggs. Buy some in the shop or breed your fish!</div>`;
  h += `<div class="grid">`;
  for (const e of S.eggs) h += `<div class="card" style="display:flex;gap:10px;align-items:center"><div style="font-size:34px">${e.water === 'fresh' ? '🥚' : '🪺'}</div><div style="flex:1"><b>${e.bred ? 'Bred' : TIER_NAMES[e.tier]} ${e.water === 'fresh' ? 'Freshwater' : 'Saltwater'} Egg</b><br>${tierBadge(e.tier)} ${e.bred ? '<span class="chip m2">bred</span>' : ''}</div>${btn('Hatch', 'hatchPick', { x: e.id }, 'pri sm')}</div>`;
  h += `</div><h3>Decorations</h3>`;
  const owned = DECOR.filter(d => S.decorInv[d.id] > 0);
  if (!owned.length) h += `<div class="card dim">No spare decorations. Buy some in the shop, then place them from a tank's page.</div>`;
  h += `<div class="grid">${owned.map(d => `<div class="card row"><span style="font-size:30px">${d.e}</span><div><b>${d.n}</b> ×${S.decorInv[d.id]}<br><span class="small dim">${bonusText(d.b)}</span></div></div>`).join('')}</div>`;
  const fish = S.fish.filter(isAdult);
  h += `<h3>All fish (${S.fish.length})</h3><div class="card" style="padding:0">${S.fish.map(f => fishRow(f, 'i')).join('') || '<div class="dim" style="padding:12px">None</div>'}</div>`;
  return h;
}

/* ---------- MENU ---------- */
function viewMenu() {
  return `<h2>⚙️ Menu</h2><div class="row">${btn('💾 Save now', 'save', {}, 'pri')} ${btn('❓ How to play', 'help')} ${btn('📤 Export save', 'export')} ${btn('📥 Import save', 'import')} ${btn('🗑️ Reset game', 'reset', {}, 'bad')}</div>
  <p class="dim">The game auto-saves every 10 seconds to your browser/app storage and catches up on fish growth while you're away (up to 4 hours).</p>
  <div class="kv"><div>Fish owned: ${S.fish.length}</div><div>Times bred: ${S.bredCount}</div><div>Total earned: ${fmt(S.earned)}</div><div>Play time: ${Math.round(S.time / 60)} min</div></div>`;
}

/* ---------- MODALS ---------- */
function modalHTML() {
  const m = UI.modal; if (!m) return '';
  let h = `<div class="mbox"><button class="x" data-act="closeModal">✕</button>`;
  switch (m.type) {
    case 'fish': {
      const f = getFish(m.id); if (!f) { UI.modal = null; return ''; }
      const sp = SPECIES[f.sp], adult = isAdult(f);
      h += `<h2>${esc(fishName(f))}</h2><div style="text-align:center">${fishSVG(f.sp, f.mods, 180, 'm' + f.id)}</div>
        <div class="kv"><div>${tierBadge(sp.t)}</div><div>${sp.w === 'salt' ? '🧂 Saltwater' : '💧 Freshwater'}</div><div>Base ${fmt(sp.value)}</div><div>Value <b class="gold">${fmt(previewValue(f))}</b></div></div>
        <p>Modifiers: ${f.mods.length ? modChips(f.mods) + `<span class="dim small"> (total x${mult(f.mods.reduce((a, x) => a * MODS[x].m, 1))})</span>` : '<span class="dim">none</span>'}</p>
        <p>${adult ? '<span class="good">Fully grown</span>' : `Growing: <span data-gtext="${f.id}">${Math.round(f.g * 100)}</span>%`}</p>
        <p class="dim small">Location: ${f.loc === 'store' ? 'Store display' : esc(getTank(f.loc).name)}</p>
        <div class="row">`;
      if (adult) {
        h += f.loc === 'store' ? btn('Back to a tank', 'fishPickTank', { x: f.id }) : btn('🏪 Put in store', 'toStore', { x: f.id }, 'pri');
        h += btn('Move tank', 'fishPickTank', { x: f.id }) + btn(`Sell to market (${fmt(fishValue(f) * QUICK_SELL)})`, 'sellMarket', { x: f.id }, 'bad');
        h += btn('💞 Breed', 'breedWith', { x: f.id });
      } else h += btn('Move tank', 'fishPickTank', { x: f.id });
      h += `</div>`; break;
    }
    case 'pickTank': {
      const f = getFish(m.id);
      h += `<h2>Move ${esc(fishName(f))} to…</h2>` + S.tanks.map(t => {
        const sp = SPECIES[f.sp]; let why = null;
        if (t.id === f.loc) why = 'Already here'; else if (tankType(t).w !== sp.w) why = 'Wrong water'; else if (rating(t) < sp.t) why = 'Needs rating ' + sp.t; else if (tankFree(t) <= 0) why = 'Full';
        return `<div class="item" style="${why ? 'opacity:.5' : ''}"><div class="tx"><b>${esc(t.name)}</b><div class="small dim">${fishIn(t.id).length}/${tankType(t).cap} fish · rating ${rating(t)}</div></div>${why ? `<span class="dim small">${why}</span>` : btn('Move', 'moveTo', { x: f.id, y: t.id }, 'pri sm')}</div>`;
      }).join(''); break;
    }
    case 'hatchTank': { // choose tank for an egg
      const e = S.eggs.find(x => x.id === m.id);
      h += `<h2>Hatch ${e.bred ? 'bred' : TIER_NAMES[e.tier]} egg in…</h2>` + (S.tanks.map(t => { const why = canHatchIn(e, t); return `<div class="item" style="${why ? 'opacity:.5' : ''}"><div class="tx"><b>${esc(t.name)}</b><div class="small dim">${fishIn(t.id).length}/${tankType(t).cap} fish · rating ${rating(t)}</div></div>${why ? `<span class="dim small">${why}</span>` : btn('Hatch', 'hatch', { x: e.id, y: t.id }, 'pri sm')}</div>`; }).join('')); break;
    }
    case 'hatchEgg': { // choose egg for a tank
      const t = getTank(m.id);
      h += `<h2>Hatch an egg in ${esc(t.name)}</h2>`;
      const eggs = S.eggs.filter(e => !canHatchIn(e, t));
      h += eggs.length ? eggs.map(e => `<div class="item"><div class="ic">${e.water === 'fresh' ? '🥚' : '🪺'}</div><div class="tx"><b>${e.bred ? 'Bred' : TIER_NAMES[e.tier]} egg</b> ${tierBadge(e.tier)}</div>${btn('Hatch', 'hatch', { x: e.id, y: t.id }, 'pri sm')}</div>`).join('') : '<p class="dim">No suitable eggs (check water type, rating and free space).</p>'; break;
    }
    case 'storeAdd': {
      const list = S.fish.filter(f => isAdult(f) && f.loc !== 'store');
      h += `<h2>Put a fish on display</h2>` + (list.length ? list.map(f => `<div class="item"><div style="width:70px">${fishSVG(f.sp, f.mods, 64, 'a' + f.id)}</div><div class="tx"><b>${esc(fishName(f))}</b><div>${modChips(f.mods)}</div></div><span class="gold">${fmt(fishValue(f))}</span>${btn('Display', 'toStore', { x: f.id }, 'pri sm')}</div>`).join('') : '<p class="dim">You have no fully grown fish outside the store yet. Feed your growing fish!</p>'); break;
    }
    case 'slot': {
      const t = getTank(m.id), isBg = m.slot === 'bg';
      const cur = isBg ? t.bg : t.slots[m.slot];
      h += `<h2>${isBg ? 'Background' : 'Decoration'} — ${esc(t.name)}</h2>`;
      if (cur) h += `<div class="item"><div class="ic">${DECOR_BY_ID[cur].e}</div><div class="tx"><b>${DECOR_BY_ID[cur].n}</b> <span class="dim small">(equipped)</span></div>${btn('Remove', 'slotClear', { x: t.id, y: m.slot }, 'bad sm')}</div>`;
      const list = DECOR.filter(d => (d.k === 'bg') === isBg && S.decorInv[d.id] > 0 && decorFits(d, t));
      h += list.length ? list.map(d => `<div class="item"><div class="ic">${d.e}</div><div class="tx"><b>${d.n}</b> ×${S.decorInv[d.id]}<div class="small dim">${bonusText(d.b)}</div></div>${btn('Place', 'slotSet', { x: t.id, y: m.slot, z: d.id }, 'pri sm')}</div>`).join('') : '<p class="dim">Nothing suitable in your inventory — visit the Shop → Decorations.</p>'; break;
    }
    case 'help': {
      h += `<h2>🐠 How to play</h2>
      <p><b>1.</b> Open your <b>Inventory</b> and hatch your two starter eggs in your tank. Baby fish need to <b>grow</b> — press <b>Feed</b> to speed it up.</p>
      <p><b>2.</b> When a fish is fully grown, put it on display in your <b>Store</b>. Customers make offers — accept good ones, decline lowballs, or hire a cashier.</p>
      <p><b>3.</b> Use profits in the <b>Shop</b>: higher-tier eggs, bigger tanks (and later saltwater ones), filters, plants, food, store upgrades.</p>
      <p><b>4.</b> Fish need a tank with enough <b>water rating</b> (tank size + filter + aerator) for their tier.</p>
      <p><b>5.</b> <b>Breed</b> two adults: eggs inherit species, small chance for a higher tier, and modifiers stack — each modifier only once per fish. Keep breeding modded fish to stack them for huge value!</p>
      <p><b>6.</b> Gain store levels with sales to unlock rarer eggs, big tanks and saltwater.</p><div class="row">${btn("Let's go!", 'closeModal', {}, 'pri')}</div>`; break;
    }
    case 'text': { h += `<h2>${esc(m.title)}</h2><textarea id="txt" style="width:100%;height:160px;background:#06111d;color:#cfe;border:1px solid var(--line);border-radius:8px;user-select:text" ${m.ro ? 'readonly' : ''}>${esc(m.text || '')}</textarea><div class="row" style="margin-top:8px">${m.ro ? '' : btn('Load', 'doImport', {}, 'pri')}${btn('Close', 'closeModal')}</div>`; break; }
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
}

function toast(text, type) {
  const d = document.createElement('div'); d.className = 'toast ' + (type || ''); d.textContent = text;
  $('#toasts').appendChild(d); setTimeout(() => d.remove(), 4200);
}
function res(r) { if (r && r.ok === false) toast(r.err, 'bad'); G.dirty = true; return r; }

/* ---------- actions ---------- */
const ACT = {
  tab: d => { UI.tab = d.x; if (d.x !== 'hall') UI.tankId = null; },
  openTank: d => { UI.tankId = d.x; UI.tab = 'hall'; },
  backHall: () => { UI.tankId = null; },
  goUpgrades: d => { UI.upTank = d.x; UI.shopCat = 'upgrades'; UI.tab = 'shop'; },
  shopCat: d => { UI.shopCat = d.x; },
  buySlot: () => res(buyHallSlot()),
  buyEgg: d => { const r = buyEgg(d.x, +d.y); res(r); if (r.ok) toast('🥚 Egg added to your inventory'); },
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
  accept: d => { const r = res(acceptCustomer(d.x)); if (r.ok) toast('💰 Sold for ' + fmt(r.offer), 'gold'); },
  decline: d => res(declineCustomer(d.x)),
  cashier: () => { S.cashierOn = !S.cashierOn; },
  hatchPick: d => { UI.modal = { type: 'hatchTank', id: d.x }; },
  hatchHere: d => { UI.modal = { type: 'hatchEgg', id: d.x }; },
  hatch: d => {
    const r = res(hatchEgg(d.x, d.y));
    if (r.ok) { const f = G.hatched; toast(`🐣 Hatched a ${fishName(f)}!` + (f.mods.length ? ' ✨ With modifiers!' : ''), f.mods.length ? 'gold' : 'good'); UI.modal = S.eggs.length && UI.tab === 'hall' ? null : null; }
  },
  slotPick: d => { UI.modal = { type: 'slot', id: d.x, slot: d.y === 'bg' ? 'bg' : +d.y }; },
  slotSet: d => { const r = res(placeDecor(d.x, d.y === 'bg' ? 'bg' : +d.y, d.z)); if (r.ok) UI.modal = null; },
  slotClear: d => { res(removeDecor(d.x, d.y === 'bg' ? 'bg' : +d.y)); UI.modal = null; },
  breedSel: d => { const i = UI.sel.indexOf(d.x); if (i >= 0) UI.sel.splice(i, 1); else if (UI.sel.length < 2) UI.sel.push(d.x); else UI.sel[1] = d.x; },
  breedWith: d => { UI.sel = [d.x]; UI.tab = 'breed'; UI.tankId = null; UI.modal = null; },
  breedGo: () => {
    const r = res(breedFish(UI.sel[0], UI.sel[1]));
    if (r.ok) { UI.lastBreed = r.made; toast('🥚 Breeding successful! Check the result below.', 'good'); if (r.made.some(m => m.mods.length)) toast('✨ A modifier was passed on!', 'gold'); }
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
  if (e.target.closest('.mbox') === null && e.target.id === 'modal') { UI.modal = null; render(); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.getAttribute('aria-disabled')) { toast('Not enough money', 'bad'); return; }
  const fn = ACT[el.dataset.act];
  if (fn) { fn(el.dataset); render(); }
});
document.addEventListener('change', e => {
  const k = e.target.dataset.change; if (!k) return;
  if (k === 'skin') res(applySkin(e.target.dataset.x, e.target.value));
  if (k === 'upTank') UI.upTank = e.target.value;
  render();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && UI.modal) { UI.modal = null; render(); } });

/* ---------- live updates ---------- */
function live() {
  $('.money') && ($('.money').textContent = fmt(S.money));
  document.querySelectorAll('[data-grow]').forEach(el => { const f = getFish(el.dataset.grow); if (f) el.style.transform = `scale(${(0.4 + 0.6 * Math.min(1, f.g)).toFixed(3)})`; });
  document.querySelectorAll('[data-gbar]').forEach(el => { const f = getFish(el.dataset.gbar); if (f) el.style.width = Math.round(f.g * 100) + '%'; });
  document.querySelectorAll('[data-gtext]').forEach(el => { const f = getFish(el.dataset.gtext); if (f) el.textContent = Math.round(f.g * 100); });
  document.querySelectorAll('[data-pat]').forEach(el => { const c = S.customers.find(x => x.id === el.dataset.pat); if (c) el.style.width = Math.max(0, c.pat / c.patMax * 100) + '%'; });
  document.querySelectorAll('[data-cd]').forEach(el => { const f = getFish(el.dataset.cd); if (!f) return; const cd = f.ready - S.time; el.textContent = cd > 0 ? '💤 Rests ' + Math.ceil(cd) + 's' : 'Ready'; el.className = 'small ' + (cd > 0 ? 'badc' : 'good'); });
  document.querySelectorAll('[data-fed]').forEach(el => { const t = getTank(el.dataset.fed); if (t) el.textContent = t.fedUntil > S.time ? '🍽️ Well fed: ' + Math.ceil(t.fedUntil - S.time) + 's left' : 'Hungry — feeding speeds up growth'; });
}

/* ---------- boot ---------- */
G.msg = toast;
function boot() {
  const r = loadGame();
  if (r.away > 60) toast(`Welcome back! Your fish kept growing for ${Math.round(r.away / 60)} min` + (r.matured ? ` — ${r.matured} reached adulthood.` : '.'), 'good');
  if (!S.seenHelp) { UI.modal = { type: 'help' }; S.seenHelp = true; }
  render();
  let last = performance.now(), acc = 0, lastMoney = S.money, saveT = 0, renderT = 0;
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
