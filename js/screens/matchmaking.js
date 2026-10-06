// Matchmaking: FINDING PLAYER → MATCH FOUND → VS cards → 3·2·1·PLAY. Dramatic but fast.
import { html, esc, wait, onTap, icon } from '../core/ui.js';
import { sfx, haptic } from '../core/fx.js';
import { go, back } from '../core/router.js';
import { store, relationship } from '../core/store.js';
import { Dice } from '../game/dice.js';
import { onlineNow, getCharacter, allCharacters } from '../content/characters.js';
import { charAvatar, meAvatar } from './components.js';
import { rpick } from '../core/rng.js';

function pickOpponents(n, exclude = []) {
  const pool = onlineNow(60).filter((c) => !exclude.includes(c.id));
  const rel = store.s.rel;
  const out = [];
  // 30% of the time, re-match someone you know (builds familiarity).
  const known = pool.filter((c) => rel[c.id]);
  if (known.length && Math.random() < 0.3) out.push(rpick(known));
  while (out.length < n) {
    const c = rpick(pool.length ? pool : allCharacters());
    if (!out.includes(c)) out.push(c);
  }
  return out;
}

export function matchmakingScreen(params) {
  const { mode = '2p', round = 1, rematch = false } = params;
  const preset = params.opponents || (params.target ? [getCharacter(params.target)] : null);
  const need = mode === '4p' ? 3 : 1;
  let opponents = preset ? [...preset] : null;
  if (opponents && opponents.length < need) opponents = [...opponents, ...pickOpponents(need - opponents.length, opponents.map((c) => c.id))];

  const el = html(`<section class="mm">
    <div class="mm-top"><button class="icon-btn" data-act="cancel" aria-label="Cancel">${icon.close}</button><div class="eyebrow">${mode === '4p' ? '4 PLAYERS' : rematch ? 'REMATCH' : 'QUICK MATCH'}</div><div style="width:44px"></div></div>
    <div class="mm-stage">
      <div class="mm-search">
        <div class="mm-orbit">${Array.from({ length: 10 }, (_, i) => `<div class="orb-slot" style="--i:${i}"></div>`).join('')}</div>
        <div class="mm-dice"></div>
        <div class="mm-label display">${rematch ? `ROUND ${round}` : preset ? 'CONNECTING…' : 'FINDING PLAYER…'}</div>
        <div class="mm-hint muted">${preset ? '' : 'Matching by level &amp; play style'}</div>
      </div>
      <div class="mm-vs hidden"></div>
      <div class="mm-count hidden"></div>
    </div>
  </section>`);

  const dice = new Dice({ size: 92, interactive: false });
  el.querySelector('.mm-dice').appendChild(dice.el);
  let cancelled = false;
  onTap(el, '[data-act="cancel"]', () => { cancelled = true; back(); });

  async function run() {
    const slots = [...el.querySelectorAll('.orb-slot')];
    const cast = onlineNow(40);
    let k = 0;
    const cycle = setInterval(() => {
      slots.forEach((s, i) => { s.innerHTML = charAvatar(cast[(k + i * 3) % cast.length], { size: 44 }); });
      k++;
    }, 260);
    const rollLoop = setInterval(() => dice.roll(1 + Math.floor(Math.random() * 6)), 1000);
    dice.roll(6);
    await wait(rematch ? 700 : preset ? 1100 : 1600 + Math.random() * 1100);
    clearInterval(cycle);
    clearInterval(rollLoop);
    if (cancelled) return;
    opponents ||= pickOpponents(need);

    // MATCH FOUND
    const search = el.querySelector('.mm-search');
    el.querySelector('.mm-label').textContent = 'MATCH FOUND';
    el.classList.add('found');
    sfx('six');
    haptic([20, 30, 40]);
    await wait(650);
    search.classList.add('hidden');

    const vs = el.querySelector('.mm-vs');
    vs.classList.remove('hidden');
    if (mode === '4p') {
      vs.innerHTML = `<div class="vs-grid">${[null, ...opponents].map((c, i) => vsCard(c, i)).join('')}</div>${rematch ? `<div class="vs-round display">ROUND ${round}</div>` : ''}`;
    } else {
      vs.innerHTML = `${vsCard(null, 0)}<div class="vs-mark display">VS</div>${vsCard(opponents[0], 1)}${rematch ? `<div class="vs-round display">ROUND ${round}</div>` : ''}`;
    }
    sfx('whoosh');
    await wait(rematch ? 900 : 1500);
    if (cancelled) return;

    const count = el.querySelector('.mm-count');
    count.classList.remove('hidden');
    for (const n of ['3', '2', '1', 'PLAY']) {
      count.innerHTML = `<span class="display">${n}</span>`;
      sfx(n === 'PLAY' ? 'six' : 'tick');
      haptic(n === 'PLAY' ? 30 : 10);
      await wait(n === 'PLAY' ? 420 : 520);
      if (cancelled) return;
    }
    go('game', { mode, opponents, round, rematch }, { transition: 'zoom', replace: true });
  }

  return { el, nav: false, onEnter() { run(); }, onLeave() { cancelled = true; } };
}

function vsCard(c, i) {
  if (!c) {
    const s = store.s;
    return `<div class="vs-card me" style="--d:${i * 0.08}s">${meAvatar({ size: 96, level: true })}<div class="vs-name">YOU</div>
      <div class="vs-sub">${s.stats.streak >= 2 ? `🔥 ${s.stats.streak} Win Streak` : `${s.stats.won} wins`}</div></div>`;
  }
  const r = relationship(c.id);
  const rel = r.played ? `<div class="vs-rel">You ${r.won}–${r.lost} ${esc(c.name)}</div>` : '';
  return `<div class="vs-card" style="--d:${i * 0.08}s">${charAvatar(c, { size: 96, level: true, online: true })}<div class="vs-name">${esc(c.name.toUpperCase())}</div>
    <div class="vs-sub">${c.streak >= 2 ? `🔥 ${c.streak} Win Streak` : `Level ${c.level}`}</div><div class="vs-tag">${esc(c.tag)}</div>${rel}</div>`;
}
