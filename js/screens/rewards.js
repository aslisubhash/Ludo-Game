// REWARDS tab: daily track, live events, missions, mystery box and the level road.
import { html, esc, onTap, icon, coinSvg, toast, modal, wait, fmt } from '../core/ui.js';
import { store, levelInfo, titleFor, addCoins, grant, own } from '../core/store.js';
import { sfx, haptic, burstAt, celebrate } from '../core/fx.js';
import { go } from '../core/router.js';
import { bus } from '../core/events.js';
import { dailyStatus, missionDefs, claimMission, eventState, claimEvent, describeReward, giveReward } from '../core/progress.js';
import { liveEvents, daysLeft, upcomingEvent } from '../content/events-calendar.js';
import { LEVEL_REWARDS, DAILY_TRACK, CATALOG, findItem } from '../content/catalog.js';
import { showRewarded, adsAvailable } from '../ads/ads.js';
import { topBar, rewardChip } from './components.js';
import { openDailyReward, openNotifications, openSettings } from './overlays.js';

const MYSTERY_COOLDOWN = 4 * 3600 * 1000;

export function rewardsScreen() {
  const el = html('<section class="rewards"></section>');

  function render() {
    const daily = dailyStatus();
    const events = liveEvents();
    const missions = missionDefs();
    const lv = levelInfo();
    const next = upcomingEvent();
    const freeIn = Math.max(0, store.s.mystery.lastFree + MYSTERY_COOLDOWN - Date.now());
    const road = Object.entries(LEVEL_REWARDS).map(([l, r]) => ({ l: +l, r })).filter((x) => x.l >= lv.level - 2).slice(0, 8);

    el.innerHTML = `${topBar()}
    <div class="scroll"><div class="pad">
      <div class="h1" style="margin:6px 0 4px">Rewards</div>

      <button class="daily-hero pressable ${daily.available ? 'ready' : ''}" data-act="daily">
        <div class="dh-box">🎁</div>
        <div class="grow"><div class="eyebrow">Daily reward · Day ${daily.streakDay}</div><b class="h2">${daily.available ? 'Ready to open!' : 'Claimed for today'}</b>
        <div class="daily-track sm">${DAILY_TRACK.map((r, i) => `<i class="${i < daily.idx || (i === daily.idx && !daily.available) ? 'done' : i === daily.idx ? 'today' : ''}"></i>`).join('')}</div></div>
        ${daily.available ? '<span class="btn go sm">OPEN</span>' : ''}
      </button>

      <div class="section-head"><div class="eyebrow">Live events</div>${next ? `<span class="dim" style="font-size:12px">Coming: ${esc(next.name)} · ${esc(next.start)}</span>` : ''}</div>
      <div class="col">${events.map((e) => {
        const st = eventState(e);
        const done = st.progress >= e.goal.count;
        return `<div class="event-card art-${e.art}" style="--ea:${e.theme.a};--eb:${e.theme.b}">
          <div class="eb-art"></div>
          <div class="ec-body"><div class="eb-tag">LIVE · ${daysLeft(e)}d left</div><div class="eb-title display">${esc(e.title)}</div><div class="eb-sub">${esc(e.sub)}</div>
          <div class="row" style="gap:8px;margin-top:10px"><div class="bar gold grow"><i style="width:${Math.min(100, (st.progress / e.goal.count) * 100)}%"></i></div><span class="num">${st.progress}/${e.goal.count}</span></div>
          <div class="row" style="justify-content:space-between;margin-top:10px">${rewardChip(e.reward)}
          ${st.claimed ? '<span class="pill-tag">✓ Claimed</span>' : done ? `<button class="btn go sm" data-event="${e.id}">CLAIM</button>` : '<button class="btn light sm" data-act="play">PLAY</button>'}</div></div>
        </div>`;
      }).join('')}</div>

      <div class="section-head"><div class="eyebrow">Daily missions</div><span class="dim" style="font-size:12px">Resets at midnight</span></div>
      <div class="col">${missions.map((m) => {
        const ready = !m.claimed && m.progress >= m.goal;
        return `<div class="mission card ${m.claimed ? 'claimed' : ready ? 'ready' : ''}">
          <div class="m-ico">${m.claimed ? '✓' : ready ? '🎯' : '◎'}</div>
          <div class="grow"><b>${esc(m.text)}</b><div class="bar" style="margin-top:8px"><i style="width:${(m.progress / m.goal) * 100}%"></i></div>
          <div class="row" style="justify-content:space-between;margin-top:8px">${rewardChip(m.reward)}<span class="num dim">${m.progress}/${m.goal}</span></div></div>
          ${ready ? `<div class="col" style="gap:6px"><button class="btn go sm" data-claim="${m.id}">CLAIM</button>${adsAvailable() ? `<button class="btn violet sm" data-claim2="${m.id}"><span class="ad-chip">AD</span>×2</button>` : ''}</div>` : ''}
        </div>`;
      }).join('')}</div>

      <div class="section-head"><div class="eyebrow">Mystery box</div></div>
      <div class="mystery card">
        <div class="mystery-box ${freeIn ? '' : 'ready'}"><div class="mb-lid"></div><div class="mb-body">?</div></div>
        <div class="grow"><b>Mystery Box</b><div class="dim" style="font-size:13px">Coins, stickers, dice or boards. Every box contains something.</div>
          <div class="row" style="gap:8px;margin-top:10px">
            ${freeIn ? `<span class="pill-tag">Free in ${Math.ceil(freeIn / 60000)}m</span>${adsAvailable() ? '<button class="btn violet sm" data-act="mystery-ad"><span class="ad-chip">AD</span> OPEN NOW</button>' : ''}` : '<button class="btn go sm" data-act="mystery-free">OPEN FREE</button>'}
          </div></div>
      </div>

      <div class="section-head"><div class="eyebrow">Level road</div><span class="lv-badge">LV ${lv.level} · ${titleFor(lv.level)}</span></div>
      <div class="rail road">${road.map(({ l, r }) => `<div class="road-step ${l <= lv.level ? 'got' : l === lv.level + 1 ? 'next' : ''}">
        <div class="rs-lvl">LV ${l}</div><div class="rs-ico">${r.kind ? itemIcon(r.kind) : '🪙'}</div><small class="ellipsis">${esc(r.kind ? findItem(r.kind, r.id)?.name || findItem(r.kind, r.id)?.text : `${r.coins} coins`)}</small>${r.title ? `<span class="rs-title">${r.title}</span>` : ''}</div>`).join('')}</div>

      <button class="shop-link card pressable" data-act="collection"><span>🛍️</span><div class="grow"><b>Collection &amp; shop</b><div class="dim" style="font-size:13px">Dice, boards, tokens, frames and more</div></div>${icon.back.replace('<svg', '<svg style="transform:rotate(180deg)"')}</button>
      <div style="height:24px"></div>
    </div></div>`;
  }

  async function openMystery(viaAd) {
    if (viaAd && !(await showRewarded('mystery_box'))) return;
    if (!viaAd) store.update((s) => { s.mystery.lastFree = Date.now(); });
    // Weighted, published odds: 60% coins, 25% sticker, 10% dice, 5% board.
    const roll = Math.random();
    const pool = (kind) => CATALOG[kind].filter((x) => !own(kind, x.id) && !x.event && x.price !== undefined);
    let prize = null;
    if (roll < 0.05 && pool('boards').length) prize = { kind: 'boards', id: pool('boards')[Math.floor(Math.random() * pool('boards').length)].id };
    else if (roll < 0.15 && pool('dice').length) prize = { kind: 'dice', id: pool('dice')[Math.floor(Math.random() * pool('dice').length)].id };
    else if (roll < 0.4 && pool('stickers').length) prize = { kind: 'stickers', id: pool('stickers')[Math.floor(Math.random() * pool('stickers').length)].id };
    const coins = prize ? 0 : 150 + Math.floor(Math.random() * 6) * 50;
    const m = modal(`<div class="mystery-open"><div class="mystery-box big opening"><div class="mb-lid"></div><div class="mb-body">?</div></div><div class="mo-prize hidden"></div>
      <button class="btn primary lg block hidden" data-ok style="margin-top:16px">COLLECT</button><div class="dim center" style="font-size:11px;margin-top:10px">Odds: 60% coins · 25% sticker · 10% dice · 5% board</div></div>`);
    sfx('roll');
    haptic([10, 40, 10, 40]);
    await wait(1100);
    const box = m.el.querySelector('.mystery-box');
    box.classList.add('opened');
    burstAt(box, { count: 50, speed: 8 });
    celebrate('confetti');
    sfx('win');
    if (prize) grant(prize.kind, prize.id); else addCoins(coins);
    const p = m.el.querySelector('.mo-prize');
    p.innerHTML = prize ? `<div class="display">${itemIcon(prize.kind)}</div><b class="h2">${esc(describeReward(prize))}</b>` : `<div class="display">${coinSvg}</div><b class="h2">+${coins} coins</b>`;
    p.classList.remove('hidden');
    const ok = m.el.querySelector('[data-ok]');
    ok.classList.remove('hidden');
    ok.addEventListener('click', () => { m.close(); render(); });
  }

  onTap(el, '[data-act]', (b) => {
    const a = b.dataset.act;
    if (a === 'daily') openDailyReward({ onDone: render });
    if (a === 'play') go('matchmaking', { mode: '2p' }, { transition: 'fade' });
    if (a === 'collection') go('profile', { tab: 'collection' }, { transition: 'fade', replace: true });
    if (a === 'mystery-free') openMystery(false);
    if (a === 'mystery-ad') openMystery(true);
    if (a === 'profile') go('profile', {}, { transition: 'fade', replace: true });
    if (a === 'notifications') openNotifications();
    if (a === 'settings') openSettings();
  });
  onTap(el, '[data-claim]', (b) => {
    const got = claimMission(b.dataset.claim);
    if (got) { sfx('coin'); burstAt(b, { count: 24 }); toast(`+${got.coins} coins · +${got.xp} XP`, { icon: '🎯' }); render(); }
  });
  onTap(el, '[data-claim2]', async (b) => {
    if (!(await showRewarded('mission_bonus'))) return;
    const got = claimMission(b.dataset.claim2, 2);
    if (got) { sfx('coin'); toast(`Doubled! +${got.coins} coins · +${got.xp} XP`, { icon: '✨' }); render(); }
  });
  onTap(el, '[data-event]', (b) => {
    const e = liveEvents().find((x) => x.id === b.dataset.event);
    const got = claimEvent(e);
    if (got) { celebrate('fireworks'); sfx('win'); toast(`Unlocked: ${describeReward(e.reward)}`, { icon: '🏆', ms: 3200 }); render(); }
  });

  const off = bus.on('store', () => { const c = el.querySelector('[data-coins]'); if (c) c.textContent = fmt(store.s.coins); });
  render();
  return { el, nav: true, tab: 'rewards', onLeave: off };
}

export function itemIcon(kind) {
  return { dice: '🎲', boards: '🧩', tokens: '♟️', frames: '🖼️', stickers: '💬', victory: '🎆' }[kind] || '🎁';
}
