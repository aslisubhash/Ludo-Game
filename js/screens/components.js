// Shared UI components: avatars, frames, profile sheets, top bar, reward chips.
import { esc, html, sheet, onTap, icon, coinSvg, fmt, ago } from '../core/ui.js';
import { store, levelInfo, titleFor, relationship, unreadNotifications } from '../core/store.js';
import { portraitOf, fallbackOf, hasPortrait, isOnline, getCharacter } from '../content/characters.js';
import { findItem } from '../content/catalog.js';
import { ARCHETYPES } from '../content/personalities.js';
import { describeReward } from '../core/progress.js';
import { COLOR_HEX } from '../game/board-view.js';

export const EMBLEMS = {
  peacock: { e: '🦚', bg: ['#1FB574', '#3C8DFF'] },
  tiger: { e: '🐯', bg: ['#FF7A2F', '#C2185B'] },
  lotus: { e: '🪷', bg: ['#FF5FA2', '#7B5CFF'] },
  kite: { e: '🪁', bg: ['#3C8DFF', '#2EC4D6'] },
  crown: { e: '👑', bg: ['#F4C776', '#B8893D'] },
  moon: { e: '🌙', bg: ['#232a55', '#7B5CFF'] },
  bolt: { e: '⚡', bg: ['#FFC23D', '#FF7A2F'] },
  dice: { e: '🎲', bg: ['#F0464B', '#7A1626'] },
  elephant: { e: '🐘', bg: ['#7FB3FF', '#3A2A8C'] },
  diya: { e: '🪔', bg: ['#FFB703', '#C4501A'] },
};

export function frameSvg(frameId) {
  const f = findItem('frames', frameId);
  if (!f || !f.ring) return '';
  const [a, b] = f.ring;
  const id = `fr${Math.random().toString(36).slice(2, 8)}`;
  let extra = '';
  if (f.petals) extra = Array.from({ length: 12 }, (_, i) => { const t = (i / 12) * Math.PI * 2; return `<ellipse cx="${50 + Math.cos(t) * 47}" cy="${50 + Math.sin(t) * 47}" rx="4.5" ry="2.6" fill="${i % 2 ? a : b}" transform="rotate(${(t * 180) / Math.PI} ${50 + Math.cos(t) * 47} ${50 + Math.sin(t) * 47})"/>`; }).join('');
  if (f.crown) extra += `<path d="M38,9 L42,1 L46,7 L50,0 L54,7 L58,1 L62,9 Z" fill="${a}" stroke="${b}" stroke-width="1"/>`;
  if (f.arches) extra += Array.from({ length: 8 }, (_, i) => { const t = (i / 8) * Math.PI * 2; return `<circle cx="${50 + Math.cos(t) * 46}" cy="${50 + Math.sin(t) * 46}" r="2.4" fill="#fff" opacity=".8"/>`; }).join('');
  return `<svg viewBox="0 0 100 100"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <circle cx="50" cy="50" r="45.5" fill="none" stroke="url(#${id})" stroke-width="5" ${f.glow ? `style="filter:drop-shadow(0 0 3px ${a})"` : ''}/>${extra}</svg>`;
}

/** Character avatar markup. */
export function charAvatar(c, { size = 48, online = false, level = false, cls = '' } = {}) {
  const src = portraitOf(c);
  const fb = fallbackOf(c);
  const img = hasPortrait(c)
    ? `<img src="${src}" alt="" loading="lazy" decoding="async" data-fb="${fb}" onerror="this.onerror=null;this.src=this.dataset.fb">`
    : `<img src="${fb}" alt="" decoding="async">`;
  return `<div class="ava ${cls}" style="--s:${size}px" data-char="${c.id}"><div class="ava-img">${img}</div>${online ? '<i class="online"></i>' : ''}${level ? `<b class="lvl">${c.level}</b>` : ''}</div>`;
}

export function meAvatar({ size = 48, level = false, cls = '' } = {}) {
  const p = store.s.profile;
  const em = EMBLEMS[p.emblem] || EMBLEMS.peacock;
  const lv = levelInfo().level;
  return `<div class="ava me ${cls}" style="--s:${size}px"><div class="ava-img emblem" style="background:linear-gradient(135deg, ${em.bg[0]}, ${em.bg[1]})"><span style="font-size:${Math.round(size * 0.52)}px">${em.e}</span></div>
    ${store.s.equipped.frame !== 'none' ? `<div class="frame">${frameSvg(store.s.equipped.frame)}</div>` : ''}${level ? `<b class="lvl">${lv}</b>` : ''}</div>`;
}

export function coinPill(cls = '') {
  return `<div class="coin-pill ${cls}">${coinSvg}<b class="num" data-coins>${fmt(store.s.coins)}</b></div>`;
}

/* ---------- Top bar (home/tab screens) ---------- */
export function topBar({ title = null } = {}) {
  const lv = levelInfo();
  const n = unreadNotifications();
  return `<header class="topbar">
    <button class="me-chip pressable" data-act="profile">${meAvatar({ size: 42 })}
      <div class="me-meta"><div class="me-name ellipsis">${esc(store.s.profile.name)}</div>
      <div class="me-lvl"><span class="lv-badge">LV ${lv.level}</span><div class="bar xp mini"><i style="width:${Math.round(lv.pct * 100)}%"></i></div></div></div>
    </button>
    ${title ? `<div class="h2 topbar-title">${title}</div>` : ''}
    <div class="row" style="gap:8px">
      ${coinPill()}
      <button class="icon-btn" data-act="notifications" aria-label="Notifications">${icon.bell}${n ? `<i class="badge-dot">${n > 9 ? '9+' : n}</i>` : ''}</button>
      <button class="icon-btn" data-act="settings" aria-label="Settings">${icon.gear}</button>
    </div>
  </header>`;
}

/* ---------- Character quick card & full profile ---------- */
export function quickCard(c, { onPlay, onProfile }) {
  const a = ARCHETYPES[c.archetype];
  const s = sheet(`
    <div class="quick-card">
      ${charAvatar(c, { size: 92, online: isOnline(c), cls: 'glow-ring' })}
      <div class="qc-meta">
        <div class="row" style="gap:8px"><div class="h1">${esc(c.name)}</div>${c.isNew ? '<span class="new-tag">NEW</span>' : ''}</div>
        <div class="muted">Level ${c.level} · ${esc(c.tag)}</div>
        <div class="qc-stats"><span><b>${c.winRate}%</b> win rate</span>${c.streak ? `<span>🔥 <b>${c.streak}</b> streak</span>` : ''}</div>
        <div class="qc-bio">“${esc(c.bio)}”</div>
      </div>
    </div>
    <div class="row" style="gap:10px;margin-top:16px">
      <button class="btn ghost lg grow" data-act="profile">VIEW PROFILE</button>
      <button class="btn primary lg grow" data-act="play">PLAY</button>
    </div>`, { cls: 'sheet-compact' });
  onTap(s.el, '[data-act]', (b) => { s.close(); (b.dataset.act === 'play' ? onPlay : onProfile)?.(c); });
  return s;
}

export function profileSheet(c, { onPlay, onChat }) {
  const a = ARCHETYPES[c.archetype];
  const r = relationship(c.id);
  const online = isOnline(c);
  const favHex = COLOR_HEX[c.fav];
  const s = sheet(`
    <div class="profile-hero" style="--fav:${favHex}">
      <div class="ph-art">${charAvatar(c, { size: 132, online, cls: 'glow-ring' })}</div>
      <div class="h1 center" style="margin-top:12px">${esc(c.name)} ${c.isNew ? '<span class="new-tag">NEW</span>' : ''}</div>
      <div class="dim center" style="font-size:13px">${esc(c.handle)} · ${online ? '<span class="online-text">● Online</span>' : 'Last seen recently'}</div>
      <div class="ph-tags"><span class="pill-tag">Level ${c.level}</span><span class="pill-tag">${esc(c.tag)}</span><span class="pill-tag"><i class="dot" style="background:${favHex}"></i>${c.fav[0].toUpperCase() + c.fav.slice(1)} tokens</span></div>
      <div class="ph-bio">“${esc(c.bio)}”</div>
      <div class="ph-mood">${esc(c.mood)}</div>
    </div>
    <div class="stat-grid">
      <div><b class="num">${c.winRate}%</b><span>Win rate</span></div>
      <div><b class="num">${fmt(c.games)}</b><span>Games</span></div>
      <div><b class="num">${c.streak || '—'}</b><span>Streak</span></div>
    </div>
    ${r.played ? `
    <div class="eyebrow" style="margin:18px 0 8px">You &amp; ${esc(c.name)}</div>
    <div class="rel-card card">
      <div class="rel-row"><span>Played together</span><b>${r.played}</b></div>
      <div class="rel-row"><span>You won</span><b class="win">${r.won}</b></div>
      <div class="rel-row"><span>${esc(c.name)} won</span><b class="loss">${r.lost}</b></div>
      <div class="rel-row"><span>Last played</span><b>${ago(r.last)}</b></div>
      <div class="rel-row"><span>Head to head</span><b>${r.won}–${r.lost}</b></div>
    </div>` : `<div class="rel-empty muted">You haven't played ${esc(c.name)} yet. First match decides the rivalry.</div>`}
    <div class="eyebrow" style="margin:18px 0 8px">Recent achievements</div>
    <div class="ach-row">${c.achievements.map((x) => `<span class="ach">🏅 ${esc(x)}</span>`).join('')}</div>
    <div class="row sheet-actions" style="gap:10px">
      <button class="btn ghost lg grow" data-act="chat">${icon.chat} MESSAGE</button>
      <button class="btn primary lg grow" data-act="play">PLAY</button>
    </div>`, { cls: 'sheet-tall' });
  onTap(s.el, '[data-act]', (b) => { s.close(); (b.dataset.act === 'play' ? onPlay : onChat)?.(c); });
  return s;
}

export function rewardChip(r) {
  if (!r) return '';
  if (r.kind) {
    return `<span class="reward-chip item">🎁 ${esc(describeReward(r))}</span>`;
  }
  return `<span class="reward-chip">${coinSvg}${fmt(r.coins || 0)}${r.xp ? ` · +${r.xp} XP` : ''}</span>`;
}

export { getCharacter };
