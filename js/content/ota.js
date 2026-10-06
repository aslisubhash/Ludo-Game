// Over-the-air content. The app ships with bundled defaults and, on every launch, fetches
// content/manifest.json (network-first via the service worker). A manifest can:
//   • grow the cast (characters.count) and flag new characters
//   • add/replace painted portraits (portraits: { index: url } or a portraitsUrl)
//   • add events, force an event live, and add banner campaigns
//   • append catalog items (dice/boards/stickers/frames…)
//   • rotate the daily mission pool and publish "What's new" notes
import { CATALOG, MISSION_POOL } from './catalog.js';
import { setOtaEvents } from './events-calendar.js';
import { buildCast, setPortraits, markNew } from './characters.js';
import { store } from '../core/store.js';

const CACHE_KEY = 'ludo-universe.ota.v1';

export const ota = {
  version: 0,
  banners: [],
  whatsNew: [],
  activity: [],
  raw: null,
};

async function fetchJson(url, timeout = 3500) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctl.signal, cache: 'no-cache' });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } finally { clearTimeout(t); }
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; }
}
function writeCache(m) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(m)); } catch { /* ignore */ }
}

function apply(m, portraitsMap) {
  ota.raw = m;
  ota.version = m.version || 0;
  ota.banners = m.banners || [];
  ota.whatsNew = m.whatsNew || [];
  ota.activity = m.activity || [];

  buildCast(m.characters?.count || 500);
  setPortraits(portraitsMap || {});
  markNew(m.characters?.new || []);

  for (const [kind, items] of Object.entries(m.catalog || {})) {
    const list = CATALOG[kind];
    if (!list) continue;
    for (const item of items) {
      const i = list.findIndex((x) => x.id === item.id);
      if (i >= 0) list[i] = { ...list[i], ...item }; else list.push({ ...item, ota: true });
    }
  }
  if (Array.isArray(m.missions)) {
    for (const mis of m.missions) if (!MISSION_POOL.find((x) => x.id === mis.id)) MISSION_POOL.push(mis);
  }
  setOtaEvents(m.events || [], m.forceEvent || null);
}

/** Load content: cached manifest instantly, then refresh from network. */
export async function loadContent() {
  const cached = readCache();
  let manifest = cached?.manifest || { version: 0 };
  let portraits = cached?.portraits || {};
  try {
    const fresh = await fetchJson(`content/manifest.json?t=${Date.now()}`);
    if (fresh && (fresh.version || 0) >= (manifest.version || 0)) {
      manifest = fresh;
      if (fresh.portraitsUrl) {
        try {
          const p = await fetchJson(fresh.portraitsUrl);
          portraits = Object.fromEntries((p.portraits || []).map((x) => [x.index, x.url]));
        } catch { /* keep cached portraits */ }
      }
      writeCache({ manifest, portraits });
    }
  } catch { /* offline: run on cache/bundled defaults */ }
  apply(manifest, portraits);
  const isUpdate = ota.version > (store.s.ota.version || 0) && store.s.ota.version > 0;
  store.update((s) => { s.ota.version = ota.version; }, { silent: true });
  return { manifest, isUpdate };
}
