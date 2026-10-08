'use strict';
/* ===== UI: expeditions, fish shows & tournaments, daily quests and login streaks ===== */

const medalChips = f => (f.medals && (f.medals.g || f.medals.s || f.medals.b) ? `<span class="chip m3" title="Show medals: +${Math.round(medalBonus(f) * 100)}% value">${f.medals.g ? '🥇' + f.medals.g : ''} ${f.medals.s ? '🥈' + f.medals.s : ''} ${f.medals.b ? '🥉' + f.medals.b : ''}</span>` : '');
const scoreBar = (score, base) => { const r = Math.min(1.6, score / Math.max(1, base)); return `<div class="bar" style="height:5px;margin-top:4px"><i style="width:${Math.min(100, r / 1.6 * 100)}%;background:${r >= 1.1 ? 'var(--good)' : r >= 0.85 ? 'var(--gold)' : 'var(--bad)'}"></i></div>`; };
const verdict = (score, base) => { const r = score / base; return r >= 1.15 ? '<span class="good">Strong contender</span>' : r >= 0.95 ? '<span class="gold">Competitive</span>' : r >= 0.7 ? '<span class="dim">Long shot</span>' : '<span class="badc">No chance</span>'; };

/* ---------------- expeditions ---------------- */
function boatCard(i) {
  const b = S.exp.boats[i];
  if (!b) return `<div class="card boatcard"><div class="row"><div class="boatpic">${boatIcon(60)}</div><div class="grow"><b>Boat ${i + 1}</b><div class="small dim">Docked and ready for the next trip.</div></div></div></div>`;
  const L = LOCATION[b.loc], ready = boatReady(b), p = boatProgress(b);
  return `<div class="card boatcard ${ready ? 'ready' : ''}"><div class="row"><div class="boatpic">${locIcon(b.loc, 60)}</div><div class="grow"><b>Boat ${i + 1}</b> <span class="dim">→ ${L.n}</span><div class="small dim">${EXP_SUPPLIES[b.sup].n}</div><div class="bar" style="margin-top:6px"><i data-boat="${i}" style="width:${Math.round(p * 100)}%"></i></div><div class="small ${ready ? 'good' : 'dim'}" data-boateta="${i}">${ready ? 'Back in the harbour — unload the catch!' : 'Returns in ' + fmtDur((1 - p) * b.dur / 1000)}</div></div>${ready ? btn('Unload catch', 'expCollect', { x: i }, 'pri') : ''}</div></div>`;
}
function viewExp() {
  if (!UI.expLoc || !LOCATION[UI.expLoc]) UI.expLoc = (LOCATIONS.find(expUnlocked) || LOCATIONS[0]).id;
  const L = LOCATION[UI.expLoc], free = S.exp.boats.filter(b => !b).length, locked = !expUnlocked(L);
  let h = pageHead('Expeditions', 'Send boats to far-away waters and bring home wild eggs of fish you cannot buy — and special modifiers found nowhere else. Click an island on the map.', `${pill('Boats free', free + '/' + S.exp.slots)}${pill('Wild catches', S.exp.caught)}${boatsReady() ? `<span class="pill good">⚓ ${boatsReady()} ready to unload</span>` : ''}`);
  h += `<div class="expwrap"><div><div class="scenewrap" style="position:relative"><canvas class="expscene"></canvas>${zoomCtl(false, true)}</div></div>`;
  const species = SPECIES_LIST.filter(s => s.exp === L.id), mod = MODS[L.mod];
  h += `<aside class="exppanel"><div class="row" style="align-items:flex-start;gap:12px"><div class="locpic">${locIcon(L.id, 96)}</div><div class="grow"><div style="font-size:18px;font-weight:700">${L.icon} ${L.n}</div><div class="small dim" style="margin:2px 0 6px">${L.d}</div>${waterTag(L.w)}</div></div>`;
  h += `<div class="stats" style="margin:12px 0 8px">${pill('Sails', fmtDur(expDuration(L)))}${pill('Storm risk', pct(L.danger * Math.pow(0.88, expUp('safety'))))}${pill('Needs level', L.lvl)}</div><div class="dim small" style="margin-bottom:6px">Special modifier found here</div><div style="margin-bottom:10px"><span class="chip m${mod.t}" title="${esc(mod.d)}">${mod.icon} ${mod.n}</span> <span class="small dim">×${mod.m} value</span></div>`;
  h += `<div class="dim small" style="margin-bottom:6px">Fish you can find</div><div class="expspecies">${species.map(s => { const got = S.book.sp[s.id]; return `<div class="espc ${got ? '' : 'unk'}" title="${got ? esc(s.n) : 'Not discovered yet'}">${got ? fishSVG(s.id, [], 54) : '<span class="q">?</span>'}<span class="tl" style="color:${TIER_COLORS[s.t]}">${TIER_NAMES[s.t]}</span></div>`; }).join('')}</div>`;
  h += `<div class="dim small" style="margin:12px 0 6px">${locked ? '🔒 Reach store level ' + L.lvl + ' to sail here.' : free ? 'Choose how well to stock the boat:' : 'All boats are busy — wait for one to return.'}</div>`;
  EXP_SUPPLIES.forEach((sp, i) => { const c = expCost(L, i); h += `<div class="row" style="margin-bottom:6px">${btn(`${sp.n} · ${fmt(c)}`, 'expSend', { x: L.id, y: i }, i === 0 ? 'pri' : '', locked || !free || S.money < c)}<span class="small dim grow">${i === 0 ? 'The basics.' : i === 1 ? 'More catches, better odds, safer.' : 'Extra catch, best odds, much safer.'}</span></div>`; });
  h += `</aside></div><h3>Your boats</h3><div class="grid sm">${S.exp.boats.map((b, i) => boatCard(i)).join('')}</div>`;
  if (S.exp.slots < EXP_BOAT_COSTS.length) h += `<div class="row" style="margin-top:10px">${btn(`Buy another boat · ${fmt(EXP_BOAT_COSTS[S.exp.slots])}`, 'buyBoat', {}, 'pri', S.money < EXP_BOAT_COSTS[S.exp.slots])}<span class="dim small">More boats can sail at the same time.</span></div>`;
  h += `<h3>Fleet upgrades</h3>`; for (const u of EXP_UPGRADES) { const l = expUp(u.id); h += item(ico(u.icon, 28), `${u.n} <span class="dim small">Lv ${l}/${u.max}</span>`, u.desc, l >= u.max ? null : u.cost(l), 'Upgrade', 'expUp', { x: u.id }, { maxed: l >= u.max }); }
  if (S.exp.log.length) h += `<h3>Recent trips</h3><div class="card">${S.exp.log.map(e => `<div class="row" style="padding:5px 0"><span>${LOCATION[e.loc].icon}</span><span class="grow">${LOCATION[e.loc].n}</span><span class="small ${e.storm ? 'badc' : 'dim'}">${e.storm ? '⛈ Storm! ' : ''}${e.n} catch${e.n === 1 ? '' : 'es'}${e.cash ? ' · +' + fmt(e.cash) : ''}</span></div>`).join('')}</div>`;
  return h;
}
function expResultModal(r) {
  const L = LOCATION[r.res.loc];
  let h = `<h2>${L.icon} Back from ${L.n}</h2>${r.res.storm ? '<p class="badc">⛈ A storm hit the boat — the catch was cut short.</p>' : '<p class="good">Smooth sailing!</p>'}`;
  h += `<div class="dim small" style="margin:6px 0">Wild eggs — hatch them in a tank with the right water. Like all babies they reveal what they are once grown.</div><div class="row" style="flex-wrap:wrap;gap:8px">${r.eggs.map(e => `<div class="eggchip" style="cursor:default" title="Wild egg">${eggArt({ ...EGG_TYPE[e.water + e.tier + '_mix'], bred: true }, 46)}<span class="tl" style="color:${TIER_COLORS[e.tier]}">${TIER_NAMES[e.tier]}</span></div>`).join('') || '<span class="dim">Nothing this time…</span>'}</div>`;
  const loot = []; if (r.res.loot.cash) loot.push('💰 ' + fmt(r.res.loot.cash) + ' of treasure'); for (const k in r.res.loot.items) loot.push(CONSUMABLE[k].e + ' ' + r.res.loot.items[k] + '× ' + CONSUMABLE[k].n);
  if (loot.length) h += `<div class="mod-info" style="margin-top:12px">${loot.map(x => `<div>${x}</div>`).join('')}</div>`;
  return h + `<div class="row" style="margin-top:16px">${btn('Great!', 'closeModal', {}, 'pri')}</div>`;
}

/* ---------------- shows & tournaments ---------------- */
function leagueTabs() {
  return `<div class="seg" style="flex-wrap:wrap">${LEAGUES.map(L => { const open = leagueOpen(L); return `<button class="${UI.showLeague === L.id ? 'on' : ''} ${open ? '' : 'lockedtab'}" data-act="showLeague" data-x="${L.id}">${open ? L.icon : '🔒'} ${L.n}</button>`; }).join('')}</div>`;
}
function tourneyCard(L) {
  const T = S.shows.tourney; let h = `<div class="card tourney"><div class="row"><b>⚔️ Tournament</b><span class="grow"></span><span class="dim small">3 rounds · a different fish for each</span></div>`;
  if (!T) return h + `<div class="small dim" style="margin:6px 0 10px">Fight your way through three head-to-head rounds. Each round has a different category, each fish can only fight once, and the prize is triple the league's first prize.</div>${btn(`Enter ${L.n} tournament · ${fmt(L.fee * 3)}`, 'tourneyStart', { x: L.id }, 'pri', !leagueOpen(L) || S.money < L.fee * 3)}</div>`;
  const TL = LEAGUE[T.league];
  h += `<div class="small dim" style="margin:4px 0 8px">${TL.n}</div>`;
  T.rounds.forEach((rd, i) => { const lg = T.log.find(x => x.r === i), cur = T.state === 'active' && i === T.r; h += `<div class="trow ${cur ? 'cur' : ''} ${lg ? (lg.won ? 'won' : 'lost') : ''}"><span class="n">${i + 1}</span><div class="grow"><b>${SHOW_CATS[rd.cat].icon} ${SHOW_CATS[rd.cat].n}</b><div class="small dim">vs ${esc(rd.rival.name)}'s fish${lg ? ` — your ${esc(lg.fish)} ${lg.mine} vs ${lg.theirs}` : ` (strength ≈ ${rd.rival.score})`}</div></div>${lg ? (lg.won ? '<span class="good">✔ Won</span>' : '<span class="badc">✖ Lost</span>') : cur ? '<span class="gold">▶ Next</span>' : ''}</div>`; });
  if (T.state === 'active') h += `<div class="row" style="margin-top:10px">${btn('Choose a fighter', 'tourneyPick', {}, 'pri')}</div>`;
  else h += `<div class="${T.state === 'won' ? 'good' : 'badc'}" style="margin-top:10px;font-weight:600">${T.state === 'won' ? `🏆 Tournament won! Prize ${fmt(T.prize)} and ${T.fame} fame.` : `Eliminated in round ${T.r + 1}.${T.prize ? ' Consolation ' + fmt(T.prize) + '.' : ''}`}</div><div class="row" style="margin-top:8px">${btn('Close', 'tourneyDismiss', {}, 'sm')}</div>`;
  return h + `</div>`;
}
function viewShows() {
  const open = LEAGUES.filter(leagueOpen); if (!UI.showLeague || !LEAGUE[UI.showLeague]) UI.showLeague = (open[0] || LEAGUES[0]).id;
  const L = LEAGUE[UI.showLeague], sh = S.shows.leagues[L.id], last = S.shows.last[L.id], rank = fameRank(), nextFame = FAME_RANKS[rank + 1];
  let h = pageHead('Fish Shows', 'Enter your best fish in shows and tournaments for prizes, fame and medals. Medals make a fish permanently worth more.', `${pill('Fame', S.shows.fame)}${pill('Rank', FAME_RANKS[rank][1])}${pill('Show wins', S.shows.wins)}`);
  h += leagueTabs();
  if (nextFame) h += `<div class="row" style="margin:10px 0 0;gap:10px"><span class="small dim">Next rank: ${nextFame[1]}</span><div class="bar grow"><i style="width:${Math.min(100, (S.shows.fame - FAME_RANKS[rank][0]) / (nextFame[0] - FAME_RANKS[rank][0]) * 100)}%"></i></div><span class="small dim">${S.shows.fame}/${nextFame[0]}</span></div>`;
  h += `<div class="showwrap" style="margin-top:14px"><div><div class="scenewrap" style="position:relative"><canvas class="showscene"></canvas>${zoomCtl(false, true)}</div><div class="row" style="margin-top:8px"><div class="seg" style="margin:0"><button class="${!UI.showResult ? 'on' : ''}" data-act="showView" data-x="live">Live show</button><button class="${UI.showResult ? 'on' : ''}" data-act="showView" data-x="result" ${last ? '' : 'disabled'}>Last results</button></div><span class="dim small">Your entries glow gold. Ribbons go to the top three.</span></div></div>`;
  h += `<aside class="showpanel">`;
  if (!leagueOpen(L)) h += `<div class="card"><b>${L.icon} ${L.n}</b><div class="small dim" style="margin-top:6px">🔒 Needs store level ${L.lvl} and ${L.fame} fame (you have ${S.shows.fame}).</div></div>`;
  else if (sh) {
    const cat = SHOW_CATS[sh.cat], entries = sh.entries.map(getFish).filter(Boolean);
    h += `<div class="card"><div class="row"><b style="font-size:16px">${L.icon} ${L.n}</b><span class="grow"></span><span class="gold small" data-showt="${L.id}">${fmtDur((sh.closes - nowMs()) / 1000)}</span></div><div style="margin:8px 0"><span class="chip m2">${cat.icon} ${cat.n}</span> <span class="small dim">${cat.d}</span></div><div class="stats" style="margin:8px 0">${pill('Entry fee', fmt(L.fee))}${pill('1st', fmt(L.prizes[0]))}${pill('2nd', fmt(L.prizes[1]))}${pill('3rd', fmt(L.prizes[2]))}</div>`;
    h += entries.length ? entries.map(f => `<div class="tfrow" style="cursor:default"><div class="tfpic">${fishPic(f, 56)}</div><div class="grow" style="min-width:0"><div class="tfname">★ ${esc(f.name)}</div><div class="small dim tfsub">${esc(fishName(f))}</div></div><div class="small">≈ ${showScore(f, sh.cat)}</div></div>`).join('') : `<div class="dim small">No entries yet — rivals are scoring around ${Math.round(L.base * 0.55)}–${Math.round(L.base * 1.25)}.</div>`;
    h += `<div class="row" style="margin-top:10px">${btn(`Enter a fish (${entries.length}/3)`, 'showEnterPick', { x: L.id }, 'pri', entries.length >= 3)}</div></div>`;
    h += tourneyCard(L);
  }
  if (last && last.entered) h += `<div class="card" style="margin-top:12px"><b>Last result · ${L.n}</b><div class="small dim">${SHOW_CATS[last.cat].n} · ${last.money ? 'prize ' + fmt(last.money) + ' · ' : ''}+${last.fame} fame</div>${last.results.slice(0, 4).map(r => `<div class="row small" style="padding:2px 0"><span style="width:26px">#${r.place}</span><span class="grow ${r.you ? 'gold' : ''}">${r.you ? '★ ' : ''}${esc(r.name)} <span class="dim">${esc(fishName({ g: 1, sp: r.sp, mods: r.mods }))}</span></span><span>${r.score}</span></div>`).join('')}</div>`;
  h += `</aside></div>`;
  if (S.shows.log.length) h += `<h3>Show history</h3><div class="card">${S.shows.log.map(e => { const best = Math.min(...e.results.filter(r => r.you).map(r => r.place)); return `<div class="row" style="padding:5px 0"><span>${LEAGUE[e.league].icon}</span><span class="grow">${LEAGUE[e.league].n} · ${SHOW_CATS[e.cat].n}</span><span class="small ${best <= 3 ? 'gold' : 'dim'}">${best <= 3 ? ['🥇', '🥈', '🥉'][best - 1] : '#' + best}${e.money ? ' · ' + fmt(e.money) : ''}</span></div>`; }).join('')}</div>`;
  return h;
}
function fighterList(cat, action, data, base, fee) {
  const list = S.fish.filter(f => !showEligible(f, cat === 'fresh' || cat === 'salt' ? cat : 'grand')).map(f => ({ f, s: showScore(f, cat) })).sort((a, b) => b.s - a.s);
  if (!list.length) return '<p class="dim">You have no eligible fish: they must be fully grown, outside the store and not already entered.</p>';
  return list.slice(0, 40).map(({ f, s }) => `<div class="item"><div style="width:84px">${fishPic(f, 80)}</div><div class="grow">${fishTitle(f)}<div>${fishChips(f)}${medalChips(f)}</div><div class="small">Score ≈ <b>${s}</b> · ${verdict(s, base)}</div>${scoreBar(s, base)}</div>${btn(fee ? `Enter · ${fmt(fee)}` : 'Fight!', action, Object.assign({ y: f.id }, data), 'pri sm', fee && S.money < fee)}</div>`).join('');
}
function showEnterModal(lg) { const sh = S.shows.leagues[lg], L = LEAGUE[lg]; return `<h2>${L.icon} Enter ${L.n}</h2><p class="dim">${SHOW_CATS[sh.cat].icon} <b>${SHOW_CATS[sh.cat].n}</b> — ${SHOW_CATS[sh.cat].d} Typical rival score: about ${L.base}.</p>` + fighterList(sh.cat, 'showEnter', { x: lg }, L.base, L.fee); }
function tourneyModal() {
  const T = S.shows.tourney; if (!T || T.state !== 'active') { UI.modal = null; return ''; } const rd = T.rounds[T.r], L = LEAGUE[T.league];
  const list = fighterList(rd.cat, 'tourneyFight', {}, rd.rival.score, 0).replace(/data-y="([^"]+)"/g, (m, id) => (T.used.includes(id) ? 'data-y="' + id + '" aria-disabled="true"' : m));
  return `<h2>⚔️ Round ${T.r + 1}: ${SHOW_CATS[rd.cat].icon} ${SHOW_CATS[rd.cat].n}</h2><p class="dim">You face ${esc(rd.rival.name)}'s ${esc(fishName({ g: 1, sp: rd.rival.sp, mods: rd.rival.mods }))} (strength ≈ ${rd.rival.score}). Pick a fish that has not fought yet — the judges are a little unpredictable.</p>` + list;
}

/* ---------------- daily quests & streaks ---------------- */
function untilMidnight() { const d = new Date(nowMs()); const n = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); return (n - d) / 1000; }
function streakRow() {
  const day = (S.streak.days - 1) % 7, claimed = !loginClaimable(), m = DAILY_MONEY[Math.max(1, Math.min(10, level()))] * streakMult();
  return `<div class="streakrow">${LOGIN_REWARDS.map((r, i) => `<div class="sday ${i < day || (i === day && claimed) ? 'done' : ''} ${i === day ? 'cur' : ''}"><div class="dn">Day ${i + 1}</div><div class="dr">${r.t(m)}</div></div>`).join('')}</div>`;
}
function viewDaily() {
  const done = S.daily.quests.filter(q => q.claimed).length, m = streakMult();
  let h = pageHead('Daily', 'Log in every day to build a streak, and finish three quests a day for rewards. New quests arrive at midnight.', `${pill('Streak', S.streak.days + ' 🔥')}${pill('Best', S.streak.best)}${pill('Shields', S.streak.shields + ' 🛡️')}`);
  h += `<div class="card streakcard"><div class="row"><b style="font-size:17px">Login streak</b><span class="grow"></span><span class="small dim">Quest rewards ×${m.toFixed(2)} · a shield saves one missed day</span></div>${streakRow()}<div class="row" style="margin-top:12px">${loginClaimable() ? btn('Claim today\'s reward', 'claimLogin', {}, 'pri') : '<span class="good">✔ Today\'s reward claimed — come back tomorrow!</span>'}</div></div>`;
  h += `<h3>Today's quests · ${done}/3 <span class="dim small" style="font-weight:400">new quests in ${fmtDur(untilMidnight())}</span></h3>`;
  h += S.daily.quests.map((q, i) => { const T = DAILY_TYPES[q.type], p = questProgress(q), fin = p >= q.goal; return `<div class="card cust"><div class="eico">${fin ? '✅' : '📋'}</div><div class="grow"><b>${T.t(q.goal)}</b><div class="bar" style="margin-top:7px;max-width:260px"><i data-quest="${i}" style="width:${p / q.goal * 100}%"></i></div><div class="small dim" data-questt="${i}">${q.type === 'earn' ? fmt(p) + ' / ' + fmt(q.goal) : p + ' / ' + q.goal}</div></div><div style="text-align:right"><div class="gold" style="font-weight:700">${fmt(Math.round(q.reward * m))}</div></div>${q.claimed ? '<span class="good small">Claimed</span>' : btn('Claim', 'claimQuest', { x: i }, 'pri', !fin)}</div>`; }).join('');
  const allDone = S.daily.quests.length && S.daily.quests.every(q => q.claimed);
  h += `<div class="card" style="margin-top:12px;border-color:rgba(255,194,74,.4)"><div class="row"><div class="eico">🎁</div><div class="grow"><b>Daily bonus chest</b><div class="small dim">Finish all three quests: a Mutagen Elixir, 2 eggs and a pile of cash.</div></div>${S.daily.bonus ? '<span class="good small">Claimed</span>' : btn('Open chest', 'claimDailyBonus', {}, 'pri', !allDone)}</div></div>`;
  h += `<h3>Streak milestones</h3><div class="grid sm">${STREAK_MILESTONES.map(([d, b]) => `<div class="card ach ${S.streak.best >= d ? 'done' : ''}"><div class="row"><b class="grow">${S.streak.best >= d ? '✓ ' : ''}${d}-day streak</b><span class="gold small">+${Math.round(b * 100)}% value</span></div><div class="small dim">Permanent bonus on every fish</div><div class="bar" style="margin-top:8px"><i style="width:${Math.min(100, S.streak.best / d * 100)}%"></i></div></div>`).join('')}</div>`;
  return h;
}
function dailyModal() {
  const c = loginClaimable(), day = (S.streak.days - 1) % 7;
  return `<h2>🔥 Day ${S.streak.days} of your streak</h2><p class="dim">${c ? 'Welcome back! Your daily reward is waiting.' : 'You already claimed today\'s reward.'}</p>${streakRow()}<div class="row" style="margin-top:14px">${c ? btn('Claim reward', 'claimLogin', {}, 'pri') : ''}${btn('Daily quests', 'goDaily', {}, '')}${btn('Close', 'closeModal')}</div>`;
}
