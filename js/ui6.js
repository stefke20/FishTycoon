'use strict';
/* ===== Story cards and the journal ===== */

function storyModal(m) {
  const c = CHAPTER[m.id]; if (!c) { UI.modal = null; return ''; }
  const card = c.cards[m.page] || c.cards[0], who = STORY_CAST[card.who] || STORY_CAST.narr, last = m.page >= c.cards.length - 1, idx = CHAPTERS.indexOf(c) + 1;
  const img = storyArt(card.art);
  return `<div class="storycard" style="--sky1:${c.sky[0]};--sky2:${c.sky[1]}"><div class="storyart">${img ? `<img src="${img}" alt="" draggable="false">` : '<div class="dim" style="padding:60px;text-align:center">(the picture needs WebGL)</div>'}<div class="storychap">Chapter ${idx} · ${esc(c.n)}</div></div>
    <div class="storybody"><div class="storyspeaker" style="color:${who.c}">${who.n ? esc(who.n) : '&nbsp;'}${who.tag ? ` <span class="small dim">· ${who.tag}</span>` : ''}</div><p class="storytext ${card.who === 'narr' ? 'narr' : ''}">${esc(card.t)}</p>
    ${last && m.reward ? `<div class="storyreward">🎁 Chapter reward: <b class="gold">${esc(m.reward)}</b></div>` : ''}
    <div class="row" style="margin-top:12px"><span class="storydots">${c.cards.map((x, i) => `<i class="${i === m.page ? 'on' : ''}"></i>`).join('')}</span><span class="grow"></span>${m.page > 0 ? btn('◂ Back', 'storyBack', {}, 'ghost sm') : ''}${last ? '' : btn('Skip', 'closeModal', {}, 'ghost sm')}${btn(last ? 'Continue' : 'Next ▸', last ? 'closeModal' : 'storyNext', {}, 'pri')}</div></div></div>`;
}
function journalPanel() {
  const done = CHAPTERS.filter(c => S.story.done[c.id]).length;
  return `<div class="card"><div class="small dim" style="margin-bottom:8px">The story of Uncle Barnaby’s shop — ${done} of ${CHAPTERS.length} chapters read. New chapters arrive as you reach milestones.</div>` + CHAPTERS.map((c, i) => S.story.done[c.id]
    ? `<div class="item"><div class="newic" style="font-size:20px">📖</div><div class="grow"><b>${i + 1}. ${esc(c.n)}</b><div class="small dim">${c.cards.length} card${c.cards.length > 1 ? 's' : ''}</div></div>${btn('Read again', 'storyReplay', { x: c.id }, 'sm')}</div>`
    : `<div class="item" style="opacity:.55"><div class="newic" style="font-size:20px">🔒</div><div class="grow"><b>${i + 1}. ???</b><div class="small dim">${esc(c.hint)}</div></div></div>`).join('') + `</div>`;
}
Object.assign(ACT4, {
  storyNext: () => { UI.modal.page++; Sfx.play('click'); },
  storyBack: () => { UI.modal.page = Math.max(0, UI.modal.page - 1); },
  storyReplay: d => { UI.modal = { type: 'story', id: d.x, page: 0, reward: null }; Sfx.play('card'); },
});
