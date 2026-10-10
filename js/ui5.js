'use strict';
/* ===== Home: living room, garden pond and aquarium gallery (v1.3) ===== */


function estatePerkPills() {
  const v = estatePerk('value'), gr = estatePerk('growth'), m = estatePerk('mod');
  return [v ? pill('Fish value', '+' + Math.round(v * 100) + '%') : '', gr ? pill('Growth', '+' + Math.round(gr * 100) + '%') : '', m ? pill('Modifier chance', '+' + Math.round(m * 100) + '%') : ''].join('');
}
function estateCard(a) {
  const l = estLvl(a.id), nx = estNext(a.id);
  let h = `<div class="card estcard"><div class="row"><b style="font-size:16px">${a.icon} ${l ? a.levels[l - 1].n : a.n}</b><span class="grow"></span><span class="pips">${a.levels.map((x, i) => `<i class="${i < l ? 'on' : ''}" title="${x.n}"></i>`).join('')}</span></div>`;
  h += `<div class="small dim" style="margin:6px 0 10px">${a.d}</div>`;
  if (l) h += `<div class="small">Current perk: <b class="good">+${Math.round(a.levels[l - 1].perk * 100)}% ${a.perkText}</b></div>`;
  if (nx) h += `<div class="estnext"><div><b>${nx.first ? 'Build' : 'Upgrade to'} ${nx.name}</b></div><div class="small dim">+${Math.round(nx.perk * 100)}% ${a.perkText}${nx.locked ? ` · needs store level ${nx.req}` : ''}</div><div style="margin-top:8px">${btn(`${nx.first ? 'Build' : 'Upgrade'} · ${fmt(nx.cost)}`, 'estBuy', { x: a.id }, 'pri', nx.locked || S.money < nx.cost)}</div></div>`;
  else h += `<div class="good small" style="margin-top:8px;font-weight:600">★ Fully upgraded</div>`;
  return h + `</div>`;
}
function hofPanel(area) {
  const list = hofFor(area), cap = area === 'living' ? 20 : 16;
  let h = `<h3 style="margin-top:14px">Hall of fame · ${list.length}/${cap}</h3>`;
  if (!list.length) h += `<div class="empty">${area === 'living' ? 'Grow a fish to adulthood and it will move in here. The more valuable it is, the better its spot in the ranking.' : `Your next-best ${area === 'garden' ? 'freshwater' : 'saltwater'} fish move in here once the living room tank is full (20 fish).`}</div>`;
  list.forEach((e, i) => { h += `<div class="hofrow"><span class="rank">${i + 1}</span><div class="hofpic">${fishSVG(e.sp, e.mods, 52)}</div><div class="grow" style="min-width:0"><div class="tfname">${esc(e.name)}</div><div class="small dim tfsub">${esc(e.label)}${e.gen ? ' · Gen ' + e.gen : ''}</div></div><div class="gold small">${fmt(e.value)}</div></div>`; });
  return h;
}
function viewHome() {
  const area = UI.homeArea || 'living', a = ESTATE_BY_ID[area], l = estLvl(area);
  let h = pageHead('Home', 'Your estate. The fish you are proudest of — even the ones you sold — live here. Upgrade each area for a permanent perk.', `<div class="stats" style="margin:0">${estatePerkPills()}</div>`);
  h += `<div class="seg estseg">${ESTATE.map(x => { const lv = estLvl(x.id); return `<button class="${area === x.id ? 'on' : ''}" data-act="homeArea" data-x="${x.id}">${x.icon} ${x.n} <span class="dim small">${lv ? 'Lv ' + lv : '🔒'}</span></button>`; }).join('')}</div>`;
  if (!l) {
    const nx = estNext(area);
    return h + `<div class="card estlock"><div style="font-size:54px">${a.icon}</div><h2 style="margin:6px 0">${a.n}</h2><p class="dim">${a.d}</p>${estateCard(a)}<div class="small dim" style="margin-top:10px">${a.levels.map((x, i) => `Level ${i + 1} · ${x.n} — +${Math.round(x.perk * 100)}% ${a.perkText} (store level ${x.req}, ${fmt(x.cost)})`).join('<br>')}</div></div>`;
  }
  const cls = { living: 'homescene', garden: 'gardenscene', gallery: 'galleryscene' }[area];
  h += `<div class="homewrap"><div><div class="scenewrap" style="position:relative"><canvas class="${cls}"></canvas>${zoomCtl(false, true)}</div><div class="dim small" style="margin-top:8px">🖱 Click a fish to boop it · hold the mouse button to wave a lure the fish will follow · quickly tap the water to sprinkle food</div></div>`;
  h += `<aside class="hofpanel">${estateCard(a)}${hofPanel(area)}</aside></div>`;
  return h;
}
Object.assign(ACT4, {
  homeArea: d => { UI.homeArea = d.x; },
  estBuy: d => { const r = res(buyEstate(d.x)); if (r.ok) { Sfx.play('level'); toast(`${ESTATE_BY_ID[d.x].icon} ${ESTATE_BY_ID[d.x].levels[r.lvl - 1].n} is ready!`, 'gold'); } },
});
