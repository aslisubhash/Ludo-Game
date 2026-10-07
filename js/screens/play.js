// PLAY tab: game modes on top, then DISCOVER PLAYERS — a browsable grid of the cast.
import { html, esc, onTap, icon } from '../core/ui.js';
import { store } from '../core/store.js';
import { go } from '../core/router.js';
import { allCharacters, onlineNow, isOnline, getCharacter, hasPortrait } from '../content/characters.js';
import { ARCHETYPES } from '../content/personalities.js';
import { topBar, charAvatar, profileSheet } from './components.js';
import { openNotifications, openSettings, openPrivateRoom } from './overlays.js';

const FILTERS = [
  { id: 'online', label: '● Online' },
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'rivals', label: 'Rivals' },
  { id: 'competitive', label: '🔥 Competitive', match: ['competitive', 'risky', 'challenger', 'confident'] },
  { id: 'chill', label: '😊 Chill', match: ['friendly', 'calm', 'playful', 'emoji', 'funny'] },
  { id: 'pro', label: '🎯 Pro', test: (c) => c.level >= 30 },
  { id: 'rookie', label: '🌱 Rookies', test: (c) => c.level < 10 },
];

export function playScreen(params = {}) {
  const el = html(`<section class="play">
    ${topBar()}
    <div class="scroll"><div class="pad">
      <div class="play-hero">
        <div class="eyebrow">Choose your game</div>
        <button class="mode-big pressable" data-mode="2p"><div><b class="display">QUICK MATCH</b><small>1v1 · ~5 min · +250 coins</small></div><span class="mb-ico">⚔️</span></button>
        <div class="mode-grid">
          <button class="mode pressable m-gold" data-mode="4p"><span class="mode-ico">👑</span><b>4 PLAYER</b><small>+400 coins</small></button>
          <button class="mode pressable m-green" data-mode="local"><span class="mode-ico">🤝</span><b>WITH FRIEND</b><small>Pass &amp; play</small></button>
          <button class="mode pressable m-violet" data-mode="private"><span class="mode-ico">🔐</span><b>PRIVATE ROOM</b><small>Pick your rivals</small></button>
          <button class="mode pressable m-red" data-mode="rematch"><span class="mode-ico">🔁</span><b>RIVALS</b><small>Players you know</small></button>
        </div>
      </div>
      <div class="section-head" id="discover"><div class="h2">Discover players</div><span class="dim count-label"></span></div>
      <div class="search-box">${icon.search}<input placeholder="Search ${allCharacters().length} players" maxlength="20"></div>
      <div class="rail filter-rail">${FILTERS.map((f, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-f="${f.id}">${f.label}</button>`).join('')}</div>
      <div class="player-grid"></div>
      <div class="grid-sentinel"></div>
    </div></div>
  </section>`);

  let filter = 'online';
  let query = '';
  let list = [];
  let shown = 0;
  const grid = el.querySelector('.player-grid');
  const PAGE = 24;

  function compute() {
    const f = FILTERS.find((x) => x.id === filter);
    const online = new Set(onlineNow(80).map((c) => c.id));
    let base = filter === 'online' ? onlineNow(80) : allCharacters();
    if (filter === 'new') base = base.filter((c) => c.isNew || c.idx >= allCharacters().length - 40);
    if (filter === 'rivals') base = base.filter((c) => store.s.rel[c.id]);
    if (f.match) base = base.filter((c) => f.match.includes(c.archetype));
    if (f.test) base = base.filter(f.test);
    if (query) base = base.filter((c) => c.name.toLowerCase().includes(query) || c.handle.includes(query));
    // Online + painted portraits first: the best-looking, most playable cards lead.
    list = base.slice().sort((a, b) => (online.has(b.id) - online.has(a.id)) || (hasPortrait(b) - hasPortrait(a)) || (b.level - a.level));
    shown = 0;
    grid.innerHTML = '';
    el.querySelector('.count-label').textContent = `${list.length} players`;
    more();
  }

  function more() {
    const slice = list.slice(shown, shown + PAGE);
    shown += slice.length;
    grid.insertAdjacentHTML('beforeend', slice.map(card).join(''));
    if (!list.length) grid.innerHTML = '<div class="empty">No players match. Try another filter.</div>';
  }

  function card(c) {
    const on = isOnline(c);
    return `<div class="pcard" data-char="${c.id}">
      <div class="pcard-art">${charAvatar(c, { size: 72, online: on })}${c.isNew ? '<span class="new-tag">NEW</span>' : ''}</div>
      <b class="ellipsis">${esc(c.name)}</b>
      <div class="pcard-meta"><span>Lv ${c.level}</span><span>${c.winRate}%</span></div>
      <div class="pcard-tag ellipsis">${esc(c.tag)}</div>
      <div class="pcard-status ${on ? 'on' : ''}">${on ? 'Online' : 'Away'}</div>
      <div class="pcard-actions"><button class="btn ghost sm" data-prof="${c.id}">PROFILE</button><button class="btn primary sm" data-playc="${c.id}">PLAY</button></div>
    </div>`;
  }

  const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting) && shown < list.length) more(); }, { root: el.querySelector('.scroll'), rootMargin: '400px' });
  io.observe(el.querySelector('.grid-sentinel'));

  onTap(el, '[data-f]', (b) => {
    filter = b.dataset.f;
    el.querySelectorAll('[data-f]').forEach((x) => x.classList.toggle('on', x === b));
    compute();
  });
  el.querySelector('.search-box input').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); compute(); });
  onTap(el, '[data-mode]', (b) => {
    const m = b.dataset.mode;
    if (m === 'local') go('game', { mode: 'local' }, { transition: 'zoom' });
    else if (m === 'private') openPrivateRoom();
    else if (m === 'rematch') { filter = 'rivals'; el.querySelectorAll('[data-f]').forEach((x) => x.classList.toggle('on', x.dataset.f === 'rivals')); compute(); el.querySelector('#discover').scrollIntoView({ behavior: 'smooth' }); }
    else go('matchmaking', { mode: m }, { transition: 'fade' });
  });
  onTap(el, '[data-playc]', (b) => go('matchmaking', { mode: '2p', target: b.dataset.playc }, { transition: 'fade' }));
  onTap(el, '[data-prof]', (b) => {
    const c = getCharacter(b.dataset.prof);
    profileSheet(c, { onPlay: (x) => go('matchmaking', { mode: '2p', target: x.id }), onChat: (x) => go('thread', { id: x.id }) });
  });
  onTap(el, '[data-act]', (b) => {
    const a = b.dataset.act;
    if (a === 'profile') go('profile', {}, { transition: 'fade', replace: true });
    if (a === 'notifications') openNotifications();
    if (a === 'settings') openSettings();
  });

  return {
    el,
    nav: true,
    tab: 'play',
    onEnter() {
      compute();
      if (params.focus === 'discover') setTimeout(() => el.querySelector('#discover').scrollIntoView({ behavior: 'smooth' }), 250);
    },
    onLeave() { io.disconnect(); },
  };
}
