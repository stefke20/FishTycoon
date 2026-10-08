'use strict';
/* ===== UI ===== */

const UI = { tab: 'store', tankId: null, shopCat: 'eggs', upTank: null, sel: [], modal: null, lastBreed: null, boost: null };
const $ = s => document.querySelector(s);
const pct = x => { const v = x * 100; return (v < 10 && v > 0 ? v.toFixed(1) : Math.round(v)) + '%'; };
let mouseDown = false;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tierBadge = t => `<span class="tier" style="background:${TIER_COLORS[t]}">T${t} ${TIER_NAMES[t]}</span>`;
const modChips = mods => mods.map(m => `<span class="chip m${MODS[m].t}" title="x${MODS[m].m} value">${MODS[m].icon} ${MODS[m].n}</span>`).join('');
const btn = (label, act, data, cls, dis) => `<button class="btn ${cls || ''} ${dis ? 'off' : ''}" data-act="${act}" ${Object.entries(data || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')} ${dis ? 'aria-disabled="true"' : ''}>${label}</button>`;
const mult = n => (Math.round(n * 100) / 100) + 'x';
const ico = (e, s) => pxEmoji(e, s || 24);
const pill = (l, v) => `<span class="pill">${l} <b>${v}</b></span>`;

function bonusText(b) {
  const names = { growth: 'growth', value: 'value', mod: 'modifier chance', tier: 'tier-up chance', inherit: 'inheritance' };
  const out = Object.keys(b || {}).filter(k => b[k]).map(k => `+${Math.round(b[k] * 100)}% ${names[k]}`);
  return out.length ? out.join(' · ') : 'cosmetic only';
}
const eggTitle = e => e.bred ? 'Bred Egg' : eggType(e).n;
const waterTag = w => w === 'salt' ? '🧂 Saltwater' : '💧 Freshwater';

/* ---------- scene ---------- */
function sceneHTML(t, mini) {
  const tt = tankType(t), skin = SKIN[t.skin], fs = fishIn(t.id);
  const bgCss = t.bg ? `background:${DECOR_BY_ID[t.bg].css};` : '';
  let h = `<div class="scene ${tt.w} ${mini ? 'mini' : ''}" data-sk="${t.id}${mini ? 'm' : ''}" style="--frame:${skin.frame};--gravel-img:url(${gravelURL(skin.gravel)});${bgCss}">`;
  for (let i = 0; i < (mini ? 3 : 9); i++) h += `<span class="bub" style="left:${(hash(t.id + i) % 92) + 3}%;animation-delay:-${(i * 2.3) % 8}s;animation-duration:${7 + (i % 4)}s"></span>`;
  h += `<div class="gravel"></div>`;
  t.slots.forEach((id, i) => { if (id) h += `<span class="dec" style="left:${SLOT_POS[i]}%">${ico(DECOR_BY_ID[id].e, mini ? 24 : 52)}</span>`; });
  fs.forEach(f => {
    const sp = SPECIES[f.sp];
    const base = (40 + 16 * sp.t) * (mini ? 0.62 : 1), sc = Math.max(1, Math.round(base / GW));
    const sc2 = 0.45 + 0.55 * Math.min(1, f.g);
    h += `<div class="swimmer" ${mini ? '' : `data-act="openFish" data-x="${f.id}"`} data-fid="${f.id}" data-w="${GW * sc}" data-h="${GH * sc}">
      <span data-grow="${f.id}" style="display:inline-block;transform:scale(${sc2.toFixed(3)})" title="${esc(fishName(f))}">${fishSVG(f.sp, f.mods, GW * sc)}</span></div>`;
  });
  if (!fs.length) h += `<div class="empty">${mini ? 'Empty' : 'Empty tank — hatch an egg from your inventory!'}</div>`;
  return h + '</div>';
}

/* ---------- smooth swimming engine ---------- */
const Swim = {
  states: new Map(), list: [], last: 0,
  bind() {
    this.list = [];
    document.querySelectorAll('.swimmer').forEach(el => {
      const scene = el.parentElement, key = scene.dataset.sk + ':' + el.dataset.fid;
      const mini = scene.classList.contains('mini');
      let s = this.states.get(key);
      const w = +el.dataset.w, h = +el.dataset.h, W = scene.clientWidth, H = scene.clientHeight;
      if (!s) {
        const hs = hash(key);
        s = { x: (hs % 1000) / 1000 * Math.max(10, W - w), y: ((hs >>> 10) % 1000) / 1000 * Math.max(10, H * 0.6 - h) + 10, vx: 0, vy: 0, face: hs % 2 ? 1 : -1, tx: 0, ty: 0, pause: 0, spd: (22 + hs % 26) * (mini ? 0.55 : 1), phase: (hs % 628) / 100, burst: 1 };
        s.tx = s.x; s.ty = s.y; this.pick(s, W, H, w, h, mini);
        this.states.set(key, s);
      }
      s.el = el; s.scene = scene; s.w = w; s.h = h; s.mini = mini;
      this.list.push(s); this.apply(s);
    });
    if (this.states.size > 400) { const live = new Set(this.list); for (const [k, v] of this.states) if (!live.has(v)) this.states.delete(k); }
  },
  pick(s, W, H, w, h, mini) {
    const gh = mini ? 14 : 26;
    const near = Math.random() < 0.55;
    const rx = near ? 140 : 9999, ry = near ? 60 : 9999;
    const minX = 4, maxX = Math.max(minX + 1, W - w - 4), minY = H * 0.05, maxY = Math.max(minY + 1, H - gh - h - 4);
    s.tx = Math.min(maxX, Math.max(minX, s.x + (Math.random() * 2 - 1) * Math.min(rx, W)));
    s.ty = Math.min(maxY, Math.max(minY, s.y + (Math.random() * 2 - 1) * Math.min(ry, H)));
    if (!near) { s.tx = minX + Math.random() * (maxX - minX); s.ty = minY + Math.random() * (maxY - minY); }
    s.burst = 0.55 + Math.random() * 0.9;
    if (Math.random() < 0.2) s.pause = 0.4 + Math.random() * 1.6;
  },
  apply(s) {
    const bob = Math.sin(s.phase) * 1.6;
    const ang = Math.max(-0.7, Math.min(0.7, s.vy / (Math.abs(s.vx) + 28))) * 20 * s.face + Math.sin(s.phase * 1.3) * 1.2;
    s.el.style.transform = `translate(${s.x.toFixed(1)}px,${(s.y + bob).toFixed(1)}px) rotate(${ang.toFixed(1)}deg) scaleX(${s.face.toFixed(2)})`;
  },
  frame(now) {
    const dt = Math.min(0.05, (now - (Swim.last || now)) / 1000); Swim.last = now;
    const dims = new Map();
    for (const s of Swim.list) {
      if (!s.el.isConnected) continue;
      let d = dims.get(s.scene); if (!d) dims.set(s.scene, d = [s.scene.clientWidth, s.scene.clientHeight]);
      const [W, H] = d;
      const dx = s.tx - s.x, dy = s.ty - s.y, dist = Math.hypot(dx, dy);
      let dvx = 0, dvy = 0;
      if (s.pause > 0) s.pause -= dt;
      else if (dist < 14) Swim.pick(s, W, H, s.w, s.h, s.mini);
      else { const sp = s.spd * s.burst; dvx = dx / dist * sp; dvy = dy / dist * sp * 0.7; }
      const k = 1 - Math.exp(-dt * 1.6);
      s.vx += (dvx - s.vx) * k; s.vy += (dvy - s.vy) * k;
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.x = Math.max(0, Math.min(W - s.w, s.x)); s.y = Math.max(0, Math.min(H - (s.mini ? 14 : 26) - s.h, s.y));
      const tf = s.vx > 5 ? 1 : s.vx < -5 ? -1 : (s.face >= 0 ? 1 : -1);
      s.face += (tf - s.face) * (1 - Math.exp(-dt * 6));
      s.phase += dt * (2.5 + Math.hypot(s.vx, s.vy) * 0.12);
      Swim.apply(s);
    }
    requestAnimationFrame(Swim.frame);
  },
};

/* ---------- chrome ---------- */
function renderHeader() {
  const tabs = [['store', '🏪', 'Store'], ['hall', '🐠', 'Aquariums'], ['breed', '💞', 'Breeding'], ['shop', '🛒', 'Shop'], ['inv', '🎒', 'Inventory'], ['menu', '⚙️', 'Menu']];
  $('#tabs').innerHTML = tabs.map(([id, e, l]) => {
    const n = id === 'store' ? S.customers.length : id === 'inv' ? S.eggs.length : 0;
    return `<button class="${UI.tab === id ? 'on' : ''}" data-act="tab" data-x="${id}">${ico(e, 22)}<span>${l}</span>${n ? `<span class="badge">${n}</span>` : ''}</button>`;
  }).join('');
  if (!$('#logoimg').firstChild) $('#logoimg').innerHTML = fishSVG('clown', [], 32);
}
function renderStats() {
  const nl = nextLevelAt(), lv = level();
  const prog = nl ? (S.sales - LEVELS[lv]) / (nl - LEVELS[lv]) : 1;
  $('#stats').innerHTML = `<div class="money">${fmt(S.money)}</div><div class="lvl">Store level ${lv}${nl ? ` · ${S.sales}/${nl} sales` : ' · MAX'}</div><div class="bar" style="margin-top:5px"><i style="width:${Math.round(prog * 100)}%"></i></div>`;
}

/* ---------- STORE ---------- */
function viewStore() {
  const fs = storeFish(), cap = storeCap();
  let h = `<h2>Your Store</h2><div class="stats">${pill('Sales', S.sales)}${pill('Total earned', fmt(S.earned))}${pill('Best sale', fmt(S.bestValue || 0))}${pill('Customer every', '~' + Math.round(arrivalInterval()) + 's')}${S.storeUp.cashier ? `<span class="pill">Cashier ${btn(S.cashierOn ? 'ON' : 'OFF', 'cashier', {}, 'sm')} accepts ≥ ${Math.round(cashierThreshold() * 100)}%</span>` : ''}</div>`;
  h += `<h3>Display cases · ${fs.length}/${cap}</h3><div class="cases">`;
  for (const f of fs) {
    h += `<div class="case"><div class="pic" data-act="openFish" data-x="${f.id}">${fishSVG(f.sp, f.mods, 96)}</div>
      <div><b>${esc(fishName(f))}</b><div>${tierBadge(SPECIES[f.sp].t)}</div><div class="gold">${fmt(fishValue(f))}</div></div>
      ${btn('Take back', 'unstore', { x: f.id }, 'sm')}</div>`;
  }
  for (let i = fs.length; i < cap; i++) h += `<div class="case empty" data-act="storeAdd"><div style="font-size:28px">＋</div>Add a fish</div>`;
  h += `</div><h3>Customers</h3>`;
  if (!fs.length) h += `<div class="card flat dim">Your cases are empty — put fully grown fish on display and customers will show up.</div>`;
  else if (!S.customers.length) h += `<div class="card flat dim">Waiting for customers… (Advertising in the shop attracts more)</div>`;
  for (const c of S.customers) {
    const f = getFish(c.fishId); if (!f) continue;
    const v = fishValue(f), r = c.offer / v;
    const desc = { browser: 'Just browsing.', enthusiast: `Really wants a ${SPECIES[f.sp].n}!`, bargain: 'Hunting for a bargain…', collector: '🎩 Collector — loves modified fish.' }[c.type];
    h += `<div class="card cust"><div class="face">${c.face}</div><div style="width:84px">${fishSVG(f.sp, f.mods, 64)}</div>
      <div class="grow"><b>${c.name}</b> <span class="dim">wants</span> <b>${esc(fishName(f))}</b><div class="dim small">${desc}</div>
      <div class="bar pat" style="margin-top:6px;max-width:220px"><i data-pat="${c.id}" style="width:${Math.max(0, c.pat / c.patMax * 100)}%"></i></div></div>
      <div style="text-align:right"><div class="offer ${r >= 1 ? 'good' : r < 0.8 ? 'badc' : ''}">${fmt(c.offer)}</div><div class="small dim">${Math.round(r * 100)}% of ${fmt(v)}</div></div>
      <div class="row">${btn('Accept', 'accept', { x: c.id }, 'pri')}${btn('✕', 'decline', { x: c.id }, 'sm bad')}</div></div>`;
  }
  return h;
}

/* ---------- HALL ---------- */
function viewHall() {
  let h = `<h2>Aquarium Hall</h2><div class="stats">${pill('Tanks', S.tanks.length + '/' + S.hallSlots)}${pill('Fish', S.fish.length)}</div><div class="grid">`;
  for (const t of S.tanks) {
    const tt = tankType(t), fs = fishIn(t.id), grow = fs.filter(f => !isAdult(f)).length;
    h += `<div class="card click" data-act="openTank" data-x="${t.id}">${sceneHTML(t, true)}
      <div style="margin-top:10px"><b>${esc(t.name)}</b> <span class="dim small">${waterTag(tt.w)}</span></div>
      <div class="small dim">${fs.length}/${tt.cap} fish · ${grow} growing · ${fs.length - grow} adult · rating ${rating(t)}</div></div>`;
  }
  for (let i = S.tanks.length; i < S.hallSlots; i++) h += `<div class="card click flat" style="display:flex;align-items:center;justify-content:center;min-height:200px;border-style:dashed;color:var(--dim);text-align:center" data-act="goTanks"><div><div style="font-size:28px">＋</div>Empty slot<br><span class="small">Buy a tank in the Shop</span></div></div>`;
  const sc = hallSlotCost();
  h += `</div><div style="margin-top:18px">${sc != null ? btn(`Expand hall · +1 slot · ${fmt(sc)}`, 'buySlot', {}, 'pri', S.money < sc) : '<span class="dim">Hall is at maximum size.</span>'}</div>`;
  return h;
}

function viewTank() {
  const t = getTank(UI.tankId);
  if (!t) { UI.tankId = null; return viewHall(); }
  const tt = tankType(t), fs = fishIn(t.id), b = tankBonus(t), fed = t.fedUntil > S.time, growing = fs.filter(f => !isAdult(f)).length;
  let h = `<div class="row" style="margin-bottom:12px">${btn('← Hall', 'backHall', {}, 'sm')}<h2 style="margin:0">${esc(t.name)}</h2>${btn('Rename', 'rename', { x: t.id }, 'sm')}</div>
    <div class="stats">${pill('', waterTag(tt.w))}${pill('Fish', fs.length + '/' + tt.cap)}${pill('Water rating', rating(t) + ' (up to tier ' + rating(t) + ')')}${pill('Growth', mult(1 + b.growth))}${pill('Value', '+' + Math.round(b.value * 100) + '%')}${pill('Mutation', '+' + Math.round(b.mod * 100) + '%')}${pill('Tier-up', '+' + Math.round(b.tier * 100) + '%')}${pill('Inherit', '+' + Math.round(b.inherit * 100) + '%')}</div>`;
  h += sceneHTML(t, false);
  h += `<div class="row" style="margin-top:14px">${btn(`Feed · ${fmt(growing * FEED_COST_PER_FISH)} · ${FOOD[S.food].n} ×${foodMult()}`, 'feed', { x: t.id }, 'pri', !growing)}
    <span class="dim small" data-fed="${t.id}">${fed ? '🍽️ Well fed: ' + Math.ceil(t.fedUntil - S.time) + 's left' : 'Hungry — feeding speeds up growth'}</span><span class="grow"></span>
    ${btn('Hatch an egg', 'hatchHere', { x: t.id })}${btn('Tank upgrades', 'goUpgrades', { x: t.id })}</div>`;
  h += `<h3>Decorations</h3><div class="slots"><div class="slot ${t.bg ? 'full' : ''}" data-act="slotPick" data-x="${t.id}" data-y="bg">${t.bg ? ico(DECOR_BY_ID[t.bg].e, 36) : ico('🖼️', 36)}${t.bg ? DECOR_BY_ID[t.bg].n : 'Background'}</div>`;
  t.slots.forEach((id, i) => { const d = id && DECOR_BY_ID[id]; h += `<div class="slot ${d ? 'full' : ''}" data-act="slotPick" data-x="${t.id}" data-y="${i}">${d ? ico(d.e, 36) : '<span style="font-size:24px">＋</span>'}${d ? d.n : 'Empty'}</div>`; });
  h += `</div><div class="row" style="margin-top:10px"><span class="dim small">Skin</span><select data-change="skin" data-x="${t.id}">${SKINS.filter(s => S.skins[s.id]).map(s => `<option value="${s.id}" ${t.skin === s.id ? 'selected' : ''}>${s.n}</option>`).join('')}</select></div>`;
  h += `<h3>Fish</h3><div class="list">`;
  if (!fs.length) h += `<div class="dim" style="padding:14px">No fish yet.</div>`;
  for (const f of fs) h += fishRow(f);
  return h + '</div>';
}
function fishRow(f) {
  const sp = SPECIES[f.sp];
  return `<div class="fishrow" data-act="openFish" data-x="${f.id}"><div class="pic">${fishSVG(f.sp, f.mods, 64)}</div>
    <div class="grow"><b>${esc(fishName(f))}</b> ${tierBadge(sp.t)}<div>${modChips(f.mods)}</div>
    ${isAdult(f) ? '<span class="good small">Fully grown</span>' : `<div class="bar"><i data-gbar="${f.id}" style="width:${Math.round(f.g * 100)}%"></i></div>`}</div>
    <div class="gold">${fmt(previewValue(f))}</div></div>`;
}

/* ---------- mutagen picker ---------- */
function boostPicker() {
  const sel = UI.boost && S.items[UI.boost] > 0 ? UI.boost : null; UI.boost = sel;
  return `<div class="boost"><span class="dim small">Mutagen</span><button class="${!sel ? 'on' : ''}" data-act="setBoost" data-x="">None</button>${CONSUMABLES.map(c => `<button class="${sel === c.id ? 'on' : ''}" data-act="setBoost" data-x="${c.id}" ${S.items[c.id] ? '' : 'disabled'}>${ico(c.e, 16)}+${Math.round(c.boost * 100)}% ×${S.items[c.id]}</button>`).join('')}</div>`;
}

/* ---------- BREEDING ---------- */
function viewBreed() {
  const adults = S.fish.filter(isAdult);
  UI.sel = UI.sel.filter(id => getFish(id) && isAdult(getFish(id)));
  const a = getFish(UI.sel[0]), b = getFish(UI.sel[1]);
  const water = a ? SPECIES[a.sp].w : null;
  let h = `<h2>Breeding</h2><p class="lead">Pick two fully grown fish of the same water type. They produce eggs that may carry traits of either parent, a small chance of a higher-tier species, and inherited modifiers that stack — each modifier only once per fish.</p>`;
  const slot = (f, label) => `<div class="card parent ${f ? '' : 'flat'}" ${f ? '' : 'style="border-style:dashed"'}>${f ? `${fishSVG(f.sp, f.mods, 128)}<div><b>${esc(fishName(f))}</b> ${tierBadge(SPECIES[f.sp].t)}</div><div>${modChips(f.mods)}</div>${btn('Remove', 'breedSel', { x: f.id }, 'sm')}` : `<span class="dim">${label}<br>select a fish below</span>`}</div>`;
  h += `<div class="parents">${slot(a, 'Parent A')}<div class="heart" style="align-self:center">${ico('💞', 40)}</div>${slot(b, 'Parent B')}</div>`;
  if (a && b) {
    const why = breedCheck(a, b), o = breedOdds(a, b);
    h += `<div class="card"><div class="row"><b>Offspring odds</b><span class="dim small">${o.eggs} egg${o.eggs > 1 ? 's' : ''} per breeding</span></div><div class="stats" style="margin:8px 0">`;
    h += o.species.map(s => pill(SPECIES[s.sp].n, pct(s.p))).join('') + pill('Higher tier', pct(o.tierUp)) + `</div>`;
    const ml = Object.entries(o.mods).filter(([id, p]) => p >= 0.02).sort((x, y) => y[1] - x[1]);
    h += `<div class="dim small" style="margin-bottom:4px">Modifier chances</div><div>${ml.map(([id, p]) => `<span class="chip m${MODS[id].t}">${MODS[id].icon} ${MODS[id].n} ${pct(p)}</span>`).join('') || '<span class="dim small">none likely</span>'}</div>`;
    h += `<div class="row" style="margin-top:12px">${boostPicker()}<span class="grow"></span>${why ? `<span class="badc small">${why}</span>` : ''}${btn('Breed!', 'breedGo', {}, 'pri', !!why)}</div></div>`;
  }
  if (UI.lastBreed) {
    h += `<div class="card" style="margin-top:12px;border-color:var(--gold)"><b>Last breeding produced</b>${UI.lastBreed.map(m => `<div class="row" style="margin-top:6px">${eggArt({ ...EGG_TYPE[SPECIES[m.sp].w + SPECIES[m.sp].t + '_mix'], bred: true }, 28)} ${m.up ? '<b class="gold">⬆ Higher tier!</b>' : ''} <b>${SPECIES[m.sp].n}</b> ${tierBadge(SPECIES[m.sp].t)} ${modChips(m.mods)}</div>`).join('')}<div class="small dim" style="margin-top:6px">Eggs are in your inventory — hatch them in a tank with enough water rating.</div></div>`;
  }
  h += `<h3>Adult fish</h3>`;
  if (!adults.length) h += `<div class="card flat dim">No fully grown fish yet.</div>`;
  h += `<div class="grid sm pick">`;
  for (const f of adults) {
    const selected = UI.sel.includes(f.id), cd = f.ready - S.time;
    const incompatible = water && !selected && SPECIES[f.sp].w !== water;
    h += `<div class="card click ${selected ? 'sel' : ''} ${incompatible ? 'dis' : ''}" data-act="breedSel" data-x="${f.id}">${fishSVG(f.sp, f.mods, 80)}<b>${esc(fishName(f))}</b><div>${modChips(f.mods)}</div>
      <div class="small ${cd > 0 ? 'badc' : 'good'}" data-cd="${f.id}">${cd > 0 ? '💤 Rests ' + Math.ceil(cd) + 's' : 'Ready'}</div><div class="small dim">${f.loc === 'store' ? 'In store' : esc(getTank(f.loc).name)}</div></div>`;
  }
  return h + '</div>';
}

/* ---------- SHOP ---------- */
function item(icon, name, desc, price, label, act, data, opts) {
  opts = opts || {};
  return `<div class="item ${opts.locked ? 'locked' : ''}"><div class="ic">${icon}</div><div class="grow"><b>${name}</b> ${opts.badge || ''}<div class="small dim">${desc}</div></div>
    ${opts.locked ? `<span class="small dim">🔒 ${opts.locked}</span>` : opts.maxed ? '<span class="good small">✔ MAX</span>' : btn(`${label || 'Buy'} · ${fmt(price)}`, act, data, 'pri', S.money < price)}</div>`;
}
function avgValue(ids) { return ids.reduce((a, id) => a + SPECIES[id].value, 0) / ids.length; }
function viewShop() {
  const cats = [['eggs', '🥚', 'Eggs'], ['consumables', '🧪', 'Mutagens'], ['tanks', '🐟', 'Tanks'], ['upgrades', '⬆️', 'Tank Upgrades'], ['decor', '🌿', 'Decorations'], ['food', '🍤', 'Food'], ['skins', '🎨', 'Skins'], ['store', '🏪', 'Store Upgrades'], ['breeding', '💞', 'Breeding']];
  let h = `<h2>Shop</h2><div class="cats">${cats.map(([id, e, l]) => `<button class="${UI.shopCat === id ? 'on' : ''}" data-act="shopCat" data-x="${id}">${l}</button>`).join('')}</div>`;
  const lv = level();
  switch (UI.shopCat) {
    case 'eggs': {
      for (const water of ['fresh', 'salt']) {
        h += `<h3>${waterTag(water)} eggs</h3>`;
        if (water === 'salt' && !hasSaltTank()) h += `<div class="card flat dim">You need a saltwater tank before you can buy saltwater eggs (Tanks tab — unlocks at store level 3).</div>`;
        for (let tier = 1; tier <= 5; tier++) {
          const need = water === 'salt' ? SALT_EGG_UNLOCK_LEVEL[tier] : EGG_UNLOCK_LEVEL[tier];
          h += `<div class="tierhead">${tierBadge(tier)}<span class="dim small">needs water rating ${tier}${lv < need ? ' · 🔒 store level ' + need : ''}</span></div><div class="grid sm">`;
          for (const e of EGG_TYPES.filter(e => e.w === water && e.t === tier)) {
            const locked = lv < need || (water === 'salt' && !hasSaltTank());
            const price = eggPrice(e.id);
            h += `<div class="card egg ${locked ? 'locked' : ''}"><div class="top">${eggArt(e, 44)}<div class="grow"><b>${e.n}</b><div class="small dim">avg value ~${fmt(avgValue(e.pool))}</div></div></div>
              <div class="small dim">${e.pool.map(id => SPECIES[id].n).join(', ')}</div>${btn(`Buy · ${fmt(price)}`, 'buyEgg', { x: e.id }, 'pri', !locked && S.money < price)}</div>`.replace('data-act="buyEgg"', locked ? 'data-act="noop"' : 'data-act="buyEgg"');
          }
          h += `</div>`;
        }
      }
      break;
    }
    case 'consumables': {
      h += `<p class="lead">Mutagens give a flat chance of one extra random modifier when you hatch an egg or breed two fish. Pick one in the hatch dialog or on the Breeding page. You own: ${CONSUMABLES.map(c => `${S.items[c.id]}× ${c.n}`).join(', ')}.</p>`;
      for (const c of CONSUMABLES) h += item(ico(c.e, 36), c.n, `+${Math.round(c.boost * 100)}% chance of an extra mutation per use (once per hatch, or per egg of a breeding)`, c.price, 'Buy', 'buyConsumable', { x: c.id }, { badge: S.items[c.id] ? `<span class="pill">owned ${S.items[c.id]}</span>` : '' });
      break;
    }
    case 'tanks': {
      h += `<div class="stats">${pill('Hall slots', S.tanks.length + '/' + S.hallSlots)}${hallSlotCost() != null ? btn(`Buy slot · ${fmt(hallSlotCost())}`, 'buySlot', {}, 'sm pri', S.money < hallSlotCost()) : ''}<span class="dim small">You keep all your old tanks.</span></div>`;
      for (const tt of TANK_TYPES) h += item(ico(tt.w === 'salt' ? '🪸' : '🐠', 36), tt.n, `${waterTag(tt.w)} · holds ${tt.cap} fish · base water rating ${tt.base} (up to ${tt.base + 3} with upgrades)`, tt.price, 'Buy', 'buyTank', { x: tt.id }, { locked: lv < tt.lvl ? 'Store level ' + tt.lvl : null });
      break;
    }
    case 'upgrades': {
      if (!UI.upTank || !getTank(UI.upTank)) UI.upTank = S.tanks[0].id;
      const t = getTank(UI.upTank);
      h += `<div class="row" style="margin-bottom:12px"><span class="dim">Tank</span><select data-change="upTank">${S.tanks.map(x => `<option value="${x.id}" ${x.id === t.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><span class="dim small">Water rating ${rating(t)} · cost scales with tank size</span></div>`;
      for (const u of TANK_UPGRADES) { const c = tankUpgradeCost(t, u); h += item(ico(u.icon, 36), `${u.n} <span class="dim small">Lv ${t.up[u.id]}/${u.max}</span>`, u.desc, c, 'Upgrade', 'tup', { x: t.id, y: u.id }, { maxed: c == null }); }
      break;
    }
    case 'decor': {
      for (const [k, label] of [['plant', 'Plants'], ['rock', 'Rocks'], ['acc', 'Accessories'], ['bg', 'Backgrounds']]) {
        h += `<h3>${label}</h3>`;
        for (const d of DECOR.filter(d => d.k === k)) h += item(ico(d.e, 36), d.n + ` <span class="dim small">${d.w === 'both' ? '' : d.w === 'salt' ? '🧂 salt only' : '💧 fresh only'}</span>`, bonusText(d.b), d.price, 'Buy', 'buyDecor', { x: d.id }, { badge: S.decorInv[d.id] ? `<span class="pill">owned ${S.decorInv[d.id]}</span>` : '' });
      }
      break;
    }
    case 'food': {
      h += `<p class="lead">Feeding makes fish grow faster for ${FED_DURATION}s. Current: <b>${FOOD[S.food].n}</b> (×${foodMult()}).</p>`;
      FOOD.forEach((f, i) => { if (i === 0) return; h += item(ico('🍤', 36), f.n, `Feeding multiplies growth speed by ×${f.mult}`, f.price, 'Buy', 'buyFood', {}, { maxed: S.food >= i, locked: i > S.food + 1 ? 'Buy the previous food first' : null }); });
      break;
    }
    case 'skins': {
      for (const s of SKINS) h += item(ico('🎨', 36), s.n, bonusText(s.b) + " — apply from a tank's page", s.price, 'Buy', 'buySkin', { x: s.id }, { maxed: !!S.skins[s.id] });
      break;
    }
    case 'store': {
      for (const u of STORE_UPGRADES) { const l = S.storeUp[u.id]; h += item(ico(u.icon, 36), `${u.n} <span class="dim small">Lv ${l}/${u.max}</span>`, u.desc, l >= u.max ? null : u.cost(l), 'Upgrade', 'sup', { x: u.id }, { maxed: l >= u.max }); }
      break;
    }
    case 'breeding': {
      for (const u of BREED_UPGRADES) { const l = S.breedUp[u.id]; h += item(ico(u.icon, 36), `${u.n} <span class="dim small">Lv ${l}/${u.max}</span>`, u.desc, l >= u.max ? null : u.cost(l), 'Upgrade', 'bup', { x: u.id }, { maxed: l >= u.max }); }
      break;
    }
  }
  return h;
}

/* ---------- INVENTORY ---------- */
function viewInv() {
  let h = `<h2>Inventory</h2><h3>Eggs · ${S.eggs.length}</h3>`;
  if (!S.eggs.length) h += `<div class="card flat dim">No eggs. Buy some in the shop or breed your fish!</div>`;
  h += `<div class="grid sm">`;
  for (const e of S.eggs) h += `<div class="card row">${eggArt(e, 40)}<div class="grow"><b>${eggTitle(e)}</b><div>${tierBadge(e.tier)} <span class="small dim">${waterTag(e.water)}</span></div></div>${btn('Hatch', 'hatchPick', { x: e.id }, 'pri sm')}</div>`;
  h += `</div><h3>Mutagens</h3><div class="stats">${CONSUMABLES.map(c => `<span class="pill row" style="gap:6px">${ico(c.e, 20)} ${c.n} <b>×${S.items[c.id]}</b> <span class="small">(+${Math.round(c.boost * 100)}%)</span></span>`).join('')}</div>`;
  h += `<h3>Decorations</h3>`;
  const owned = DECOR.filter(d => S.decorInv[d.id] > 0);
  if (!owned.length) h += `<div class="card flat dim">No spare decorations. Buy some in the shop, then place them from a tank's page.</div>`;
  h += `<div class="grid sm">${owned.map(d => `<div class="card row">${ico(d.e, 36)}<div><b>${d.n}</b> ×${S.decorInv[d.id]}<div class="small dim">${bonusText(d.b)}</div></div></div>`).join('')}</div>`;
  h += `<h3>All fish · ${S.fish.length}</h3><div class="list">${S.fish.map(f => fishRow(f)).join('') || '<div class="dim" style="padding:14px">None</div>'}</div>`;
  return h;
}

/* ---------- MENU ---------- */
function viewMenu() {
  return `<h2>Menu</h2><div class="row">${btn('Save now', 'save', {}, 'pri')}${btn('How to play', 'help')}${btn('Export save', 'export')}${btn('Import save', 'import')}${btn('Reset game', 'reset', {}, 'bad')}</div>
  <p class="lead" style="margin-top:14px">The game auto-saves every 10 seconds and catches up on fish growth while you're away (up to 4 hours).</p>
  <div class="stats">${pill('Fish owned', S.fish.length)}${pill('Times bred', S.bredCount)}${pill('Total earned', fmt(S.earned))}${pill('Play time', Math.round(S.time / 60) + ' min')}</div>`;
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
      h += `<h2>${esc(fishName(f))}</h2><div style="display:flex;justify-content:center;padding:10px 0 16px">${fishSVG(f.sp, f.mods, 192)}</div>
        <div class="stats">${tierBadge(sp.t)}${pill('', waterTag(sp.w))}${pill('Base', fmt(sp.value))}${pill('Value', fmt(previewValue(f)))}</div>
        <p>Modifiers: ${f.mods.length ? modChips(f.mods) + `<span class="dim small"> total ×${mult(f.mods.reduce((a, x) => a * MODS[x].m, 1))}</span>` : '<span class="dim">none</span>'}</p>
        <p>${adult ? '<span class="good">Fully grown</span>' : `Growing: <span data-gtext="${f.id}">${Math.round(f.g * 100)}</span>%`} <span class="dim small"> · ${f.loc === 'store' ? 'Store display' : esc(getTank(f.loc).name)}</span></p>
        <div class="row" style="margin-top:14px">`;
      if (adult) {
        h += f.loc === 'store' ? btn('Back to a tank', 'fishPickTank', { x: f.id }) : btn('Put in store', 'toStore', { x: f.id }, 'pri') + btn('Move tank', 'fishPickTank', { x: f.id });
        h += btn('Breed', 'breedWith', { x: f.id }) + btn(`Sell to market · ${fmt(fishValue(f) * QUICK_SELL)}`, 'sellMarket', { x: f.id }, 'bad');
      } else h += btn('Move tank', 'fishPickTank', { x: f.id });
      h += `</div>`; break;
    }
    case 'pickTank': {
      const f = getFish(m.id), sp = SPECIES[f.sp];
      h += `<h2>Move ${esc(fishName(f))} to…</h2>` + S.tanks.map(t => {
        let why = null;
        if (t.id === f.loc) why = 'Already here'; else if (tankType(t).w !== sp.w) why = 'Wrong water'; else if (rating(t) < sp.t) why = 'Needs rating ' + sp.t; else if (tankFree(t) <= 0) why = 'Full';
        return tankRow(t, why, 'moveTo', { x: f.id, y: t.id }, 'Move');
      }).join(''); break;
    }
    case 'hatchTank': {
      const e = S.eggs.find(x => x.id === m.id);
      if (!e) { UI.modal = null; return ''; }
      h += `<h2>Hatch ${eggTitle(e)}</h2><div style="margin-bottom:12px">${boostPicker()}</div>` + S.tanks.map(t => tankRow(t, canHatchIn(e, t), 'hatch', { x: e.id, y: t.id }, 'Hatch')).join(''); break;
    }
    case 'hatchEgg': {
      const t = getTank(m.id);
      h += `<h2>Hatch an egg in ${esc(t.name)}</h2><div style="margin-bottom:12px">${boostPicker()}</div>`;
      const eggs = S.eggs.filter(e => !canHatchIn(e, t));
      h += eggs.length ? eggs.map(e => `<div class="item"><div class="ic">${eggArt(e, 36)}</div><div class="grow"><b>${eggTitle(e)}</b> ${tierBadge(e.tier)}</div>${btn('Hatch', 'hatch', { x: e.id, y: t.id }, 'pri sm')}</div>`).join('') : '<p class="dim">No suitable eggs (check water type, rating and free space).</p>'; break;
    }
    case 'storeAdd': {
      const list = S.fish.filter(f => isAdult(f) && f.loc !== 'store');
      h += `<h2>Put a fish on display</h2>` + (list.length ? list.map(f => `<div class="item"><div style="width:70px">${fishSVG(f.sp, f.mods, 64)}</div><div class="grow"><b>${esc(fishName(f))}</b><div>${modChips(f.mods)}</div></div><span class="gold">${fmt(fishValue(f))}</span>${btn('Display', 'toStore', { x: f.id }, 'pri sm')}</div>`).join('') : '<p class="dim">You have no fully grown fish outside the store yet. Feed your growing fish!</p>'); break;
    }
    case 'slot': {
      const t = getTank(m.id), isBg = m.slot === 'bg';
      const cur = isBg ? t.bg : t.slots[m.slot];
      h += `<h2>${isBg ? 'Background' : 'Decoration'} · ${esc(t.name)}</h2>`;
      if (cur) h += `<div class="item"><div class="ic">${ico(DECOR_BY_ID[cur].e, 32)}</div><div class="grow"><b>${DECOR_BY_ID[cur].n}</b> <span class="dim small">equipped</span></div>${btn('Remove', 'slotClear', { x: t.id, y: m.slot }, 'bad sm')}</div>`;
      const list = DECOR.filter(d => (d.k === 'bg') === isBg && S.decorInv[d.id] > 0 && decorFits(d, t));
      h += list.length ? list.map(d => `<div class="item"><div class="ic">${ico(d.e, 32)}</div><div class="grow"><b>${d.n}</b> ×${S.decorInv[d.id]}<div class="small dim">${bonusText(d.b)}</div></div>${btn('Place', 'slotSet', { x: t.id, y: m.slot, z: d.id }, 'pri sm')}</div>`).join('') : '<p class="dim">Nothing suitable in your inventory — visit Shop → Decorations.</p>'; break;
    }
    case 'help': {
      h += `<h2>How to play</h2>
      <p><b>1.</b> Open <b>Inventory</b> and hatch your two starter eggs. Baby fish must <b>grow</b> — press <b>Feed</b> in the tank to speed it up.</p>
      <p><b>2.</b> Put fully grown fish on display in your <b>Store</b>. Customers make offers — accept good ones, decline lowballs, or hire a cashier.</p>
      <p><b>3.</b> Spend profits in the <b>Shop</b>: higher-tier eggs, bigger tanks (saltwater later), filters, decorations, food and store upgrades.</p>
      <p><b>4.</b> Fish need a tank with enough <b>water rating</b> (tank size + filter + aerator) for their tier.</p>
      <p><b>5.</b> <b>Breed</b> two adults: offspring may be a higher tier and can inherit and stack modifiers (each only once). <b>Mutagens</b> add extra mutation chance.</p>
      <p><b>6.</b> Sales raise your store level, unlocking rarer eggs, big tanks and saltwater.</p><div class="row">${btn("Let's go!", 'closeModal', {}, 'pri')}</div>`; break;
    }
    case 'text': { h += `<h2>${esc(m.title)}</h2><textarea id="txt" style="width:100%;height:160px;background:#06111d;color:#cfe;border:2px solid var(--line);border-radius:4px;user-select:text" ${m.ro ? 'readonly' : ''}>${esc(m.text || '')}</textarea><div class="row" style="margin-top:8px">${m.ro ? '' : btn('Load', 'doImport', {}, 'pri')}${btn('Close', 'closeModal')}</div>`; break; }
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
  Swim.bind();
}

function toast(text, type) {
  const d = document.createElement('div'); d.className = 'toast ' + (type || ''); d.textContent = text;
  $('#toasts').appendChild(d); setTimeout(() => d.remove(), 4200);
}
function res(r) { if (r && r.ok === false) toast(r.err, 'bad'); G.dirty = true; return r; }
const activeBoost = () => (UI.boost && S.items[UI.boost] > 0 ? UI.boost : null);

/* ---------- actions ---------- */
const ACT = {
  noop: () => toast('Locked — reach a higher store level / get a saltwater tank', 'bad'),
  tab: d => { UI.tab = d.x; if (d.x !== 'hall') UI.tankId = null; },
  openTank: d => { UI.tankId = d.x; UI.tab = 'hall'; },
  backHall: () => { UI.tankId = null; },
  goTanks: () => { UI.shopCat = 'tanks'; UI.tab = 'shop'; },
  goUpgrades: d => { UI.upTank = d.x; UI.shopCat = 'upgrades'; UI.tab = 'shop'; },
  shopCat: d => { UI.shopCat = d.x; },
  buySlot: () => res(buyHallSlot()),
  buyEgg: d => { const r = res(buyEgg(d.x)); if (r.ok) toast('🥚 Egg added to your inventory'); },
  buyConsumable: d => { const r = res(buyConsumable(d.x)); if (r.ok) toast('🧪 ' + CONSUMABLE[d.x].n + ' added to your inventory', 'good'); },
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
  accept: d => { const r = res(acceptCustomer(d.x)); if (r.ok) toast('💰 Sold for ' + fmt(r.offer), 'gold'); },
  decline: d => res(declineCustomer(d.x)),
  cashier: () => { S.cashierOn = !S.cashierOn; },
  hatchPick: d => { UI.modal = { type: 'hatchTank', id: d.x }; },
  hatchHere: d => { UI.modal = { type: 'hatchEgg', id: d.x }; },
  hatch: d => {
    const r = res(hatchEgg(d.x, d.y, activeBoost()));
    if (r.ok) {
      const f = G.hatched;
      toast(`🐣 Hatched a ${fishName(f)}!` + (f.mods.length ? ' ✨' : ''), f.mods.length ? 'gold' : 'good');
      if (G.boosted) toast('🧪 The mutagen caused a mutation!', 'gold');
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
    if (r.ok) { UI.lastBreed = r.made; toast('🥚 Breeding successful!', 'good'); if (r.made.some(m => m.mods.length)) toast('✨ A modifier was passed on!', 'gold'); }
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
  const mo = $('.money'); if (mo) mo.textContent = fmt(S.money);
  document.querySelectorAll('[data-grow]').forEach(el => { const f = getFish(el.dataset.grow); if (f) el.style.transform = `scale(${(0.45 + 0.55 * Math.min(1, f.g)).toFixed(3)})`; });
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
  requestAnimationFrame(Swim.frame);
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
