// Feedback layer: synthesized sound, haptics, and a lightweight particle canvas.
import { store } from './store.js';

/* ---------- Sound (WebAudio synth — no audio files needed) ---------- */
let ctx = null;
function audio() {
  if (!store.s.settings.sound) return null;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(a, { f = 440, f2 = f, type = 'sine', dur = 0.08, vol = 0.08, delay = 0 } = {}) {
  const t0 = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(a, { dur = 0.05, vol = 0.05, delay = 0, hp = 1800 } = {}) {
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filt = a.createBiquadFilter();
  filt.type = 'highpass';
  filt.frequency.value = hp;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(filt).connect(g).connect(a.destination);
  src.start(a.currentTime + delay);
}

const SOUNDS = {
  tap: (a) => tone(a, { f: 660, f2: 520, dur: 0.05, vol: 0.035, type: 'triangle' }),
  roll: (a) => { for (let i = 0; i < 7; i++) noise(a, { dur: 0.035, vol: 0.06, delay: i * 0.07, hp: 1200 + i * 200 }); },
  land: (a) => { tone(a, { f: 180, f2: 90, dur: 0.12, vol: 0.12, type: 'sine' }); noise(a, { dur: 0.04, vol: 0.05 }); },
  six: (a) => { [523, 659, 784, 1046].forEach((f, i) => tone(a, { f, dur: 0.12, vol: 0.06, type: 'triangle', delay: i * 0.06 })); },
  hop: (a) => tone(a, { f: 420 + Math.random() * 60, f2: 620, dur: 0.06, vol: 0.04, type: 'sine' }),
  lift: (a) => tone(a, { f: 300, f2: 700, dur: 0.1, vol: 0.05, type: 'sine' }),
  capture: (a) => { tone(a, { f: 220, f2: 70, dur: 0.25, vol: 0.12, type: 'sawtooth' }); noise(a, { dur: 0.12, vol: 0.08, hp: 600 }); },
  home: (a) => { [659, 880, 1175].forEach((f, i) => tone(a, { f, dur: 0.18, vol: 0.06, type: 'triangle', delay: i * 0.08 })); },
  win: (a) => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(a, { f, dur: 0.3, vol: 0.07, type: 'triangle', delay: i * 0.09 })); },
  lose: (a) => { [392, 349, 311].forEach((f, i) => tone(a, { f, dur: 0.28, vol: 0.06, type: 'sine', delay: i * 0.12 })); },
  pop: (a) => tone(a, { f: 880, f2: 1320, dur: 0.07, vol: 0.05, type: 'sine' }),
  msg: (a) => { tone(a, { f: 988, dur: 0.06, vol: 0.04, type: 'sine' }); tone(a, { f: 1319, dur: 0.08, vol: 0.04, type: 'sine', delay: 0.06 }); },
  coin: (a) => { tone(a, { f: 1568, dur: 0.06, vol: 0.04, type: 'square' }); tone(a, { f: 2093, dur: 0.12, vol: 0.035, type: 'square', delay: 0.05 }); },
  tick: (a) => tone(a, { f: 1200, dur: 0.03, vol: 0.03, type: 'square' }),
  whoosh: (a) => noise(a, { dur: 0.25, vol: 0.05, hp: 400 }),
  danger: (a) => { tone(a, { f: 330, dur: 0.12, vol: 0.05, type: 'square' }); tone(a, { f: 330, dur: 0.12, vol: 0.05, type: 'square', delay: 0.18 }); },
};

export function sfx(name) {
  const a = audio();
  if (!a) return;
  try { SOUNDS[name]?.(a); } catch { /* ignore */ }
}

export function haptic(pattern = 10) {
  if (!store.s.settings.haptics) return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  try { navigator.vibrate?.(pattern); } catch { /* ignore */ }
}

/* ---------- Particles ---------- */
let canvas, c2d, parts = [], raf = 0, W = 0, H = 0, dpr = 1;

function ensureCanvas() {
  if (canvas) return;
  canvas = document.getElementById('fx-canvas');
  c2d = canvas.getContext('2d');
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
  };
  resize();
  window.addEventListener('resize', resize);
}

function loop() {
  c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  c2d.clearRect(0, 0, W, H);
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) {
    p.life -= 1;
    p.vy += p.g;
    p.vx *= p.drag; p.vy *= p.drag;
    p.x += p.vx; p.y += p.vy;
    p.rot += p.vr;
    const a = Math.min(1, p.life / 30);
    c2d.save();
    c2d.globalAlpha = a;
    c2d.translate(p.x, p.y);
    c2d.rotate(p.rot);
    c2d.fillStyle = p.color;
    if (p.shape === 'rect') c2d.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    else if (p.shape === 'petal') { c2d.beginPath(); c2d.ellipse(0, 0, p.size * 0.7, p.size * 0.35, 0, 0, Math.PI * 2); c2d.fill(); }
    else { c2d.beginPath(); c2d.arc(0, 0, p.size / 2, 0, Math.PI * 2); c2d.fill(); }
    c2d.restore();
  }
  if (parts.length) raf = requestAnimationFrame(loop);
  else { c2d.clearRect(0, 0, W, H); raf = 0; }
}

function spawn(list) {
  if (store.s.settings.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  ensureCanvas();
  parts.push(...list);
  if (!raf) raf = requestAnimationFrame(loop);
}

const PALETTES = {
  confetti: ['#F0464B', '#1FB574', '#FFC23D', '#3C8DFF', '#FFFFFF', '#FF7A2F'],
  petals: ['#FF9F1C', '#FFB703', '#FB8500', '#FFD166', '#E63946'],
  holi: ['#FF3D7F', '#7B5CFF', '#3EE6B0', '#FFC23D', '#3C8DFF', '#FF7A2F'],
  fireworks: ['#FFD166', '#FFFFFF', '#FF7A2F', '#B39DFF'],
};

/** Burst of particles at stage-relative coordinates (0..1). */
export function burst(xr = 0.5, yr = 0.5, { count = 26, colors = PALETTES.confetti, speed = 6, size = 6, shape = 'circle', gravity = 0.18, life = 60 } = {}) {
  ensureCanvas();
  const x = xr * W, y = yr * H;
  const list = [];
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    list.push({ x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 1.5, g: gravity, drag: 0.97, size: size * (0.6 + Math.random() * 0.8), color: colors[i % colors.length], life: life + Math.random() * 30, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, shape });
  }
  spawn(list);
}

export function burstAt(el, opts) {
  ensureCanvas();
  const s = canvas.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  burst((r.left + r.width / 2 - s.left) / s.width, (r.top + r.height / 2 - s.top) / s.height, opts);
}

/** Full-screen celebration rain. */
export function celebrate(kind = 'confetti') {
  ensureCanvas();
  const colors = PALETTES[kind] || PALETTES.confetti;
  const shape = kind === 'petals' ? 'petal' : kind === 'holi' ? 'circle' : 'rect';
  const list = [];
  for (let i = 0; i < 140; i++) {
    list.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.6, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, g: 0.04, drag: 0.995, size: 7 + Math.random() * 7, color: colors[i % colors.length], life: 160 + Math.random() * 80, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2, shape });
  }
  spawn(list);
  if (kind === 'fireworks') {
    for (let k = 0; k < 4; k++) setTimeout(() => burst(0.2 + Math.random() * 0.6, 0.15 + Math.random() * 0.3, { count: 40, colors, speed: 7, size: 4, gravity: 0.08 }), k * 350);
  }
}
