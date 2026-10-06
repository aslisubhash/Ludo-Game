// Overlays: daily reward, notifications, settings, private room, welcome back,
// what's new (OTA) and the branded connection-lost hold screen.
import { html, esc, onTap, sheet, modal, icon, toast, ago, coinSvg, wait } from '../core/ui.js';
import { store, levelInfo, relationship, pushNotification } from '../core/store.js';
import { sfx, haptic, celebrate, burstAt } from '../core/fx.js';
import { go } from '../core/router.js';
import { bus } from '../core/events.js';
import { claimDaily, dailyStatus, claimDailyAdBonus, describeReward, missionsReady, recentOpponents } from '../core/progress.js';
import { showRewarded, adsAvailable } from '../ads/ads.js';
import { DAILY_TRACK, findItem } from '../content/catalog.js';
import { onlineNow, getCharacter, isOnline } from '../content/characters.js';
import { ota } from '../content/ota.js';
import { Dice } from '../game/dice.js';
import { charAvatar, meAvatar, EMBLEMS } from './components.js';
import { activeMatch } from './game.js';

/* ---------- Daily reward ---------- */
export function openDailyReward({ onDone } = {}) {
  const st = dailyStatus();
  const m = modal(`<div class="daily">
    <div class="eyebrow center">Daily reward</div>
    <div class="display daily-day center">DAY ${st.streakDay}</div>
    <div class="daily-grid">${DAILY_TRACK.map((r, i) => `<div class="dg ${i < st.idx ? 'done' : ''} ${i === st.idx ? 'today' : ''} ${r.big ? 'big' : ''}">
      <small>Day ${i + 1}</small><span>${r.kind ? '🎁' : coinSvg}</span><b>${r.kind ? esc(findItem(r.kind, r.id)?.name || findItem(r.kind, r.id)?.text || '') : r.coins}</b></div>`).join('')}</div>
    <div class="gift-box ${st.available ? '' : 'opened'}"><div class="gift-lid"></div><div class="gift-body"></div><div class="gift-glow"></div></div>
    <div class="daily-msg center muted">${st.available ? 'Tap the box to open' : 'Already claimed today — see you tomorrow!'}</div>
    <div class="daily-actions"></div>
  </div>`, { cls: 'daily-modal', onClose: onDone });
  const box = m.el.querySelector('.gift-box');
  const actions = m.el.querySelector('.daily-actions');
  if (!st.available) {
    actions.innerHTML = '<button class="btn ghost block" data-a="close">Close</button>';
  }
  box.addEventListener('click', async () => {
    if (!dailyStatus().available || box.classList.contains('opening')) return;
    box.classList.add('opening');
    sfx('roll');
    haptic([10, 30, 10, 30]);
    await wait(700);
    const got = claimDaily();
    box.classList.add('opened');
    burstAt(box, { count: 40, speed: 7 });
    sfx('coin');
    m.el.querySelector('.daily-msg').innerHTML = `<b class="daily-got">${got.item ? `🎁 ${esc(describeReward(got.item))}` : `+${got.coins} coins`}</b>`;
    actions.innerHTML = `${adsAvailable() ? `<button class="btn violet block" data-a="ad"><span class="ad-chip">AD</span> WATCH FOR +200 BONUS</button>` : ''}<button class="btn primary lg block" data-a="close" style="margin-top:10px">COLLECT</button>`;
  });
  onTap(m.el, '[data-a]', async (b) => {
    if (b.dataset.a === 'close') m.close();
    if (b.dataset.a === 'ad') {
      b.disabled = true;
      if (await showRewarded('daily_bonus')) { claimDailyAdBonus(); sfx('coin'); toast('+200 bonus coins', { icon: '🪙' }); b.remove(); }
      else b.disabled = false;
    }
  });
}

/* ---------- Notifications ---------- */
export function openNotifications() {
  const list = store.s.notifications;
  const s = sheet(`<div class="row" style="justify-content:space-between;margin-bottom:12px"><div class="h2">Notifications</div>${list.length ? '<button class="link dim" data-a="clear">Clear all</button>' : ''}</div>
    <div class="notif-list">${list.length ? list.map((n) => notifCard(n)).join('') : '<div class="empty">You’re all caught up ✨</div>'}</div>`, { cls: 'sheet-tall' });
  store.update((st) => { st.notifications.forEach((n) => { n.read = true; }); });
  onTap(s.el, '[data-a="clear"]', () => { store.update((st) => { st.notifications = []; }); s.close(); });
  onTap(s.el, '[data-n]', (b) => {
    const n = list.find((x) => x.id === b.dataset.n);
    s.close();
    if (!n?.action) return;
    if (n.action.startsWith('play:')) go('matchmaking', { mode: '2p', target: n.action.slice(5) });
    else if (n.action.startsWith('chat:')) go('thread', { id: n.action.slice(5) });
    else go(n.action, {}, { transition: 'fade', replace: true });
  });
}

function notifCard(n) {
  const c = n.char ? getCharacter(n.char) : null;
  const ico = { level: '⭐', reward: '🎁', rematch: '🔁', online: '🟢', event: '🎉', unlock: '✨', mission: '🎯' }[n.kind] || '🔔';
  return `<button class="notif ${n.read ? '' : 'unread'}" data-n="${n.id}">${c ? charAvatar(c, { size: 40, online: n.kind === 'online' }) : `<span class="notif-ico">${ico}</span>`}
    <div class="grow"><b>${esc(n.title)}</b><div class="dim">${esc(n.body || '')}</div></div><small class="dim">${ago(n.t)}</small></button>`;
}

/* ---------- Settings ---------- */
export function openSettings() {
  const st = store.s.settings;
  const toggle = (k, label, sub) => `<label class="set-row"><div><b>${label}</b><div class="dim">${sub}</div></div><input type="checkbox" class="switch" data-k="${k}" ${st[k] ? 'checked' : ''}></label>`;
  const s = sheet(`<div class="h2" style="margin-bottom:10px">Settings</div>
    ${toggle('sound', 'Sound effects', 'Dice, moves and celebrations')}
    ${toggle('haptics', 'Haptics', 'Vibration on supported devices')}
    ${toggle('reducedMotion', 'Reduce motion', 'Calmer animations, no particles')}
    ${toggle('chatBubbles', 'Chat bubbles', 'Show messages over the dock in matches')}
    <div class="set-row"><div><b>Content version</b><div class="dim">Live content updates automatically</div></div><span class="pill-tag">v${ota.version}</span></div>
    <div class="set-note dim">All characters in Ludo Universe are fictional game characters. Dice rolls always use secure randomness — ads and purchases never affect outcomes.</div>
    <button class="btn ghost block" data-a="reset" style="margin-top:12px">Reset progress</button>`, { cls: 'sheet-compact' });
  s.el.addEventListener('change', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    store.update((x) => { x.settings[k] = e.target.checked; });
    if (k === 'reducedMotion') document.documentElement.dataset.reducedMotion = e.target.checked ? '1' : '0';
  });
  onTap(s.el, '[data-a="reset"]', () => {
    const m = modal(`<div class="h2 center">Reset all progress?</div><p class="muted center">Coins, levels, collection and chats will be cleared.</p>
      <div class="col" style="margin-top:12px"><button class="btn primary block" data-r="no">Keep my progress</button><button class="btn ghost block" data-r="yes">Reset</button></div>`);
    onTap(m.el, '[data-r]', (b) => { m.close(); if (b.dataset.r === 'yes') { store.reset(); s.close(); location.reload(); } });
  });
}

/* ---------- Private room ---------- */
export function openPrivateRoom() {
  const code = Math.random().toString(36).slice(2, 7).toUpperCase();
  const recent = recentOpponents(12).map((r) => getCharacter(r.id)).filter(Boolean);
  const pool = [...new Set([...recent, ...onlineNow(16)])].slice(0, 16);
  let mode = '2p';
  const picked = new Set();
  const s = sheet(`<div class="h2">Private room</div>
    <div class="room-code"><span class="dim">Room</span><b class="display">${code}</b></div>
    <div class="seg"><button class="on" data-m="2p">2 Players</button><button data-m="4p">4 Players</button></div>
    <div class="eyebrow" style="margin:14px 0 8px">Invite rivals <span class="dim" data-need>(pick 1)</span></div>
    <div class="pick-grid">${pool.map((c) => `<button class="pick" data-c="${c.id}">${charAvatar(c, { size: 52, online: isOnline(c) })}<b class="ellipsis">${esc(c.name)}</b><small>Lv ${c.level}</small></button>`).join('')}</div>
    <button class="btn primary lg block" data-a="start" style="margin-top:14px" disabled>START ROOM</button>`, { cls: 'sheet-tall' });
  const need = () => (mode === '4p' ? 3 : 1);
  const sync = () => {
    s.el.querySelector('[data-need]').textContent = `(${picked.size}/${need()})`;
    s.el.querySelector('[data-a="start"]').disabled = picked.size !== need();
    s.el.querySelectorAll('.pick').forEach((b) => b.classList.toggle('on', picked.has(b.dataset.c)));
  };
  onTap(s.el, '[data-m]', (b) => {
    mode = b.dataset.m;
    s.el.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x === b));
    while (picked.size > need()) picked.delete([...picked][picked.size - 1]);
    sync();
  });
  onTap(s.el, '[data-c]', (b) => {
    const id = b.dataset.c;
    if (picked.has(id)) picked.delete(id);
    else if (picked.size < need()) picked.add(id);
    else if (need() === 1) { picked.clear(); picked.add(id); }
    sync();
  });
  onTap(s.el, '[data-a="start"]', () => {
    s.close();
    go('matchmaking', { mode, opponents: [...picked].map(getCharacter) }, { transition: 'fade' });
  });
  sync();
}

/* ---------- Returning user ---------- */
export function welcomeBack() {
  const s = store.s;
  const away = Date.now() - (s.lastSeen || Date.now());
  if (!s.lastSeen || away < 3 * 3600 * 1000) return false;
  const lv = levelInfo();
  const daily = dailyStatus();
  const waiting = (daily.available ? 1 : 0) + missionsReady();
  const rival = recentOpponents(10).map((r) => ({ r, c: getCharacter(r.id) })).find(({ c }) => c && isOnline(c));

  let body;
  if (rival) {
    const beat = rival.r.streak === 'W';
    body = `<div class="wb-rival">${charAvatar(rival.c, { size: 84, online: true, cls: 'glow-ring' })}
      <div class="display wb-title">${esc(rival.c.name.toUpperCase())} IS ONLINE</div>
      <div class="muted">${beat ? 'You beat her last time.' : 'She beat you last time. Revenge?'}</div></div>
      <button class="btn primary xl block" data-a="rival">PLAY</button>`;
  } else if (lv.need - lv.into <= 130) {
    body = `<div class="display wb-title">ONE WIN AWAY</div><div class="muted">Reach Level ${lv.level + 1}.</div><button class="btn primary xl block" data-a="play">PLAY NOW</button>`;
  } else {
    body = `<div class="display wb-title">WELCOME BACK</div><div class="muted">${waiting ? `You have ${waiting} reward${waiting > 1 ? 's' : ''} waiting.` : 'The board missed you.'}</div><button class="btn primary xl block" data-a="${waiting ? 'rewards' : 'play'}">${waiting ? 'CLAIM REWARDS' : 'PLAY NOW'}</button>`;
  }
  const m = modal(`<div class="welcome-back">${body}<button class="btn ghost block" data-a="later" style="margin-top:10px">Later</button></div>`);
  onTap(m.el, '[data-a]', (b) => {
    m.close();
    const a = b.dataset.a;
    if (a === 'rival') go('matchmaking', { mode: '2p', target: rival.c.id });
    if (a === 'play') go('matchmaking', { mode: '2p' });
    if (a === 'rewards') go('rewards', {}, { transition: 'fade', replace: true });
  });
  return true;
}

/* ---------- What's new (OTA) ---------- */
export function whatsNew() {
  if (!ota.whatsNew.length || store.s.ota.seenWhatsNew >= ota.version) return false;
  const m = modal(`<div class="whats-new"><div class="eyebrow center">Fresh update · v${ota.version}</div><div class="display wb-title center">WHAT'S NEW</div>
    <div class="wn-list">${ota.whatsNew.map((w) => `<div class="wn"><span>${esc(w.icon || '✨')}</span><div><b>${esc(w.title)}</b><div class="dim">${esc(w.body || '')}</div></div></div>`).join('')}</div>
    <button class="btn primary lg block" data-ok style="margin-top:14px">LET'S GO</button></div>`);
  m.el.querySelector('[data-ok]').addEventListener('click', m.close);
  store.update((s) => { s.ota.seenWhatsNew = ota.version; });
  return true;
}

/* ---------- Connection lost ---------- */
let lostEl = null;
export function initConnectionWatch() {
  const show = () => {
    if (lostEl) return;
    activeMatch()?.pause();
    lostEl = html(`<div class="conn-lost"><div class="conn-card">
      <div class="conn-dice"></div>
      <div class="display conn-title">CONNECTION LOST</div>
      <div class="muted">${activeMatch() ? 'Your match is being held.' : 'Hang tight — we’ll be right back.'}</div>
      <div class="conn-status"><span class="live-dot amber"></span> RECONNECTING…</div></div></div>`);
    const d = new Dice({ size: 70, interactive: false });
    lostEl.querySelector('.conn-dice').appendChild(d.el);
    lostEl._t = setInterval(() => d.roll(1 + Math.floor(Math.random() * 6)), 1400);
    document.getElementById('overlay-host').appendChild(lostEl);
    requestAnimationFrame(() => lostEl.classList.add('open'));
  };
  const hide = () => {
    if (!lostEl) return;
    clearInterval(lostEl._t);
    const el = lostEl;
    lostEl = null;
    el.querySelector('.conn-status').innerHTML = '<span class="live-dot"></span> RECONNECTED';
    setTimeout(() => { el.classList.remove('open'); setTimeout(() => el.remove(), 300); activeMatch()?.resume(); }, 700);
  };
  window.addEventListener('offline', show);
  window.addEventListener('online', hide);
  // Debug hook for previews: ?offline=1 simulates a drop.
  return { show, hide };
}
