// Game services: missions, daily rewards, live-event progress, match bookkeeping,
// relationships, chat threads and level-up rewards.
import { store, dayKey, addXp, addCoins, grant, own, levelInfo, pushNotification, relationship } from './store.js';
import { bus } from './events.js';
import { mulberry32, hashStr, shuffle } from './rng.js';
import { MISSION_POOL, DAILY_TRACK, LEVEL_REWARDS, findItem, KIND_LABEL } from '../content/catalog.js';
import { liveEvents, xpMultiplier } from '../content/events-calendar.js';

/* ---------- Rewards ---------- */
export function describeReward(r) {
  if (!r) return '';
  if (r.kind) {
    const item = findItem(r.kind, r.id);
    return `${item?.name || item?.text || r.id} ${KIND_LABEL[r.kind]?.replace(/s$/, '') || ''}`.trim();
  }
  const parts = [];
  if (r.coins) parts.push(`${r.coins.toLocaleString('en-IN')} coins`);
  if (r.xp) parts.push(`${r.xp} XP`);
  return parts.join(' + ');
}

/** Grants a reward; returns what was actually given (items already owned convert to coins). */
export function giveReward(r, mult = 1) {
  const given = { coins: 0, xp: 0, item: null };
  if (!r) return given;
  if (r.kind) {
    if (!own(r.kind, r.id)) { grant(r.kind, r.id); given.item = { kind: r.kind, id: r.id }; }
    else if (r.fallbackCoins) { addCoins(r.fallbackCoins * mult); given.coins += r.fallbackCoins * mult; }
  }
  if (r.coins) { addCoins(r.coins * mult); given.coins += r.coins * mult; }
  if (r.xp) { addXp(r.xp * mult); given.xp += r.xp * mult; }
  return given;
}

/* ---------- Missions ---------- */
export function ensureMissions() {
  const today = dayKey();
  if (store.s.missions.day === today && store.s.missions.list.length) return store.s.missions.list;
  const r = mulberry32(hashStr(`missions-${today}`));
  const picks = shuffle(r, MISSION_POOL).slice(0, 4);
  store.update((s) => { s.missions = { day: today, list: picks.map((m) => ({ id: m.id, progress: 0, claimed: false })) }; }, { silent: true });
  return store.s.missions.list;
}

export function missionDefs() {
  return ensureMissions().map((m) => ({ ...MISSION_POOL.find((d) => d.id === m.id), ...m })).filter((m) => m.text);
}

export function claimMission(id, mult = 1) {
  const m = missionDefs().find((x) => x.id === id);
  if (!m || m.claimed || m.progress < m.goal) return null;
  store.update((s) => { s.missions.list.find((x) => x.id === id).claimed = true; });
  return giveReward(m.reward, mult);
}

export const missionsReady = () => missionDefs().filter((m) => !m.claimed && m.progress >= m.goal).length;

/* ---------- Event progress ---------- */
export function eventState(e) { return store.s.events[e.id] || { progress: 0, claimed: false }; }
export function claimEvent(e) {
  const st = eventState(e);
  if (st.claimed || st.progress < e.goal.count) return null;
  store.update((s) => { s.events[e.id] = { ...st, claimed: true }; });
  return giveReward(e.reward);
}

/* ---------- Tracking ---------- */
export function track(evt, n = 1) {
  ensureMissions();
  let completed = null;
  store.update((s) => {
    for (const m of s.missions.list) {
      const def = MISSION_POOL.find((d) => d.id === m.id);
      if (def?.event === evt && !m.claimed && m.progress < def.goal) {
        m.progress = Math.min(def.goal, m.progress + n);
        if (m.progress === def.goal) completed = def;
      }
    }
    for (const e of liveEvents()) {
      if (e.goal?.event !== evt) continue;
      const st = s.events[e.id] || { progress: 0, claimed: false };
      st.progress = Math.min(e.goal.count, st.progress + n);
      s.events[e.id] = st;
    }
  }, { silent: true });
  if (completed) bus.emit('mission:complete', completed);
}

/* ---------- Daily login ---------- */
export function dailyStatus() {
  const d = store.s.daily;
  const today = dayKey();
  const yesterday = dayKey(new Date(Date.now() - 864e5));
  const claimedToday = d.lastClaim === today;
  const continuing = d.lastClaim === yesterday || claimedToday;
  const streakDay = claimedToday ? d.streakDay : continuing ? d.streakDay + 1 : 1;
  const idx = (streakDay - 1) % DAILY_TRACK.length;
  return { available: !claimedToday, streakDay, idx, reward: DAILY_TRACK[idx], adBonusUsed: d.adBonusDay === today };
}

export function claimDaily() {
  const st = dailyStatus();
  if (!st.available) return null;
  store.update((s) => { s.daily.lastClaim = dayKey(); s.daily.streakDay = st.streakDay; });
  return { ...giveReward(st.reward), day: st.streakDay, idx: st.idx };
}

export function claimDailyAdBonus() {
  store.update((s) => { s.daily.adBonusDay = dayKey(); });
  return giveReward({ coins: 200 });
}

/* ---------- Match bookkeeping ---------- */
/**
 * result: { won, mode: '2p'|'4p'|'local', opponents: [char], rematch, close, captures, sixes, tokensHome }
 * returns reward breakdown for the result screen.
 */
export function recordMatch(result) {
  const { won, mode, opponents = [], rematch, close } = result;
  const before = levelInfo();
  const xpMult = xpMultiplier();
  const streakBefore = store.s.stats.streak;
  const local = mode === 'local';

  let coins = local ? 0 : won ? (mode === '4p' ? 400 : 250) : close ? 80 : 50;
  let xp = local ? 30 : won ? (mode === '4p' ? 160 : 120) : close ? 90 : 70;
  const streak = won ? streakBefore + 1 : 0;
  const streakBonus = won && streak >= 2 ? Math.min(5, streak) * 20 : 0;
  coins += streakBonus;
  xp = Math.round(xp * xpMult);

  store.update((s) => {
    s.stats.played++;
    if (won) { s.stats.won++; s.stats.streak = streak; s.stats.bestStreak = Math.max(s.stats.bestStreak, streak); } else if (!local) { s.stats.lost++; s.stats.streak = 0; }
    if (close) s.stats.closeGames++;
    if (rematch) s.stats.rematches++;
    if (s.trial && --s.trial.left <= 0) { if (s.equipped.dice === s.trial.id) s.equipped.dice = s.trial.prev; delete s.trial; }
    for (const c of opponents) {
      const r = { ...relationship(c.id) };
      r.played++;
      if (won) r.won++; else r.lost++;
      r.last = Date.now();
      const res = won ? 'W' : 'L';
      r.run = r.streak === res ? r.run + 1 : 1;
      r.streak = res;
      s.rel[c.id] = r;
    }
  });
  addCoins(coins);
  const ups = addXp(xp);

  track('match:end');
  if (mode === '4p') track('match:end4');
  if (won) track('match:win');
  if (rematch) track('match:rematch');
  if (rematch && won) track('match:rematchwin');

  return { coins, xp, xpMult, streak, streakBonus, levelUps: ups, before, after: levelInfo() };
}

/* ---------- Level-up rewards ---------- */
bus.on('levelup', (levels) => {
  for (const l of levels) {
    const r = LEVEL_REWARDS[l];
    if (r) giveReward(r);
    pushNotification({ kind: 'level', title: `Level ${l} reached!`, body: r ? `Unlocked: ${describeReward(r)}` : 'Keep climbing.', action: 'rewards' });
  }
});

/* ---------- Chat threads ---------- */
export function addMessage(charId, msg, { unread = false } = {}) {
  store.update((s) => {
    const list = (s.chats[charId] ||= []);
    list.push({ t: Date.now(), ...msg });
    if (list.length > 80) list.splice(0, list.length - 80);
    if (unread) s.unread[charId] = (s.unread[charId] || 0) + 1;
  });
}

export function markRead(charId) {
  if (!store.s.unread[charId]) return;
  store.update((s) => { delete s.unread[charId]; });
}

export function threads() {
  return Object.entries(store.s.chats)
    .map(([id, list]) => ({ id, last: list[list.length - 1], unread: store.s.unread[id] || 0 }))
    .filter((t) => t.last)
    .sort((a, b) => b.last.t - a.last.t);
}

export function recentOpponents(limit = 10) {
  return Object.entries(store.s.rel).sort((a, b) => b[1].last - a[1].last).slice(0, limit).map(([id, r]) => ({ id, ...r }));
}
