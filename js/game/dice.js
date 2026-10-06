// Signature 3D dice. The value is decided by fairDie() BEFORE the animation starts and
// the animation simply lands on it — presentation never influences outcomes.
import { findItem } from '../content/catalog.js';
import { sfx, haptic } from '../core/fx.js';
import { wait } from '../core/ui.js';

const PIPS = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
// face -> cube rotation that brings it to the front: [rx, ry]
const FACE_ROT = { 1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0] };
const FACE_CLASS = { 1: 'f-front', 6: 'f-back', 2: 'f-right', 5: 'f-left', 3: 'f-top', 4: 'f-bottom' };

function faceHtml(n) {
  return `<div class="die-face ${FACE_CLASS[n]}">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[n].includes(i + 1) ? 'pip' : ''}"></i>`).join('')}</div>`;
}

export class Dice {
  constructor({ size = 64, skin = 'classic', interactive = true } = {}) {
    this.value = 1;
    this.rx = -18;
    this.ry = 22;
    this.el = document.createElement('div');
    this.el.className = `dice-stage${interactive ? ' interactive' : ''}`;
    this.el.style.setProperty('--ds', `${size}px`);
    this.el.innerHTML = `<div class="dice-shadow"></div><div class="dice-hop"><div class="die">${[1, 2, 3, 4, 5, 6].map(faceHtml).join('')}</div></div><div class="dice-result"></div>`;
    this.die = this.el.querySelector('.die');
    this.hop = this.el.querySelector('.dice-hop');
    this.result = this.el.querySelector('.dice-result');
    this.setSkin(skin);
    this.apply(false);
  }

  setSkin(id) {
    const s = findItem('dice', id) || findItem('dice', 'classic');
    const st = this.el.style;
    st.setProperty('--d-face', s.face);
    st.setProperty('--d-face2', s.face2);
    st.setProperty('--d-pip', s.pip);
    st.setProperty('--d-edge', s.edge);
    st.setProperty('--d-glow', s.glow || 'transparent');
    this.el.dataset.texture = s.texture || '';
  }

  apply(animated = true) {
    this.die.style.transition = animated ? '' : 'none';
    this.die.style.transform = `rotateX(${this.rx}deg) rotateY(${this.ry}deg)`;
  }

  show(value) {
    this.value = value;
    const [fx, fy] = FACE_ROT[value];
    this.rx = fx - 18;
    this.ry = fy + 22;
    this.apply(false);
  }

  /** Full roll sequence: compress → launch → tumble → bounce → land. */
  async roll(value) {
    this.value = value;
    this.el.classList.remove('landed', 'six', 'idle-pulse');
    this.result.textContent = '';
    this.el.classList.add('rolling');
    haptic(15);
    sfx('roll');
    const [fx, fy] = FACE_ROT[value];
    const turnsX = 2 + Math.floor(Math.random() * 2);
    const turnsY = 2 + Math.floor(Math.random() * 2);
    const baseX = Math.ceil(this.rx / 360) * 360 + turnsX * 360;
    const baseY = Math.ceil(this.ry / 360) * 360 + turnsY * 360;
    this.rx = baseX + fx - 18;
    this.ry = baseY + fy + 22;
    this.hop.classList.remove('go');
    void this.hop.offsetWidth;
    this.hop.classList.add('go');
    await wait(40);
    this.apply(true);
    await wait(860);
    this.el.classList.remove('rolling');
    this.el.classList.add('landed');
    if (value === 6) { this.el.classList.add('six'); sfx('six'); haptic([20, 30, 20]); } else { sfx('land'); haptic(18); }
    this.result.textContent = value;
    await wait(160);
    return value;
  }

  setEnabled(on) {
    this.el.classList.toggle('ready', on);
    this.el.classList.toggle('idle-pulse', on);
  }
}
