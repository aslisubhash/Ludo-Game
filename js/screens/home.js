// Home: who can I play, how fast can I start, what can I win.
import { html, esc, onTap, icon, coinSvg, fmt, toast, sheet } from '../core/ui.js';
import { store, levelInfo } from '../core/store.js';
import { go } from '../core/router.js';
import { bus } from '../core/events.js';
import { rpick, rbetween } from '../core/rng.js';
import { Dice } from '../game/dice.js';
import { boardSvg } from '../game/board-view.js';
import { onlineNow, getCharacter, activePlayersCount } from '../content/characters.js';
import { liveEvents, daysLeft, upcomingEvent } from '../content/events-calendar.js';
import { ota } from '../content/ota.js';
import { dailyStatus, missionDefs, eventState, recentOpponents } from '../core/progress.js';
import { DAILY_TRACK } from '../content/catalog.js';
import { topBar, charAvatar, quickCard, profileSheet, rewardChip } from './components.js';
import { openNotifications, openSettings, openDailyReward, openPrivateRoom } from './overlays.js';

export function homeScreen() {
  const el = html('<section class="home"></section>');
  const timers = [];
  let dice;

  function render() {
    const online = onlineNow(8);
    const recent = recentOpponents(8).map((r) => ({ ...r, c: getCharacter(r.id) })).filter((r) => r.c);
    const events = liveEvents();
    const daily = dailyStatus();
    const missions = missionDefs();
    const lv = levelInfo();
    const banners = [...events.map((e) => ({ type: 'event', e })), ...ota.banners.map((b) => ({ type: 'banner', b }))];
    const next = upcomingEvent();

    el.innerHTML = `
      ${topBar()}
      <div class="scroll">
        <div class="pad">
          <div class="hero">
            <div class="hero-board"><div class="hb-tilt">${boardSvg(store.s.equipped.board)}</div>
              <i class="float-token ft1"></i><i class="float-token ft2"></i><i class="float-token ft3"></i><i class="float-token ft4"></i></div>
            <div class="hero-dice"></div>
            <div class="hero-live"><span class="live-dot"></span><b class="num" data-active>${activePlayersCount()}</b> players active · <b class="num" data-matches>${Math.round(activePlayersCount() / 2.6)}</b> matches now</div>
          </div>
          <button class="btn primary xl block play-now" data-act="play">PLAY NOW</button>
          <div class="ticker"><span class="ticker-text"></span></div>

          <div class="modes">
            <button class="mode pressable" data-mode="2p"><span class="mode-ico">⚔️</span><b>2 PLAYER</b><small>Quick duel</small></button>
            <button class="mode pressable" data-mode="4p"><span class="mode-ico">👑</span><b>4 PLAYER</b><small>Classic chaos</small></button>
            <button class="mode pressable" data-mode="local"><span class="mode-ico">🤝</span><b>FRIENDS</b><small>Pass &amp; play</small></button>
            <button class="mode pressable" data-mode="private"><span class="mode-ico">🔐</span><b>PRIVATE</b><small>Pick rivals</small></button>
          </div>

          <div class="section-head"><div class="eyebrow">Players online</div><button class="link" data-act="discover">See all</button></div>
          <div class="rail online-rail">${online.map((c) => `
            <button class="online-card pressable" data-char="${c.id}">${charAvatar(c, { size: 64, online: true })}<b class="ellipsis">${esc(c.name)}</b><small>Lv ${c.level}</small></button>`).join('')}</div>

          ${recent.length ? `
          <div class="section-head"><div class="eyebrow">Continue playing</div></div>
          <div class="rail">${recent.map(({ c, won, lost }) => `
            <button class="recent-card card pressable" data-rematch="${c.id}">${charAvatar(c, { size: 44 })}
              <div class="grow"><b class="ellipsis">${esc(c.name)}</b><small class="${won >= lost ? 'win' : 'loss'}">You ${won}–${lost}</small></div>
              <span class="mini-play">${icon.play}</span></button>`).join('')}</div>` : ''}

          <div class="section-head"><div class="eyebrow">Live events</div>${next ? `<span class="dim" style="font-size:12px">Next: ${esc(next.name)}</span>` : ''}</div>
          <div class="banner-rail rail">${banners.map((x) => x.type === 'event' ? eventBanner(x.e) : otaBanner(x.b)).join('')}</div>

          <div class="section-head"><div class="eyebrow">Daily reward</div><span class="dim" style="font-size:12px">Day ${daily.streakDay}</span></div>
          <button class="daily-card card pressable" data-act="daily">
            <div class="daily-track">${DAILY_TRACK.map((r, i) => `<i class="${i < daily.idx || (i === daily.idx && !daily.available) ? 'done' : i === daily.idx ? 'today' : ''} ${r.big ? 'big' : ''}">${r.kind ? '🎁' : i + 1}</i>`).join('')}</div>
            <div class="row" style="justify-content:space-between;margin-top:12px">
              <div><b>${daily.available ? 'Your reward is ready!' : 'Come back tomorrow'}</b><div class="dim" style="font-size:12px">${daily.available ? 'Tap to open' : `Day ${daily.streakDay + 1} unlocks next`}</div></div>
              ${daily.available ? '<span class="btn go sm">CLAIM</span>' : '<span class="pill-tag">✓ Claimed</span>'}
            </div>
          </button>

          <div class="section-head"><div class="eyebrow">Today's missions</div><button class="link" data-act="rewards">All rewards</button></div>
          <div class="col">${missions.slice(0, 3).map((m) => `
            <div class="mission card ${m.claimed ? 'claimed' : m.progress >= m.goal ? 'ready' : ''}">
              <div class="grow"><b>${esc(m.text)}</b><div class="bar" style="margin-top:8px"><i style="width:${(m.progress / m.goal) * 100}%"></i></div></div>
              <div class="m-side"><span class="num">${m.progress}/${m.goal}</span>${rewardChip(m.reward)}</div>
            </div>`).join('')}</div>

          <div class="lv-teaser card">
            <div class="row"><span class="lv-badge">LV ${lv.level}</span><div class="grow"><div class="bar xp"><i style="width:${Math.round(lv.pct * 100)}%"></i></div></div><span class="dim num" style="font-size:12px">${lv.into}/${lv.need} XP</span></div>
          </div>
          <div style="height:24px"></div>
        </div>
      </div>`;

    dice = new Dice({ size: 72, skin: store.s.equipped.dice, interactive: true });
    el.querySelector('.hero-dice').appendChild(dice.el);
    dice.show(6);
    dice.el.addEventListener('click', () => dice.roll(1 + Math.floor(Math.random() * 6)));
  }

  function eventBanner(e) {
    const st = eventState(e);
    const pct = Math.min(100, (st.progress / e.goal.count) * 100);
    return `<button class="event-banner pressable art-${e.art}" data-event="${e.id}" style="--ea:${e.theme.a};--eb:${e.theme.b}">
      <div class="eb-art"></div>
      <div class="eb-body"><div class="eb-tag">LIVE · ${daysLeft(e)}d left</div><div class="eb-title display">${esc(e.title)}</div><div class="eb-sub">${esc(e.sub)}</div>
      <div class="row" style="gap:8px;margin-top:10px"><div class="bar gold grow"><i style="width:${pct}%"></i></div><span class="num" style="font-size:12px">${st.progress}/${e.goal.count}</span></div></div>
    </button>`;
  }
  function otaBanner(b) {
    return `<button class="event-banner pressable art-${b.art || 'bolt'}" data-banner="${esc(b.action || 'rewards')}" style="--ea:${b.a || '#7B5CFF'};--eb:${b.b || '#FF7A2F'}">
      <div class="eb-art"></div><div class="eb-body"><div class="eb-tag">${esc(b.tag || 'NEW')}</div><div class="eb-title display">${esc(b.title)}</div><div class="eb-sub">${esc(b.sub || '')}</div></div></button>`;
  }

  /* ---------- Live world ticker ---------- */
  function tickerLine() {
    const c = rpick(onlineNow(40));
    const lines = [
      `<b>${esc(c.name)}</b> just won a match`,
      `<b>${esc(c.name)}</b> is on a ${rbetween(3, 6)}-win streak 🔥`,
      `<b>${esc(c.name)}</b> is looking for a match`,
      `<b>${esc(c.name)}</b> won with 3 tokens home`,
      `<b>${esc(c.name)}</b> reached Level ${c.level + 1}`,
      `<b>${esc(c.name)}</b> unlocked Galaxy Dice ✨`,
      `<b>${esc(c.name)}</b> pulled off a photo finish 😱`,
      ...(ota.activity || []).map((x) => esc(x)),
    ];
    return rpick(lines);
  }

  function startTicker() {
    const t = el.querySelector('.ticker-text');
    const set = () => {
      if (!t.isConnected) return;
      t.classList.remove('in');
      void t.offsetWidth;
      t.innerHTML = tickerLine();
      t.classList.add('in');
    };
    set();
    timers.push(setInterval(set, 5200));
    timers.push(setInterval(() => {
      const a = el.querySelector('[data-active]');
      const m = el.querySelector('[data-matches]');
      if (!a) return;
      const n = activePlayersCount();
      a.textContent = n;
      m.textContent = Math.round(n / 2.6);
    }, 4000));
    // Gently cycle event banners
    const rail = el.querySelector('.banner-rail');
    timers.push(setInterval(() => {
      if (!rail || rail.matches(':hover')) return;
      const w = rail.clientWidth;
      const nextX = rail.scrollLeft + w * 0.86 >= rail.scrollWidth - 4 ? 0 : rail.scrollLeft + w * 0.86;
      rail.scrollTo({ left: nextX, behavior: 'smooth' });
    }, 6500));
  }

  const openChar = (c) => quickCard(c, {
    onPlay: (x) => go('matchmaking', { mode: '2p', target: x.id }),
    onProfile: (x) => profileSheet(x, { onPlay: (y) => go('matchmaking', { mode: '2p', target: y.id }), onChat: (y) => go('thread', { id: y.id }) }),
  });

  onTap(el, '[data-act]', (b) => {
    const a = b.dataset.act;
    if (a === 'play') go('matchmaking', { mode: '2p' }, { transition: 'fade' });
    if (a === 'discover') go('play', { focus: 'discover' }, { transition: 'fade', replace: true });
    if (a === 'rewards') go('rewards', {}, { transition: 'fade', replace: true });
    if (a === 'profile') go('profile', {}, { transition: 'fade', replace: true });
    if (a === 'notifications') openNotifications();
    if (a === 'settings') openSettings();
    if (a === 'daily') openDailyReward({ onDone: render });
  });
  onTap(el, '[data-mode]', (b) => {
    const m = b.dataset.mode;
    if (m === 'local') go('game', { mode: 'local' }, { transition: 'zoom' });
    else if (m === 'private') openPrivateRoom();
    else go('matchmaking', { mode: m }, { transition: 'fade' });
  });
  onTap(el, '[data-char]', (b) => { const c = getCharacter(b.dataset.char); if (c) openChar(c); });
  onTap(el, '[data-rematch]', (b) => go('matchmaking', { mode: '2p', target: b.dataset.rematch }, { transition: 'fade' }));
  onTap(el, '[data-event],[data-banner]', (b) => go('rewards', {}, { transition: 'fade', replace: true }));

  const off = bus.on('store', () => {
    const coins = el.querySelector('[data-coins]');
    if (coins) coins.textContent = fmt(store.s.coins);
  });

  render();
  return {
    el,
    nav: true,
    tab: 'home',
    onEnter() { startTicker(); },
    onLeave() { timers.forEach(clearInterval); off(); },
  };
}
