// Live events & festival seasons. Each event can re-theme the app (CSS tokens),
// suggest a board/dice, and carry a goal with an exclusive reward. The OTA manifest
// can add events or force one live.

export const EVENTS = [
  {
    id: 'navratri-2026', name: 'Navratri Nights', title: 'NAVRATRI NIGHTS', sub: 'Win 5 matches · Unlock the Festival Dice',
    start: '2026-10-03', end: '2026-10-21', goal: { event: 'match:win', count: 5 }, reward: { kind: 'dice', id: 'festival' },
    theme: { a: '#FF3D7F', b: '#FFB703', glow: 'rgba(255, 61, 127, 0.22)' }, art: 'garba', board: 'royal-jaipur',
  },
  {
    id: 'diwali-2026', name: 'Diwali Showdown', title: 'DIWALI SHOWDOWN', sub: 'Win 5 matches · Unlock Festival Dice + Diwali Board',
    start: '2026-10-25', end: '2026-11-14', goal: { event: 'match:win', count: 5 }, reward: { kind: 'boards', id: 'diwali' },
    theme: { a: '#FFB703', b: '#FF7A2F', glow: 'rgba(255, 183, 3, 0.24)' }, art: 'diyas', board: 'diwali',
  },
  {
    id: 'newyear-2027', name: 'New Year Rush', title: 'NEW YEAR RUSH', sub: 'Play 10 matches · 2X XP all week',
    start: '2026-12-29', end: '2027-01-05', goal: { event: 'match:end', count: 10 }, reward: { kind: 'victory', id: 'fireworks' }, xpBoost: 2,
    theme: { a: '#7B5CFF', b: '#3EE6B0', glow: 'rgba(123, 92, 255, 0.24)' }, art: 'fireworks',
  },
  {
    id: 'holi-2027', name: 'Holi Splash', title: 'HOLI SPLASH', sub: 'Send 20 reactions · Unlock Holi board',
    start: '2027-03-15', end: '2027-03-28', goal: { event: 'reaction:sent', count: 20 }, reward: { kind: 'boards', id: 'holi' },
    theme: { a: '#FF3D7F', b: '#3EE6B0', glow: 'rgba(62, 230, 176, 0.2)' }, art: 'splash', board: 'holi',
  },
  {
    id: 'cricket-2027', name: 'Cricket Season', title: 'CRICKET SEASON', sub: 'Roll 30 sixes · Unlock “KING MOVE” sticker',
    start: '2027-03-29', end: '2027-05-31', goal: { event: 'roll:six', count: 30 }, reward: { kind: 'stickers', id: 'king-move' },
    theme: { a: '#1FB574', b: '#3C8DFF', glow: 'rgba(31, 181, 116, 0.2)' }, art: 'stadium',
  },
  {
    id: 'monsoon-2027', name: 'Monsoon Cup', title: 'MONSOON CUP', sub: 'Win 3 rematches · Unlock Monsoon board',
    start: '2027-07-01', end: '2027-08-10', goal: { event: 'match:rematchwin', count: 3 }, reward: { kind: 'boards', id: 'monsoon' },
    theme: { a: '#2EC4D6', b: '#3C8DFF', glow: 'rgba(46, 196, 214, 0.22)' }, art: 'rain', board: 'monsoon',
  },
  {
    id: 'independence-2027', name: 'Azadi Cup', title: 'AZADI CUP', sub: 'Win 3 matches · Tiranga frame',
    start: '2027-08-11', end: '2027-08-18', goal: { event: 'match:win', count: 3 }, reward: { kind: 'frames', id: 'marigold' },
    theme: { a: '#FF9933', b: '#138808', glow: 'rgba(255, 153, 51, 0.2)' }, art: 'kites',
  },
];

// Always-on rotations so there is something live every day.
const WEEKEND = {
  id: 'weekend-rush', name: 'Weekend Rush', title: 'WEEKEND RUSH', sub: '2X XP on every match', xpBoost: 2, rotating: true,
  goal: { event: 'match:end', count: 4 }, reward: { coins: 500 }, theme: { a: '#7B5CFF', b: '#FF7A2F', glow: 'rgba(123, 92, 255, 0.2)' }, art: 'bolt',
};
const REMATCH_WEEK = {
  id: 'rematch-week', name: 'Rematch Week', title: 'REMATCH WEEK', sub: 'Win 2 rematches · Unlock exclusive sticker', rotating: true,
  goal: { event: 'match:rematchwin', count: 2 }, reward: { kind: 'stickers', id: 'too-close' }, theme: { a: '#FF7A2F', b: '#FF3D7F', glow: 'rgba(255, 122, 47, 0.2)' }, art: 'versus',
};

let extra = [];
let forcedId = null;
export function setOtaEvents(list = [], forced = null) { extra = list; forcedId = forced; }

const inWindow = (e, d) => {
  const key = d.toISOString().slice(0, 10);
  return e.start <= key && key <= e.end;
};

/** Live events for today, festival first, then the rotating weekly. */
export function liveEvents(d = new Date()) {
  const all = [...extra, ...EVENTS];
  const forced = forcedId && all.find((e) => e.id === forcedId);
  const festival = forced ? [forced] : all.filter((e) => inWindow(e, d));
  const day = d.getDay();
  const weekly = day === 0 || day === 6 ? WEEKEND : REMATCH_WEEK;
  // Rotating weekly IDs include the ISO week so progress resets each week.
  const week = Math.floor((d - new Date(d.getFullYear(), 0, 1)) / (7 * 864e5));
  return [...festival, { ...weekly, id: `${weekly.id}-${d.getFullYear()}-w${week}` }];
}

export function upcomingEvent(d = new Date()) {
  const key = d.toISOString().slice(0, 10);
  return [...extra, ...EVENTS].filter((e) => e.start > key).sort((a, b) => a.start.localeCompare(b.start))[0];
}

export const primaryEvent = (d) => liveEvents(d)[0];

export function xpMultiplier(d = new Date()) {
  return Math.max(1, ...liveEvents(d).map((e) => e.xpBoost || 1));
}

export function applyEventTheme(e) {
  const root = document.documentElement;
  if (!e?.theme) return;
  root.style.setProperty('--event-a', e.theme.a);
  root.style.setProperty('--event-b', e.theme.b);
  root.style.setProperty('--event-glow', e.theme.glow);
  document.getElementById('stage').dataset.themeEvent = e.art || 'none';
}

export function daysLeft(e, d = new Date()) {
  if (!e.end) {
    const day = d.getDay();
    return e.id.startsWith('weekend') ? (day === 6 ? 2 : 1) : Math.max(1, 6 - day);
  }
  return Math.max(0, Math.ceil((new Date(`${e.end}T23:59:59`) - d) / 864e5));
}
