// Match screen: opponent strip (top) · board (centre) · player dock (bottom).
import { html, esc, onTap, wait, icon, sheet, modal, toast } from '../core/ui.js';
import { store } from '../core/store.js';
import { sfx, haptic, burstAt } from '../core/fx.js';
import { bus } from '../core/events.js';
import { go } from '../core/router.js';
import { track, addMessage } from '../core/progress.js';
import { BoardView, COLOR_HEX } from '../game/board-view.js';
import { Dice } from '../game/dice.js';
import { Match } from '../game/match.js';
import { assess } from '../game/tension.js';
import { tokensHome } from '../game/rules.js';
import { setGameplayGuard, showRewarded, adsAvailable } from '../ads/ads.js';
import { ARCHETYPES, line, QUICK_REPLIES, REACTIONS } from '../content/personalities.js';
import { STICKERS, findItem } from '../content/catalog.js';
import { charAvatar, meAvatar } from './components.js';
import { showResult } from './result.js';

let active = null; // current match controller (for connection-loss pause)
export const activeMatch = () => active;

export function gameScreen(params) {
  const { mode = '2p', opponents = [], round = 1, rematch = false } = params;
  const el = html('<section class="game-screen"></section>');
  const eq = store.s.equipped;

  // Seats: player is always blue (bottom-left yard, nearest the thumb).
  let seats;
  if (mode === '4p') {
    seats = [
      { kind: 'bot', color: 'red', char: opponents[0] },
      { kind: 'bot', color: 'green', char: opponents[1] },
      { kind: 'bot', color: 'yellow', char: opponents[2] },
      { kind: 'me', color: 'blue' },
    ];
  } else if (mode === 'local') {
    seats = [{ kind: 'local', color: 'green', name: 'Player 2' }, { kind: 'local', color: 'blue', name: 'Player 1' }];
  } else {
    seats = [{ kind: 'bot', color: 'green', char: opponents[0] }, { kind: 'me', color: 'blue' }];
  }
  const meIdx = mode === 'local' ? 1 : seats.findIndex((s) => s.kind === 'me');
  const bots = seats.map((s, i) => ({ ...s, i })).filter((s) => s.kind === 'bot');
  const startTurn = round % 2 === 1 ? meIdx : bots[0]?.i ?? 0;

  /* ---------- Layout ---------- */
  const oppHtml = mode === '4p'
    ? `<div class="opp-row">${bots.map((b) => oppChip(b)).join('')}</div>`
    : mode === 'local'
      ? `<div class="opp-card" data-seat="0"><div class="ava" style="--s:52px"><div class="ava-img emblem" style="background:linear-gradient(135deg,#1FB574,#12804F)"><span style="font-size:26px">🎲</span></div></div>
         <div class="opp-meta"><div class="opp-name">Player 2</div><div class="opp-sub">Pass &amp; Play</div><div class="home-pips" data-home="0">${pips(0, 'green')}</div></div><div class="opp-dice" data-dice="0"></div></div>`
      : `<div class="opp-card" data-seat="${bots[0].i}">${charAvatar(bots[0].char, { size: 52, online: true })}
         <div class="opp-meta"><div class="row" style="gap:6px"><div class="opp-name">${esc(bots[0].char.name)}</div><span class="lv-badge">LV ${bots[0].char.level}</span></div>
         <div class="opp-sub">${esc(bots[0].char.tag)}</div><div class="home-pips" data-home="${bots[0].i}">${pips(0, 'green')}</div></div>
         <div class="opp-status" data-status="${bots[0].i}"></div><div class="opp-dice" data-dice="${bots[0].i}"></div></div>`;

  el.innerHTML = `
    <div class="game-top">
      <button class="icon-btn" data-act="exit" aria-label="Leave match">${icon.back}</button>
      <div class="round-tag">${mode === '4p' ? '4 PLAYERS' : mode === 'local' ? 'PASS & PLAY' : `ROUND ${round}`}</div>
      <button class="icon-btn" data-act="rules" aria-label="How to play">${icon.info}</button>
    </div>
    <div class="opp-zone">${oppHtml}</div>
    <div class="board-zone">
      <div class="tension-banner" aria-live="polite"></div>
      <div class="board-wrap"><div class="board-host"></div></div>
    </div>
    <div class="bubble-zone"></div>
    <div class="dock">
      <div class="react-bar">${REACTIONS.map((r) => `<button class="react" data-react="${r}">${r}</button>`).join('')}<button class="react sticker-btn" data-act="stickers" aria-label="Stickers">${icon.sticker}</button></div>
      <div class="dock-main">
        <div class="dock-me" data-seat="${meIdx}">
          ${mode === 'local' ? `<div class="ava" style="--s:54px"><div class="ava-img emblem" style="background:linear-gradient(135deg,#3C8DFF,#1F5FC4)"><span style="font-size:27px">🎲</span></div></div>` : meAvatar({ size: 54 })}
          <div class="dock-meta"><div class="opp-name">${mode === 'local' ? 'Player 1' : esc(store.s.profile.name)}</div><div class="home-pips" data-home="${meIdx}">${pips(0, 'blue')}</div></div>
        </div>
        <div class="dice-slot"></div>
        <button class="chat-btn" data-act="chat" aria-label="Chat">${icon.chat}<i class="badge-dot hidden">1</i></button>
      </div>
      <div class="status-line"></div>
    </div>`;

  const boardHost = el.querySelector('.board-host');
  const board = new BoardView(boardHost, { skin: eq.board, token: eq.token });
  const dockDice = new Dice({ size: 76, skin: eq.dice });
  el.querySelector('.dice-slot').appendChild(dockDice.el);
  const oppDice = new Map();
  el.querySelectorAll('[data-dice]').forEach((slot) => {
    const i = +slot.dataset.dice;
    const d = new Dice({ size: mode === '4p' ? 30 : 40, skin: 'classic', interactive: false });
    slot.appendChild(d.el);
    oppDice.set(i, d);
  });
  const statusEl = el.querySelector('.status-line');
  const bannerEl = el.querySelector('.tension-banner');
  const setStatus = (t, tone = '') => { statusEl.textContent = t; statusEl.dataset.tone = tone; };

  /* ---------- Turn input plumbing ---------- */
  let rollResolver = null;
  let pickResolver = null;
  const diceFor = (i) => (seats[i].kind === 'bot' ? oppDice.get(i) : (mode === 'local' && i === 0 ? oppDice.get(0) : dockDice));

  dockDice.el.addEventListener('click', () => {
    if (!rollResolver) return;
    const r = rollResolver;
    rollResolver = null;
    dockDice.setEnabled(false);
    r();
  });
  el.querySelector('.opp-dice')?.addEventListener('click', () => {
    if (mode !== 'local' || !rollResolver) return;
    const r = rollResolver;
    rollResolver = null;
    oppDice.get(0).setEnabled(false);
    r();
  });

  board.onPick = (p, t) => {
    if (!pickResolver) return;
    const { moves, resolve } = pickResolver;
    const tokPos = match.g.players[p].tokens[t];
    const mv = moves.find((m) => m.token === t) || moves.find((m) => m.from === tokPos);
    if (!mv) return;
    pickResolver = null;
    board.setMovable([]);
    haptic(10);
    resolve(mv);
  };

  /* ---------- Chat & reactions ---------- */
  const chatLog = []; // { from: 'me'|charId, text, kind }
  const lastSaid = new Map();
  let lastAny = 0;
  let chatOpen = null;
  const threadChar = mode === '2p' ? bots[0].char : null;

  function bubble(who, text, { sticker = null } = {}) {
    const zone = el.querySelector('.bubble-zone');
    const c = who === 'me' ? null : seats.find((s) => s.char?.id === who)?.char;
    const b = html(`<button class="chat-bubble ${who === 'me' ? 'mine' : ''}">${c ? charAvatar(c, { size: 26 }) : ''}<div><b>${c ? esc(c.name.toUpperCase()) : 'YOU'}</b><span>${sticker ? `<i class="mini-sticker" style="background:${sticker.bg};color:${sticker.fg}">${esc(sticker.text)}</i>` : esc(text)}</span></div></button>`);
    b.addEventListener('click', () => openChat());
    zone.appendChild(b);
    while (zone.children.length > 2) zone.firstElementChild.remove();
    setTimeout(() => { b.classList.add('out'); setTimeout(() => b.remove(), 300); }, 3400);
  }

  function say(char, text) {
    if (!text) return;
    chatLog.push({ from: char.id, text });
    if (threadChar && char.id === threadChar.id) addMessage(char.id, { from: 'them', text });
    if (chatOpen) chatOpen.append({ from: char.id, text });
    else { bubble(char.id, text); const b = el.querySelector('.chat-btn .badge-dot'); b.classList.remove('hidden'); }
    sfx('msg');
    const st = el.querySelector(`[data-status="${seats.findIndex((s) => s.char?.id === char.id)}"]`);
    if (st) { st.textContent = '💬'; setTimeout(() => { st.textContent = ''; }, 2500); }
  }

  function botReact(char, emoji) {
    const i = seats.findIndex((s) => s.char?.id === char.id);
    const st = el.querySelector(`[data-status="${i}"]`);
    if (st) { st.textContent = emoji; st.classList.remove('pop'); void st.offsetWidth; st.classList.add('pop'); setTimeout(() => { st.textContent = ''; }, 2600); }
    board.float(`<span class="float-emoji">${emoji}</span>`, { x: 70 + Math.random() * 15, y: 18 + Math.random() * 12 });
  }

  // Personality-driven chatter, rate-limited so it never floods.
  function chatter(char, key, weight = 1) {
    if (!char || mode === 'local') return;
    const a = ARCHETYPES[char.archetype];
    const now = Date.now();
    if (now - (lastSaid.get(char.id) || 0) < 7000 || now - lastAny < 2500) return;
    if (Math.random() > a.chat * weight) {
      if (Math.random() < a.emojiRate * 0.35 * weight) { lastAny = now; setTimeout(() => botReact(char, a.emojis[Math.floor(Math.random() * a.emojis.length)]), 500); }
      return;
    }
    lastSaid.set(char.id, now);
    lastAny = now;
    setTimeout(() => say(char, line(char, key)), 500 + Math.random() * 900);
  }

  function sendMine(text, sticker = null) {
    chatLog.push({ from: 'me', text, sticker });
    if (threadChar) addMessage(threadChar.id, { from: 'me', text: sticker ? sticker.text : text, kind: sticker ? 'sticker' : 'text' });
    if (!chatOpen) bubble('me', text, { sticker });
    track('chat:sent');
    // Someone may answer.
    const responder = bots[Math.floor(Math.random() * bots.length)]?.char;
    if (responder && Math.random() < ARCHETYPES[responder.archetype].chat * 0.9) {
      lastAny = 0;
      lastSaid.delete(responder.id);
      setTimeout(() => say(responder, line(responder, 'reply')), 1100 + Math.random() * 1400);
    }
  }

  function sendReaction(r) {
    board.float(`<span class="float-emoji big">${r}</span>`, { x: 30 + Math.random() * 10, y: 72 });
    sfx('pop');
    track('reaction:sent');
    const b = bots[Math.floor(Math.random() * bots.length)]?.char;
    if (b && Math.random() < 0.45) setTimeout(() => botReact(b, ARCHETYPES[b.archetype].emojis[0]), 900);
  }

  function sendSticker(st) {
    board.float(`<div class="sticker-float" style="background:${st.bg};color:${st.fg};--rot:${st.rot}deg">${esc(st.text)}</div>`, { x: 50, y: 50, cls: 'sticker' });
    sfx('pop');
    sendMine(st.text, st);
    track('reaction:sent');
  }

  function openStickers() {
    const owned = store.s.inventory.stickers;
    const s = sheet(`<div class="h2" style="margin-bottom:12px">Stickers</div><div class="sticker-grid">${STICKERS.map((st) => {
      const has = owned.includes(st.id);
      return `<button class="sticker ${has ? '' : 'locked'}" data-st="${st.id}" style="background:${st.bg};color:${st.fg};--rot:${st.rot}deg">${esc(st.text)}${has ? '' : `<i class="lock">${icon.lock}</i>`}</button>`;
    }).join('')}</div>`, { cls: 'sheet-compact' });
    onTap(s.el, '[data-st]', (b) => {
      const st = STICKERS.find((x) => x.id === b.dataset.st);
      if (!owned.includes(st.id)) { toast('Unlock stickers through levels, events and the shop', { icon: '🔒' }); return; }
      s.close();
      sendSticker(st);
    });
  }

  function openChat() {
    if (mode === 'local') { toast('Chat is for online matches'); return; }
    el.querySelector('.chat-btn .badge-dot').classList.add('hidden');
    const head = threadChar
      ? `${charAvatar(threadChar, { size: 40, online: true })}<div><div class="h3">${esc(threadChar.name)}</div><div class="online-text">● Online · in match</div></div>`
      : `<div class="stack-avas">${bots.map((b) => charAvatar(b.char, { size: 32 })).join('')}</div><div><div class="h3">Table chat</div><div class="online-text">● ${bots.length + 1} players</div></div>`;
    const s = sheet(`
      <div class="chat-head">${head}</div>
      <div class="chat-list"></div>
      <div class="quick-replies">${QUICK_REPLIES.map((q) => `<button class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      <div class="emoji-row hidden">${['😂', '🔥', '😏', '👏', '😱', '❤️', '😭', '👑', '😊', '✨', '🙏', '😎', '🤔', '🎲', '💪', '🥳'].map((e) => `<button data-emoji="${e}">${e}</button>`).join('')}</div>
      <form class="chat-input"><button type="button" class="icon-btn" data-act="emoji">${icon.smile}</button><button type="button" class="icon-btn" data-act="sticker">${icon.sticker}</button>
        <input maxlength="80" placeholder="Say something…" enterkeyhint="send"><button class="send-btn" aria-label="Send">${icon.send}</button></form>`,
      { cls: 'chat-sheet', dim: false, onClose: () => { chatOpen = null; } });
    const list = s.el.querySelector('.chat-list');
    const append = (m) => {
      const c = m.from === 'me' ? null : seats.find((x) => x.char?.id === m.from)?.char;
      const node = html(`<div class="msg ${m.from === 'me' ? 'mine' : ''}">${c && !threadChar ? `<b>${esc(c.name)}</b>` : ''}${m.sticker ? `<i class="mini-sticker" style="background:${m.sticker.bg};color:${m.sticker.fg}">${esc(m.sticker.text)}</i>` : `<span>${esc(m.text)}</span>`}</div>`);
      list.appendChild(node);
      list.scrollTop = list.scrollHeight;
    };
    if (!chatLog.length) list.innerHTML = '<div class="msg-sys">Say hi 👋 Keep it friendly.</div>';
    chatLog.forEach(append);
    chatOpen = { append, close: s.close };
    const input = s.el.querySelector('input');
    s.el.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const t = input.value.trim();
      if (!t) return;
      input.value = '';
      sendMine(t);
      append({ from: 'me', text: t });
    });
    onTap(s.el, '[data-q]', (b) => { sendMine(b.dataset.q); append({ from: 'me', text: b.dataset.q }); });
    onTap(s.el, '[data-emoji]', (b) => { input.value += b.dataset.emoji; input.focus(); });
    onTap(s.el, '[data-act="emoji"]', () => s.el.querySelector('.emoji-row').classList.toggle('hidden'));
    onTap(s.el, '[data-act="sticker"]', () => { s.close(); openStickers(); });
  }

  onTap(el, '[data-react]', (b) => sendReaction(b.dataset.react));
  onTap(el, '[data-act]', (b) => {
    const a = b.dataset.act;
    if (a === 'chat') openChat();
    if (a === 'stickers') openStickers();
    if (a === 'rules') rulesSheet();
    if (a === 'exit') confirmExit();
  });

  function confirmExit() {
    const m = modal(`<div class="h2 center">Leave this match?</div><p class="muted center">The match will count as a loss.</p>
      <div class="col" style="margin-top:14px"><button class="btn primary lg block" data-a="stay">KEEP PLAYING</button><button class="btn ghost block" data-a="leave">Leave match</button></div>`);
    onTap(m.el, '[data-a]', (b) => {
      m.close();
      if (b.dataset.a === 'leave') { match.abort(); go('home', {}, { transition: 'fade', replace: true }); }
    });
  }

  /* ---------- Presentation updates ---------- */
  let lastBanner = null;
  function refresh() {
    const g = match.g;
    g.players.forEach((p, i) => {
      const slot = el.querySelector(`[data-home="${i}"]`);
      if (slot) slot.innerHTML = pips(tokensHome(p), p.color);
    });
    if (mode === 'local') return;
    const t = assess(g, meIdx);
    board.setDanger(t.danger);
    board.setHighlight(t.spotlight, 'spot');
    el.dataset.tension = t.level;
    el.style.setProperty('--tension', t.level);
    if (t.label !== lastBanner) {
      lastBanner = t.label;
      if (t.label) {
        bannerEl.innerHTML = `<span>${t.label}</span>`;
        bannerEl.dataset.tone = t.tone;
        bannerEl.classList.remove('show');
        void bannerEl.offsetWidth;
        bannerEl.classList.add('show');
        if (t.tone === 'danger') sfx('danger');
      } else bannerEl.classList.remove('show');
    }
  }

  function setTurn(i) {
    el.querySelectorAll('[data-seat]').forEach((n) => n.classList.toggle('turn', +n.dataset.seat === i));
    const s = seats[i];
    el.dataset.turn = s.kind === 'bot' ? 'opp' : 'me';
    if (s.kind === 'bot') setStatus(`${s.char.name} is rolling…`);
  }

  /* ---------- Match ---------- */
  const hooks = {
    view: board,
    dice: diceFor,
    onTurn: (i) => setTurn(i),
    awaitRoll: (i) => new Promise((resolve) => {
      const d = diceFor(i);
      d.setEnabled(true);
      setStatus(mode === 'local' ? `${seats[i].name} — tap the dice` : 'Your turn — tap the dice', 'go');
      rollResolver = resolve;
      // Gentle nudge from the opponent if the player idles.
      const idle = setTimeout(() => { if (rollResolver === resolve) chatter(bots[0]?.char, 'idle', 0.6); }, 12000);
      const done = resolve;
      rollResolver = () => { clearTimeout(idle); done(); };
    }),
    awaitPick: (i, moves) => new Promise((resolve) => {
      board.setMovable(moves.map((m) => ({ p: i, t: m.token })));
      setStatus('Tap a glowing token to move', 'go');
      pickResolver = { moves, resolve };
    }),
    offerSecondChance: (i, roll) => secondChanceOffer(match, meIdx, seats, roll),
    onEvent: (type, d) => onEvent(type, d),
  };

  const match = new Match(seats, hooks, { startTurn, secondChance: mode !== 'local' });
  setGameplayGuard(() => match.busy || Boolean(pickResolver));

  function onEvent(type, d) {
    const seat = seats[d?.player];
    const mine = d?.player === meIdx || seat?.kind === 'local';
    switch (type) {
      case 'roll':
        if (mine && d.roll === 6 && mode !== 'local') { track('roll:six'); store.update((s) => { s.stats.sixes++; }, { silent: true }); }
        if (d.roll === 6) {
          if (mine) bots.forEach((b) => chatter(b.char, 'youSix', 0.7));
          else if (seat?.char) chatter(seat.char, 'meSix', 0.5);
        }
        setStatus(seat.kind === 'bot' ? `${seat.char.name} rolled ${d.roll}` : `You rolled ${d.roll}${d.roll === 6 ? ' — bonus roll after this!' : ''}`);
        break;
      case 'triple-six':
        setStatus('Three sixes in a row — turn passes', 'warn');
        toast('Three 6s! Turn passes.', { icon: '🎲' });
        break;
      case 'no-move':
        if (!d.offer) setStatus(seat.kind === 'bot' ? `${seat.char.name} has no move` : `No move with a ${d.roll}`, 'warn');
        break;
      case 'second-chance':
        setStatus('Extra roll unlocked — tap the dice!', 'go');
        break;
      case 'moved': {
        refresh();
        if (d.captured.length) {
          const victimMine = d.captured.some((c) => c.player === meIdx);
          if (mine) {
            if (mode !== 'local') { track('capture:made', d.captured.length); store.update((s) => { s.stats.captures += d.captured.length; }, { silent: true }); }
            d.captured.forEach((c) => { const v = seats[c.player]; if (v.char) chatter(v.char, 'gotCaptured', 1.3); });
            board.float('<span class="float-emoji big">💥</span>', { x: 50, y: 45 });
          } else if (seat?.char) {
            chatter(seat.char, victimMine ? 'iCaptured' : 'iCaptured', victimMine ? 1.2 : 0.4);
          }
        }
        if (d.reachedHome) {
          if (mine && mode !== 'local') track('token:home');
          else if (seat?.char) chatter(seat.char, 'meHome', 0.5);
        }
        const g = match.g;
        if (!mine && seat?.char && tokensHome(g.players[d.player]) === 3) chatter(seat.char, 'meNearHome', 0.8);
        if (mine && tokensHome(g.players[meIdx]) === 3) bots.forEach((b) => chatter(b.char, 'youNearHome', 0.8));
        break;
      }
      case 'extra-turn':
        if (mine) setStatus(d.reason === 'capture' ? 'Capture! Roll again' : d.reason === 'home' ? 'Token home! Roll again' : 'Six! Roll again', 'go');
        break;
      case 'end':
        finish(d.winner);
        break;
    }
  }

  async function finish(winner) {
    setGameplayGuard(null);
    active = null;
    dockDice.setEnabled(false);
    const won = mode === 'local' ? null : winner === meIdx;
    const winSeat = seats[winner];
    if (winSeat.char) chatter(winSeat.char, 'meWin', 1.5);
    else bots.forEach((b) => chatter(b.char, 'meLose', 1.5));
    await wait(900);
    showResult({ el, match, seats, meIdx, mode, opponents, round, rematch, won, board, chatLog, threadChar });
  }

  return {
    el,
    nav: false,
    onEnter() {
      active = match;
      board.setup(match.g);
      dockDice.show(6);
      oppDice.forEach((d) => d.show(1));
      refresh();
      // Opening line
      if (bots.length) setTimeout(() => chatter(bots[0].char, 'greet', rematch ? 0.5 : 1.2), 800);
      setTimeout(() => match.run(), 450);
    },
    onLeave() {
      match.abort();
      setGameplayGuard(null);
      if (active === match) active = null;
    },
  };
}

function pips(n, color) {
  return Array.from({ length: 4 }, (_, i) => `<i class="${i < n ? 'on' : ''}" style="--c:${COLOR_HEX[color]}"></i>`).join('');
}

function oppChip(b) {
  return `<div class="opp-chip" data-seat="${b.i}" style="--c:${COLOR_HEX[b.color]}">
    ${charAvatar(b.char, { size: 40, online: true })}
    <div class="opp-meta"><div class="opp-name ellipsis">${esc(b.char.name)}</div><div class="home-pips" data-home="${b.i}">${pips(0, b.color)}</div></div>
    <div class="opp-status" data-status="${b.i}"></div><div class="opp-dice" data-dice="${b.i}"></div></div>`;
}

/* ---------- Second chance (fair, published, optional) ---------- */
function secondChanceOffer(match, meIdx, seats, roll) {
  return new Promise((resolve) => {
    const g = match.g;
    const t = assess(g, meIdx);
    const leader = seats[t.leader];
    const oppName = leader.char ? leader.char.name : 'Opponent';
    const available = adsAvailable();
    const m = modal(`
      <div class="sc-offer">
        <div class="eyebrow center">Second chance · once per match</div>
        <div class="display sc-title center">ONE MORE<br>CHANCE?</div>
        <div class="sc-state">
          <div><span class="dim">You</span><b>${t.myHome}/4 home</b></div>
          <div class="sc-vs">VS</div>
          <div><span class="dim">${esc(oppName)}</span><b>${t.leaderHome}/4 home</b></div>
        </div>
        <p class="center muted" style="margin:10px 0 2px">Your ${roll} has no legal move. Watch a short ad to get</p>
        <div class="sc-reward center">+1 Extra Roll</div>
        <p class="center dim" style="font-size:12px;margin:4px 0 14px">The new roll is just as random as any other.</p>
        <button class="btn go lg block sc-watch" data-a="watch" ${available ? '' : 'disabled'}>${available ? '▶ WATCH &amp; CONTINUE' : 'NO AD AVAILABLE'}</button>
        <button class="btn ghost block" data-a="no" style="margin-top:10px">NO THANKS</button>
      </div>`, { dismissible: false, cls: 'sc-modal' });
    onTap(m.el, '[data-a]', async (b) => {
      m.close();
      if (b.dataset.a === 'watch') {
        const ok = await showRewarded('second_chance');
        resolve(ok);
      } else resolve(false);
    });
  });
}

function rulesSheet() {
  sheet(`<div class="h2">How to play</div>
    <ul class="rules-list">
      <li>Roll a <b>6</b> to bring a token out of your yard.</li>
      <li>A <b>6</b>, a <b>capture</b> or bringing a token <b>home</b> gives you another roll.</li>
      <li>Three 6s in a row and your turn passes.</li>
      <li>Land on an opponent to send them back to their yard — except on <b>start</b> and <b>★ star</b> squares, which are safe.</li>
      <li>Tokens need an exact roll to reach home. First to bring all four home wins.</li>
    </ul>
    <div class="h3" style="margin-top:14px">Fair play</div>
    <ul class="rules-list">
      <li>Every roll uses your device's secure random generator. Ads, rewards and cosmetics never change dice.</li>
      <li><b>Second chance:</b> once per match, in the final stage (any player has 2 tokens home or a token in a home column), if your roll has no legal move you may watch an optional ad for one extra roll.</li>
    </ul>`, { cls: 'sheet-compact' });
}
