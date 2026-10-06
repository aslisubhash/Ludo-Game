// Fictional character universe. Deterministic from a seed so every install sees the
// same cast; scales to 10,000+ by raising `count` (OTA can do this via the manifest).
// Painted portraits (Higgsfield-generated) are attached by index from content/portraits.json;
// characters without one use the procedural illustrated avatar.
import { mulberry32, hashStr, pick, between, weighted } from '../core/rng.js';
import { ARCHETYPES, ARCHETYPE_IDS } from './personalities.js';
import { rollTraits, traitKey, EXPRESSIONS, avatarDataUri } from './avatar.js';

export const NAMES = [
  'Aanya', 'Ananya', 'Riya', 'Kiara', 'Ishita', 'Meera', 'Kavya', 'Naina', 'Aditi', 'Tanya', 'Ira', 'Myra', 'Avni', 'Pihu',
  'Saanvi', 'Mahi', 'Ishani', 'Anika', 'Navya', 'Simran', 'Sakshi', 'Diya', 'Aarohi', 'Aisha', 'Anvi', 'Anushka', 'Arya',
  'Bhavya', 'Charvi', 'Damini', 'Devika', 'Esha', 'Gauri', 'Gunjan', 'Harini', 'Hiya', 'Ishika', 'Jahnvi', 'Jiya', 'Kashvi',
  'Khushi', 'Kritika', 'Lavanya', 'Mansi', 'Mehak', 'Mitali', 'Mrinal', 'Nandini', 'Neha', 'Nidhi', 'Nisha', 'Nitya', 'Ojasvi',
  'Palak', 'Pari', 'Pooja', 'Prisha', 'Radhika', 'Rashi', 'Ritika', 'Ruhi', 'Sanya', 'Sara', 'Shreya', 'Shruti', 'Siya',
  'Sneha', 'Suhana', 'Tara', 'Trisha', 'Urvi', 'Vaani', 'Vanya', 'Vidhi', 'Yashvi', 'Zara', 'Aadya', 'Amaira', 'Bani', 'Chhavi',
  'Disha', 'Ekta', 'Garima', 'Heer', 'Inaaya', 'Juhi', 'Keya', 'Lipika', 'Madhavi', 'Manya', 'Nayra', 'Oorja', 'Pavni',
  'Rhea', 'Riddhi', 'Samaira', 'Shanaya', 'Tvisha', 'Uma', 'Vrinda', 'Yamini', 'Zoya', 'Aditri', 'Bela', 'Charu', 'Dhriti',
  'Eshana', 'Falguni', 'Gia', 'Hansika', 'Ila', 'Jasmin', 'Kanika', 'Leela', 'Malini', 'Naisha', 'Pranavi', 'Reet', 'Shivani',
  'Tanvi', 'Unnati', 'Vedika', 'Aparna', 'Ahana', 'Bhoomi', 'Chitra', 'Drishti', 'Gayatri', 'Hema', 'Jaya', 'Kamya', 'Lakshmi',
  'Mallika', 'Noor', 'Prachi', 'Roshni', 'Sonal', 'Tamanna', 'Vasudha', 'Anjali', 'Deepika', 'Kajal', 'Madhuri', 'Preeti',
  'Rekha', 'Seema', 'Swati', 'Tulsi', 'Vibha', 'Amrita', 'Ankita', 'Barkha', 'Komal', 'Megha', 'Payal', 'Ragini', 'Sonia',
];

const HANDLE_WORDS = ['rolls', 'dice', 'six', 'plays', 'ludo', 'queen', 'moves', 'gg', 'star', 'wins', 'luck', 'token', 'xo', 'og', 'pro', 'zz'];
const MOODS = ['Feeling lucky 🍀', 'On a streak 🔥', 'Chilling 😌', 'Looking for a rematch', 'Practising openings', 'Chai + Ludo ☕', 'Festival mode 🪔', 'Need one more win', 'Night owl 🌙', 'Weekend grind', 'Here for fun ✨', 'Hunting sixes 🎲'];
const ACHIEVEMENTS = ['5-Win Streak', 'Capture Queen', '100 Games', 'Perfect Game', 'Comeback Kid', 'Six Machine', 'Safe Player', 'Rematch Royalty', 'Photo Finisher', 'Monsoon Cup', 'Diwali Champion', 'Holi Hero', 'First Blood', 'Speed Demon', '1000 Sixes'];
export const TOKEN_COLORS = ['red', 'green', 'yellow', 'blue'];

// Hand-tuned hero cast (indices 0..4 match their painted portraits).
const HEROES = [
  { heroKey: 'riya', name: 'Riya', archetype: 'competitive', level: 19, winRate: 72, bio: 'Don’t leave your token outside 😏', mood: 'On a streak 🔥', fav: 'red', expression: 'smirk', tag: '🔥 Aggressive Player' },
  { heroKey: 'meera', name: 'Meera', archetype: 'friendly', level: 11, winRate: 54, bio: 'Here for good games ✨', mood: 'Chai + Ludo ☕', fav: 'yellow', expression: 'smile', tag: '😊 Chill Player' },
  { heroKey: 'tanya', name: 'Tanya', archetype: 'strategic', level: 27, winRate: 68, bio: 'Every move matters.', mood: 'Need one more win', fav: 'blue', expression: 'focused', tag: '♟️ Strategist' },
  { heroKey: 'ananya', name: 'Ananya', archetype: 'talkative', level: 15, winRate: 58, bio: 'Will comment on every move 😄', mood: 'Here for fun ✨', fav: 'green', expression: 'laugh', tag: '💬 Talkative' },
  { heroKey: 'kavya', name: 'Kavya', archetype: 'quiet', level: 22, winRate: 65, bio: 'Quiet moves, loud wins.', mood: 'Night owl 🌙', fav: 'blue', expression: 'calm', tag: '🌙 Quiet' },
];

let cast = [];
let byId = new Map();
let portraits = {}; // index -> url
const SEED = 2026;

export function buildCast(count = 500) {
  const r = mulberry32(SEED);
  const seenLook = new Set();
  const nameUse = new Map();
  const out = [];
  for (let i = 0; i < count; i++) {
    const hero = HEROES[i];
    const name = hero?.name ?? NAMES[(i * 7 + Math.floor(r() * NAMES.length)) % NAMES.length];
    const n = (nameUse.get(name) || 0) + 1;
    nameUse.set(name, n);
    const archetype = hero?.archetype ?? pick(r, ARCHETYPE_IDS);
    const a = ARCHETYPES[archetype];

    let traits;
    let guard = 0;
    do { traits = rollTraits(r); } while (seenLook.has(traitKey(traits)) && guard++ < 20);
    seenLook.add(traitKey(traits));

    const skillBias = { expert: 14, strategic: 10, competitive: 8, confident: 6, beginner: -16, challenger: 6 }[archetype] || 0;
    const level = hero?.level ?? Math.max(1, Math.min(60, Math.round(weighted(r, [[between(r, 2, 9), 3], [between(r, 10, 24), 5], [between(r, 25, 42), 2], [between(r, 43, 60), 0.6]]) + skillBias / 4)));
    const games = Math.round(level * between(r, 18, 42) + between(r, 0, 60));
    const winRate = hero?.winRate ?? Math.max(28, Math.min(81, Math.round(46 + skillBias + (r() - 0.5) * 22 + level * 0.15)));
    const handle = `@${name.toLowerCase()}${n > 1 ? `.${pick(r, HANDLE_WORDS)}${n}` : `.${pick(r, HANDLE_WORDS)}`}`;
    const achievements = [];
    const nAch = between(r, 1, 3);
    while (achievements.length < nAch) { const x = pick(r, ACHIEVEMENTS); if (!achievements.includes(x)) achievements.push(x); }

    out.push({
      id: `c${i}`,
      idx: i,
      name,
      handle,
      heroKey: hero?.heroKey,
      archetype,
      tag: hero?.tag ?? a.tag,
      level,
      games,
      winRate,
      streak: r() < 0.35 ? between(r, 2, 7) : 0,
      mood: hero?.mood ?? pick(r, MOODS),
      fav: hero?.fav ?? pick(r, TOKEN_COLORS),
      bio: hero?.bio ?? pick(r, a.bios),
      achievements,
      traits,
      expression: hero?.expression ?? pick(r, EXPRESSIONS),
      activity: r(), // propensity to be online
      isNew: false,
    });
  }
  cast = out;
  byId = new Map(out.map((c) => [c.id, c]));
  return cast;
}

export function setPortraits(map) { portraits = map || {}; }
export function markNew(ids = []) { ids.forEach((id) => { const c = byId.get(id); if (c) c.isNew = true; }); }

export const allCharacters = () => cast;
export const getCharacter = (id) => byId.get(id);
export const hasPortrait = (c) => Boolean(portraits[c.idx]);

/** Best available image for a character: painted portrait URL or procedural SVG. */
export function portraitOf(c) {
  return portraits[c.idx] || avatarDataUri(c);
}
export const fallbackOf = (c) => avatarDataUri(c);

/* ---------- Live presence simulation ---------- */
// Presence rotates on a 7-minute cadence, deterministically per time-slot, so the
// "who's online" list feels alive but stable across screens.
export function onlineNow(limit = 40) {
  const slot = Math.floor(Date.now() / (7 * 60 * 1000));
  const r = mulberry32(hashStr(`online-${slot}`));
  const hour = new Date().getHours();
  const busy = hour >= 19 || hour <= 1 ? 0.22 : hour >= 12 ? 0.16 : 0.1;
  const list = cast.filter((c) => r() < busy + c.activity * 0.18);
  // Painted-portrait characters surface first so the hero rows look their best.
  list.sort((a, b) => (hasPortrait(b) - hasPortrait(a)) || (b.activity - a.activity));
  return list.slice(0, limit);
}

export const isOnline = (c) => onlineNow(80).includes(c);

export function activePlayersCount() {
  const base = 96 + Math.round(40 * Math.sin(Date.now() / 600000));
  const hour = new Date().getHours();
  return base + (hour >= 19 || hour <= 1 ? 60 : 0) + Math.floor(Math.random() * 6);
}
