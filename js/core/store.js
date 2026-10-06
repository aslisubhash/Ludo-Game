// Persistent player state. Everything lives in localStorage (guarded), so the game
// works offline and survives reloads. Shape is versioned for future migrations.
import { bus } from './events.js';

const KEY = 'ludo-universe.state.v1';

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function defaults() {
  return {
    v: 1,
    createdAt: Date.now(),
    lastSeen: 0,
    sessions: 0,
    profile: { name: 'You', emblem: 'peacock', color: 'blue' },
    coins: 1000,
    xp: 0,
    stats: { played: 0, won: 0, lost: 0, streak: 0, bestStreak: 0, captures: 0, sixes: 0, closeGames: 0, rematches: 0 },
    inventory: {
      dice: ['classic'], boards: ['classic-india'], tokens: ['classic'], frames: ['none'],
      stickers: ['lucky', 'ouch', 'good-move', 'gg', 'rematch', 'game-on'], victory: ['confetti'],
    },
    equipped: { dice: 'classic', board: 'classic-india', token: 'classic', frame: 'none', victory: 'confetti' },
    seenItems: [],
    daily: { lastClaim: null, streakDay: 0, adBonusDay: null },
    missions: { day: null, list: [] },
    events: {}, // eventId -> { progress, claimed }
    rel: {}, // characterId -> { played, won, lost, last, streak: 'W'|'L', run }
    chats: {}, // characterId -> [{ from: 'me'|'them'|'sys', text, t, kind?, data? }]
    unread: {}, // characterId -> count
    notifications: [], // { id, kind, title, body, t, read, action }
    ads: { day: null, count: 0, last: 0 },
    mystery: { lastFree: 0 },
    ota: { version: 0, seenWhatsNew: 0 },
    settings: { sound: true, haptics: true, reducedMotion: false, chatBubbles: true },
  };
}

function deepMerge(base, saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return saved ?? base;
  const out = { ...base };
  for (const k of Object.keys(saved)) {
    const b = base?.[k];
    out[k] = b && typeof b === 'object' && !Array.isArray(b) ? deepMerge(b, saved[k]) : saved[k];
  }
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return deepMerge(defaults(), JSON.parse(raw));
  } catch { /* storage unavailable or corrupt: start fresh */ }
  return defaults();
}

let state = load();
let saveTimer = 0;

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore quota/private mode */ }
}

export const store = {
  get s() { return state; },
  update(fn, { silent = false } = {}) {
    fn(state);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 60);
    if (!silent) bus.emit('store', state);
  },
  flush() { clearTimeout(saveTimer); persist(); },
  reset() { state = defaults(); persist(); bus.emit('store', state); },
};

/* ---------- Progression ---------- */
export const xpForLevel = (level) => 120 + (level - 1) * 70;

export function levelInfo(totalXp = state.xp) {
  let level = 1;
  let rest = totalXp;
  while (rest >= xpForLevel(level)) { rest -= xpForLevel(level); level++; }
  const need = xpForLevel(level);
  return { level, into: rest, need, pct: rest / need };
}

export const TITLES = [
  [1, 'ROOKIE'], [5, 'PLAYER'], [10, 'STRATEGIST'], [20, 'PRO'], [35, 'MASTER'], [50, 'LEGEND'],
];
export function titleFor(level) {
  let t = TITLES[0][1];
  for (const [min, name] of TITLES) if (level >= min) t = name;
  return t;
}

/** Adds XP and returns the list of levels newly reached. */
export function addXp(amount) {
  const before = levelInfo().level;
  store.update((s) => { s.xp += Math.max(0, Math.round(amount)); });
  const after = levelInfo().level;
  const ups = [];
  for (let l = before + 1; l <= after; l++) ups.push(l);
  if (ups.length) bus.emit('levelup', ups);
  return ups;
}

export function addCoins(amount) {
  store.update((s) => { s.coins = Math.max(0, s.coins + Math.round(amount)); });
}

export function spendCoins(amount) {
  if (state.coins < amount) return false;
  store.update((s) => { s.coins -= amount; });
  return true;
}

export function own(kind, id) {
  return state.inventory[kind]?.includes(id);
}

export function grant(kind, id) {
  if (own(kind, id)) return false;
  store.update((s) => { (s.inventory[kind] ||= []).push(id); });
  bus.emit('unlock', { kind, id });
  return true;
}

export function relationship(charId) {
  return state.rel[charId] || { played: 0, won: 0, lost: 0, last: 0, run: 0, streak: null };
}

export function pushNotification(n) {
  store.update((s) => {
    s.notifications.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, t: Date.now(), read: false, ...n });
    s.notifications = s.notifications.slice(0, 40);
  });
}

export function unreadNotifications() {
  return state.notifications.filter((n) => !n.read).length;
}

export function unreadChats() {
  return Object.values(state.unread).reduce((a, b) => a + b, 0);
}
