'use strict';
/* ===== UI: collection, events, stats, contracts, heroes, staff, family tree ===== */

const evWater = w => (w.startsWith('ev_') ? EVENT[w.slice(3)] : null);
function waterTag2(w) { const ev = evWater(w); return ev ? `<span class="wt" style="--dot:${ev.color}">${ev.icon} ${ev.short} event</span>` : `<span class="wt ${w}">${w === 'salt' ? 'Saltwater' : 'Freshwater'}</span>`; }
const fishTitle = f => `<b>${esc(f.name)}</b>${f.fav ? ' <span class="gold" title="Favourite">★</span>' : ''} <span class="dim">${esc(fishName(f))}</span>`;
const genChip = f => (f.gen > 0 ? `<span class="chip m1" title="Generations of selective breeding">Gen ${f.gen}</span>` : '');
const wqBar = t => { const q = wqOf(t); return `<div class="wq"><div class="bar"><i data-wq="${t.id}" style="width:${Math.round(q)}%;background:${wqColor(q)}"></i></div></div>`; };
function mmss(sec) { sec = Math.max(0, Math.floor(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }

/* ---------- record fish ---------- */
function recordCard(big) {
  const r = S.record;
  if (!r) return `<div class="empty">Your most valuable fish will be displayed here once you hatch one.</div>`;
  return `<div class="card record"><div class="recpic">${fishSVG(r.sp, r.mods, big ? 240 : 150)}</div><div class="grow"><div class="lbl">★ Most valuable fish yet</div><div style="font-size:${big ? 22 : 18}px;margin:2px 0"><b>${esc(r.name)}</b> <span class="dim">${esc(r.label)}</span></div><div class="gold" style="font-size:${big ? 30 : 24}px;font-weight:700">${fmt(r.value)}</div><div style="margin-top:6px">${modChips(r.mods)}${r.gen ? `<span class="chip m1">Gen ${r.gen}</span>` : ''}</div></div></div>`;
}

/* ---------- special orders ---------- */
function contractsPanel() {
  let h = `<h3>Special orders · ${S.contracts.length}/3</h3>`;
  if (level() < 2) return h + `<div class="empty">Special orders unlock at store level 2.</div>`;
  if (!S.contracts.length) return h + `<div class="empty">No orders right now — customers will request something soon.</div>`;
  for (const c of S.contracts) {
    const n = S.fish.filter(f => contractMatches(c, f)).length;
    h += `<div class="card cust"><div class="eico">📜</div><div class="grow"><b>${contractSpec(c)}</b><div class="small dim">Expires in <span data-ctl="${c.id}">${mmss(c.left)}</span> · +${c.rep} reputation · ${n ? `<span class="good">${n} matching fish</span>` : 'no matching fish yet'}</div></div><div style="text-align:right"><div class="offer gold">${fmt(c.reward)}</div></div>${btn('Deliver', 'openContract', { x: c.id }, 'pri', !n)}</div>`;
  }
  return h;
}

/* ---------- management (staff & unlocks) ---------- */
function viewMgmt() {
  let h = `<h3>Upgrades</h3>`;
  for (const u of UNLOCKS) h += item(ico(u.icon, 28), u.n, u.d, u.price, 'Buy', 'buyUnlock', { x: u.id }, { maxed: S.unlocks[u.id] });
  h += `<h3>Staff</h3><p class="lead">Staff work automatically while you play and while the page is open. They draw a wage every minute — total now <b class="gold">${fmt(staffWage())}/min</b>. If you can't pay them they stop working.</p>`;
  for (const s of STAFF) {
    const l = S.staff[s.id];
    h += item(ico(s.icon, 28), `${s.n} <span class="dim small">Lv ${l}/3</span>`, `${s.d}<br>${l ? `Works every ${s.every[l - 1]}s · wage ${fmt(s.wage[l - 1])}/min` : `Hire: first shift every ${s.every[0]}s · wage ${fmt(s.wage[0])}/min`}`, l >= 3 ? null : s.hire[l], l ? 'Upgrade' : 'Hire', 'hire', { x: s.id }, { maxed: l >= 3 });
  }
  return h;
}

/* ---------- heroes ---------- */
function viewHeroes() {
  let h = `<p class="lead">Hero fish can't be sold and don't count toward a tank's capacity. Assign one to a tank and it roams there, granting a permanent bonus to every fish in that tank. One hero per tank.</p><div class="grid">`;
  for (const H of HEROES) {
    const own = S.heroes.find(x => x.kind === H.id), at = own && own.tank ? getTank(own.tank) : null;
    h += `<div class="card hero"><div class="heropic">${heroThumb(H.id, 230)}</div><div><b style="font-size:16px">${H.n}</b></div><div class="small dim" style="min-height:40px;margin:4px 0 8px">${H.d}</div>`;
    if (!own) h += btn(`Buy · ${fmt(H.price)}`, 'buyHero', { x: H.id }, 'pri', S.money < H.price);
    else h += `<div class="row"><select data-change="assignHero" data-x="${own.id}"><option value="">Not assigned</option>${S.tanks.map(t => `<option value="${t.id}" ${own.tank === t.id ? 'selected' : ''}>${esc(t.name)}${S.heroes.some(o => o !== own && o.tank === t.id) ? ' (swap)' : ''}</option>`).join('')}</select></div>${at ? `<div class="small good" style="margin-top:6px">Roaming in ${esc(at.name)}</div>` : ''}`;
    h += `</div>`;
  }
  return h + `</div>`;
}
function heroPanel(t) {
  const hh = heroIn(t.id), owned = S.heroes;
  return `<h3>Hero fish</h3><div class="row">${hh ? `<div class="heropic" style="width:110px">${heroThumb(hh.kind, 110)}</div><div class="grow"><b>${HERO[hh.kind].n}</b><div class="small dim">${HERO[hh.kind].d}</div></div>` : `<span class="dim">${owned.length ? 'No hero in this tank.' : 'No hero fish yet — buy one in Shop → Hero Fish.'}</span>`}${owned.length ? `<select data-change="assignHeroHere" data-x="${t.id}"><option value="">${hh ? 'Remove hero' : 'Choose a hero…'}</option>${owned.map(o => `<option value="${o.id}" ${hh && hh.id === o.id ? 'selected' : ''}>${HERO[o.kind].n}${o.tank && o.tank !== t.id ? ' (in ' + esc(getTank(o.tank).name) + ')' : ''}</option>`).join('')}</select>` : ''}</div>`;
}
function heroModal(id) {
  const o = S.heroes.find(x => x.id === id); if (!o) { UI.modal = null; return ''; }
  const H = HERO[o.kind], t = o.tank ? getTank(o.tank) : null;
  return `<h2>${H.n}</h2><div style="display:flex;justify-content:center">${heroThumb(o.kind, 360)}</div><p>${H.d}</p><div class="stats">${Object.entries(H.b).map(([k, v]) => pill({ growth: 'Growth', value: 'Value', mod: 'Mutation', tier: 'Tier-up', inherit: 'Inheritance', wq: 'Water decay −', auto: 'Auto-feed' }[k], k === 'auto' ? 'always' : '+' + Math.round(v * 100) + '%')).join('')}</div><p class="dim small">Heroes can't be sold. ${t ? 'Currently in ' + esc(t.name) + '.' : ''}</p><div class="row">${btn('Remove from tank', 'unassignHero', { x: o.id }, '', !t)}</div>`;
}

/* ---------- family tree ---------- */
function treeNode(n, depth) {
  if (!n) return `<div class="tnode unknown"><div class="tcard dim small">Unknown</div></div>`;
  const kids = n.parents.filter(Boolean).length || n.parents.length ? `<div class="tparents">${n.parents.map(p => treeNode(p, depth + 1)).join('')}</div>` : '';
  const sp = SPECIES[n.sp];
  return `<div class="tnode"><div class="tcard ${n.alive ? '' : 'gone'}"><div class="tpic">${fishSVG(n.sp, n.m, 84)}</div><div><b>${esc(n.n)}</b></div><div class="small dim">${esc(n.m.map(m => MODS[m].n).join(' ') + (n.m.length ? ' ' : '') + sp.n)}</div><div class="small">${n.g ? 'Gen ' + n.g : 'Founder'}${n.alive ? '' : ' · gone'}</div></div>${kids}</div>`;
}
function treeModal(id) {
  const t = lineageTree(id, 3); if (!t) { UI.modal = null; return ''; }
  const f = getFish(id);
  return `<h2>Family tree · ${esc(t.n)}</h2><p class="dim small">Parents extend to the right. Fish you've sold are marked "gone" but still keep their place in the lineage.</p><div class="tree">${treeNode(t, 0)}</div>${f ? '' : ''}`;
}

/* ---------- collection book ---------- */
function viewCollection() {
  const tab = UI.bookTab || 'species', n = bookCount(), tot = bookTotal();
  let h = pageHead('Collection', `Discover every species and modifier. You've found <b>${n}</b> of <b>${tot}</b> regular species.`) +
    `<div class="two" style="grid-template-columns:1.1fr 1fr;gap:16px">${recordCard(true)}<div class="card"><b>Discovery rewards</b><div style="margin-top:10px">${BOOK_MILESTONES.map(m => `<div class="row" style="padding:5px 0"><span class="grow">Discover ${m.n} species</span><span class="gold">${fmt(m.reward)}</span>${S.book.claimed[m.n] ? '<span class="good small">Claimed</span>' : btn('Claim', 'claimBook', { x: m.n }, 'pri sm', n < m.n)}</div><div class="bar" style="height:4px"><i style="width:${Math.min(100, n / m.n * 100)}%"></i></div>`).join('')}</div></div></div>` +
    `<div class="seg" style="margin-top:22px">${[['species', 'Species'], ['mods', 'Modifiers']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="bookTab" data-x="${k}">${l}</button>`).join('')}</div>`;
  if (tab === 'species') {
    for (const water of ['fresh', 'salt']) {
      h += `<h3>${water === 'fresh' ? 'Freshwater' : 'Saltwater'}</h3>`;
      for (let t = 1; t <= 5; t++) {
        const list = speciesOf(water, t); h += `<div class="tierhead">${tierBadge(t)}<span class="dim small">${list.filter(s => S.book.sp[s.id]).length}/${list.length}</span></div><div class="bookgrid">`;
        for (const s of list) { const d = S.book.sp[s.id]; h += d ? `<div class="card booktile">${fishSVG(s.id, [], 110)}<b>${s.n}</b><div class="small dim">Hatched ×${d.n}${d.best ? ' · best ' + fmt(d.best) : ''}</div></div>` : `<div class="card booktile unk"><div class="q">?</div><b>???</b><div class="small dim">${TIER_NAMES[t]} · ${s.f}</div></div>`; }
        h += `</div>`;
      }
    }
    const evs = EVENTS.filter(e => SPECIES_LIST.some(s => s.ev === e.id && S.book.sp[s.id]));
    if (evs.length) { h += `<h3>Event species</h3>`; for (const e of evs) { h += `<div class="tierhead"><span class="dim">${e.icon} ${e.n}</span></div><div class="bookgrid">`; for (const s of SPECIES_LIST.filter(x => x.ev === e.id)) { const d = S.book.sp[s.id]; h += d ? `<div class="card booktile">${fishSVG(s.id, [], 110)}<b>${s.n}</b><div class="small dim">Hatched ×${d.n}</div></div>` : `<div class="card booktile unk"><div class="q">?</div><b>???</b></div>`; } h += `</div>`; } }
  } else {
    for (const t of [1, 2, 3, 4]) {
      const list = MODS_LIST.filter(m => !m.ev && m.t === t); h += `<div class="tierhead"><span class="chip m${t}">${MOD_TIER_NAMES[t]}</span><span class="dim small">${list.filter(m => S.book.mods[m.id]).length}/${list.length}</span></div><div class="modgrid">`;
      for (const m of list) { const c = S.book.mods[m.id]; h += c ? `<div class="card"><span class="chip m${m.t}">${m.icon} ${m.n}</span><div class="small dim" style="margin-top:6px">${m.d}</div><div class="small gold">×${m.m} value · seen ${c}×</div></div>` : `<div class="card unk"><b class="dim">???</b><div class="small dim">Undiscovered ${MOD_TIER_NAMES[t]} modifier</div></div>`; }
      h += `</div>`;
    }
    const evm = MODS_LIST.filter(m => m.ev && S.book.mods[m.id]);
    if (evm.length) { h += `<h3>Event modifiers</h3><div class="modgrid">${evm.map(m => `<div class="card"><span class="chip m${m.t}">${m.icon} ${m.n}</span><div class="small dim" style="margin-top:6px">${m.d}</div><div class="small gold">×${m.m} · ${EVENT[m.ev].short}</div></div>`).join('')}</div>`; }
  }
  return h;
}

/* ---------- events ---------- */
function evCountdown(ev) { const st = eventStatus(ev); if (S.settings.event === 'all' || S.settings.event === ev.id) return `<span class="good">Preview mode — active</span>`; return st.active ? `<span class="good">Active · ${st.daysLeft} day${st.daysLeft === 1 ? '' : 's'} left</span>` : `<span class="dim">Returns in ${st.daysTo} days (${st.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})</span>`; }
function viewEvents() {
  const act = activeEvents();
  let h = pageHead('Seasonal Events', 'Limited-time fish, modifiers and a dedicated tank for each holiday. Sell event fish to earn tokens, then spend them on exclusive cosmetics.');
  const order = EVENTS.slice().sort((a, b) => (eventActive(b.id) ? 1 : 0) - (eventActive(a.id) ? 1 : 0));
  for (const ev of order) {
    const on = eventActive(ev.id), tk = eventTank(ev.id), tokens = S.tokens[ev.id] || 0, sh = EVENT_SHOP[ev.id], w = 'ev_' + ev.id;
    h += `<div class="card evcard" style="--ev:${ev.color}"><div class="evhead"><div class="evicon">${ev.icon}</div><div class="grow"><b style="font-size:18px">${ev.n}</b><div class="small">${evCountdown(ev)}</div></div><div class="tokens"><div class="lbl">${ev.short} tokens</div><div class="gold" style="font-size:20px;font-weight:700">${tokens}</div></div></div>`;
    if (on || tokens > 0 || tk) {
      h += `<div class="row" style="margin:12px 0">${tk ? btn('Open event tank', 'openTank', { x: tk.id }, 'pri') : btn('Claim event tank', 'evClaim', { x: ev.id }, 'pri', !on)}<span class="dim small">${tk ? esc(tk.name) + ' — free of charge and doesn\'t use a hall slot.' : 'A dedicated tank for event fish.'}</span></div>`;
      h += `<div class="dim small" style="margin-bottom:6px">Event eggs ${on ? '' : '— only sold while the event is running'}</div><div class="grid sm">`;
      for (let t = 1; t <= 3; t++) {
        const e = EGG_TYPE[w + t + '_mix'], price = eggPrice(e.id) * UI.qty, can = on && !!tk;
        h += `<div class="card egg flat ${can ? '' : 'locked'}"><div class="top">${eggArt(e, 52)}<div class="grow"><b>${e.n}</b> ${tierBadge(t)}<div class="small dim">${e.pool.map(id => SPECIES[id].n).join(', ')}</div></div></div>${btn(`Buy${UI.qty > 1 ? ' ×' + UI.qty : ''} · ${fmt(price)}`, can ? 'buyEgg' : 'noop', { x: e.id }, 'pri', can && S.money < price)}</div>`;
      }
      h += `</div><div class="dim small" style="margin:14px 0 6px">Event modifiers: ${MODS_LIST.filter(m => m.ev === ev.id).map(m => `<span class="chip m${m.t}" title="${esc(m.d)}">${m.icon} ${m.n}</span>`).join('')}</div>`;
      h += `<div class="dim small" style="margin:10px 0 6px">Token shop</div><div class="grid sm">`;
      const skin = SKIN['sk_' + ev.id];
      h += `<div class="card flat evitem"><div class="swatch" style="background:linear-gradient(135deg,${skin.frame},${skin.gravel})"></div><b>${skin.n}</b><div class="small dim">Tank skin · ${bonusText(skin.b)}</div>${S.skins[skin.id] ? '<span class="good small">Owned</span>' : btn(`${skin.tokens} tokens`, 'evBuy', { x: ev.id, y: 'skin' }, 'sm pri', tokens < skin.tokens)}</div>`;
      for (const [kind, did] of [['bg', 'bg_' + ev.id], ['decor', 'dc_' + ev.id]]) { const d = DECOR_BY_ID[did]; h += `<div class="card flat evitem"><div class="swatchimg">${decorPic(d, 74)}</div><b>${d.n}</b><div class="small dim">${kind === 'bg' ? 'Background' : 'Decoration'} · ${bonusText(d.b)}${S.decorInv[did] ? ' · owned ' + S.decorInv[did] : ''}</div>${btn(`${d.tokens} tokens`, 'evBuy', { x: ev.id, y: kind }, 'sm pri', tokens < d.tokens)}</div>`; }
      h += `</div>`;
    } else h += `<div class="dim small" style="margin-top:8px">Come back when the event starts to claim its exclusive tank, eggs and fish.</div>`;
    h += `</div>`;
  }
  return h;
}

/* ---------- stats & achievements ---------- */
function viewStats() {
  const done = ACHIEVEMENTS.filter(a => S.ach[a.id]).length;
  const st = [['Total earned', fmt(S.earned)], ['Sales to customers', S.sales], ['Best single sale', fmt(S.bestValue || 0)], ['Eggs hatched', S.stats.hatched], ['Times bred', S.bredCount], ['Fish sold at market', S.stats.marketSold], ['Special orders done', S.stats.contracts], ['Fish owned', S.fish.length], ['Highest generation', maxGen()], ['Species discovered', bookCount() + ' / ' + bookTotal()], ['Event tokens earned', S.stats.tokens], ['Tanks cleaned', S.stats.cleaned], ['Staff wages / min', fmt(staffWage())], ['Play time', Math.round(S.time / 60) + ' min']];
  let h = pageHead('Stats & Achievements', `${done} of ${ACHIEVEMENTS.length} achievements unlocked.`) + `<div class="statgrid">${st.map(([k, v]) => `<div class="card flat"><div class="lbl">${k}</div><div style="font-size:20px;font-weight:650">${v}</div></div>`).join('')}</div><h3>Achievements</h3><div class="grid sm">`;
  for (const a of ACHIEVEMENTS) { const d = S.ach[a.id], v = Math.min(a.goal, a.val()); h += `<div class="card ach ${d ? 'done' : ''}"><div class="row"><b class="grow">${d ? '✓ ' : ''}${a.n}</b><span class="gold small">${fmt(a.reward)}</span></div><div class="small dim">${a.d}</div><div class="bar" style="margin-top:8px"><i style="width:${v / a.goal * 100}%"></i></div><div class="small dim" style="margin-top:3px">${d ? 'Completed' : fmt2(v) + ' / ' + fmt2(a.goal)}</div></div>`; }
  return h + `</div>`;
}
const fmt2 = n => (n >= 1e4 ? fmt(n).replace('$', '') : Math.floor(n).toLocaleString('en-US'));

/* ---------- contract delivery modal ---------- */
function contractModal(cid) {
  const c = S.contracts.find(x => x.id === cid); if (!c) { UI.modal = null; return ''; }
  const list = S.fish.filter(f => contractMatches(c, f)).sort((a, b) => (a.fav ? 1 : 0) - (b.fav ? 1 : 0) || fishValue(a) - fishValue(b));
  return `<h2>Deliver: ${contractSpec(c)}</h2><p class="dim">Reward <b class="gold">${fmt(c.reward)}</b> + ${c.rep} reputation. Pick a fish to hand over:</p>` + (list.length ? list.map(f => `<div class="item"><div style="width:84px">${fishSVG(f.sp, f.mods, 80)}</div><div class="grow">${fishTitle(f)}<div>${modChips(f.mods)}</div></div><span class="gold">${fmt(fishValue(f))}</span>${btn('Deliver', 'deliver', { x: c.id, y: f.id }, 'pri sm')}</div>`).join('') : '<p class="dim">You have no matching fish.</p>');
}
