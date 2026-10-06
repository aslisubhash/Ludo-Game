// Cinematic opening: the board builds itself, dice tumble, tokens glide and
// characters drift in around the logo while content loads.
import { html } from '../core/ui.js';
import { boardSvg } from '../game/board-view.js';
import { Dice } from '../game/dice.js';
import { charAvatar } from './components.js';
import { allCharacters, hasPortrait } from '../content/characters.js';

const LINES = ['Shuffling dice…', 'Polishing tokens…', 'Building the board…', 'Waking up players…', 'Lighting the diyas…'];

export function splashScreen({ ready }) {
  const el = html(`<section class="splash">
    <div class="splash-glow"></div>
    <div class="splash-particles">${Array.from({ length: 18 }, (_, i) => `<i style="--x:${(i * 53) % 100}%;--d:${(i % 6) * 0.4}s;--s:${4 + (i % 4) * 2}px"></i>`).join('')}</div>
    <div class="splash-board"><div class="sb-inner">${boardSvg('classic-india')}</div>
      <i class="sb-token t1"></i><i class="sb-token t2"></i><i class="sb-token t3"></i><i class="sb-token t4"></i></div>
    <div class="splash-ring"></div>
    <div class="splash-dice"></div>
    <div class="splash-logo">
      <div class="logo-mark">LUDO</div>
      <div class="logo-sub">UNIVERSE</div>
    </div>
    <div class="splash-foot">
      <div class="splash-line"><i></i></div>
      <div class="splash-caption">${LINES[0]}</div>
    </div>
  </section>`);
  const dice = new Dice({ size: 70, interactive: false });
  el.querySelector('.splash-dice').appendChild(dice.el);

  let t1, t2;
  return {
    el,
    nav: false,
    onEnter() {
      // Characters appear around the board once the cast exists.
      ready.then(() => {
        const ring = el.querySelector('.splash-ring');
        const cast = allCharacters().filter(hasPortrait).slice(0, 8);
        const list = cast.length >= 6 ? cast : allCharacters().slice(0, 8);
        ring.innerHTML = list.map((c, i) => {
          // Arc over the top and sides of the board, leaving the logo area clear.
          const ang = (-215 + (i / (list.length - 1)) * 250) * (Math.PI / 180);
          return `<div class="ring-ava" style="--x:${50 + Math.cos(ang) * 43}%;--y:${50 + Math.sin(ang) * 44}%;--d:${0.15 + i * 0.09}s">${charAvatar(c, { size: 46 })}</div>`;
        }).join('');
      });
      let k = 0;
      const cap = el.querySelector('.splash-caption');
      t1 = setInterval(() => { k = (k + 1) % LINES.length; cap.textContent = LINES[k]; }, 700);
      const roll = () => dice.roll(1 + Math.floor(Math.random() * 6));
      setTimeout(roll, 400);
      t2 = setInterval(roll, 1300);
    },
    onLeave() { clearInterval(t1); clearInterval(t2); },
  };
}
