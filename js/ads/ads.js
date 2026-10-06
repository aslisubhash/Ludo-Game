// Rewarded-ads layer. All ad requests go through `showRewarded(placement)`, which
// enforces the fairness/timing rules before any provider is asked for an ad:
//   • never while dice are rolling, a token is moving, or a move must be chosen
//   • never more than once per natural break, with a daily cap and a cooldown
//   • the reward is described to the player before they opt in
// Swap MockAdProvider for a real SDK adapter (e.g. H5 Games Ads `adBreak`, AdMob via
// a WebView bridge) by implementing `{ name, isReady(), show(placement) → Promise<boolean> }`.
import { html, wait } from '../core/ui.js';
import { store, dayKey } from '../core/store.js';
import { sfx } from '../core/fx.js';

export const PLACEMENTS = {
  second_chance: { label: '+1 Extra Roll' },
  double_reward: { label: 'Double match reward' },
  daily_bonus: { label: 'Extra daily reward' },
  mystery_box: { label: 'Unlock mystery box' },
  mission_bonus: { label: 'Extra mission reward' },
  streak_save: { label: 'Keep your win streak' },
  trial_dice: { label: 'Try premium dice for 3 matches' },
};

const DAILY_CAP = 25;
const COOLDOWN_MS = 20_000;

// Gameplay registers a guard so the ad layer can refuse to interrupt live action.
let busyGuard = () => false;
export function setGameplayGuard(fn) { busyGuard = fn || (() => false); }

class MockAdProvider {
  name = 'mock';
  isReady() { return true; }
  async show(placement) {
    const host = document.getElementById('overlay-host');
    const el = html(`
      <div class="ad-screen" role="dialog" aria-label="Sponsored">
        <div class="ad-top"><span class="ad-label">Sponsored · Reward: ${PLACEMENTS[placement]?.label || 'Reward'}</span><span class="ad-timer num">5</span></div>
        <div class="ad-body">
          <div class="ad-art"><div class="ad-dice d1"></div><div class="ad-dice d2"></div></div>
          <div class="ad-copy">
            <div class="eyebrow">Ludo Universe Presents</div>
            <div class="display ad-title">Festival Pass</div>
            <div class="muted">Exclusive diyas, boards &amp; dice all season long.</div>
          </div>
        </div>
        <div class="ad-progress"><i></i></div>
        <button class="btn light block ad-close" disabled>Reward in 5s</button>
      </div>`);
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('open'));
    const timer = el.querySelector('.ad-timer');
    const btn = el.querySelector('.ad-close');
    el.querySelector('.ad-progress i').style.animationDuration = '5s';
    for (let s = 5; s > 0; s--) { timer.textContent = s; btn.textContent = `Reward in ${s}s`; await wait(1000); }
    timer.textContent = '✓';
    btn.disabled = false;
    btn.textContent = 'Collect reward';
    sfx('coin');
    await new Promise((r) => btn.addEventListener('click', r, { once: true }));
    el.classList.remove('open');
    setTimeout(() => el.remove(), 250);
    return true;
  }
}

let provider = new MockAdProvider();
export function setAdProvider(p) { provider = p; }

export function adsAvailable() {
  const a = store.s.ads;
  const today = dayKey();
  const count = a.day === today ? a.count : 0;
  return provider.isReady() && count < DAILY_CAP && Date.now() - (a.last || 0) > COOLDOWN_MS;
}

/** Shows a rewarded ad. Resolves true only if the reward was earned. */
export async function showRewarded(placement) {
  if (busyGuard()) {
    console.warn('[ads] refused: gameplay is busy');
    return false;
  }
  if (!adsAvailable()) return false;
  const ok = await provider.show(placement);
  if (ok) {
    store.update((s) => {
      const today = dayKey();
      if (s.ads.day !== today) { s.ads.day = today; s.ads.count = 0; }
      s.ads.count++;
      s.ads.last = Date.now();
    });
  }
  return ok;
}
