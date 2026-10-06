// PROFILE tab: identity, level, stats and the cosmetic collection (equip / buy).
import { html, esc, onTap, icon, coinSvg, toast, sheet, fmt, modal } from '../core/ui.js';
import { store, levelInfo, titleFor, spendCoins, own, grant } from '../core/store.js';
import { sfx, burstAt } from '../core/fx.js';
import { go } from '../core/router.js';
import { bus } from '../core/events.js';
import { CATALOG, KIND_LABEL, EQUIP_KEY, LEVEL_REWARDS, findItem } from '../content/catalog.js';
import { boardSvg, COLOR_HEX } from '../game/board-view.js';
import { Dice } from '../game/dice.js';
import { showRewarded, adsAvailable } from '../ads/ads.js';
import { topBar, meAvatar, EMBLEMS, frameSvg } from './components.js';
import { openNotifications, openSettings } from './overlays.js';

const KINDS = ['dice', 'boards', 'tokens', 'frames', 'stickers', 'victory'];

export function profileScreen(params = {}) {
  const el = html('<section class="profile"></section>');
  let kind = 'dice';

  function unlockHint(k, item) {
    if (item.event) return `${item.event[0].toUpperCase() + item.event.slice(1)} event`;
    const lvl = Object.entries(LEVEL_REWARDS).find(([, r]) => r.kind === k && r.id === item.id)?.[0];
    if (lvl) return `Level ${lvl}`;
    return null;
  }

  function preview(k, item) {
    if (k === 'dice') return `<div class="cp-dice" data-dice="${item.id}"></div>`;
    if (k === 'boards') return `<div class="cp-board">${boardSvg(item.id)}</div>`;
    if (k === 'tokens') return `<div class="cp-tokens">${['red', 'green', 'yellow', 'blue'].map((c) => `<i class="piece static c-${c} shape-${item.shape}"><span class="piece-in"><i class="piece-shadow"></i><i class="piece-body"></i><i class="piece-ring"></i></span></i>`).join('')}</div>`;
    if (k === 'frames') return `<div class="cp-frame"><div class="ava" style="--s:56px"><div class="ava-img emblem" style="background:linear-gradient(135deg,#232a55,#7B5CFF)"><span style="font-size:28px">🎲</span></div>${item.ring ? `<div class="frame">${frameSvg(item.id)}</div>` : ''}</div></div>`;
    if (k === 'stickers') return `<div class="cp-sticker"><span class="sticker" style="background:${item.bg};color:${item.fg};--rot:${item.rot}deg">${esc(item.text)}</span></div>`;
    return `<div class="cp-fx fx-${item.fx}">${item.fx === 'petals' ? '🌼' : item.fx === 'holi' ? '🎨' : item.fx === 'fireworks' ? '🎆' : '🎉'}</div>`;
  }

  function render() {
    const s = store.s;
    const lv = levelInfo();
    const em = EMBLEMS[s.profile.emblem] || EMBLEMS.peacock;
    const winRate = s.stats.played ? Math.round((s.stats.won / s.stats.played) * 100) : 0;
    const items = CATALOG[kind];
    const eqKey = EQUIP_KEY[kind];

    el.innerHTML = `${topBar()}
    <div class="scroll"><div class="pad">
      <div class="me-hero">
        <button class="me-ava-btn" data-act="emblem">${meAvatar({ size: 108 })}<span class="edit-dot">✎</span></button>
        <button class="me-name-btn" data-act="name"><span class="h1">${esc(s.profile.name)}</span> <span class="dim">✎</span></button>
        <div class="me-title">${titleFor(lv.level)}</div>
        <div class="me-xp"><span class="lv-badge">LV ${lv.level}</span><div class="bar xp grow"><i style="width:${Math.round(lv.pct * 100)}%"></i></div><span class="dim num">${lv.into}/${lv.need}</span></div>
      </div>
      <div class="stat-grid four">
        <div><b class="num">${s.stats.played}</b><span>Played</span></div>
        <div><b class="num">${winRate}%</b><span>Win rate</span></div>
        <div><b class="num">${s.stats.bestStreak}</b><span>Best streak</span></div>
        <div><b class="num">${s.stats.captures}</b><span>Captures</span></div>
      </div>

      <div class="section-head" id="collection"><div class="h2">Collection</div>${coinPillInline()}</div>
      <div class="rail kind-tabs">${KINDS.map((k) => `<button class="chip ${k === kind ? 'on' : ''}" data-kind="${k}">${KIND_LABEL[k]} <span class="dim">${s.inventory[k]?.length || 0}/${CATALOG[k].length}</span></button>`).join('')}</div>
      <div class="coll-grid">${items.map((item) => {
        const has = own(kind, item.id);
        const equipped = eqKey && s.equipped[eqKey] === item.id;
        const hint = !has ? unlockHint(kind, item) : null;
        const buyable = !has && !hint && item.price > 0;
        return `<div class="coll-item ${equipped ? 'equipped' : ''} ${has ? '' : 'locked'}">
          ${preview(kind, item)}
          <b class="ellipsis">${esc(item.name || item.text)}</b>
          ${equipped ? '<span class="pill-tag on">EQUIPPED</span>'
            : has ? (eqKey ? `<button class="btn light sm" data-equip="${item.id}">EQUIP</button>` : '<span class="pill-tag">OWNED</span>')
            : buyable ? `<button class="btn primary sm" data-buy="${item.id}">${coinSvg}${fmt(item.price)}</button>`
            : `<span class="pill-tag">${icon.lock} ${esc(hint || 'Locked')}</span>`}
          ${!has && kind === 'dice' && buyable && adsAvailable() ? `<button class="link try-link" data-try="${item.id}">▶ Try 3 matches</button>` : ''}
        </div>`;
      }).join('')}</div>

      <div class="fair-card card"><div class="row"><span style="font-size:22px">⚖️</span><div><b>Fair play promise</b><div class="dim" style="font-size:13px">Every dice roll uses secure randomness. Ads, coins and cosmetics never change outcomes.</div></div></div></div>
      <div style="height:24px"></div>
    </div></div>`;

    // Live dice previews
    el.querySelectorAll('[data-dice]').forEach((slot) => {
      const d = new Dice({ size: 44, skin: slot.dataset.dice, interactive: false });
      d.show(5);
      slot.appendChild(d.el);
      slot.addEventListener('click', () => d.roll(1 + Math.floor(Math.random() * 6)));
    });
  }

  function coinPillInline() {
    return `<div class="coin-pill">${coinSvg}<b class="num" data-coins>${fmt(store.s.coins)}</b></div>`;
  }

  onTap(el, '[data-kind]', (b) => { kind = b.dataset.kind; render(); });
  onTap(el, '[data-equip]', (b) => {
    store.update((s) => { s.equipped[EQUIP_KEY[kind]] = b.dataset.equip; });
    sfx('pop');
    render();
  });
  onTap(el, '[data-buy]', (b) => {
    const item = findItem(kind, b.dataset.buy);
    if (!spendCoins(item.price)) { toast('Not enough coins — win matches or open the mystery box', { icon: '🪙' }); return; }
    grant(kind, item.id);
    if (EQUIP_KEY[kind]) store.update((s) => { s.equipped[EQUIP_KEY[kind]] = item.id; });
    sfx('coin');
    burstAt(b, { count: 30 });
    toast(`${item.name || item.text} unlocked!`, { icon: '✨' });
    render();
  });
  onTap(el, '[data-try]', async (b) => {
    if (!(await showRewarded('trial_dice'))) return;
    // Trial = equip temporarily; reverts to previous dice after 3 matches.
    const prev = store.s.equipped.dice;
    store.update((s) => { s.equipped.dice = b.dataset.try; s.trial = { id: b.dataset.try, left: 3, prev }; });
    toast('Trial dice equipped for 3 matches', { icon: '🎲' });
    render();
  });
  onTap(el, '[data-act]', (b) => {
    const a = b.dataset.act;
    if (a === 'emblem') pickEmblem();
    if (a === 'name') editName();
    if (a === 'notifications') openNotifications();
    if (a === 'settings') openSettings();
    if (a === 'profile') {}
  });

  function pickEmblem() {
    const s = sheet(`<div class="h2" style="margin-bottom:12px">Choose your emblem</div><div class="emblem-grid">${Object.entries(EMBLEMS).map(([k, e]) => `<button class="emblem-opt ${store.s.profile.emblem === k ? 'on' : ''}" data-em="${k}" style="background:linear-gradient(135deg,${e.bg[0]},${e.bg[1]})">${e.e}</button>`).join('')}</div>`, { cls: 'sheet-compact' });
    onTap(s.el, '[data-em]', (b) => { store.update((x) => { x.profile.emblem = b.dataset.em; }); s.close(); render(); });
  }

  function editName() {
    const m = modal(`<div class="h2 center">Your player name</div><input class="name-input" maxlength="14" value="${esc(store.s.profile.name)}"><button class="btn primary lg block" data-ok style="margin-top:12px">SAVE</button>`);
    const input = m.el.querySelector('input');
    input.focus();
    input.select();
    const save = () => { const v = input.value.trim().replace(/[<>]/g, ''); if (v) store.update((x) => { x.profile.name = v; }); m.close(); render(); };
    m.el.querySelector('[data-ok]').addEventListener('click', save);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
  }

  const off = bus.on('store', () => { const c = el.querySelector('[data-coins]'); if (c) c.textContent = fmt(store.s.coins); });
  render();
  return {
    el,
    nav: true,
    tab: 'profile',
    onEnter() { if (params.tab === 'collection') setTimeout(() => el.querySelector('#collection')?.scrollIntoView({ behavior: 'smooth' }), 250); },
    onLeave: off,
  };
}
