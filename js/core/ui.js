// DOM helpers, sheets, modals, toasts, count-ups and shared icon set.
import { sfx, haptic } from './fx.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function html(str) {
  const t = document.createElement('template');
  t.innerHTML = str.trim();
  return t.content.firstElementChild;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// `?turbo` (automated tests only) compresses every scripted delay.
const SPEED = typeof location !== 'undefined' && /[?&]turbo\b/.test(location.search) ? 0.08 : 1;
export const wait = (ms) => new Promise((r) => setTimeout(r, ms * SPEED));
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

export function fmt(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1e4) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toLocaleString('en-IN');
}

export function ago(t) {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'Yesterday' : `${d}d`;
}

/** Delegated tap handler with press feedback. */
export function onTap(root, selector, fn) {
  root.addEventListener('click', (e) => {
    const el = e.target.closest(selector);
    if (!el || !root.contains(el)) return;
    sfx('tap');
    haptic(8);
    fn(el, e);
  });
}

export function countUp(el, from, to, dur = 900, prefix = '') {
  const start = performance.now();
  return new Promise((resolve) => {
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Math.round(from + (to - from) * e).toLocaleString('en-IN');
      if (t < 1) requestAnimationFrame(step); else resolve();
    }
    requestAnimationFrame(step);
  });
}

/* ---------- Toasts ---------- */
export function toast(text, { icon = '', tone = '', ms = 2400 } = {}) {
  const host = $('#toast-host');
  const el = html(`<div class="toast ${tone}">${icon ? `<span class="toast-ico">${icon}</span>` : ''}<span>${text}</span></div>`);
  host.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
}

/* ---------- Bottom sheet ---------- */
export function sheet(content, { cls = '', dim = true, onClose, dismissible = true } = {}) {
  const host = $('#overlay-host');
  const wrap = html(`<div class="sheet-wrap ${dim ? 'dim' : ''}"><div class="sheet ${cls}"><div class="sheet-grip"></div></div></div>`);
  const panel = wrap.firstElementChild;
  if (typeof content === 'string') panel.insertAdjacentHTML('beforeend', content);
  else panel.appendChild(content);
  host.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    wrap.classList.remove('open');
    wrap.classList.add('closing');
    setTimeout(() => wrap.remove(), 280);
    onClose?.();
  };
  if (dismissible) {
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    // drag-down to dismiss
    let y0 = null;
    const grip = panel.querySelector('.sheet-grip');
    const start = (e) => { y0 = (e.touches?.[0] || e).clientY; panel.style.transition = 'none'; };
    const move = (e) => {
      if (y0 == null) return;
      const dy = Math.max(0, (e.touches?.[0] || e).clientY - y0);
      panel.style.transform = `translateY(${dy}px)`;
    };
    const end = (e) => {
      if (y0 == null) return;
      const dy = (e.changedTouches?.[0] || e).clientY - y0;
      y0 = null;
      panel.style.transition = '';
      panel.style.transform = '';
      if (dy > 90) close();
    };
    grip.addEventListener('pointerdown', start);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
  }
  return { el: panel, wrap, close };
}

/* ---------- Center modal ---------- */
export function modal(content, { cls = '', dismissible = true, onClose } = {}) {
  const host = $('#overlay-host');
  const wrap = html(`<div class="modal-wrap"><div class="modal ${cls}"></div></div>`);
  const panel = wrap.firstElementChild;
  if (typeof content === 'string') panel.innerHTML = content;
  else panel.appendChild(content);
  host.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    wrap.classList.remove('open');
    setTimeout(() => wrap.remove(), 260);
    onClose?.();
  };
  if (dismissible) wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  return { el: panel, wrap, close };
}

/* ---------- Icons (inline SVG, stroke-based) ---------- */
const P = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
export const icon = {
  home: P('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>'),
  play: P('<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>'),
  chat: P('<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>'),
  gift: P('<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18"/><path d="M12 8S10.5 3 7.5 4.5 9 8 12 8zM12 8s1.5-5 4.5-3.5S15 8 12 8z"/>'),
  user: P('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  bell: P('<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>'),
  gear: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  back: P('<path d="M15 18l-6-6 6-6"/>'),
  close: P('<path d="M18 6 6 18M6 6l12 12"/>'),
  send: P('<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>'),
  smile: P('<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>'),
  sticker: P('<path d="M15 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h7l8-8V6a3 3 0 0 0-3-3z"/><path d="M13 21v-5a3 3 0 0 1 3-3h5"/>'),
  users: P('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.5 0 4 1.5 4.5 4"/>'),
  lock: P('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  bolt: P('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  crown: P('<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>'),
  flame: P('<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-2 5-2 8 0 4 3 7 7 7z"/>'),
  target: P('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  info: P('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>'),
  sound: P('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
  check: P('<path d="M5 12.5 10 17 19 7"/>'),
  plus: P('<path d="M12 5v14M5 12h14"/>'),
  door: P('<path d="M14 3H6v18h8"/><path d="M14 3l5 2v14l-5 2z"/><path d="M11 12h.01"/>'),
  key: P('<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 20 3M17 6l3 3M14 9l2 2"/>'),
  refresh: P('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
  search: P('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  film: P('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/>'),
  sparkle: P('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
};

export const coinSvg = `<svg class="coin-ico" viewBox="0 0 24 24"><defs><radialGradient id="cg" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFE6A8"/><stop offset=".55" stop-color="#F4C776"/><stop offset="1" stop-color="#B8893D"/></radialGradient></defs><circle cx="12" cy="12" r="10" fill="url(#cg)"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#9A6B22" stroke-width="1.4" opacity=".7"/><path d="M9.2 8.6h5.6M9.2 11h5.6M11 8.6c2.6 0 2.6 4.6 0 4.6H9.4l4.2 3.6" stroke="#7A4F12" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const xpSvg = `<svg class="coin-ico" viewBox="0 0 24 24"><path d="M12 2l2.6 6.4L21 9.3l-5 4.4 1.5 6.8L12 17l-5.5 3.5L8 13.7 3 9.3l6.4-.9z" fill="#B39DFF" stroke="#7B5CFF" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
