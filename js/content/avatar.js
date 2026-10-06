// Procedural illustrated avatar renderer (SVG). Used for every character that does not
// (yet) have a painted portrait, and as the instant placeholder while a portrait loads.
// Layered: background pattern → back hair → shoulders/outfit → neck → face → features →
// front hair → accessories. Legible at 40px, crisp at 300px.

export const SKIN = ['#F3CDAE', '#E9B996', '#DDA67F', '#CB8F68', '#B87A54', '#A16744', '#8A5536', '#714429'];
export const HAIR = ['#17110F', '#21160F', '#2E1D14', '#3D2619', '#4F311F', '#5A1E2A', '#2B2440'];
const LIPS = ['#B85C5C', '#A2474F', '#C46A6A', '#8E3B46', '#B5655A', '#9C5148', '#C9787A'];
const IRIS = ['#3B2416', '#2A1A10', '#4A2F1B', '#5B3B22'];
export const BG = [
  ['#FF7A59', '#C2185B'], ['#3C8DFF', '#1A3A8F'], ['#1FB574', '#0C5E43'], ['#FFC23D', '#D9731A'],
  ['#7B5CFF', '#3A2A8C'], ['#FF5FA2', '#8E2A6B'], ['#2EC4D6', '#145C78'], ['#F0464B', '#7A1626'],
  ['#9CCB5A', '#3B6E2A'], ['#FFB38A', '#C7623F'], ['#B39DFF', '#5B45B8'], ['#4DD6A6', '#1B6F6A'],
];
const OUTFIT = [
  ['#F8F3EA', '#D9CFBF'], ['#22263F', '#151829'], ['#C2185B', '#8E1046'], ['#1F6FEB', '#174EA6'], ['#E9A23B', '#B5761E'],
  ['#2E8B57', '#1F6340'], ['#7B5CFF', '#5639D1'], ['#E85D75', '#B83A52'], ['#3A3A3A', '#222'], ['#F4D35E', '#C9A93A'],
  ['#5AB1BB', '#3C8189'], ['#A0522D', '#7A3E21'],
];
const ACCENT = ['#F4C776', '#E5E4E2', '#FF7A2F', '#3EE6B0', '#FF3D7F', '#7FB3FF'];

export const HAIR_STYLES = ['long', 'wavy', 'bob', 'pixie', 'bun', 'ponytail', 'braid', 'curly', 'bangs', 'sidepart', 'twobraids', 'shoulder'];
export const OUTFIT_STYLES = ['kurta', 'saree', 'hoodie', 'denim', 'tee', 'blazer', 'festive', 'turtleneck', 'jersey', 'kurti'];
export const ACCESSORIES = ['none', 'bindi', 'nosepin', 'glasses', 'hoops', 'jhumka', 'studs', 'headphones', 'gajra', 'tikka', 'clip'];
export const EXPRESSIONS = ['smile', 'smirk', 'grin', 'calm', 'laugh', 'focused'];
const PATTERNS = ['jaali', 'dots', 'waves', 'diamonds', 'rays', 'none'];

/** Build a deterministic trait vector from a seeded RNG. */
export function rollTraits(r) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  return {
    skin: Math.floor(r() * SKIN.length),
    hair: Math.floor(r() * HAIR.length),
    hairStyle: pick(HAIR_STYLES),
    face: Math.floor(r() * 4),
    outfit: pick(OUTFIT_STYLES),
    outfitColor: Math.floor(r() * OUTFIT.length),
    bg: Math.floor(r() * BG.length),
    pattern: pick(PATTERNS),
    acc: pick(ACCESSORIES),
    acc2: r() < 0.35 ? pick(['bindi', 'hoops', 'studs', 'nosepin']) : 'none',
    lips: Math.floor(r() * LIPS.length),
    iris: Math.floor(r() * IRIS.length),
    brow: Math.floor(r() * 3),
    liner: r() < 0.4,
    blush: r() < 0.6,
    freckles: r() < 0.12,
    mole: r() < 0.15,
    accent: Math.floor(r() * ACCENT.length),
  };
}

export const traitKey = (t) => [t.skin, t.hair, t.hairStyle, t.face, t.outfit, t.outfitColor, t.bg, t.acc].join('|');

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`;
};

let uid = 0;

export function renderAvatar(t, expression = 'smile') {
  const id = `av${++uid}`;
  const skin = SKIN[t.skin];
  const skinD = shade(skin, -0.12);
  const skinL = shade(skin, 0.06);
  const hair = HAIR[t.hair];
  const hairL = shade(hair, 0.12);
  const [bg1, bg2] = BG[t.bg];
  const [o1, o2] = OUTFIT[t.outfitColor];
  const acc = ACCENT[t.accent];
  const cx = 100;
  const cy = 92;
  const W = [62, 66, 60, 64][t.face];
  const H = [76, 78, 80, 74][t.face];
  const jaw = [0.2, 0.26, 0.16, 0.3][t.face];
  const hw = W / 2;

  const facePath = `M${cx - hw},${cy - 6} C${cx - hw},${cy - H * 0.64} ${cx + hw},${cy - H * 0.64} ${cx + hw},${cy - 6}
    C${cx + hw},${cy + H * 0.22} ${cx + W * jaw},${cy + H / 2} ${cx},${cy + H / 2}
    C${cx - W * jaw},${cy + H / 2} ${cx - hw},${cy + H * 0.22} ${cx - hw},${cy - 6}Z`;

  const s = [];
  s.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">`);
  s.push(`<defs>
    <radialGradient id="${id}bg" cx="35%" cy="25%" r="85%"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></radialGradient>
    <radialGradient id="${id}sk" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${skinL}"/><stop offset=".75" stop-color="${skin}"/><stop offset="1" stop-color="${skinD}"/></radialGradient>
    <linearGradient id="${id}hr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hairL}"/><stop offset="1" stop-color="${hair}"/></linearGradient>
    <linearGradient id="${id}of" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o1}"/><stop offset="1" stop-color="${o2}"/></linearGradient>
    <clipPath id="${id}c"><circle cx="100" cy="100" r="100"/></clipPath>
  </defs>`);
  s.push(`<g clip-path="url(#${id}c)">`);
  s.push(`<rect width="200" height="200" fill="url(#${id}bg)"/>`);
  s.push(pattern(t.pattern));
  s.push(`<ellipse cx="100" cy="210" rx="120" ry="60" fill="rgba(0,0,0,.18)"/>`);

  // Back hair
  s.push(backHair(t.hairStyle, cx, cy, W, H, `url(#${id}hr)`, hair));

  // Shoulders / outfit
  s.push(outfit(t.outfit, `url(#${id}of)`, o1, o2, acc, skin));

  // Neck
  s.push(`<path d="M${cx - 13},${cy + H / 2 - 16} L${cx - 14},${cy + H / 2 + 22} Q${cx},${cy + H / 2 + 30} ${cx + 14},${cy + H / 2 + 22} L${cx + 13},${cy + H / 2 - 16}Z" fill="${skinD}"/>`);
  s.push(`<path d="M${cx - 13},${cy + H / 2 - 4} Q${cx},${cy + H / 2 + 8} ${cx + 13},${cy + H / 2 - 4}" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="4"/>`);
  if (t.outfit === 'saree' || t.outfit === 'kurta' || t.outfit === 'festive' || t.outfit === 'kurti') s.push(neckline(t.outfit, cx, cy + H / 2, skinD, o1, acc));

  // Ears
  s.push(`<ellipse cx="${cx - hw + 1}" cy="${cy + 4}" rx="6" ry="9" fill="${skinD}"/><ellipse cx="${cx + hw - 1}" cy="${cy + 4}" rx="6" ry="9" fill="${skinD}"/>`);
  s.push(earrings([t.acc, t.acc2], cx, cy, hw, acc));

  // Face
  s.push(`<path d="${facePath}" fill="url(#${id}sk)"/>`);
  s.push(`<path d="${facePath}" fill="none" stroke="rgba(0,0,0,.06)" stroke-width="1.2"/>`);
  if (t.blush) s.push(`<ellipse cx="${cx - hw * 0.55}" cy="${cy + 14}" rx="9" ry="5" fill="#E26D6D" opacity=".16"/><ellipse cx="${cx + hw * 0.55}" cy="${cy + 14}" rx="9" ry="5" fill="#E26D6D" opacity=".16"/>`);
  if (t.freckles) s.push([[-16, 10], [-12, 13], [-19, 14], [16, 10], [12, 13], [19, 14]].map(([x, y]) => `<circle cx="${cx + x}" cy="${cy + y}" r="0.9" fill="${shade(skin, -0.3)}" opacity=".6"/>`).join(''));
  if (t.mole) s.push(`<circle cx="${cx + 13}" cy="${cy + H * 0.33}" r="1.2" fill="${shade(skin, -0.4)}"/>`);

  // Eyes
  const ey = cy - 1;
  const ex = W * 0.2;
  const squint = expression === 'laugh' ? 0.45 : expression === 'grin' ? 0.8 : expression === 'calm' ? 0.85 : 1;
  for (const side of [-1, 1]) {
    const x = cx + side * ex;
    if (expression === 'laugh') {
      s.push(`<path d="M${x - 7},${ey + 1} Q${x},${ey - 5} ${x + 7},${ey + 1}" fill="none" stroke="#1d1310" stroke-width="2.4" stroke-linecap="round"/>`);
      continue;
    }
    s.push(`<g transform="translate(${x} ${ey}) scale(1 ${squint})">
      <path d="M-7.5,0 Q0,-6.5 7.5,0 Q0,4.6 -7.5,0Z" fill="#FBF7F2"/>
      <circle cx="${side * 0.4}" cy="-0.4" r="3.6" fill="${IRIS[t.iris]}"/>
      <circle cx="${side * 0.4}" cy="-0.4" r="1.8" fill="#0d0907"/>
      <circle cx="${side * 0.4 + 1.3}" cy="-1.7" r="1" fill="#fff"/>
      <path d="M-8,0.2 Q0,-7 8,0.2" fill="none" stroke="#1d1310" stroke-width="2" stroke-linecap="round"/>
      ${t.liner ? `<path d="M${side * 7.6},-0.2 L${side * 11},-2.6" stroke="#1d1310" stroke-width="1.8" stroke-linecap="round"/>` : ''}
    </g>`);
  }
  // Brows
  const bt = [2.6, 3.4, 2.2][t.brow];
  const arch = expression === 'smirk' ? 1 : 0;
  const focused = expression === 'focused';
  s.push(`<path d="M${cx - ex - 8},${ey - 9} Q${cx - ex},${ey - 14 + (focused ? 2 : 0)} ${cx - ex + 8},${ey - 10 + (focused ? 2 : 0)}" fill="none" stroke="${hair}" stroke-width="${bt}" stroke-linecap="round"/>`);
  s.push(`<path d="M${cx + ex - 8},${ey - 10 - arch * 2 + (focused ? 2 : 0)} Q${cx + ex},${ey - 14 - arch * 3 + (focused ? 2 : 0)} ${cx + ex + 8},${ey - 9 - arch}" fill="none" stroke="${hair}" stroke-width="${bt}" stroke-linecap="round"/>`);

  // Nose
  s.push(`<path d="M${cx - 1},${cy + 4} Q${cx - 4},${cy + 15} ${cx},${cy + 16} Q${cx + 3},${cy + 16.5} ${cx + 4},${cy + 14.5}" fill="none" stroke="${shade(skin, -0.22)}" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>`);

  // Mouth
  const my = cy + H * 0.3;
  const lip = LIPS[t.lips];
  s.push(mouth(expression, cx, my, lip));

  // Front hair
  s.push(frontHair(t.hairStyle, cx, cy, W, H, `url(#${id}hr)`, hairL));

  // Face accessories
  const accs = [t.acc, t.acc2];
  if (accs.includes('bindi') && t.hairStyle !== 'bangs') s.push(`<circle cx="${cx}" cy="${ey - 17}" r="2.6" fill="#C8102E"/><circle cx="${cx - 0.7}" cy="${ey - 17.7}" r=".8" fill="#fff" opacity=".6"/>`);
  if (accs.includes('tikka')) s.push(`<path d="M${cx},${cy - H * 0.52} L${cx},${ey - 22}" stroke="${acc}" stroke-width="1.2"/><circle cx="${cx}" cy="${ey - 20}" r="3.6" fill="${acc}"/><circle cx="${cx}" cy="${ey - 20}" r="1.5" fill="#C8102E"/>`);
  if (accs.includes('nosepin')) s.push(`<circle cx="${cx + 5}" cy="${cy + 14}" r="1.4" fill="${acc}"/>`);
  if (accs.includes('glasses')) {
    const gx = ex;
    s.push(`<g fill="rgba(255,255,255,.08)" stroke="#1d1310" stroke-width="2"><rect x="${cx - gx - 11}" y="${ey - 8}" width="21" height="15" rx="6"/><rect x="${cx + gx - 10}" y="${ey - 8}" width="21" height="15" rx="6"/></g><path d="M${cx - gx + 10},${ey - 2} Q${cx},${ey - 5} ${cx + gx - 10},${ey - 2}" stroke="#1d1310" stroke-width="2" fill="none"/>`);
  }
  if (accs.includes('gajra')) s.push(Array.from({ length: 7 }, (_, i) => `<circle cx="${cx + hw - 2 + Math.cos(i * 0.5) * 8}" cy="${cy - H * 0.38 + i * 3}" r="3" fill="#FFFDF5" stroke="#E8E2D0" stroke-width=".6"/>`).join(''));
  if (accs.includes('clip')) s.push(`<rect x="${cx - hw + 6}" y="${cy - H * 0.4}" width="14" height="4" rx="2" fill="${acc}" transform="rotate(-25 ${cx - hw + 13} ${cy - H * 0.38})"/>`);
  if (accs.includes('headphones')) s.push(`<path d="M${cx - 40},178 Q${cx},158 ${cx + 40},178" fill="none" stroke="#1b1b22" stroke-width="7" stroke-linecap="round"/><rect x="${cx - 50}" y="166" width="16" height="22" rx="7" fill="#2a2a35"/><rect x="${cx + 34}" y="166" width="16" height="22" rx="7" fill="#2a2a35"/>`);

  // Rim light
  s.push(`<path d="M${cx + hw - 2},${cy - 20} C${cx + hw + 2},${cy} ${cx + hw - 4},${cy + 20} ${cx + W * jaw + 6},${cy + H / 2 - 6}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="2" stroke-linecap="round"/>`);
  s.push(`</g></svg>`);
  return s.join('');
}

function pattern(kind) {
  const st = 'rgba(255,255,255,.09)';
  switch (kind) {
    case 'jaali': {
      let out = '';
      for (let y = 0; y <= 200; y += 28) for (let x = (y / 28) % 2 ? 14 : 0; x <= 200; x += 28)
        out += `<path d="M${x},${y - 9} L${x + 9},${y} L${x},${y + 9} L${x - 9},${y}Z" fill="none" stroke="${st}" stroke-width="1.4"/>`;
      return out;
    }
    case 'dots': {
      let out = '';
      for (let y = 8; y < 200; y += 18) for (let x = 8; x < 200; x += 18) out += `<circle cx="${x}" cy="${y}" r="1.6" fill="${st}"/>`;
      return out;
    }
    case 'waves':
      return Array.from({ length: 9 }, (_, i) => `<path d="M-10,${i * 24} q25,-12 50,0 t50,0 t50,0 t50,0 t50,0" fill="none" stroke="${st}" stroke-width="2"/>`).join('');
    case 'diamonds':
      return Array.from({ length: 8 }, (_, i) => `<path d="M${-20 + i * 30},0 l40,200" stroke="${st}" stroke-width="1.5"/><path d="M${220 - i * 30},0 l-40,200" stroke="${st}" stroke-width="1.5"/>`).join('');
    case 'rays':
      return Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<path d="M100,60 L${100 + Math.cos(a) * 200},${60 + Math.sin(a) * 200}" stroke="${st}" stroke-width="7"/>`; }).join('');
    default: return '';
  }
}

function backHair(style, cx, cy, W, H, fill, base) {
  const hw = W / 2;
  const top = cy - H * 0.72;
  const dome = (bottom, flare = 6) => `<path d="M${cx - hw - 8},${cy - 4} C${cx - hw - 14},${top} ${cx + hw + 14},${top} ${cx + hw + 8},${cy - 4} L${cx + hw + 8 + flare},${bottom} Q${cx},${bottom + 10} ${cx - hw - 8 - flare},${bottom}Z" fill="${fill}"/>`;
  switch (style) {
    case 'long': case 'sidepart': return dome(188, 10);
    case 'wavy': return `<path d="M${cx - hw - 8},${cy - 4} C${cx - hw - 14},${top} ${cx + hw + 14},${top} ${cx + hw + 8},${cy - 4} Q${cx + hw + 22},${cy + 30} ${cx + hw + 10},${cy + 52} Q${cx + hw + 26},${cy + 72} ${cx + hw + 14},${190} L${cx - hw - 14},190 Q${cx - hw - 26},${cy + 72} ${cx - hw - 10},${cy + 52} Q${cx - hw - 22},${cy + 30} ${cx - hw - 8},${cy - 4}Z" fill="${fill}"/>`;
    case 'shoulder': return dome(cy + H * 0.62, 8);
    case 'bob': return dome(cy + H * 0.28, 6);
    case 'bangs': return dome(cy + H * 0.55, 8);
    case 'curly': {
      let out = '';
      const pts = 16;
      for (let i = 0; i < pts; i++) {
        const a = Math.PI * 0.95 + (i / (pts - 1)) * Math.PI * 1.1;
        const r = 46 + (i % 2) * 4;
        out += `<circle cx="${cx + Math.cos(a) * r}" cy="${cy - 6 + Math.sin(a) * r * 0.92}" r="${15 + (i % 3) * 2}" fill="${base}"/>`;
      }
      for (const [x, y] of [[-44, 30], [44, 30], [-50, 55], [50, 55], [-42, 75], [42, 75]]) out += `<circle cx="${cx + x}" cy="${cy + y}" r="15" fill="${base}"/>`;
      return out;
    }
    case 'bun': return `<circle cx="${cx}" cy="${top + 2}" r="20" fill="${fill}"/>` + dome(cy + 6, 0);
    case 'ponytail': return `<path d="M${cx + hw - 4},${cy - H * 0.4} Q${cx + hw + 36},${cy - 10} ${cx + hw + 20},${cy + 60} Q${cx + hw + 10},${cy + 30} ${cx + hw - 2},${cy - 10}Z" fill="${fill}"/>` + dome(cy + 4, 0);
    case 'braid': {
      let out = dome(cy + 8, 0);
      for (let i = 0; i < 6; i++) out += `<ellipse cx="${cx + hw - 2 + i * 1.5}" cy="${cy + 22 + i * 14}" rx="9" ry="9" fill="${fill}"/>`;
      return out;
    }
    case 'twobraids': {
      let out = dome(cy + 8, 0);
      for (const side of [-1, 1]) for (let i = 0; i < 5; i++) out += `<ellipse cx="${cx + side * (hw + 2)}" cy="${cy + 22 + i * 13}" rx="8" ry="8" fill="${fill}"/>`;
      return out;
    }
    case 'pixie': default: return '';
  }
}

function frontHair(style, cx, cy, W, H, fill, light) {
  const hw = W / 2;
  const top = cy - H / 2 - 16;
  const L = cx - hw - 5;
  const R = cx + hw + 5;
  const base = `M${L},${cy + 4} C${L - 4},${top} ${R + 4},${top} ${R},${cy + 4}`;
  let d;
  switch (style) {
    case 'bangs':
      d = `${base} L${R - 4},${cy - H * 0.16} Q${cx + 18},${cy - H * 0.2} ${cx + 8},${cy - H * 0.18} Q${cx},${cy - H * 0.22} ${cx - 10},${cy - H * 0.17} Q${cx - 20},${cy - H * 0.21} ${L + 4},${cy - H * 0.14}Z`;
      break;
    case 'sidepart': case 'wavy':
      d = `${base} C${R - 2},${cy - H * 0.12} ${cx + 8},${cy - H * 0.24} ${cx - 14},${cy - H * 0.43} Q${cx - hw + 2},${cy - H * 0.32} ${L},${cy + 4}Z`;
      break;
    case 'pixie':
      d = `M${L + 2},${cy - 2} C${L - 4},${top + 2} ${R + 4},${top + 2} ${R - 2},${cy - 2} Q${R - 8},${cy - H * 0.3} ${cx + 10},${cy - H * 0.34} Q${cx - 14},${cy - H * 0.2} ${L + 2},${cy - 2}Z`;
      break;
    case 'curly':
      d = `${base} Q${R - 4},${cy - H * 0.3} ${cx + 12},${cy - H * 0.36} Q${cx},${cy - H * 0.28} ${cx - 12},${cy - H * 0.36} Q${L + 4},${cy - H * 0.3} ${L},${cy + 4}Z`;
      break;
    default: // middle part
      d = `${base} Q${R - 6},${cy - H * 0.3} ${cx + 2},${cy - H * 0.43} Q${L + 6},${cy - H * 0.3} ${L},${cy + 4}Z`;
  }
  return `<path d="${d}" fill="${fill}"/><path d="M${cx - 14},${top + 10} Q${cx + 4},${top + 2} ${cx + 22},${top + 12}" fill="none" stroke="${light}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
}

function outfit(kind, fill, o1, o2, acc, skin) {
  const body = `M10,210 C14,168 52,150 100,150 C148,150 186,168 190,210Z`;
  switch (kind) {
    case 'hoodie':
      return `<path d="${body}" fill="${fill}"/><path d="M62,156 Q100,190 138,156 Q132,176 100,182 Q68,176 62,156Z" fill="${o2}"/><path d="M90,176 L88,200 M110,176 L112,200" stroke="#fff" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/>`;
    case 'denim':
      return `<path d="${body}" fill="#3E6FA8"/><path d="M76,152 L100,196 L124,152Z" fill="#F8F3EA"/><path d="M70,154 L94,200 L80,200 L58,160Z M130,154 L106,200 L120,200 L142,160Z" fill="#2F5A8C"/><circle cx="84" cy="186" r="1.8" fill="#C9A44C"/><circle cx="116" cy="186" r="1.8" fill="#C9A44C"/>`;
    case 'blazer':
      return `<path d="${body}" fill="${fill}"/><path d="M84,152 L100,200 L116,152Z" fill="#F8F3EA"/><path d="M78,152 L100,200 L88,200 L66,158Z M122,152 L100,200 L112,200 L134,158Z" fill="${o2}"/>`;
    case 'turtleneck':
      return `<path d="${body}" fill="${fill}"/><rect x="84" y="140" width="32" height="20" rx="8" fill="${o2}"/>`;
    case 'jersey':
      return `<path d="${body}" fill="${fill}"/><path d="M80,153 L100,172 L120,153" fill="none" stroke="#fff" stroke-width="4"/><path d="M28,190 L60,170 M172,190 L140,170" stroke="#fff" stroke-opacity=".6" stroke-width="5"/><text x="128" y="196" font-family="Arial Black,Arial" font-size="16" fill="#fff" opacity=".85">7</text>`;
    case 'tee':
      return `<path d="${body}" fill="${fill}"/><path d="M80,152 Q100,168 120,152" fill="none" stroke="${o2}" stroke-width="4"/><circle cx="100" cy="188" r="9" fill="none" stroke="${acc}" stroke-width="3"/>`;
    case 'saree':
      return `<path d="${body}" fill="${fill}"/><path d="M120,150 C150,154 170,170 176,210 L140,210 C136,186 124,166 104,156Z" fill="${o2}"/><path d="M118,151 C146,156 164,172 170,210" fill="none" stroke="${acc}" stroke-width="4"/><path d="M110,154 C132,162 146,184 150,210" fill="none" stroke="${acc}" stroke-width="1.5" stroke-dasharray="2 4"/>`;
    case 'festive':
      return `<path d="${body}" fill="${fill}"/><path d="M14,206 C18,176 52,160 100,160 C148,160 182,176 186,206" fill="none" stroke="${acc}" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round"/><path d="M36,178 Q100,150 164,178" fill="none" stroke="${acc}" stroke-width="2.5"/><path d="M130,150 C160,160 176,180 182,210 L150,210 C146,186 136,166 118,154Z" fill="${o2}" opacity=".85"/>`;
    case 'kurti':
      return `<path d="${body}" fill="${fill}"/>${Array.from({ length: 10 }, (_, i) => `<circle cx="${30 + i * 16}" cy="${186 + (i % 2) * 8}" r="2.4" fill="${acc}" opacity=".8"/>`).join('')}`;
    case 'kurta': default:
      return `<path d="${body}" fill="${fill}"/><path d="M100,166 L100,200" stroke="${o2}" stroke-width="3"/><circle cx="100" cy="176" r="1.6" fill="${acc}"/><circle cx="100" cy="186" r="1.6" fill="${acc}"/><circle cx="100" cy="196" r="1.6" fill="${acc}"/>`;
  }
}

function neckline(kind, cx, y, skinD, o1, acc) {
  if (kind === 'saree') return '';
  return `<path d="M${cx - 16},${y + 14} Q${cx},${y + 32} ${cx + 16},${y + 14}" fill="none" stroke="${acc}" stroke-width="2.2"/>`;
}

function earrings(list, cx, cy, hw, acc) {
  let out = '';
  for (const side of [-1, 1]) {
    const x = cx + side * (hw - 1);
    const y = cy + 12;
    if (list.includes('hoops')) out += `<circle cx="${x}" cy="${y + 6}" r="6" fill="none" stroke="${acc}" stroke-width="2"/>`;
    else if (list.includes('jhumka')) out += `<circle cx="${x}" cy="${y}" r="2.4" fill="${acc}"/><path d="M${x - 5},${y + 10} Q${x},${y} ${x + 5},${y + 10}Z" fill="${acc}"/>${[-3, 0, 3].map((d) => `<circle cx="${x + d}" cy="${y + 12}" r="1.1" fill="${acc}"/>`).join('')}`;
    else if (list.includes('studs')) out += `<circle cx="${x}" cy="${y}" r="2.4" fill="${acc}"/>`;
  }
  return out;
}

function mouth(expr, cx, y, lip) {
  switch (expr) {
    case 'grin': case 'laugh':
      return `<path d="M${cx - 11},${y - 2} Q${cx},${y + (expr === 'laugh' ? 13 : 10)} ${cx + 11},${y - 2} Q${cx},${y + 1} ${cx - 11},${y - 2}Z" fill="#5A1F22"/><path d="M${cx - 9},${y - 1} Q${cx},${y + 3} ${cx + 9},${y - 1} L${cx + 8},${y + 1.5} Q${cx},${y + 4} ${cx - 8},${y + 1.5}Z" fill="#fff"/><path d="M${cx - 11},${y - 2} Q${cx},${y - 4.5} ${cx + 11},${y - 2}" fill="none" stroke="${lip}" stroke-width="2.4" stroke-linecap="round"/>`;
    case 'smirk':
      return `<path d="M${cx - 8},${y} Q${cx + 2},${y + 3} ${cx + 10},${y - 3}" fill="none" stroke="${lip}" stroke-width="3.4" stroke-linecap="round"/>`;
    case 'calm': case 'focused':
      return `<path d="M${cx - 7},${y} Q${cx},${y + 2} ${cx + 7},${y}" fill="none" stroke="${lip}" stroke-width="3.6" stroke-linecap="round"/>`;
    default:
      return `<path d="M${cx - 9},${y - 1} Q${cx},${y + 6} ${cx + 9},${y - 1} Q${cx},${y + 2.4} ${cx - 9},${y - 1}Z" fill="${lip}"/><path d="M${cx - 9},${y - 1} Q${cx},${y - 2.6} ${cx + 9},${y - 1}" fill="none" stroke="${lip}" stroke-width="2.2" stroke-linecap="round"/>`;
  }
}

const cache = new Map();
/** Returns a data URI for a character's procedural avatar (cached). */
export function avatarDataUri(char) {
  const key = char.id;
  if (!cache.has(key)) cache.set(key, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderAvatar(char.traits, char.expression))}`);
  return cache.get(key);
}
