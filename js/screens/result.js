// Match result overlay: emotional win/close/loss presentation, rewards, and the
// one-tap paths to the next meaningful action (rematch, new player, chat).
import { html, esc, onTap, countUp, wait, coinSvg, xpSvg, toast, modal, icon } from '../core/ui.js';
import { store, levelInfo, titleFor } from '../core/store.js';
import { sfx, haptic, celebrate } from '../core/fx.js';
import { go } from '../core/router.js';
import { recordMatch, addMessage, giveReward, describeReward } from '../core/progress.js';
import { closeness } from '../game/tension.js';
import { showRewarded, adsAvailable } from '../ads/ads.js';
import { ARCHETYPES, line } from '../content/personalities.js';
import { findItem, LEVEL_REWARDS } from '../content/catalog.js';
import { charAvatar, meAvatar } from './components.js';

export function showResult(ctx) {
  const { el, match, seats, meIdx, mode, opponents, round, rematch, won, threadChar } = ctx;
  const g = match.g;
  const winSeat = seats[g.winner];
  const local = mode === 'local';
  const close = local ? { kind: 'win', title: `${winSeat.name.toUpperCase()} WINS!`, sub: 'Pass & Play' } : closeness(g, meIdx);
  const isClose = ['photo', 'close', 'epic'].includes(close.kind);
  const rewards = local ? null : recordMatch({ won, mode, opponents, rematch, close: isClose });
  const primaryOpp = opponents[0];

  el.classList.add('ended', won ? 'won' : 'lost');
  sfx(won || local ? 'win' : 'lose');
  haptic(won ? [30, 50, 30, 50, 60] : 40);
  if (won) celebrate(findItem('victory', store.s.equipped.victory)?.fx || 'confetti');

  const winnerAva = winSeat.kind === 'me' || winSeat.kind === 'local' ? meAvatar({ size: 120 }) : charAvatar(winSeat.char, { size: 120 });
  const title = won === false ? close.title : (close.kind === 'win' && !local ? 'YOU WON!' : close.title);
  const sub = won === false && close.kind !== 'loss' ? close.sub : won ? close.sub : close.sub;

  const overlay = html(`
    <div class="result ${won ? 'is-win' : local ? 'is-win' : 'is-loss'} kind-${close.kind}">
      <div class="result-rays"></div>
      <div class="result-card">
        <div class="result-ava">${winnerAva}<div class="crown">👑</div></div>
        <div class="result-title display">${esc(title)}</div>
        ${sub ? `<div class="result-sub">${esc(sub)}</div>` : ''}
        ${!won && !local && winSeat.char ? `<div class="result-who muted">${esc(winSeat.char.name)} took this one</div>` : ''}
        ${rewards ? `
        <div class="reward-row">
          <div class="rw"><span class="rw-ico">${coinSvg}</span><b class="num" data-r="coins">+0</b></div>
          <div class="rw"><span class="rw-ico">${xpSvg}</span><b class="num" data-r="xp">+0</b><small>XP${rewards.xpMult > 1 ? ` ×${rewards.xpMult}` : ''}</small></div>
          ${won && rewards.streak >= 2 ? `<div class="rw streak">🔥<b>${rewards.streak}</b><small>Win streak</small></div>` : ''}
        </div>
        <div class="lv-progress"><span class="lv-badge">LV <b data-lv>${rewards.before.level}</b></span><div class="bar xp"><i data-xpbar style="width:${Math.round(rewards.before.pct * 100)}%"></i></div></div>
        ${!won ? '<div class="mission-note">📈 Progress saved · Missions updated</div>' : ''}
        ${won && adsAvailable() ? `<button class="btn violet block double-btn" data-a="double"><span class="ad-chip">AD</span> DOUBLE IT · +${rewards.coins} MORE</button>` : ''}
        ` : ''}
      </div>
      <div class="result-actions">
        <div class="rematch-note"></div>
        <button class="btn primary xl block" data-a="rematch">${icon.refresh} REMATCH</button>
        <div class="row" style="gap:10px">
          <button class="btn ghost lg grow" data-a="new">${local ? 'HOME' : 'NEW PLAYER'}</button>
          ${!local ? `<button class="btn ghost lg grow" data-a="chat">${icon.chat} CHAT</button>` : ''}
        </div>
      </div>
    </div>`);
  el.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));

  // Reward count-ups
  (async () => {
    if (!rewards) return;
    await wait(700);
    sfx('coin');
    countUp(overlay.querySelector('[data-r="coins"]'), 0, rewards.coins, 900, '+');
    await countUp(overlay.querySelector('[data-r="xp"]'), 0, rewards.xp, 900, '+');
    const bar = overlay.querySelector('[data-xpbar]');
    if (rewards.levelUps.length) {
      bar.style.width = '100%';
      await wait(600);
      overlay.querySelector('[data-lv]').textContent = rewards.after.level;
      bar.style.transition = 'none';
      bar.style.width = '0%';
      void bar.offsetWidth;
      bar.style.transition = '';
      bar.style.width = `${Math.round(rewards.after.pct * 100)}%`;
      levelUpModal(rewards.levelUps[rewards.levelUps.length - 1]);
    } else {
      bar.style.width = `${Math.round(rewards.after.pct * 100)}%`;
    }
  })();

  // Post-match social beat: opponent comments and maybe asks for a rematch.
  const note = overlay.querySelector('.rematch-note');
  if (primaryOpp && !local) {
    const a = ARCHETYPES[primaryOpp.archetype];
    const theyLost = winSeat.char?.id !== primaryOpp.id;
    const msg = line(primaryOpp, theyLost ? 'meLose' : 'meWin');
    if (threadChar) addMessage(primaryOpp.id, { from: 'them', text: msg, kind: 'text' });
    setTimeout(() => {
      note.innerHTML = `${charAvatar(primaryOpp, { size: 28 })}<span><b>${esc(primaryOpp.name)}:</b> ${esc(msg)}</span>`;
      note.classList.add('show');
      sfx('msg');
    }, 1300);
    if (theyLost && Math.random() < a.rematch * 0.8) {
      setTimeout(() => {
        const ask = line(primaryOpp, 'rematchAsk');
        note.innerHTML = `${charAvatar(primaryOpp, { size: 28 })}<span><b>${esc(primaryOpp.name)} wants a rematch:</b> ${esc(ask)}</span>`;
        overlay.querySelector('[data-a="rematch"]').classList.add('pulse');
        sfx('msg');
        if (threadChar) addMessage(primaryOpp.id, { from: 'them', text: ask, kind: 'rematch' });
      }, 3600);
    }
  }

  onTap(overlay, '[data-a]', async (b) => {
    const a = b.dataset.a;
    if (a === 'double') {
      b.disabled = true;
      const ok = await showRewarded('double_reward');
      if (ok) {
        giveReward({ coins: rewards.coins });
        const c = overlay.querySelector('[data-r="coins"]');
        countUp(c, rewards.coins, rewards.coins * 2, 700, '+');
        sfx('coin');
        b.textContent = 'DOUBLED ✓';
      } else b.disabled = false;
    }
    if (a === 'rematch') {
      if (local) { go('game', { mode: 'local', round: round + 1 }, { transition: 'zoom', replace: true }); return; }
      const accept = opponents.every((c) => Math.random() < ARCHETYPES[c.archetype].rematch);
      if (accept) {
        note.innerHTML = `<span>✅ <b>${esc(primaryOpp.name)}</b> accepted · ${esc(line(primaryOpp, 'rematchYes'))}</span>`;
        note.classList.add('show');
        await wait(700);
        go('matchmaking', { mode, opponents, round: round + 1, rematch: true }, { transition: 'fade', replace: true });
      } else {
        const msg = line(primaryOpp, 'rematchNo');
        note.innerHTML = `${charAvatar(primaryOpp, { size: 28 })}<span><b>${esc(primaryOpp.name)}:</b> ${esc(msg)}</span>`;
        note.classList.add('show');
        if (threadChar) addMessage(primaryOpp.id, { from: 'them', text: msg });
        b.textContent = 'FIND NEW PLAYER';
        b.dataset.a = 'new';
      }
    }
    if (a === 'new') go(local ? 'home' : 'matchmaking', local ? {} : { mode }, { transition: 'fade', replace: true });
    if (a === 'chat') go('thread', { id: primaryOpp.id }, { transition: 'slide' });
  });
}

function levelUpModal(level) {
  const r = LEVEL_REWARDS[level];
  setTimeout(() => {
    celebrate('fireworks');
    sfx('win');
    const m = modal(`<div class="levelup">
      <div class="eyebrow center">Level up</div>
      <div class="lvl-burst display">${level}</div>
      <div class="h2 center">${titleFor(level)}</div>
      ${r ? `<div class="center muted" style="margin-top:6px">Unlocked: <b style="color:var(--text)">${esc(describeReward(r))}</b></div>` : ''}
      <button class="btn primary lg block" style="margin-top:18px" data-ok>AWESOME</button></div>`);
    m.el.querySelector('[data-ok]').addEventListener('click', m.close);
  }, 600);
}
