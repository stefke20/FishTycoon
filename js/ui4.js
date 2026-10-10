'use strict';
/* ===== UI for tags, auto-rules, new-feature cards, checklist, away card, clock and the breeding planner ===== */

/* ---------- tags ---------- */
const tagDot = f => (f.tag && TAG[f.tag] ? ` <i class="tagdot" style="background:${TAG[f.tag].c}" title="${TAG[f.tag].n}"></i>` : '');
const tagChip = f => (f.tag && TAG[f.tag] ? `<span class="tagchip" style="--tc:${TAG[f.tag].c}">${TAG[f.tag].n}</span>` : '');
const tagBar = f => `<div class="row" style="margin-top:8px;gap:6px"><span class="dim small">Tag</span>${TAGS.map(t => `<button class="tagbtn ${f.tag === t.id ? 'on' : ''}" style="--tc:${t.c}" data-act="tagFish" data-x="${f.id}" data-y="${t.id}" title="${t.n}${t.prot ? ' — protected from auto-rules and Sell all' : ''}">${t.n}</button>`).join('')}</div>`;
const tagFilter = () => `<span class="dim small">Tag</span><select data-change="filterTag" title="Show only fish with a tag"><option value="all">Any tag</option><option value="none" ${UI.filterTag === 'none' ? 'selected' : ''}>Untagged</option>${TAGS.map(t => `<option value="${t.id}" ${UI.filterTag === t.id ? 'selected' : ''}>● ${t.n}</option>`).join('')}</select>`;
function tagBulkRow(shown) {
  const ids = shown.filter(isAdult).map(f => f.id);
  return `<div class="row" style="margin-bottom:12px;gap:8px"><span class="dim small">Tag all ${ids.length} shown adults</span>${TAGS.map(t => `<button class="tagbtn" style="--tc:${t.c}" data-act="tagShown" data-x="${t.id}" ${ids.length ? '' : 'disabled'}>${t.n}</button>`).join('')}<button class="tagbtn" data-act="tagShown" data-x="" ${ids.length ? '' : 'disabled'}>Clear tags</button></div>`;
}

/* ---------- auto-rules (Inventory) ---------- */
const selNum = (id, key, val, opts) => `<select data-change="rule" data-x="${id}" data-y="${key}">${opts.map(([v, l]) => `<option value="${v}" ${+val === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
function ruleEditor(r) {
  const mods = selNum(r.id, 'maxMods', r.maxMods, [[0, 'no modifiers'], [1, 'at most 1 modifier'], [2, 'at most 2 modifiers'], [3, 'at most 3 modifiers'], [9, 'any number of modifiers']]);
  const tier = selNum(r.id, 'tierBelow', r.tierBelow, [[2, 'below tier 2'], [3, 'below tier 3'], [4, 'below tier 4'], [5, 'below tier 5'], [6, 'any tier']]);
  let body;
  if (r.type === 'junk') body = `Sell adults with ${mods} that are ${tier}`;
  else if (r.type === 'dupes') body = `Keep the best ${selNum(r.id, 'keep', r.keep, [1, 2, 3, 4, 5, 6].map(n => [n, String(n)]))} of each species and sell the rest — only fish with ${mods} that are ${tier}`;
  else body = `Sell every adult tagged <span class="tagchip" style="--tc:${TAG.sell.c}">${TAG.sell.n}</span>`;
  return `<div class="item rule ${r.on ? '' : 'off'}"><button class="boost-chip ${r.on ? 'on' : ''}" data-act="ruleToggle" data-x="${r.id}">${r.on ? 'On' : 'Off'}</button><div class="grow rulebody">${body}</div>${btn('✕', 'ruleDel', { x: r.id }, 'sm bad')}</div>`;
}
function rulesPanel() {
  if (!S.unlocks.autoRules) return `<div class="card" style="margin-bottom:14px"><div class="row"><b>🗂️ Auto-rules</b><span class="grow"></span>${btn('🔒 Unlock', 'goMgmt', {}, 'sm ghost')}</div><div class="dim small" style="margin-top:6px">Buy the Auto-Sorter in Shop → Management to sell plain fish and keep only the best of each species — automatically.</div></div>`;
  const R = S.rules, n = ruleTargets().length;
  let h = `<div class="card" style="margin-bottom:14px"><div class="row"><b>🗂️ Auto-rules</b><span class="dim small">${R.sold ? `${R.sold} fish sold so far for ${fmt(R.money)}` : 'Nothing sold yet'}</span><span class="grow"></span><button class="boost-chip ${R.on ? 'on' : ''}" data-act="rulesMaster">Automatic selling: ${R.on ? 'On' : 'Off'}</button></div>`;
  h += `<div class="dim small" style="margin:6px 0 10px">Rules only sell fully grown fish that are in a tank. Favourites, protected tags (Breeding stock, Boss candidate, Show fish, Keeper), fish on display, show entrants, and fish that fit an open order or the current campaign boss are <b>never</b> touched.</div>`;
  h += R.list.length ? R.list.map(ruleEditor).join('') : `<div class="empty" style="padding:12px">No rules yet — add one below.</div>`;
  h += `<div class="row" style="margin-top:10px">${Object.entries(RULE_TYPES).map(([k, t]) => btn('＋ ' + t.n, 'ruleAdd', { x: k }, 'sm', R.list.length >= 8)).join('')}<span class="grow"></span>${btn(`Preview · ${n} fish`, 'rulesPreview', {}, 'sm', !R.list.some(r => r.on))}${btn('Run now', 'rulesRun', {}, 'sm pri', !n)}</div></div>`;
  return h;
}
function rulesPreviewModal() {
  const list = ruleTargets(), val = marketTotal(list.map(x => x.f));
  let h = `<h2>Auto-rules preview</h2><p class="dim">These fish would be sold right now for about <b class="gold">${fmt(val)}</b>:</p>`;
  h += list.length ? list.slice(0, 40).map(({ f, rule }) => `<div class="item"><div style="width:64px">${fishPic(f, 60)}</div><div class="grow">${fishTitle(f)}<div class="small dim">${esc(ruleText(rule))}</div></div><span class="gold">${fmt(marketPrice(f))}</span>${btn('Keep', 'ruleKeep', { x: f.id }, 'sm ghost')}</div>`).join('') + (list.length > 40 ? `<div class="dim small">…and ${list.length - 40} more</div>` : '') : '<p class="dim">Nothing matches your rules.</p>';
  return h + `<div class="row" style="margin-top:12px">${btn(`Sell these ${list.length}`, 'rulesRun', {}, 'pri', !list.length)}${btn('Close', 'closeModal', {}, 'ghost')}</div><div class="dim small" style="margin-top:6px">“Keep” tags the fish as a Keeper so no rule will sell it.</div>`;
}

/* ---------- new-feature cards & tab hints ---------- */
const NEW_INFO = {
  home: ['🏠', 'Home', 'Your estate: a living room with a big aquarium, and later a garden pond and an aquarium gallery. Upgrade each for a permanent perk.'],
  shows: ['🏆', 'Fish Shows', 'Enter your best fish in shows and tournaments for prize money, medals (permanent value) and fame.'],
  exp: ['⛵', 'Expeditions', 'Send boats to far-away waters and bring home wild eggs of exclusive species with wild modifiers.'],
  research: ['🔬', 'Research', 'Spend research points on permanent upgrades across six branches of the tree.'],
  camp: ['🚩', 'Ocean Campaign', 'Every island is ruled by a boss fish. Breed the exact fish it demands to sail on to the next island.'],
};
const visibleTabs = () => TABS.filter(([id]) => tabOpen(id));
function nextUnlockHint() {
  const nxt = Object.entries(TAB_REQ).filter(([id, l]) => level() < l).sort((a, b) => a[1] - b[1])[0];
  if (!nxt) return '';
  const names = Object.entries(TAB_REQ).filter(([id, l]) => l === nxt[1]).map(([id]) => NEW_INFO[id][1]);
  return `<div class="nexthint">🔒 Level ${nxt[1]}: ${names.join(', ')}</div>`;
}
function newFeatureModal(m) {
  let h = `<h2>✨ New: ${m.ids.length > 1 ? 'features unlocked' : NEW_INFO[m.ids[0]][1]}</h2><p class="dim">Your store reached <b>level ${level()}</b>.</p>`;
  h += m.ids.map(id => { const [ic, n, d] = NEW_INFO[id]; return `<div class="card newcard"><div class="newic">${ic}</div><div class="grow"><b>${n}</b><div class="small dim">${d}</div></div>${btn('Take a look', 'goNew', { x: id }, 'pri sm')}</div>`; }).join('');
  return h + `<div class="row" style="margin-top:12px">${btn('Later', 'closeModal', {}, 'ghost')}</div><div class="dim small" style="margin-top:6px">Look for the <span class="badge new" style="position:static">NEW</span> badge in the menu.</div>`;
}

/* ---------- first-hour checklist (Store) ---------- */
function guideCard() {
  if (S.g4.guideHide) return '';
  const done = GUIDE.filter(guideClaimed).length;
  let h = `<div class="card guide"><div class="row"><b>🧭 Your first hour</b><span class="dim small">${done} of ${GUIDE.length} done</span><span class="grow"></span>${btn('Hide', 'guideHide', {}, 'sm ghost')}</div><div class="bar" style="margin:8px 0 10px"><i style="width:${done / GUIDE.length * 100}%"></i></div><div class="guidegrid">`;
  for (const g of GUIDE) {
    const d = guideDone(g), c = guideClaimed(g), v = Math.min(g.goal, g.val());
    h += `<div class="gitem ${c ? 'claimed' : d ? 'ready' : ''}"><span class="gck">${c ? '✔' : d ? '★' : '○'}</span><div class="grow"><b>${g.t}</b><div class="small dim">${c ? 'Reward claimed' : esc(g.d)}</div><div class="small gold">${rewardText(g.reward)}</div></div>${c ? '' : d ? btn('Claim', 'guideClaim', { x: g.id }, 'sm pri') : btn('Show me', 'goTab', { x: g.go }, 'sm ghost')}</div>`;
  }
  h += `</div>`;
  if (guideAllClaimed()) h += `<div class="row" style="margin-top:10px"><b class="gold">All done!</b> <span class="small dim">Completion bonus: ${rewardText(GUIDE_BONUS)}</span><span class="grow"></span>${btn('Claim bonus', 'guideBonus', {}, 'pri sm')}</div>`;
  else h += `<div class="small dim" style="margin-top:8px">Finish all six for a bonus of ${rewardText(GUIDE_BONUS)}.</div>`;
  return h + `</div>`;
}

/* ---------- while you were away ---------- */
function awayModal() {
  const a = G.awayRep; if (!a) { UI.modal = null; return ''; }
  let h = `<h2>🌅 Welcome back!</h2><p class="dim">You were away for <b>${fmtDur(a.gap)}</b>${a.capped ? ` — your fish grow for at most ${fmtDur(maxOffline())} while you are gone` : ''}. The store was closed, so there were no sales.</p>`;
  if (a.grown.length) {
    h += `<div class="awayrow"><b>🐟 ${a.grown.length} fish grew up</b></div>` + a.grown.slice(0, 5).map(g => `<div class="item"><div style="width:60px">${fishSVG(g.sp, g.mlist, 56)}</div><div class="grow"><b>${esc(g.name)}</b> <span class="dim">${esc(g.label)}</span></div><span class="gold">${fmt(g.value)}</span></div>`).join('') + (a.grown.length > 5 ? `<div class="dim small" style="margin:2px 0 6px">…and ${a.grown.length - 5} more</div>` : '');
  } else h += `<div class="awayrow"><b>🐟 No fish finished growing</b>${a.growing ? '' : ' <span class="dim small">— nothing is growing right now. Hatch some eggs!</span>'}</div>`;
  if (a.growing) h += `<div class="small dim" style="margin:2px 0 6px">${a.growing} still growing — the next one is ready in about ${fmtDur(a.eta)}.</div>`;
  const todo = [];
  if (a.boats) todo.push(['⛵', `${a.boats} expedition boat${a.boats > 1 ? 's' : ''} back from sea`, 'exp', 'Collect']);
  else if (a.sailing) todo.push(['⛵', `${a.sailing} boat${a.sailing > 1 ? 's' : ''} still sailing — back in ${fmtDur(a.sailEta)}`, 'exp', 'View']);
  if (a.login || a.quests) todo.push(['📅', a.login ? 'Your daily login reward is waiting' : `${a.quests} daily reward${a.quests > 1 ? 's' : ''} to claim`, 'daily', 'Claim']);
  if (a.eggs) todo.push(['🥚', `${a.eggs} egg${a.eggs > 1 ? 's' : ''} waiting to hatch`, 'inv', 'Open']);
  if (a.dirty) todo.push(['🫧', `${a.dirty} tank${a.dirty > 1 ? 's' : ''} need a clean`, 'hall', 'Open']);
  if (a.guide) todo.push(['🧭', `${a.guide} checklist reward${a.guide > 1 ? 's' : ''} to claim`, 'store', 'Open']);
  h += todo.map(([ic, t, tab, l]) => `<div class="item"><div class="newic" style="font-size:22px">${ic}</div><div class="grow">${t}</div>${btn(l, 'awayGo', { x: tab }, 'sm pri')}</div>`).join('');
  return h + `<div class="row" style="margin-top:14px">${btn('Let\'s go', 'closeModal', {}, 'pri')}</div>`;
}

/* ---------- clock ---------- */
const clockPillHTML = () => { const p = clockPhase(), t = trafficMult(), w = wxNow(); return `${p.icon} <b>${clockText()}</b> ${p.n} · ${w.icon} ${w.n}${S.town.cur ? ' · ' + TOWN_EVENT[S.town.cur.id].icon : ''}${t >= 1.15 ? ` <span class="good small">customers ×${t.toFixed(1)}</span>` : t <= 0.7 ? ` <span class="dim small">customers ×${t.toFixed(1)}</span>` : ''}`; };
const clockPill = () => `<span class="pill" data-clockpill title="Game time — customers come more often at lunch and in the evening (set the lighting in the Menu)">${clockPillHTML()}</span>`;
let _tintKey = '';
function liveG4() {
  document.querySelectorAll('[data-townt]').forEach(el => { if (S.town.cur) el.textContent = mmss(S.town.cur.left); });
  document.querySelectorAll('[data-townbar]').forEach(el => { if (S.town.cur) el.style.width = Math.round(S.town.cur.left / S.town.cur.total * 100) + '%'; });
  document.querySelectorAll('[data-clockpill]').forEach(el => { const h = clockPillHTML(); if (el._h !== h) { el._h = h; el.innerHTML = h; } });
  const a = lightTint(false), b = lightTint(true), key = a.join() + '|' + b.join();
  if (key !== _tintKey) { _tintKey = key; const r = document.documentElement.style; r.setProperty('--dn-tint', `rgb(${a})`); r.setProperty('--dn-soft', `rgb(${b})`); if (typeof Scenes !== 'undefined') Scenes.list.forEach(s => s.dayNight && s.dayNight(sunAt(lightHour()))); }
}

/* ---------- breeding planner ---------- */
const PLAN_SPECIES = () => SPECIES_LIST.filter(s => !s.ev).slice().sort((a, b) => (a.w === b.w ? 0 : a.w === 'fresh' ? -1 : 1) || a.t - b.t || a.n.localeCompare(b.n));
function planModsText(U, mods) { const l = mods.filter((m, i) => U & (1 << i)).map(m => MODS[m].n); return l.length ? ' with ' + l.join(' + ') : ''; }
function plannerModal() {
  if (!UI.plan) UI.plan = { sp: 'goldfish', mods: [] };
  const P = UI.plan, sp = SPECIES[P.sp] || SPECIES.goldfish, r = planFor(sp.id, P.mods), mods = r.mods || P.mods;
  let h = `<h2>🧬 Breeding planner</h2><p class="dim">Pick the fish you want. The planner looks at the fish you own and finds the cheapest chain of pairings (counting waiting time and money).</p>`;
  h += `<div class="row" style="margin-bottom:8px"><span class="dim small">Species</span><select data-change="planSp">${PLAN_SPECIES().map(s => `<option value="${s.id}" ${s.id === sp.id ? 'selected' : ''}>${s.n} · tier ${s.t} · ${s.w}${s.exp ? ' · wild' : ''}</option>`).join('')}</select><span class="grow"></span>${P.mods.length ? btn('Clear', 'planClear', {}, 'sm ghost') : ''}</div>`;
  h += `<div class="dim small" style="margin-bottom:4px">Modifiers (up to 5) — ${P.mods.length} chosen</div><div class="planmods">${MODS_LIST.filter(m => !m.ev).map(m => `<button class="chip m${m.t} ${P.mods.includes(m.id) ? 'sel' : ''}" data-act="planMod" data-x="${m.id}" title="${esc(m.d)}">${m.icon} ${m.n}</button>`).join('')}</div>`;
  h += `<div class="plantarget">${fishSVG(sp.id, P.mods, 120)}<div><b>${P.mods.map(m => MODS[m].n).join(' ')} ${sp.n}</b> ${tierBadge(sp.t)}<div class="small dim">Worth about ${fmt(fishValue({ sp: sp.id, mods: P.mods, loc: null, vb: 0, medals: { g: 0, s: 0, b: 0 } }, true))}</div></div></div>`;
  if (r.err) return h + `<div class="warn">${r.err}</div><div class="row" style="margin-top:12px">${btn('Close', 'closeModal', {}, 'ghost')}</div>`;
  if (r.owned) return h + `<div class="card" style="border-color:rgba(79,224,160,.5)"><b class="good">You already own this fish!</b><div style="margin-top:6px">${fishTitle(r.best.node.f)}</div></div><div class="row" style="margin-top:12px">${btn('Close', 'closeModal', {}, 'ghost')}</div>`;
  const ref = n => (n.t === 'have' ? `<b>${esc(n.f.name)}</b> <span class="dim">(${esc(fishName(n.f))})</span>` : `the ${sp.n}${planModsText(n.U, mods)} from step ${n.no}`);
  h += `<div class="stats" style="margin-top:12px">${pill('Breedings', '~' + Math.ceil(r.tries))}${r.buys ? pill('Eggs to buy', '~' + Math.ceil(r.buys)) : ''}${pill('Time', '~' + fmtDur(r.time))}${pill('Money', fmt(r.money))}</div>`;
  h += `<div class="planlist">` + r.steps.map(s => {
    if (s.t === 'buy') return `<div class="pstep"><span class="pn">${s.no}</span><div class="grow"><b>Buy ${Math.ceil(s.n)} × ${s.egg.n}</b> <span class="dim">(${fmt(s.n * eggPrice(s.egg.id))})</span><div class="small dim">and hatch them until you get a ${sp.n}${planModsText(s.U, mods)} (${pct(s.p)} per egg).</div></div></div>`;
    const ready = s.a.t === 'have' && s.b.t === 'have' && !breedCheck(s.a.f, s.b.f);
    return `<div class="pstep"><span class="pn">${s.no}</span><div class="grow"><b>Breed</b> ${ref(s.a)} <b>×</b> ${ref(s.b)}<div class="small dim">→ ${sp.n}${planModsText(s.U, mods)} · ${pct(s.p)} per egg, about ${s.E < 1.5 ? 'one try' : Math.ceil(s.E) + ' tries'}</div></div>${s.a.t === 'have' && s.b.t === 'have' ? btn('Use this pair', 'planUse', { x: s.a.f.id, y: s.b.f.id }, 'sm pri', !ready) : ''}</div>`;
  }).join('') + `</div>`;
  h += `<div class="small dim" style="margin-top:8px">Assumes you breed in your best tanks and tags nothing away. Higher-tier surprises and mutagens only help. Inheritance chance per modifier: ${pct(r.inh)} · new-modifier chance: ${pct(r.fresh)} · ${r.eggs} egg${r.eggs > 1 ? 's' : ''} per breeding.</div><div class="row" style="margin-top:12px">${btn('Close', 'closeModal', {}, 'ghost')}</div>`;
  return h;
}

/* ---------- version / changelog (Menu) ---------- */
function versionCard() {
  return `<div class="card"><div class="row"><b>Fish Tycoon</b><span class="pill">version <b>${GAME_VERSION}</b></span></div>${CHANGELOG.map(c => `<div style="margin-top:10px"><b>${c.v}</b> <span class="dim small">· ${c.d}</span><ul class="notes">${c.notes.map(n => `<li>${n}</li>`).join('')}</ul></div>`).join('')}</div>`;
}
const daymodeRow = () => `<div class="row" style="margin-top:12px"><span class="dim small">Day &amp; night</span><select data-change="daymode">${[['auto', 'Game clock (8 min per day)'], ['real', 'Follow my computer clock'], ['day', 'Always day'], ['night', 'Always night']].map(([v, l]) => `<option value="${v}" ${S.settings.daymode === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;

/* ---------- actions ---------- */
const ACT4 = {
  tagFish: d => res(setTag(d.x, d.y)),
  tagShown: d => { const ids = sortFish(S.fish).filter(isAdult).map(f => f.id); if (d.x) tagMany(ids, d.x); else clearTags(ids); },
  ruleAdd: d => res(addRule(d.x)),
  ruleDel: d => res(delRule(d.x)),
  ruleToggle: d => res(setRule(d.x, 'on')),
  rulesMaster: () => { S.rules.on = !S.rules.on; if (S.rules.on) toast('Auto-rules will run every few seconds', 'good'); },
  rulesPreview: () => { UI.modal = { type: 'rulesPrev' }; },
  rulesRun: () => { const r = res(runRules()); if (r.ok) { Sfx.play('sale'); toast(`Sold ${r.n} fish for ${fmt(r.money)}`, 'gold'); UI.modal = null; } },
  ruleKeep: d => { const f = getFish(d.x); if (f) f.tag = 'keep'; G.dirty = true; },
  guideClaim: d => { const r = res(claimGuide(d.x)); if (r.ok) { Sfx.play('level'); toast('Reward: ' + rewardText(r.g.reward), 'gold'); } },
  guideBonus: () => { const r = res(claimGuideBonus()); if (r.ok) { Sfx.play('level'); toast('First-hour bonus: ' + rewardText(GUIDE_BONUS), 'gold'); } },
  guideHide: () => { S.g4.guideHide = true; },
  goTab: d => { UI.tab = d.x; UI.tankId = null; delete S.g4.fresh[d.x]; UI.modal = null; },
  goNew: d => { UI.tab = d.x; UI.tankId = null; delete S.g4.fresh[d.x]; UI.modal = null; },
  awayGo: d => { UI.tab = d.x; UI.tankId = null; UI.modal = null; },
  planOpen: d => { UI.plan = d.sp ? { sp: d.sp, mods: d.mods ? d.mods.split(',').filter(Boolean) : [] } : UI.plan; UI.modal = { type: 'planner' }; },
  planMod: d => { const P = UI.plan; const i = P.mods.indexOf(d.x); if (i >= 0) P.mods.splice(i, 1); else if (P.mods.length < 5) P.mods.push(d.x); else toast('Up to five modifiers', 'bad'); },
  planClear: () => { UI.plan.mods = []; },
  planUse: d => { UI.sel = [d.x, d.y]; UI.tab = 'breed'; UI.tankId = null; UI.modal = null; },
};
/* returns true when the change event was handled here */
function changeG4(e) {
  const k = e.target.dataset.change;
  if (k === 'filterTag') { UI.filterTag = e.target.value; return true; }
  if (k === 'rule') { res(setRule(e.target.dataset.x, e.target.dataset.y, e.target.value)); return true; }
  if (k === 'daymode') { S.settings.daymode = e.target.value; _tintKey = ''; return true; }
  if (k === 'planSp') { UI.plan.sp = e.target.value; UI.plan.mods = []; return true; }
  return false;
}
/* open a card for a freshly unlocked tab, and the away card */
function checkPopups() {
  if (UI.modal || (typeof DRAG !== 'undefined' && DRAG.ghost) || mouseDown) return false;
  if (S.g4.q.length) { UI.modal = { type: 'newFeature', ids: S.g4.q.slice() }; S.g4.q.forEach(id => (S.g4.seen[id] = true)); S.g4.q = []; return true; }
  if (S.story.queue.length) { const id = S.story.queue[0], rt = startChapter(id); UI.modal = { type: 'story', id, page: 0, reward: rt }; Sfx.play('card'); return true; }
  return false;
}

/* =====================================================================
   v1.2 — collapsible sections, tank navigation, egg manager, tidier Breeding
   ===================================================================== */
const isOpen = (id, def) => { const f = S.settings.fold; return f && id in f ? !!f[id] : !!def; };
/* a titled section the player can fold away; remembered between sessions */
function fold(id, title, body, def, sub, acts) {
  const open = isOpen(id, def);
  return `<div class="fold ${open ? 'open' : ''}"><div class="foldhead"><button class="foldtoggle" data-act="fold" data-x="${id}" data-y="${def ? 1 : 0}"><span class="car">${open ? '▾' : '▸'}</span><b>${title}</b></button>${sub ? `<span class="dim small">${sub}</span>` : ''}<span class="grow"></span>${open && acts ? acts : ''}</div>${open ? `<div class="foldbody">${body}</div>` : ''}</div>`;
}

/* ---------- tank navigation ---------- */
function tankNav(t) {
  const i = S.tanks.indexOf(t), n = S.tanks.length;
  return `<div class="tanknav"><button class="btn sm" data-act="tankStep" data-x="-1" title="Previous tank (←)" ${n < 2 ? 'disabled' : ''}>‹</button><select data-change="tankJump" title="Jump to a tank">${S.tanks.map(x => `<option value="${x.id}" ${x.id === t.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><span class="dim small">${i + 1} / ${n}</span><button class="btn sm" data-act="tankStep" data-x="1" title="Next tank (→)" ${n < 2 ? 'disabled' : ''}>›</button></div>`;
}
function tankMgmt(t) {
  const nx = tankNextInfo(t), why = sellTankCheck(t);
  return (tankType(t).ev ? '' : `<div class="row" style="margin-bottom:10px">${btn(t.sale ? '🏷 Sale tank: ON' : '🏷 Sale tank: OFF', 'tankSale', { x: t.id }, t.sale ? 'sm gold-btn' : 'sm')}<span class="small dim grow">Your Display Handler and Auto-fill only put fish from <b>Sale tanks</b> (or fish tagged “Sell soon”) in the store. Keep breeding stock in a normal tank and it will never be sold.</span></div>`) + `<div class="row" style="gap:8px;flex-wrap:wrap">${nx ? btn(`⬆ ${nx.to.n} · ${fmt(nx.cost)}`, 'tankUpType', { x: t.id }, 'sm pri', !!nx.locked || S.money < nx.cost) + (nx.locked ? `<span class="small dim">unlocks at store level ${nx.locked}</span>` : `<span class="small dim">cap ${nx.from.cap}→${nx.to.cap} · base rating ${nx.from.base}→${nx.to.base} · old tank trades in at ${Math.round(TANK_TRADEIN * 100)}%</span>`) : `<span class="small dim">Biggest tank of its kind</span>`}<span class="grow"></span>${tankType(t).ev ? '' : btn(`Sell tank · ${fmt(tankSellValue(t))}`, 'tankSell', { x: t.id }, 'sm bad', !!why)}</div>${why && !tankType(t).ev ? `<div class="small dim" style="margin-top:4px">${why}.</div>` : ''}`;
}

/* ---------- eggs ---------- */
const EGG_SORTS = [['tier', 'Rarity (high → low)'], ['tier_asc', 'Rarity (low → high)'], ['water', 'Water type'], ['new', 'Newest first']];
function eggControls(list) {
  const cnt = [0, 0, 0, 0, 0, 0]; list.forEach(e => cnt[e.tier]++);
  return `<div class="row eggctl"><span class="dim small">Sort</span><select data-change="eggSort">${EGG_SORTS.map(([k, l]) => `<option value="${k}" ${UI.eggSort === k ? 'selected' : ''}>${l}</option>`).join('')}</select><select data-change="eggWater" title="Water type"><option value="all">Any water</option><option value="fresh" ${UI.eggWater === 'fresh' ? 'selected' : ''}>Freshwater</option><option value="salt" ${UI.eggWater === 'salt' ? 'selected' : ''}>Saltwater</option></select><button class="boost-chip ${UI.eggTier === 'all' ? 'on' : ''}" data-act="eggTier" data-x="all">All ${list.length}</button>${[5, 4, 3, 2, 1].filter(t => cnt[t]).map(t => `<button class="boost-chip ${UI.eggTier == t ? 'on' : ''}" style="--tc:${TIER_COLORS[t]}" data-act="eggTier" data-x="${t}"><i class="tierdot" style="background:${TIER_COLORS[t]}"></i>${TIER_NAMES[t]} ${cnt[t]}</button>`).join('')}</div>`;
}
function eggTray(t) {
  if (!S.eggs.length) return `<div class="eggtray empty-tray"><span class="dim small">No eggs — buy some in the shop, or breed your fish.</span></div>`;
  const pool = t ? S.eggs.filter(e => !canHatchIn(e, t)) : S.eggs, stacks = eggStacks(pool, UI.eggSort, UI.eggTier, UI.eggWater);
  const shown = UI.eggMore ? stacks : stacks.slice(0, 24), eggsShown = stacks.reduce((a, s) => a + s.n, 0);
  const chips = shown.map(s => `<div class="eggchip" data-drag="egg" data-id="${s.ids[0]}" title="${esc(eggTitle(s.egg))}${s.n > 1 ? ' ×' + s.n : ''} — drag onto ${t ? 'the aquarium' : 'a tank'} to hatch one">${eggArt(s.egg, 46)}<span class="tl" style="color:${TIER_COLORS[s.egg.tier]}">${TIER_NAMES[s.egg.tier]}</span>${s.n > 1 ? `<span class="cnt">×${s.n}</span>` : ''}</div>`).join('');
  const body = `${eggControls(pool)}${stacks.length ? `<div class="eggchips">${chips}</div>${stacks.length > 24 ? `<button class="boost-chip" data-act="eggMore" style="margin-top:8px">${UI.eggMore ? 'Show fewer' : `Show all ${stacks.length} kinds`}</button>` : ''}<div class="dim small" style="margin-top:6px">Drag an egg onto ${t ? 'the aquarium' : 'a tank below'} and let go to hatch it. Stacks hatch one egg at a time.</div>` : `<div class="dim small" style="margin-top:6px">${pool.length ? 'No eggs match these filters.' : 'None of your eggs fit this tank (check water type and rating).'}</div>`}${pool.length ? `<div style="margin-top:8px">${boostPicker()}</div>` : ''}`;
  return `<div class="eggtray">${fold('eggtray' + (t ? ':t' : ':h'), 'Eggs', body, true, `${t ? pool.length + ' can hatch here' : S.eggs.length + ' in your inventory'}${eggsShown !== pool.length ? ` · ${eggsShown} shown` : ''}`, btn('Manage / destroy', 'goTab', { x: 'inv' }, 'sm ghost'))}</div>`;
}
function eggStackCard(s) {
  const e = s.egg, risky = e.bred || e.wild || e.tier >= 3;
  return `<div class="eggrow"><div class="eggpic">${eggArt(e, 54)}</div><div class="grow" style="min-width:0"><div class="eggname"><b>${eggTitle(e)}</b>${s.n > 1 ? ` <span class="pill"><b>×${s.n}</b></span>` : ''}</div><div>${tierBadge(e.tier)} ${waterTag(e.water)}</div></div><div class="eggbtns">${btn('Hatch', 'hatchPick', { x: s.ids[0] }, 'pri sm')}${btn('Destroy', 'eggDestroy', { x: s.ids[0], y: risky ? 1 : 0 }, 'sm bad')}${s.n > 1 ? btn('Destroy all ' + s.n, 'eggDestroyStack', { x: s.key, y: risky ? 1 : 0 }, 'sm bad') : ''}</div></div>`;
}
function eggsSection() {
  if (!S.eggs.length) return `<div class="empty">No eggs. Buy some in the shop or breed your fish.</div>`;
  const stacks = eggStacks(S.eggs, UI.eggSort, UI.eggTier, UI.eggWater), n = stacks.reduce((a, s) => a + s.n, 0), lim = UI.eggMore ? 400 : 30;
  let h = eggControls(S.eggs);
  h += `<div class="row" style="margin:8px 0 10px">${S.unlocks.hatchAll ? btn('Hatch all', 'hatchAll', {}, 'pri sm') : btn('🔒 Hatch all', 'goMgmt', {}, 'sm ghost')}${btn(`Destroy the ${n} shown`, 'eggDestroyShown', {}, 'bad sm', !n)}<span class="dim small">Use the rarity chips first — e.g. pick “Common” and destroy the lot.</span></div>`;
  h += stacks.length ? `<div class="eggs2">${stacks.slice(0, lim).map(eggStackCard).join('')}</div>${stacks.length > lim ? `<button class="boost-chip" data-act="eggMore" style="margin-top:8px">Show all ${stacks.length} kinds</button>` : UI.eggMore && stacks.length > 30 ? `<button class="boost-chip" data-act="eggMore" style="margin-top:8px">Show fewer</button>` : ''}` : `<div class="empty">No eggs match these filters.</div>`;
  return h;
}

/* ---------- inventory ---------- */
function viewInv() {
  let h = pageHead('Inventory', 'Eggs, mutagens, spare decorations and every fish you own. Sections fold away — click a heading.');
  h += fold('inv:eggs', 'Eggs', eggsSection(), true, S.eggs.length + ' total');
  h += fold('inv:mut', 'Mutagens', `<div class="stats">${CONSUMABLES.map(c => `<span class="pill">${c.e} ${c.n} <b>×${S.items[c.id]}</b> <span class="small">+${Math.round(c.boost * 100)}%</span></span>`).join('')}</div>`, false, CONSUMABLES.reduce((a, c) => a + S.items[c.id], 0) + ' owned');
  const owned = DECOR.filter(d => S.decorInv[d.id] > 0);
  h += fold('inv:decor', 'Decorations', owned.length ? `<div class="grid sm">${owned.map(d => `<div class="card row">${decorPic(d, 64)}<div><b>${d.n}</b> ×${S.decorInv[d.id]}<div class="small dim">${bonusText(d.b)}</div></div></div>`).join('')}</div>` : `<div class="empty">No spare decorations. Buy some, then place them from a tank's page.</div>`, false, owned.reduce((a, d) => a + S.decorInv[d.id], 0) + ' spare');
  h += fold('inv:rules', '🗂️ Auto-rules', rulesPanel(), false, S.unlocks.autoRules ? (S.rules.on ? 'automatic selling on' : 'automatic selling off') : 'locked');
  const shown = sortFish(S.fish), sellIds = shown.filter(f => isAdult(f) && !f.fav && !tagKept(f)), lim = UI.invMore ? 1000 : 40;
  let body = sortBar() + tagBulkRow(shown) + `<div class="row" style="margin-bottom:12px">${S.unlocks.bulkSell ? btn(`Sell all shown · ${sellIds.length} fish`, 'sellAll', {}, 'bad sm', !sellIds.length) : btn('🔒 Sell all shown', 'goMgmt', {}, 'sm ghost')}<span class="dim small">${S.unlocks.bulkSell ? 'Favourites, protected tags and growing fish are never sold. Use the filters above first!' : 'Unlock the Market Broker in Shop → Management to sell everything you are looking at.'} Or click Sell on a single row.</span></div>`;
  body += `<div class="list">${shown.slice(0, lim).map(f => fishRow(f)).join('') || '<div class="dim" style="padding:16px">None</div>'}</div>${shown.length > 40 ? `<button class="boost-chip" data-act="invMore" style="margin-top:10px">${UI.invMore ? 'Show fewer' : `Show all ${shown.length} fish`}</button>` : ''}`;
  return h + fold('inv:fish', 'All fish', body, true, shown.length + (shown.length !== S.fish.length ? ' of ' + S.fish.length : ''));
}

/* ---------- breeding ---------- */
function bRow(f, sel, water) {
  const cd = f.ready - S.time, sp = SPECIES[f.sp], bad = water && !sel && sp.w !== water;
  return `<div class="brow ${sel ? 'sel' : ''} ${bad ? 'dis' : ''}" data-act="breedSel" data-x="${f.id}"><div class="bpic">${fishPic(f, 46)}</div><div class="grow" style="min-width:0"><div class="bname"><b>${esc(f.name)}</b>${tagDot(f)} <span class="dim">${esc(fishName(f))}</span></div><div class="bmods">${tierBadge(sp.t)} ${modChips(f.mods)}</div></div><div class="small ${cd > 0 ? 'badc' : 'good'}" data-cd="${f.id}" style="min-width:76px;text-align:right">${cd > 0 ? 'Resting ' + Math.ceil(cd) + 's' : 'Ready'}</div><div class="small dim bloc">${f.loc === 'store' ? 'Store' : esc((getTank(f.loc) || { name: '?' }).name)}</div><span class="bsel">${sel ? '✓ Selected' : 'Select'}</span></div>`;
}
function viewBreed() {
  UI.sel = UI.sel.filter(id => getFish(id) && isAdult(getFish(id)));
  const a = getFish(UI.sel[0]), b = getFish(UI.sel[1]), water = a ? SPECIES[a.sp].w : null;
  let h = pageHead('Breeding', `Pair two fully grown fish of the same water type. Every modifier a parent carries can be passed on, with a small chance of a new one — a fish can carry at most ${MAX_MODS}.`, btn('🧬 Planner', 'planOpen', {}, 'pri') + (S.unlocks.autoPair ? btn('Suggest a pair', 'suggestPair') : btn('🔒 Suggest a pair', 'goMgmt', {}, 'ghost')));
  const slot = (f, label) => `<div class="card parent ${f ? '' : 'flat'}" ${f ? '' : 'style="border-style:dashed"'}>${f ? `${fishSVG(f.sp, f.mods, 130)}<div><b>${esc(fishName(f))}</b> ${tierBadge(SPECIES[f.sp].t)}</div><div>${modChips(f.mods)}</div>${btn('Remove', 'breedSel', { x: f.id }, 'sm ghost')}` : `<span class="dim">${label}<br><span class="small">pick a fish below</span></span>`}</div>`;
  h += `<div class="parents compact">${slot(a, 'Parent A')}<div style="align-self:center;font-size:30px;color:var(--accent)">♥</div>${slot(b, 'Parent B')}</div>`;
  if (a && b) {
    const why = breedCheck(a, b), o = breedOdds(a, b);
    let od = `<div class="row"><b>Offspring odds</b><span class="dim small">${o.eggs} egg${o.eggs > 1 ? 's' : ''} per breeding · max ${MAX_MODS} modifiers</span></div><div class="stats" style="margin:10px 0">` + o.species.map(s => pill(SPECIES[s.sp].n, pct(s.p))).join('') + pill('Higher tier', pct(o.tierUp)) + pill('Each parent modifier passed on', pct(o.inh)) + pill('Chance of a new modifier', pct(o.fresh)) + `</div>`;
    const ml = Object.entries(o.mods).filter(([id, p]) => p >= 0.02).sort((x, y) => y[1] - x[1]);
    od += `<div class="dim small" style="margin-bottom:4px">Modifier chances</div><div>${ml.map(([id, p]) => `<span class="chip m${MODS[id].t}">${MODS[id].icon} ${MODS[id].n} ${pct(p)}</span>`).join('') || '<span class="dim small">none likely</span>'}</div>`;
    od += `<div class="row" style="margin-top:14px">${boostPicker()}<span class="grow"></span>${why ? `<span class="badc small">${why}</span>` : ''}${btn('Breed', 'breedGo', {}, 'pri', !!why)}</div>`;
    h += `<div class="card">${od}</div>`;
  }
  if (UI.lastBreed) h += `<div class="card" style="margin-top:12px;border-color:rgba(255,194,74,.5)"><b>Last breeding produced</b>${UI.lastBreed.map(m => `<div class="row" style="margin-top:6px">${eggArt({ ...EGG_TYPE[SPECIES[m.sp].w + SPECIES[m.sp].t + '_mix'], bred: true }, 30)} ${m.up ? '<b class="gold">▲ Higher tier</b>' : ''} <b>${SPECIES[m.sp].n}</b> ${tierBadge(SPECIES[m.sp].t)} ${modChips(m.mods)}${m.fresh ? ` <span class="good small">✨ new: ${MODS[m.fresh].n}</span>` : ''}</div>`).join('')}<div class="small dim" style="margin-top:6px">Eggs are in your inventory — hatch them in a tank with enough water rating.</div></div>`;
  // ---- the adults ----
  const q = (UI.bq || '').trim().toLowerCase(), all = S.fish.filter(isAdult);
  let list = sortFish(all);
  if (q) list = list.filter(f => (f.name + ' ' + fishName(f) + ' ' + SPECIES[f.sp].n).toLowerCase().includes(q));
  if (UI.bReady) list = list.filter(f => f.ready <= S.time);
  if (water && !UI.bAll) list = list.filter(f => UI.sel.includes(f.id) || SPECIES[f.sp].w === water);
  const gkey = { tank: f => (f.loc === 'store' ? 'Store display' : (getTank(f.loc) || { name: '?' }).name), species: f => SPECIES[f.sp].n, tier: f => 'Tier ' + SPECIES[f.sp].t + ' · ' + TIER_NAMES[SPECIES[f.sp].t], none: () => 'All adults' }[UI.bgroup];
  const groups = new Map(); list.forEach(f => { const k = gkey(f); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); });
  const names = [...groups.keys()]; if (UI.bgroup === 'tier') names.sort().reverse(); else if (UI.bgroup !== 'none') names.sort((x, y) => x.localeCompare(y));
  let ctl = `<div class="row" style="margin-bottom:10px;gap:8px"><input type="text" class="search" placeholder="Search name, species, modifier…" value="${esc(UI.bq || '')}" data-change="bq"><span class="dim small">Group</span><select data-change="bgroup">${[['tank', 'By aquarium'], ['species', 'By species'], ['tier', 'By rarity'], ['none', 'No grouping']].map(([k, l]) => `<option value="${k}" ${UI.bgroup === k ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="boost-chip ${UI.bReady ? 'on' : ''}" data-act="bReady">Ready only</button>${water ? `<button class="boost-chip ${UI.bAll ? 'on' : ''}" data-act="bAll">Show other water types</button>` : ''}</div>`;
  const ready = all.filter(f => f.ready <= S.time).length;
  let body = ctl + sortBar();
  if (!all.length) body += `<div class="empty">No fully grown fish yet.</div>`;
  else if (!list.length) body += `<div class="empty">No fish match these filters.</div>`;
  for (const k of names) {
    const g = groups.get(k), id = 'bg:' + UI.bgroup + ':' + k, lim = UI.bmore[id] ? 500 : 12, open = isOpen(id, names.length <= 3 || g.some(f => UI.sel.includes(f.id)));
    body += `<div class="fold ${open ? 'open' : ''} bgroup"><div class="foldhead"><button class="foldtoggle" data-act="fold" data-x="${esc(id)}" data-y="${names.length <= 3 ? 1 : 0}"><span class="car">${open ? '▾' : '▸'}</span><b>${esc(k)}</b></button><span class="dim small">${g.length} fish · ${g.filter(f => f.ready <= S.time).length} ready</span></div>${open ? `<div class="foldbody"><div class="blist">${g.slice(0, lim).map(f => bRow(f, UI.sel.includes(f.id), water)).join('')}</div>${g.length > 12 ? `<button class="boost-chip" data-act="bMore" data-x="${esc(id)}" style="margin-top:6px">${UI.bmore[id] ? 'Show fewer' : `Show all ${g.length}`}</button>` : ''}</div>` : ''}</div>`;
  }
  return h + `<div style="margin-top:14px">${fold('breed:adults', 'Adult fish', body, true, `${list.length} shown · ${ready} ready`)}</div>`;
}

/* ---------- aquarium hall: compact list for lots of tanks ---------- */
function hallCompactRow(t) {
  const tt = tankType(t), fs = fishIn(t.id), nx = tankNextInfo(t);
  return `<div class="item hallrow" data-droptank="${t.id}"><div class="grow" style="min-width:0"><b>${esc(t.name)}</b> ${t.sale ? '<span class="tagchip" style="--tc:#ff9a52">SALE</span> ' : ''}${waterTag(tt.w)}<div class="small dim">${fs.length}/${tankCap(t)} fish · ${fs.filter(f => !isAdult(f)).length} growing · rating ${rating(t)}${heroIn(t.id) ? ' · ★ ' + HERO[heroIn(t.id).kind].n : ''}</div></div><div style="width:120px">${wqBar(t)}<div class="small" style="color:${wqColor(wqOf(t))}">${wqLabel(wqOf(t))}</div></div>${nx && !nx.locked ? btn('⬆ ' + nx.to.n.split(' ')[0], 'tankUpType', { x: t.id }, 'sm', S.money < nx.cost) : ''}${btn('Open', 'openTank', { x: t.id }, 'sm pri')}</div>`;
}

/* ---------- shop: your tanks (upgrade / sell back) ---------- */
function myTanksPanel() {
  return S.tanks.map(t => {
    const nx = tankNextInfo(t), why = sellTankCheck(t);
    return `<div class="item"><div class="grow"><b>${esc(t.name)}</b> ${waterTag(tankType(t).w)}<div class="small dim">${tankType(t).n} · ${fishIn(t.id).length}/${tankCap(t)} fish</div></div>${nx ? btn(`⬆ ${nx.to.n} · ${fmt(nx.cost)}`, 'tankUpType', { x: t.id }, 'sm pri', !!nx.locked || S.money < nx.cost) + (nx.locked ? `<span class="small dim">level ${nx.locked}</span>` : '') : '<span class="small dim">biggest</span>'}${tankType(t).ev ? '' : btn(`Sell · ${fmt(tankSellValue(t))}`, 'tankSell', { x: t.id }, 'sm bad', !!why)}</div>`;
  }).join('');
}

/* ---------- actions ---------- */
Object.assign(ACT4, {
  fold: d => { S.settings.fold = S.settings.fold || {}; S.settings.fold[d.x] = !isOpen(d.x, d.y === '1'); },
  tankStep: d => { const i = S.tanks.findIndex(t => t.id === UI.tankId), n = S.tanks.length; if (i < 0 || n < 2) return false; UI.tankId = S.tanks[(i + (+d.x) + n) % n].id; UI.selFish = null; },
  tankUpType: d => { const r = res(upgradeTankType(d.x)); if (r.ok) { Sfx.play('level'); toast('Tank upgraded to a ' + r.to.n, 'gold'); } },
  tankSale: d => { const r = res(toggleSaleTank(d.x)); if (r.ok) toast(getTank(d.x).sale ? 'Now a Sale tank — the handler will display its adults' : 'Back to a normal tank — its fish are safe', 'good'); },
  tagBoss: () => { const r = res(tagBossCandidates()); if (r.ok) toast(`Tagged ${r.n} fish as Boss candidates — they are protected`, 'good'); },
  tankSell: d => { const t = getTank(d.x); if (!t) return false; if (!confirm(`Sell ${t.name} for ${fmt(tankSellValue(t))}? Its decorations go back to your inventory.`)) return false; const r = res(sellTank(d.x)); if (r.ok) { Sfx.play('sale'); toast(`Sold ${r.name} for ${fmt(r.value)}`, 'gold'); if (UI.tankId === d.x) UI.tankId = null; } },
  eggTier: d => { UI.eggTier = d.x; UI.eggMore = false; },
  eggMore: () => { UI.eggMore = !UI.eggMore; },
  invMore: () => { UI.invMore = !UI.invMore; },
  bMore: d => { UI.bmore[d.x] = !UI.bmore[d.x]; },
  bReady: () => { UI.bReady = !UI.bReady; },
  bAll: () => { UI.bAll = !UI.bAll; },
  hallCompact: () => { UI.hallCompact = !UI.hallCompact; },
  eggDestroy: d => { if (d.y === '1' && !confirm('Destroy this egg for good?')) return false; const r = res(discardEggs([d.x])); if (r.ok) toast('Egg destroyed'); },
  eggDestroyStack: d => { const st = eggStacks(S.eggs).find(s => s.key === d.x); if (!st) return false; if (!confirm(`Destroy all ${st.n} of these eggs?`)) return false; const r = res(discardEggs(st.ids)); if (r.ok) toast(`Destroyed ${r.n} eggs`); },
  eggDestroyShown: () => { const ids = eggStacks(S.eggs, UI.eggSort, UI.eggTier, UI.eggWater).flatMap(s => s.ids); if (!ids.length) return false; if (!confirm(`Destroy the ${ids.length} eggs you are looking at? This cannot be undone.`)) return false; const r = res(discardEggs(ids)); if (r.ok) toast(`Destroyed ${r.n} eggs`); },
});
const _changeG4 = changeG4;
changeG4 = function (e) {
  const k = e.target.dataset.change, v = e.target.value;
  if (k === 'eggSort') { UI.eggSort = v; return true; }
  if (k === 'eggWater') { UI.eggWater = v; UI.eggMore = false; return true; }
  if (k === 'tankJump') { UI.tankId = v; UI.selFish = null; return true; }
  if (k === 'bgroup') { UI.bgroup = v; return true; }
  if (k === 'bq') { UI.bq = v; return true; }
  return _changeG4(e);
};

/* ---------- local event banner (Store) ---------- */
function townBanner() {
  const ev = S.town.cur; if (!ev) return '';
  const d = TOWN_EVENT[ev.id], have = storeFish().filter(f => townWants(ev, f)).length;
  return `<div class="card townbanner"><div class="tbicon">${d.icon}</div><div class="grow"><b>${d.n}</b> <span class="dim small">· ends in <span data-townt>${mmss(ev.left)}</span></span><div class="small dim">${d.d} They want <b class="gold">${townWantText(ev)}</b> — offers ×${d.want} for those, ×${d.other} for everything else. Arrivals ×${d.traffic}.</div><div class="bar" style="margin-top:6px"><i data-townbar style="width:${Math.round(ev.left / ev.total * 100)}%"></i></div></div><div style="text-align:right">${ev.id === 'tourists' ? '' : have ? `<div class="good small">${have} in your cases</div>` : '<div class="badc small">None in your cases!</div>'}<div class="small dim">${ev.sold} sold · ${fmt(ev.earned)}</div></div></div>`;
}

/* ---------- sound settings (Menu) ---------- */
function soundSettings() {
  const row = (key, vol, label, hint) => `<div class="row sndrow"><button class="boost-chip ${S.settings[key] !== false ? 'on' : ''}" data-act="setting" data-x="${key}" style="min-width:150px">${label}: ${S.settings[key] !== false ? 'On' : 'Off'}</button><input type="range" min="0" max="100" value="${Math.round((S.settings[vol] == null ? { vol: 0.8, mvol: 0.45, avol: 0.5 }[vol] : S.settings[vol]) * 100)}" data-change="vol" data-x="${vol}" style="width:200px"><span class="dim small">${hint}</span></div>`;
  return row('sound', 'vol', 'Sound effects', 'sales, clicks, thunder, door bell') + row('music', 'mvol', 'Music', 'generated live — it follows the time of day, the weather and events') + row('ambient', 'avol', 'Ambience', 'water, rain, crickets and birdsong') + `<div class="row" style="margin-top:8px"><span class="dim small">Now playing: <b>${Sfx.moodName()}</b></span><span class="grow"></span>${btn('Test sound', 'sfxTest', {}, 'sm')}</div>`;
}
Object.assign(ACT4, { sfxTest: () => { Sfx.play('level'); return false; } });
const _changeG4b = changeG4;
changeG4 = function (e) {
  if (e.target.dataset.change === 'vol') { S.settings[e.target.dataset.x] = +e.target.value / 100; Sfx.apply(); Sfx.play('pop'); return true; }
  return _changeG4b(e);
};
