// Screen router with animated transitions and the native-style bottom navigation.
import { $, html, icon } from './ui.js';
import { sfx, haptic } from './fx.js';
import { bus } from './events.js';
import { unreadChats } from './store.js';

const factories = new Map();
let current = null; // { name, params, inst }
const history = [];

export const TABS = [
  { name: 'home', label: 'HOME', icon: icon.home },
  { name: 'play', label: 'PLAY', icon: icon.play, special: true },
  { name: 'chats', label: 'CHATS', icon: icon.chat },
  { name: 'rewards', label: 'REWARDS', icon: icon.gift },
  { name: 'profile', label: 'PROFILE', icon: icon.user },
];

export function register(name, factory) { factories.set(name, factory); }
export const currentScreen = () => current?.name;

/**
 * Navigate to a screen. Factories return { el, tab?, nav?: boolean, onEnter?, onLeave? }.
 */
export function go(name, params = {}, { transition = 'slide', replace = false } = {}) {
  const factory = factories.get(name);
  if (!factory) throw new Error(`Unknown screen ${name}`);
  const host = $('#screen-host');
  const prev = current;
  const inst = factory(params);
  inst.el.classList.add('screen', 'enter');
  if (transition === 'fade') inst.el.classList.add('fade');
  if (transition === 'zoom') inst.el.classList.add('zoom');
  if (inst.nav) inst.el.classList.add('has-nav');
  host.appendChild(inst.el);
  inst.el.addEventListener('animationend', () => inst.el.classList.remove('enter', 'fade', 'zoom'), { once: true });

  if (prev) {
    prev.inst.onLeave?.();
    prev.inst.el.classList.add('leave');
    setTimeout(() => prev.inst.el.remove(), 200);
    if (!replace) history.push({ name: prev.name, params: prev.params });
    if (history.length > 20) history.shift();
  }
  current = { name, params, inst };
  setNav(inst.nav ? inst.tab || name : null);
  inst.onEnter?.();
  bus.emit('screen', name);
}

export function back(fallback = 'home') {
  const prev = history.pop();
  if (prev) go(prev.name, prev.params, { replace: true });
  else go(fallback, {}, { replace: true });
}

/* ---------- Bottom nav ---------- */
function buildNav() {
  const nav = $('#nav');
  nav.innerHTML = TABS.map((t) => t.special
    ? `<button class="nav-item play" data-tab="${t.name}" aria-label="${t.label}"><div class="play-orb">${t.icon}</div><span>${t.label}</span></button>`
    : `<button class="nav-item" data-tab="${t.name}" aria-label="${t.label}">${t.icon}<span>${t.label}</span></button>`).join('');
  nav.addEventListener('click', (e) => {
    const b = e.target.closest('.nav-item');
    if (!b) return;
    sfx('tap');
    haptic(8);
    if (current?.name !== b.dataset.tab) go(b.dataset.tab, {}, { transition: 'fade', replace: true });
  });
  bus.on('store', refreshBadges);
}

function refreshBadges() {
  const nav = $('#nav');
  const chat = nav.querySelector('[data-tab="chats"]');
  if (!chat) return;
  const n = unreadChats();
  let b = chat.querySelector('.badge-dot');
  if (n && !b) { b = html('<i class="badge-dot"></i>'); chat.appendChild(b); }
  if (b) { if (n) b.textContent = n > 9 ? '9+' : n; else b.remove(); }
  bus.emit('badges');
}

function setNav(tab) {
  const nav = $('#nav');
  if (!nav.children.length) buildNav();
  nav.classList.toggle('hidden', !tab);
  nav.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  refreshBadges();
}
