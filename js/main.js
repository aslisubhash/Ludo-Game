// Boot: content → splash → home, plus the "living world" heartbeat.
import { register, go, currentScreen } from './core/router.js';
import { store, pushNotification, relationship } from './core/store.js';
import { bus } from './core/events.js';
import { toast, wait } from './core/ui.js';
import { sfx } from './core/fx.js';
import { loadContent } from './content/ota.js';
import { onlineNow, getCharacter, allCharacters } from './content/characters.js';
import { primaryEvent, applyEventTheme, liveEvents } from './content/events-calendar.js';
import { ensureMissions, addMessage, dailyStatus, describeReward } from './core/progress.js';
import { line } from './content/personalities.js';
import { splashScreen } from './screens/splash.js';
import { homeScreen } from './screens/home.js';
import { playScreen } from './screens/play.js';
import { matchmakingScreen } from './screens/matchmaking.js';
import { gameScreen } from './screens/game.js';
import { chatsScreen, threadScreen } from './screens/chats.js';
import { rewardsScreen } from './screens/rewards.js';
import { profileScreen } from './screens/profile.js';
import { openDailyReward, welcomeBack, whatsNew, initConnectionWatch } from './screens/overlays.js';

register('home', homeScreen);
register('play', playScreen);
register('matchmaking', matchmakingScreen);
register('game', gameScreen);
register('chats', chatsScreen);
register('thread', threadScreen);
register('rewards', rewardsScreen);
register('profile', profileScreen);

const params = new URLSearchParams(location.search);

async function boot() {
  document.documentElement.dataset.reducedMotion = store.s.settings.reducedMotion ? '1' : '0';
  const firstRun = !store.s.lastSeen;
  const contentReady = loadContent();
  register('splash', () => splashScreen({ ready: contentReady }));
  go('splash', {}, { transition: 'fade' });

  const [{ isUpdate }] = await Promise.all([contentReady, wait(params.has('fast') ? 200 : 2600)]);
  applyEventTheme(primaryEvent());
  ensureMissions();
  if (firstRun) seedFirstRun();
  else seedReturn();

  const start = params.get('screen') || 'home';
  go(start === 'game' ? 'home' : start, {}, { transition: 'zoom', replace: true });
  store.update((s) => { s.sessions++; });

  // One contextual moment, never a stack of popups.
  await wait(700);
  if (params.has('fast')) return;
  if (isUpdate && whatsNew()) return;
  if (welcomeBack()) return;
  if (dailyStatus().available) openDailyReward();
}

function seedFirstRun() {
  const meera = getCharacter('c1');
  const riya = getCharacter('c0');
  addMessage(meera.id, { from: 'them', text: 'Hii! Welcome to Ludo Universe ✨' }, { unread: true });
  addMessage(meera.id, { from: 'them', text: 'Up for a game?', kind: 'invite' }, { unread: true });
  pushNotification({ kind: 'reward', title: 'Your daily reward is ready', body: 'Open it on the Rewards tab', action: 'rewards' });
  pushNotification({ kind: 'online', title: `${riya.name} is online`, body: 'Think you can beat her?', char: riya.id, action: `play:${riya.id}` });
  const ev = primaryEvent();
  if (ev) pushNotification({ kind: 'event', title: `${ev.name} is live`, body: ev.sub, action: 'rewards' });
}

function seedReturn() {
  const away = Date.now() - store.s.lastSeen;
  if (away < 2 * 3600 * 1000) return;
  // A rival you played recently might be back.
  const rival = Object.keys(store.s.rel).map(getCharacter).filter(Boolean).find((c) => onlineNow(60).includes(c));
  if (rival) {
    const r = relationship(rival.id);
    pushNotification({ kind: 'rematch', title: `${rival.name} wants a rematch`, body: r.streak === 'W' ? 'You beat her last time.' : 'Time for revenge?', char: rival.id, action: `chat:${rival.id}` });
    addMessage(rival.id, { from: 'them', text: line(rival, 'rematchAsk'), kind: 'rematch' }, { unread: true });
  }
}

/* ---------- Living world heartbeat ---------- */
// Low-frequency, gaming-focused nudges. Never during a match, never more than one at a time.
function heartbeat() {
  setInterval(() => {
    const scr = currentScreen();
    if (['game', 'matchmaking', 'splash', 'thread'].includes(scr) || document.hidden) return;
    if (Math.random() > 0.35) return;
    const pool = onlineNow(30);
    const c = pool[Math.floor(Math.random() * pool.length)];
    if (!c) return;
    const known = store.s.rel[c.id];
    const roll = Math.random();
    if (roll < 0.5) {
      addMessage(c.id, { from: 'them', text: line(c, 'invite'), kind: known ? 'rematch' : 'invite' }, { unread: true });
      toast(`<b>${c.name}</b> ${known ? 'wants a rematch' : 'challenged you'} 🎲`, { icon: '💬', ms: 2800 });
      sfx('msg');
    } else {
      pushNotification({ kind: 'online', title: `${c.name} is online`, body: known ? 'You played recently' : c.tag, char: c.id, action: `play:${c.id}` });
    }
  }, 75_000);
}

bus.on('mission:complete', (m) => { toast(`Mission complete: ${m.text}`, { icon: '🎯', ms: 2600 }); sfx('coin'); });
bus.on('unlock', ({ kind, id }) => { pushNotification({ kind: 'unlock', title: 'New item unlocked', body: describeReward({ kind, id }), action: 'profile' }); });

const markSeen = () => { store.update((s) => { s.lastSeen = Date.now(); }, { silent: true }); store.flush(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) markSeen(); });
window.addEventListener('pagehide', markSeen);
setInterval(markSeen, 30_000);

const conn = initConnectionWatch();
if (params.has('offline')) setTimeout(conn.show, 4000);

if ('serviceWorker' in navigator && location.protocol !== 'file:' && !params.has('nosw')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Test/automation hook (used by tests/smoke.mjs).
window.__lu = { store, go, allCharacters, liveEvents };

boot().then(heartbeat);
