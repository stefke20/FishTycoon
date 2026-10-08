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
  const list = ruleTargets(), val = list.reduce((a, x) => a + fishValue(x.f) * quickSell(), 0);
  let h = `<h2>Auto-rules preview</h2><p class="dim">These fish would be sold right now for about <b class="gold">${fmt(val)}</b>:</p>`;
  h += list.length ? list.slice(0, 40).map(({ f, rule }) => `<div class="item"><div style="width:64px">${fishPic(f, 60)}</div><div class="grow">${fishTitle(f)}<div class="small dim">${esc(ruleText(rule))}</div></div><span class="gold">${fmt(fishValue(f) * quickSell())}</span>${btn('Keep', 'ruleKeep', { x: f.id }, 'sm ghost')}</div>`).join('') + (list.length > 40 ? `<div class="dim small">…and ${list.length - 40} more</div>` : '') : '<p class="dim">Nothing matches your rules.</p>';
  return h + `<div class="row" style="margin-top:12px">${btn(`Sell these ${list.length}`, 'rulesRun', {}, 'pri', !list.length)}${btn('Close', 'closeModal', {}, 'ghost')}</div><div class="dim small" style="margin-top:6px">“Keep” tags the fish as a Keeper so no rule will sell it.</div>`;
}

/* ---------- new-feature cards & tab hints ---------- */
const NEW_INFO = {
  home: ['🏠', 'Home', 'Your living room, with a big aquarium that shows the 20 most valuable fish you have ever owned.'],
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
const clockPillHTML = () => { const p = clockPhase(), t = trafficMult(); return `${p.icon} <b>${clockText()}</b> ${p.n}${t >= 1.15 ? ` <span class="good small">customers ×${t.toFixed(1)}</span>` : t <= 0.7 ? ` <span class="dim small">customers ×${t.toFixed(1)}</span>` : ''}`; };
const clockPill = () => `<span class="pill" data-clockpill title="Game time — customers come more often at lunch and in the evening (set the lighting in the Menu)">${clockPillHTML()}</span>`;
let _tintKey = '';
function liveG4() {
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
  return `<h3>Version</h3><div class="card"><div class="row"><b>Fish Tycoon</b><span class="pill">version <b>${GAME_VERSION}</b></span></div>${CHANGELOG.map(c => `<div style="margin-top:10px"><b>${c.v}</b> <span class="dim small">· ${c.d}</span><ul class="notes">${c.notes.map(n => `<li>${n}</li>`).join('')}</ul></div>`).join('')}</div>`;
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
  return false;
}
