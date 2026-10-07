// Board renderer (SVG surface) + token layer (DOM pieces for crisp shadows/animation).
// Coordinates are in grid units on a 15×15 board; x = column, y = row (cell centres at +0.5).
import { START, STAR_CELLS, HOME, YARD, LAST_TRACK, absCell } from './rules.js';
import { findItem } from '../content/catalog.js';
import { sfx, haptic, burstAt } from '../core/fx.js';
import { wait } from '../core/ui.js';

export const COLOR_HEX = { red: '#F0464B', green: '#1FB574', yellow: '#FFC23D', blue: '#3C8DFF' };
export const COLOR_DARK = { red: '#B8282E', green: '#12804F', yellow: '#C88B0C', blue: '#1F5FC4' };

// Shared track, clockwise, starting at red's start cell. [row, col]
const TRACK = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0],
];
const HOME_COL = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
};
const YARD_ORIGIN = { red: [0, 0], green: [9, 0], yellow: [9, 9], blue: [0, 9] }; // [x, y]
const HOME_SPOT = { red: [6.55, 7.5], green: [7.5, 6.55], yellow: [8.45, 7.5], blue: [7.5, 8.45] };

export function posXY(color, pos, tokenIdx) {
  if (pos === YARD) {
    const [x0, y0] = YARD_ORIGIN[color];
    return [x0 + 1.75 + (tokenIdx % 2) * 2.5, y0 + 1.75 + Math.floor(tokenIdx / 2) * 2.5];
  }
  if (pos <= LAST_TRACK) {
    const [r, c] = TRACK[absCell(color, pos)];
    return [c + 0.5, r + 0.5];
  }
  if (pos < HOME) {
    const [r, c] = HOME_COL[color][pos - LAST_TRACK - 1];
    return [c + 0.5, r + 0.5];
  }
  return HOME_SPOT[color];
}

/* ---------- Board surface (SVG) ---------- */
export function boardSvg(skinId) {
  const s = findItem('boards', skinId) || findItem('boards', 'classic-india');
  const dark = Boolean(s.dark);
  const line = s.line;
  const gold = s.gold || !dark ? '#E9C177' : '#F4C776';
  const out = [];
  out.push(`<svg class="board-svg" viewBox="-0.5 -0.5 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`);
  out.push(`<defs>
    ${Object.entries(COLOR_HEX).map(([k, v]) => `
      <linearGradient id="yd-${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(v, 0.1)}"/><stop offset=".55" stop-color="${v}"/><stop offset="1" stop-color="${COLOR_DARK[k]}"/></linearGradient>
      <linearGradient id="hc-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(v, 0.14)}"/><stop offset="1" stop-color="${shade(v, -0.06)}"/></linearGradient>
      <radialGradient id="hole-${k}" cx="50%" cy="38%" r="62%"><stop offset="0" stop-color="${shade(v, 0.35)}" stop-opacity=".25"/><stop offset=".7" stop-color="${v}" stop-opacity=".22"/><stop offset="1" stop-color="${COLOR_DARK[k]}" stop-opacity=".55"/></radialGradient>`).join('')}
    <linearGradient id="cell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(s.cell, dark ? 0.05 : 0.02)}"/><stop offset="1" stop-color="${shade(s.cell, dark ? -0.04 : -0.06)}"/></linearGradient>
    <linearGradient id="cell-sh" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${dark ? 0.35 : 0.1}"/></linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="well-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="${dark ? 0.5 : 0.22}"/><stop offset=".18" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(s.frame, 0.16)}"/><stop offset=".5" stop-color="${s.frame}"/><stop offset="1" stop-color="${shade(s.frame, -0.1)}"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1C9"/><stop offset=".45" stop-color="${gold}"/><stop offset="1" stop-color="#9C6B22"/></linearGradient>
    <radialGradient id="light" cx="25%" cy="12%" r="95%"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.1 : 0.28}"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${dark ? 0.3 : 0.12}"/></radialGradient>
    <filter id="drop" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0.08" stdDeviation="0.09" flood-color="#000" flood-opacity=".35"/></filter>
    ${patternDefs(s)}
  </defs>`);

  // Frame: bevelled rim with an inner lip
  out.push(`<rect x="-0.5" y="-0.5" width="16" height="16" rx="0.9" fill="url(#frame)"/>`);
  out.push(`<rect x="-0.42" y="-0.42" width="15.84" height="15.84" rx="0.84" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="0.05"/>`);
  out.push(`<rect x="-0.14" y="-0.14" width="15.28" height="15.28" rx="0.6" fill="#000" opacity=".35"/>`);
  out.push(`<rect x="-0.08" y="-0.08" width="15.16" height="15.16" rx="0.55" fill="${s.surface}"/>`);
  if (s.pattern !== 'none') out.push(`<rect x="-0.08" y="-0.08" width="15.16" height="15.16" rx="0.55" fill="url(#pat)" opacity="${dark ? 0.5 : 0.6}"/>`);

  // Yards: coloured tile, recessed well, carved holes
  for (const [color, [x0, y0]] of Object.entries(YARD_ORIGIN)) {
    out.push(`<g filter="url(#drop)"><rect x="${x0 + 0.1}" y="${y0 + 0.1}" width="5.8" height="5.8" rx="0.62" fill="url(#yd-${color})"/></g>`);
    out.push(`<rect x="${x0 + 0.1}" y="${y0 + 0.1}" width="5.8" height="5.8" rx="0.62" fill="url(#pat-y)" opacity=".3"/>`);
    out.push(`<rect x="${x0 + 0.1}" y="${y0 + 0.1}" width="5.8" height="2.4" rx="0.62" fill="url(#gloss)" opacity=".5"/>`);
    out.push(`<rect x="${x0 + 0.82}" y="${y0 + 0.82}" width="4.36" height="4.36" rx="0.6" fill="${dark ? shade(s.cell, 0.04) : '#FFFDF8'}"/>`);
    out.push(`<rect x="${x0 + 0.82}" y="${y0 + 0.82}" width="4.36" height="4.36" rx="0.6" fill="url(#well-sh)"/>`);
    out.push(`<rect x="${x0 + 0.82}" y="${y0 + 0.82}" width="4.36" height="4.36" rx="0.6" fill="none" stroke="${COLOR_DARK[color]}" stroke-opacity=".35" stroke-width="0.05"/>`);
    for (let i = 0; i < 4; i++) {
      const [x, y] = [x0 + 1.75 + (i % 2) * 2.5, y0 + 1.75 + Math.floor(i / 2) * 2.5];
      out.push(`<circle cx="${x}" cy="${y}" r="0.8" fill="url(#hole-${color})"/><circle cx="${x}" cy="${y}" r="0.8" fill="none" stroke="${COLOR_HEX[color]}" stroke-width="0.09"/><path d="M${x - 0.62},${y - 0.18} A0.66 0.66 0 0 1 ${x + 0.62},${y - 0.18}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="0.1"/>`);
    }
  }

  // Track cells (raised tiles)
  const cell = (r, c, fill, extra = '') => `<rect x="${c + 0.04}" y="${r + 0.04}" width="0.92" height="0.92" rx="0.16" fill="${fill}" stroke="${line}" stroke-width="0.03" ${extra}/><rect x="${c + 0.04}" y="${r + 0.04}" width="0.92" height="0.92" rx="0.16" fill="url(#cell-sh)"/>`;
  TRACK.forEach(([r, c]) => out.push(cell(r, c, 'url(#cell)')));
  for (const [color, cells] of Object.entries(HOME_COL)) cells.forEach(([r, c]) => {
    out.push(cell(r, c, `url(#hc-${color})`));
    out.push(`<rect x="${c + 0.1}" y="${r + 0.08}" width="0.8" height="0.36" rx="0.12" fill="url(#gloss)"/>`);
  });
  for (const color of Object.keys(START)) {
    const [r, c] = TRACK[START[color]];
    out.push(cell(r, c, `url(#hc-${color})`));
    out.push(pawnIcon(c + 0.5, r + 0.52));
  }
  // Entry arrows just before each home column
  out.push(arrow(0.5, 7.5, 'red'), arrow(7.5, 0.5, 'green'), arrow(14.5, 7.5, 'yellow'), arrow(7.5, 14.5, 'blue'));
  STAR_CELLS.forEach((abs) => { const [r, c] = TRACK[abs]; out.push(star(c + 0.5, r + 0.5, dark)); });

  // Centre home with a raised gold medallion
  out.push(`<g filter="url(#drop)">
    <polygon points="6,6 7.5,7.5 6,9" fill="url(#yd-red)"/><polygon points="6,6 9,6 7.5,7.5" fill="url(#yd-green)"/>
    <polygon points="9,6 9,9 7.5,7.5" fill="url(#yd-yellow)"/><polygon points="6,9 9,9 7.5,7.5" fill="url(#yd-blue)"/></g>`);
  out.push(`<path d="M6,6 L9,9 M9,6 L6,9" stroke="#fff" stroke-opacity=".35" stroke-width="0.04"/>`);
  out.push(`<g filter="url(#drop)"><circle cx="7.5" cy="7.5" r="0.82" fill="url(#gold)"/><circle cx="7.5" cy="7.5" r="0.66" fill="${s.frame}"/></g>`);
  out.push(`<g class="board-emblem">${rosette(7.5, 7.5, 0.52, gold)}</g>`);

  // Global lighting
  out.push(`<rect x="-0.08" y="-0.08" width="15.16" height="15.16" rx="0.55" fill="url(#light)" pointer-events="none"/>`);
  out.push(`</svg>`);
  return out.join('');
}

function shade(hex, amt) {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`;
}

function pawnIcon(x, y) {
  return `<g fill="#fff" opacity=".92"><circle cx="${x}" cy="${y - 0.2}" r="0.13"/><path d="M${x - 0.13},${y - 0.06} L${x + 0.13},${y - 0.06} L${x + 0.2},${y + 0.18} L${x - 0.2},${y + 0.18}Z"/><rect x="${x - 0.27}" y="${y + 0.16}" width="0.54" height="0.1" rx="0.05"/></g>`;
}

function arrow(x, y, color) {
  const rot = { red: 0, green: 90, yellow: 180, blue: 270 }[color];
  return `<g transform="rotate(${rot} ${x} ${y})"><circle cx="${x}" cy="${y}" r="0.3" fill="${COLOR_HEX[color]}" opacity=".9"/><path d="M${x - 0.14},${y} L${x + 0.12},${y} M${x + 0.01},${y - 0.11} L${x + 0.13},${y} L${x + 0.01},${y + 0.11}" stroke="#fff" stroke-width="0.07" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

function star(x, y, dark) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.13 : 0.31;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(x + Math.cos(a) * r).toFixed(3)},${(y + Math.sin(a) * r).toFixed(3)}`);
  }
  return `<circle cx="${x}" cy="${y}" r="0.38" fill="#F4C776" opacity="${dark ? 0.22 : 0.28}"/><polygon points="${pts.join(' ')}" fill="url(#gold)" stroke="#9C6B22" stroke-width="0.03" stroke-linejoin="round"/>`;
}

function rosette(x, y, r, col) {
  let d = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    d += `<ellipse cx="${x + Math.cos(a) * r * 0.5}" cy="${y + Math.sin(a) * r * 0.5}" rx="${r * 0.42}" ry="${r * 0.18}" transform="rotate(${(a * 180) / Math.PI} ${x + Math.cos(a) * r * 0.5} ${y + Math.sin(a) * r * 0.5})" fill="${col}" opacity=".85"/>`;
  }
  return `${d}<circle cx="${x}" cy="${y}" r="${r * 0.22}" fill="${col}"/>`;
}

function patternDefs(s) {
  const c = s.dark ? 'rgba(255,255,255,.07)' : 'rgba(26,31,61,.06)';
  const y = 'rgba(255,255,255,.5)';
  const jaali = (col, sw) => `<path d="M0.5,0 L1,0.5 L0.5,1 L0,0.5Z" fill="none" stroke="${col}" stroke-width="${sw}"/><circle cx="0.5" cy="0.5" r="0.08" fill="${col}"/>`;
  const p = {
    jaali: jaali(c, 0.04),
    skyline: `<rect x="0.1" y="0.4" width="0.18" height="0.6" fill="${c}"/><rect x="0.36" y="0.2" width="0.14" height="0.8" fill="${c}"/><rect x="0.6" y="0.55" width="0.25" height="0.45" fill="${c}"/>`,
    signage: `<rect x="0.1" y="0.15" width="0.8" height="0.3" rx="0.06" fill="none" stroke="${c}" stroke-width="0.04"/><path d="M0.2,0.7 h0.6" stroke="${c}" stroke-width="0.04"/>`,
    arches: `<path d="M0.1,1 V0.55 Q0.5,0 0.9,0.55 V1" fill="none" stroke="${c}" stroke-width="0.05"/>`,
    rain: `<path d="M0.2,0.1 l-0.1,0.3 M0.7,0.5 l-0.1,0.3" stroke="${c}" stroke-width="0.04" stroke-linecap="round"/>`,
    diyas: `<path d="M0.3,0.62 Q0.5,0.85 0.7,0.62Z" fill="rgba(255,183,3,.18)"/><path d="M0.5,0.6 Q0.42,0.45 0.5,0.32 Q0.58,0.45 0.5,0.6Z" fill="rgba(255,183,3,.25)"/>`,
    splash: `<circle cx="0.3" cy="0.3" r="0.16" fill="rgba(255,61,127,.08)"/><circle cx="0.75" cy="0.7" r="0.12" fill="rgba(62,230,176,.1)"/>`,
    circuit: `<path d="M0,0.5 H0.4 V0.2 H1 M0.4,0.5 V0.9 H0.8" fill="none" stroke="rgba(62,230,176,.12)" stroke-width="0.04"/><circle cx="0.4" cy="0.5" r="0.06" fill="rgba(62,230,176,.2)"/>`,
    grid: `<path d="M0,0 H1 M0,0 V1" stroke="rgba(123,92,255,.18)" stroke-width="0.03"/>`,
    wood: `<path d="M0,0.2 Q0.5,0.28 1,0.2 M0,0.6 Q0.5,0.52 1,0.62" stroke="rgba(90,58,30,.15)" stroke-width="0.05" fill="none"/>`,
  }[s.pattern] || '';
  return `<pattern id="pat" width="1" height="1" patternUnits="userSpaceOnUse">${p}</pattern>
    <pattern id="pat-y" width="1.5" height="1.5" patternUnits="userSpaceOnUse"><g transform="scale(1.5)">${jaali(y, 0.03)}</g></pattern>`;
}

/* ---------- Board view (surface + pieces) ---------- */
// Grid units (0..15) → % of the board element; the SVG viewBox adds a 0.5-unit frame on each side.
const VB_PAD = 0.5;
const toPct = (v) => ((v + VB_PAD) / (15 + VB_PAD * 2)) * 100;

// Pawn: shadow · base disc · tapered body · collar · spherical head.
export const PIECE_HTML = '<div class="piece-in"><i class="piece-shadow"></i><i class="piece-base"></i><i class="piece-body"></i><i class="piece-ring"></i><i class="piece-head"></i></div>';
export class BoardView {
  constructor(root, { skin = 'classic-india', token = 'classic' } = {}) {
    this.root = root;
    this.root.classList.add('board');
    this.root.innerHTML = `<div class="board-surface">${boardSvg(skin)}</div><div class="board-glow"></div><div class="pieces"></div><div class="board-fx"></div>`;
    this.layer = root.querySelector('.pieces');
    this.fxLayer = root.querySelector('.board-fx');
    this.tokenSkin = findItem('tokens', token) || findItem('tokens', 'classic');
    this.pieces = []; // [pIdx][tIdx] -> el
    this.onPick = null;
    this.layer.addEventListener('click', (e) => {
      const el = e.target.closest('.piece.can-move');
      if (el && this.onPick) this.onPick(+el.dataset.p, +el.dataset.t);
    });
  }

  setSkin(skin) {
    this.root.querySelector('.board-surface').innerHTML = boardSvg(skin);
  }

  setup(game) {
    this.game = game;
    this.layer.innerHTML = '';
    this.pieces = game.players.map((p, pi) => p.tokens.map((pos, ti) => {
      const el = document.createElement('div');
      el.className = `piece c-${p.color} shape-${this.tokenSkin.shape}`;
      el.dataset.p = pi;
      el.dataset.t = ti;
      el.innerHTML = PIECE_HTML;
      this.layer.appendChild(el);
      return el;
    }));
    this.layoutAll();
  }

  place(el, x, y, scale = 1) {
    el.style.left = `${toPct(x)}%`;
    el.style.top = `${toPct(y)}%`;
    el.style.setProperty('--sc', scale);
  }

  /** Recompute positions for all pieces, fanning out tokens that share a cell. */
  layoutAll(except = null) {
    const groups = new Map();
    this.game.players.forEach((p, pi) => p.tokens.forEach((pos, ti) => {
      const [x, y] = posXY(p.color, pos, ti);
      const key = pos === YARD ? `y${pi}-${ti}` : `${x.toFixed(2)},${y.toFixed(2)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ pi, ti, x, y });
    }));
    for (const list of groups.values()) {
      const n = list.length;
      list.forEach(({ pi, ti, x, y }, k) => {
        const el = this.pieces[pi][ti];
        if (el === except) return;
        if (n === 1) { this.place(el, x, y, 1); el.style.zIndex = Math.round(y * 10); return; }
        const off = [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2], [0, 0], [0, -0.3], [0, 0.3], [-0.3, 0]][k % 8];
        this.place(el, x + off[0], y + off[1], 0.72);
        el.style.zIndex = Math.round(y * 10) + k;
      });
    }
  }

  setMovable(list) {
    this.layer.querySelectorAll('.can-move').forEach((el) => el.classList.remove('can-move'));
    for (const { p, t } of list) this.pieces[p][t].classList.add('can-move');
    this.root.classList.toggle('picking', list.length > 0);
  }

  setDanger(list) {
    this.layer.querySelectorAll('.danger').forEach((el) => el.classList.remove('danger'));
    for (const { p, t } of list) this.pieces[p][t]?.classList.add('danger');
  }

  setHighlight(list, cls = 'spot') {
    this.layer.querySelectorAll(`.${cls}`).forEach((el) => el.classList.remove(cls));
    for (const { p, t } of list) this.pieces[p][t]?.classList.add(cls);
  }

  /** Animate a token along its path, cell by cell. */
  async animateMove(pi, ti, from, to, color) {
    const el = this.pieces[pi][ti];
    el.classList.add('moving', 'lifted');
    el.style.zIndex = 900;
    sfx('lift');
    await wait(120);
    const steps = from === YARD ? [0] : Array.from({ length: to - from }, (_, k) => from + k + 1);
    const stepMs = steps.length > 5 ? 120 : 150;
    el.style.setProperty('--step', `${stepMs}ms`);
    for (const pos of steps) {
      const [x, y] = posXY(color, pos, ti);
      this.place(el, x, y, 1);
      el.classList.remove('hop');
      void el.offsetWidth;
      el.classList.add('hop');
      this.trail(x, y, color);
      sfx('hop');
      await wait(stepMs);
    }
    el.classList.remove('lifted', 'hop');
    el.classList.add('landed');
    haptic(12);
    setTimeout(() => el.classList.remove('landed', 'moving'), 260);
    if (to === HOME) {
      el.classList.add('home-burst');
      burstAt(el, { count: 22, colors: [COLOR_HEX[color], '#fff', '#FFC23D'], speed: 5, size: 5 });
      sfx('home');
      setTimeout(() => el.classList.remove('home-burst'), 700);
    }
    this.layoutAll();
  }

  async animateCapture(victims) {
    for (const { player, token } of victims) {
      const el = this.pieces[player][token];
      el.classList.add('captured');
      burstAt(el, { count: 18, colors: [COLOR_HEX[this.game.players[player].color], '#fff'], speed: 6, size: 5 });
    }
    sfx('capture');
    haptic([20, 40, 30]);
    this.root.classList.add('shake');
    setTimeout(() => this.root.classList.remove('shake'), 400);
    await wait(380);
    for (const { player, token } of victims) {
      const el = this.pieces[player][token];
      el.classList.remove('captured');
      el.classList.add('returning');
      setTimeout(() => el.classList.remove('returning'), 600);
    }
    this.layoutAll();
    await wait(450);
  }

  trail(x, y, color) {
    const d = document.createElement('i');
    d.className = 'trail';
    d.style.left = `${toPct(x)}%`;
    d.style.top = `${toPct(y)}%`;
    d.style.background = COLOR_HEX[color];
    this.fxLayer.appendChild(d);
    setTimeout(() => d.remove(), 500);
  }

  /** Floating emoji/sticker over the board (never blocks input). */
  float(content, { x = 50, y = 50, cls = '' } = {}) {
    const el = document.createElement('div');
    el.className = `board-float ${cls}`;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.innerHTML = content;
    this.fxLayer.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
}
