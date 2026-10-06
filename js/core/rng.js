// Seeded randomness for deterministic content, and a provably fair die for gameplay.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export const between = (r, min, max) => min + Math.floor(r() * (max - min + 1));
export const chance = (r, p) => r() < p;

export function weighted(r, entries) {
  // entries: [[value, weight], ...]
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of entries) { if ((x -= w) < 0) return v; }
  return entries[entries.length - 1][0];
}

export function shuffle(r, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Non-deterministic helpers for UI flavour (never used for dice outcomes).
export const rand = Math.random;
export const rpick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const rbetween = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

/**
 * Fair six-sided die. Uses the platform CSPRNG with rejection sampling so every
 * face has exactly equal probability. Nothing in the game ever overrides this value.
 */
export function fairDie() {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / 6) * 6;
  let x;
  do { globalThis.crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
  return (x % 6) + 1;
}
