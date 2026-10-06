// CHATS tab (inbox) and conversation threads with game invites.
import { html, esc, onTap, icon, ago, wait } from '../core/ui.js';
import { store } from '../core/store.js';
import { sfx } from '../core/fx.js';
import { go, back } from '../core/router.js';
import { bus } from '../core/events.js';
import { threads, addMessage, markRead, track } from '../core/progress.js';
import { getCharacter, isOnline, onlineNow } from '../content/characters.js';
import { ARCHETYPES, line, QUICK_REPLIES } from '../content/personalities.js';
import { STICKERS } from '../content/catalog.js';
import { topBar, charAvatar, profileSheet } from './components.js';
import { openNotifications, openSettings } from './overlays.js';

export function chatsScreen() {
  const el = html('<section class="chats"></section>');
  function render() {
    const list = threads();
    const online = onlineNow(10);
    el.innerHTML = `${topBar()}
      <div class="scroll"><div class="pad">
        <div class="h1" style="margin:6px 0 12px">Chats</div>
        <div class="rail online-rail compact">${online.map((c) => `<button class="online-card pressable" data-open="${c.id}">${charAvatar(c, { size: 56, online: true })}<b class="ellipsis">${esc(c.name)}</b></button>`).join('')}</div>
        <div class="inbox">${list.length ? list.map(({ id, last, unread }) => {
          const c = getCharacter(id);
          if (!c) return '';
          const preview = last.kind === 'invite' ? '🎲 Challenged you to Ludo' : last.kind === 'rematch' ? `🔁 ${last.text}` : last.from === 'me' ? `You: ${last.text}` : last.text;
          return `<button class="inbox-row ${unread ? 'unread' : ''}" data-open="${id}">${charAvatar(c, { size: 52, online: isOnline(c) })}
            <div class="grow"><div class="row" style="justify-content:space-between"><b>${esc(c.name)}</b><small class="dim">${ago(last.t)}</small></div>
            <div class="row" style="justify-content:space-between"><span class="ellipsis inbox-preview">${esc(preview)}</span>${unread ? `<i class="unread-dot">${unread}</i>` : ''}</div></div></button>`;
        }).join('') : `<div class="empty-state"><div class="es-ico">💬</div><b>No chats yet</b><div class="dim">Play a match — opponents often stick around to chat.</div><button class="btn primary" data-act="play">PLAY NOW</button></div>`}</div>
        <div style="height:20px"></div>
      </div></div>`;
  }
  onTap(el, '[data-open]', (b) => go('thread', { id: b.dataset.open }));
  onTap(el, '[data-act]', (b) => {
    const a = b.dataset.act;
    if (a === 'play') go('matchmaking', { mode: '2p' }, { transition: 'fade' });
    if (a === 'profile') go('profile', {}, { transition: 'fade', replace: true });
    if (a === 'notifications') openNotifications();
    if (a === 'settings') openSettings();
  });
  const off = bus.on('store', () => { if (el.isConnected && !el.querySelector('input:focus')) render(); });
  render();
  return { el, nav: true, tab: 'chats', onLeave: off };
}

export function threadScreen({ id }) {
  const c = getCharacter(id);
  const a = ARCHETYPES[c.archetype];
  const el = html(`<section class="thread">
    <header class="thread-head">
      <button class="icon-btn" data-act="back" aria-label="Back">${icon.back}</button>
      <button class="row grow th-who" data-act="profile">${charAvatar(c, { size: 42, online: isOnline(c) })}
        <div><b>${esc(c.name)}</b><div class="${isOnline(c) ? 'online-text' : 'dim'}" style="font-size:12px">${isOnline(c) ? '● Online' : 'Away'} · Lv ${c.level}</div></div></button>
      <button class="btn primary sm" data-act="play">${icon.play} PLAY</button>
    </header>
    <div class="thread-list scroll"></div>
    <div class="typing hidden"><span></span><span></span><span></span></div>
    <div class="thread-bottom">
      <div class="quick-replies">${QUICK_REPLIES.map((q) => `<button class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}<button class="chip" data-act="invite">🎲 Challenge</button></div>
      <div class="sticker-tray hidden">${STICKERS.filter((s) => store.s.inventory.stickers.includes(s.id)).map((s) => `<button class="sticker" data-st="${s.id}" style="background:${s.bg};color:${s.fg};--rot:${s.rot}deg">${esc(s.text)}</button>`).join('')}</div>
      <form class="chat-input"><button type="button" class="icon-btn" data-act="sticker">${icon.sticker}</button>
        <input maxlength="120" placeholder="Message ${esc(c.name)}…" enterkeyhint="send"><button class="send-btn" aria-label="Send">${icon.send}</button></form>
    </div>
  </section>`);
  const list = el.querySelector('.thread-list');
  const typing = el.querySelector('.typing');

  function renderMsgs() {
    const msgs = store.s.chats[id] || [];
    list.innerHTML = `<div class="thread-intro">${charAvatar(c, { size: 72 })}<b>${esc(c.name)}</b><span class="dim">${esc(c.tag)} · “${esc(c.bio)}”</span></div>` + msgs.map(msgHtml).join('');
    list.scrollTop = list.scrollHeight;
  }
  function msgHtml(m) {
    if (m.kind === 'invite' || m.kind === 'rematch') {
      const title = m.kind === 'invite' ? `${esc(c.name.toUpperCase())} challenged you.` : `${esc(c.name.toUpperCase())} wants a rematch.`;
      return `<div class="invite-card"><div class="ic-dice">🎲</div><div class="grow"><b>${title}</b><div class="dim">${m.kind === 'invite' ? 'PLAY LUDO?' : esc(m.text)}</div></div><button class="btn go sm" data-act="accept">${m.kind === 'invite' ? 'ACCEPT' : 'PLAY NOW'}</button></div>`;
    }
    if (m.from === 'sys') return `<div class="msg-sys">${esc(m.text)}</div>`;
    if (m.kind === 'sticker') {
      const st = STICKERS.find((s) => s.text === m.text) || { bg: '#333', fg: '#fff', rot: 0 };
      return `<div class="msg ${m.from === 'me' ? 'mine' : ''}"><i class="mini-sticker big" style="background:${st.bg};color:${st.fg};--rot:${st.rot}deg">${esc(m.text)}</i></div>`;
    }
    return `<div class="msg ${m.from === 'me' ? 'mine' : ''}"><span>${esc(m.text)}</span><small>${ago(m.t)}</small></div>`;
  }

  let replyTimer = 0;
  function theyRespond(force = false) {
    clearTimeout(replyTimer);
    const chance = force ? 1 : 0.35 + a.chat * 0.6;
    if (Math.random() > chance) return;
    replyTimer = setTimeout(async () => {
      typing.classList.remove('hidden');
      await wait(900 + Math.random() * 1400);
      typing.classList.add('hidden');
      if (!el.isConnected) return;
      if (Math.random() < 0.25) addMessage(id, { from: 'them', text: line(c, 'invite'), kind: 'invite' });
      else addMessage(id, { from: 'them', text: line(c, 'reply') });
      sfx('msg');
      renderMsgs();
    }, 500);
  }

  function send(text, kind = 'text') {
    addMessage(id, { from: 'me', text, kind });
    track('chat:sent');
    sfx('pop');
    renderMsgs();
    theyRespond();
  }

  const input = el.querySelector('input');
  el.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); const t = input.value.trim(); if (!t) return; input.value = ''; send(t); });
  onTap(el, '[data-q]', (b) => send(b.dataset.q));
  onTap(el, '[data-st]', (b) => { const st = STICKERS.find((s) => s.id === b.dataset.st); send(st.text, 'sticker'); el.querySelector('.sticker-tray').classList.add('hidden'); });
  onTap(el, '[data-act]', (b) => {
    const act = b.dataset.act;
    if (act === 'back') back('chats');
    if (act === 'play' || act === 'accept') go('matchmaking', { mode: '2p', target: id }, { transition: 'fade' });
    if (act === 'sticker') el.querySelector('.sticker-tray').classList.toggle('hidden');
    if (act === 'profile') profileSheet(c, { onPlay: (x) => go('matchmaking', { mode: '2p', target: x.id }), onChat: () => {} });
    if (act === 'invite') {
      addMessage(id, { from: 'sys', text: `You challenged ${c.name} 🎲` });
      renderMsgs();
      setTimeout(() => { addMessage(id, { from: 'them', text: line(c, 'rematchYes') }); renderMsgs(); sfx('msg'); setTimeout(() => go('matchmaking', { mode: '2p', target: id }, { transition: 'fade' }), 900); }, 1200);
    }
  });

  return {
    el,
    nav: false,
    onEnter() {
      if (!(store.s.chats[id] || []).length) addMessage(id, { from: 'them', text: line(c, 'greet') });
      markRead(id);
      renderMsgs();
    },
    onLeave() { clearTimeout(replyTimer); markRead(id); },
  };
}
