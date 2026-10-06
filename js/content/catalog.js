// Cosmetic catalogue. OTA manifests can append items (see js/content/ota.js), so every
// list here is the bundled baseline, not the ceiling.

export const DICE = [
  { id: 'classic', name: 'Classic', face: '#FBF7F0', face2: '#E9E1D3', pip: '#151a36', edge: '#CFC5B4', price: 0 },
  { id: 'midnight', name: 'Midnight', face: '#232a55', face2: '#121633', pip: '#F8F3EA', edge: '#0a0d22', price: 800 },
  { id: 'marble', name: 'Marble', face: '#F4F1EC', face2: '#D9D3CA', pip: '#2b2b2b', edge: '#bdb5aa', texture: 'marble', price: 1200 },
  { id: 'crystal', name: 'Crystal', face: 'rgba(190,225,255,.75)', face2: 'rgba(120,170,255,.55)', pip: '#0f3b8a', edge: 'rgba(80,140,255,.6)', glow: '#9fd0ff', price: 2000 },
  { id: 'royal', name: 'Royal', face: '#5B1530', face2: '#3a0b1e', pip: '#F4C776', edge: '#2a0716', price: 2500 },
  { id: 'festival', name: 'Festival', face: '#FF8A3D', face2: '#E2512A', pip: '#FFF4D6', edge: '#a8341a', texture: 'rangoli', price: 0, event: 'diwali' },
  { id: 'cyber', name: 'Cyber', face: '#0d1224', face2: '#05070f', pip: '#3EE6B0', edge: '#3EE6B0', glow: '#3EE6B0', price: 3000 },
  { id: 'fire', name: 'Fire', face: '#FF5A36', face2: '#B3170E', pip: '#FFE08A', edge: '#7a0d06', glow: '#ff7a2f', price: 3500 },
  { id: 'ice', name: 'Ice', face: '#E8F7FF', face2: '#AEE3FF', pip: '#1A6FB5', edge: '#86c9f0', glow: '#bff0ff', price: 3500 },
  { id: 'galaxy', name: 'Galaxy', face: '#2A1B5E', face2: '#0D0A26', pip: '#FFFFFF', edge: '#130f35', texture: 'stars', glow: '#7B5CFF', price: 5000 },
  { id: 'minimal', name: 'Minimal', face: '#F8F8F8', face2: '#F0F0F0', pip: '#111', edge: '#ddd', price: 600 },
];

// Board skins: surface, track cell, lines, yard style, pattern overlay, centre emblem.
export const BOARDS = [
  { id: 'classic-india', name: 'Classic India', surface: '#F7F1E6', cell: '#FFFDF8', line: '#E2D6C2', frame: '#1A1F3D', pattern: 'jaali', price: 0 },
  { id: 'mumbai-night', name: 'Mumbai Night', surface: '#141A3A', cell: '#1E2550', line: '#2C3570', frame: '#0A0E24', pattern: 'skyline', dark: true, price: 1500 },
  { id: 'delhi-street', name: 'Delhi Street', surface: '#F3E3C8', cell: '#FFF6E6', line: '#D9C09A', frame: '#4A2C17', pattern: 'signage', price: 1500 },
  { id: 'royal-jaipur', name: 'Royal Jaipur', surface: '#F6D9CF', cell: '#FFF4EF', line: '#E5B5A4', frame: '#7A2E3A', pattern: 'arches', price: 2200 },
  { id: 'monsoon', name: 'Monsoon', surface: '#D6E9E6', cell: '#F2FBF9', line: '#A9CFC9', frame: '#16413F', pattern: 'rain', price: 1800 },
  { id: 'diwali', name: 'Diwali', surface: '#2A1036', cell: '#3A1A4A', line: '#5B2E6E', frame: '#140620', pattern: 'diyas', dark: true, price: 0, event: 'diwali' },
  { id: 'holi', name: 'Holi', surface: '#FFF6FB', cell: '#FFFFFF', line: '#F2D2E4', frame: '#5B2A86', pattern: 'splash', price: 0, event: 'holi' },
  { id: 'cyber-india', name: 'Cyber India', surface: '#0B1020', cell: '#121A33', line: '#1F2C55', frame: '#04060E', pattern: 'circuit', dark: true, neon: true, price: 3000 },
  { id: 'minimal-black', name: 'Minimal Black', surface: '#111214', cell: '#1A1B1F', line: '#2A2C31', frame: '#000', pattern: 'none', dark: true, price: 1000 },
  { id: 'minimal-white', name: 'Minimal White', surface: '#FAFAFA', cell: '#FFFFFF', line: '#ECECEC', frame: '#D8D8D8', pattern: 'none', price: 1000 },
  { id: 'royal-palace', name: 'Royal Palace', surface: '#1F1633', cell: '#2B2047', line: '#43356A', frame: '#0F0A1C', pattern: 'arches', dark: true, gold: true, price: 4000 },
  { id: 'neon-arcade', name: 'Neon Arcade', surface: '#0A0A14', cell: '#14142A', line: '#2A2A55', frame: '#000', pattern: 'grid', dark: true, neon: true, price: 3500 },
  { id: 'vintage-wooden', name: 'Vintage Wooden', surface: '#C89B6D', cell: '#E9CFAE', line: '#A87A4E', frame: '#5A3A1E', pattern: 'wood', price: 2500 },
];

export const TOKENS = [
  { id: 'classic', name: 'Classic', shape: 'dome', price: 0 },
  { id: 'gem', name: 'Gem', shape: 'gem', price: 1500 },
  { id: 'royal', name: 'Royal', shape: 'crown', price: 2500 },
  { id: 'pearl', name: 'Pearl', shape: 'pearl', price: 2000 },
  { id: 'neon', name: 'Neon', shape: 'neon', price: 3000 },
];

export const FRAMES = [
  { id: 'none', name: 'None', price: 0 },
  { id: 'bronze', name: 'Bronze', ring: ['#C98A5A', '#7A4B2A'], price: 0, level: 3 },
  { id: 'silver', name: 'Silver', ring: ['#E8EDF2', '#8D97A3'], price: 0, level: 8 },
  { id: 'marigold', name: 'Marigold', ring: ['#FFB703', '#FB8500'], petals: true, price: 1500 },
  { id: 'neon', name: 'Neon', ring: ['#3EE6B0', '#7B5CFF'], glow: true, price: 2500 },
  { id: 'jaipur', name: 'Jaipur', ring: ['#FF7A9C', '#C2185B'], arches: true, price: 0, level: 15 },
  { id: 'diya', name: 'Diwali Diya', ring: ['#FFD166', '#FF7A2F'], glow: true, price: 0, event: 'diwali' },
  { id: 'royal', name: 'Royal', ring: ['#F4C776', '#8A5A1E'], crown: true, price: 0, level: 25 },
  { id: 'legend', name: 'Legend', ring: ['#FF3D7F', '#7B5CFF'], crown: true, glow: true, price: 0, level: 50 },
];

export const STICKERS = [
  { id: 'lucky', text: 'LUCKY!', bg: '#1FB574', fg: '#fff', rot: -6 },
  { id: 'ouch', text: 'OUCH!', bg: '#F0464B', fg: '#fff', rot: 5 },
  { id: 'good-move', text: 'GOOD MOVE', bg: '#3C8DFF', fg: '#fff', rot: -3 },
  { id: 'bye-token', text: 'BYE BYE TOKEN 👋', bg: '#FFC23D', fg: '#1b1300', rot: 4 },
  { id: 'six-again', text: 'SIX AGAIN?!', bg: '#7B5CFF', fg: '#fff', rot: -5 },
  { id: 'rematch', text: 'REMATCH?', bg: '#FF7A2F', fg: '#1b0b02', rot: 3 },
  { id: 'too-close', text: 'TOO CLOSE 😱', bg: '#FF3D7F', fg: '#fff', rot: -4 },
  { id: 'game-on', text: 'GAME ON', bg: '#151a36', fg: '#FFC23D', rot: 2 },
  { id: 'king-move', text: 'KING MOVE 👑', bg: '#F4C776', fg: '#2a1a00', rot: -3 },
  { id: 'queen-move', text: 'QUEEN MOVE 👑', bg: '#C2185B', fg: '#FFE6F0', rot: 4 },
  { id: 'gg', text: 'GG!', bg: '#F8F3EA', fg: '#151a36', rot: -2 },
  { id: 'arre-yaar', text: 'ARRE YAAR 😭', bg: '#2EC4D6', fg: '#03262b', rot: 5 },
  { id: 'shubh-diwali', text: 'SHUBH DIWALI 🪔', bg: '#FF8A3D', fg: '#2a0f00', rot: -4, event: 'diwali' },
  { id: 'bura-na-mano', text: 'BURA NA MANO! 🎨', bg: '#FF3D7F', fg: '#fff', rot: 3, event: 'holi' },
];

export const VICTORY = [
  { id: 'confetti', name: 'Confetti', fx: 'confetti', price: 0 },
  { id: 'petals', name: 'Marigold Petals', fx: 'petals', price: 1500 },
  { id: 'holi', name: 'Holi Colours', fx: 'holi', price: 0, event: 'holi' },
  { id: 'fireworks', name: 'Fireworks', fx: 'fireworks', price: 2500 },
];

export const CATALOG = { dice: DICE, boards: BOARDS, tokens: TOKENS, frames: FRAMES, stickers: STICKERS, victory: VICTORY };
export const KIND_LABEL = { dice: 'Dice', boards: 'Boards', tokens: 'Tokens', frames: 'Frames', stickers: 'Stickers', victory: 'Victory FX' };
export const EQUIP_KEY = { dice: 'dice', boards: 'board', tokens: 'token', frames: 'frame', victory: 'victory' };

export const findItem = (kind, id) => CATALOG[kind]?.find((x) => x.id === id);

// Level-up rewards: what each level unlocks (shown on the level road).
export const LEVEL_REWARDS = {
  2: { coins: 300 },
  3: { kind: 'frames', id: 'bronze' },
  4: { kind: 'stickers', id: 'bye-token' },
  5: { kind: 'dice', id: 'minimal', title: 'PLAYER' },
  6: { kind: 'stickers', id: 'six-again' },
  7: { coins: 600 },
  8: { kind: 'frames', id: 'silver' },
  9: { kind: 'stickers', id: 'too-close' },
  10: { kind: 'boards', id: 'minimal-white', title: 'STRATEGIST' },
  12: { kind: 'dice', id: 'midnight' },
  13: { kind: 'stickers', id: 'king-move' },
  14: { kind: 'stickers', id: 'queen-move' },
  15: { kind: 'frames', id: 'jaipur' },
  17: { kind: 'victory', id: 'petals' },
  18: { kind: 'boards', id: 'mumbai-night' },
  20: { kind: 'dice', id: 'marble', title: 'PRO' },
  22: { kind: 'tokens', id: 'gem' },
  25: { kind: 'frames', id: 'royal' },
  30: { kind: 'boards', id: 'royal-jaipur' },
  35: { kind: 'dice', id: 'galaxy', title: 'MASTER' },
  40: { kind: 'tokens', id: 'royal' },
  50: { kind: 'frames', id: 'legend', title: 'LEGEND' },
};

// 7-day login track (repeats).
export const DAILY_TRACK = [
  { coins: 100 },
  { coins: 150 },
  { kind: 'stickers', id: 'arre-yaar', fallbackCoins: 250 },
  { coins: 250 },
  { kind: 'dice', id: 'minimal', fallbackCoins: 400 },
  { coins: 400 },
  { kind: 'boards', id: 'monsoon', fallbackCoins: 800, big: true },
];

export const MISSION_POOL = [
  { id: 'play2', text: 'Play 2 matches', goal: 2, event: 'match:end', reward: { coins: 150, xp: 40 } },
  { id: 'win1', text: 'Win 1 match', goal: 1, event: 'match:win', reward: { coins: 200, xp: 60 } },
  { id: 'react3', text: 'Send 3 reactions', goal: 3, event: 'reaction:sent', reward: { coins: 80, xp: 20 } },
  { id: 'four1', text: 'Play a 4-player match', goal: 1, event: 'match:end4', reward: { coins: 150, xp: 50 } },
  { id: 'six5', text: 'Roll a six 5 times', goal: 5, event: 'roll:six', reward: { coins: 120, xp: 30 } },
  { id: 'rematch1', text: 'Rematch once', goal: 1, event: 'match:rematch', reward: { coins: 120, xp: 40 } },
  { id: 'capture3', text: 'Capture 3 tokens', goal: 3, event: 'capture:made', reward: { coins: 150, xp: 40 } },
  { id: 'chat2', text: 'Send 2 chat messages', goal: 2, event: 'chat:sent', reward: { coins: 60, xp: 20 } },
  { id: 'home4', text: 'Bring 4 tokens home', goal: 4, event: 'token:home', reward: { coins: 120, xp: 40 } },
];
