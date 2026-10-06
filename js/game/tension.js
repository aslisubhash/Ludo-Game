// Tension presentation derived ONLY from the real board state. Nothing here changes
// the game; it decides what to spotlight and how warm the lighting should feel.
import { HOME, LAST_TRACK, tokensHome, threatsTo, remainingPips } from './rules.js';

export function assess(g, me) {
  const p = g.players[me];
  const mh = tokensHome(p);
  const opps = g.players.map((op, i) => ({ i, home: tokensHome(op), pips: remainingPips(op) })).filter((o) => o.i !== me);
  const leader = opps.reduce((a, b) => (b.home > a.home || (b.home === a.home && b.pips < a.pips) ? b : a), opps[0]);
  const myPips = remainingPips(p);

  const danger = [];
  p.tokens.forEach((pos, t) => { if (pos > 6 && pos <= LAST_TRACK && threatsTo(g, me, pos).length) danger.push({ p: me, t }); });
  const nearHome = [];
  p.tokens.forEach((pos, t) => { if (pos > LAST_TRACK && pos < HOME) nearHome.push({ p: me, t }); });
  const oppNear = [];
  g.players.forEach((op, i) => { if (i !== me) op.tokens.forEach((pos, t) => { if (pos >= LAST_TRACK - 6 && pos < HOME) oppNear.push({ p: i, t }); }); });

  let level = 0;
  let label = null;
  let tone = 'neutral';

  if (mh === 3 && leader.home === 3) { level = 3; label = 'THIS COULD DECIDE THE MATCH'; tone = 'hot'; }
  else if (leader.home === 3 && leader.pips <= 14) { level = 3; label = 'OPPONENT NEAR VICTORY'; tone = 'danger'; }
  else if (mh === 3 && myPips <= 14) { level = 2; label = 'ONE MOVE FROM HOME'; tone = 'gold'; }
  else if (mh === 3) { level = 2; label = '1 TOKEN LEFT'; tone = 'gold'; }
  else if (danger.length) { level = 1; label = 'DANGER'; tone = 'danger'; }
  else if (nearHome.some(({ t }) => HOME - p.tokens[t] <= 6)) { level = 1; label = 'ONE MOVE FROM HOME'; tone = 'gold'; }
  else if (mh >= 2 || leader.home >= 2) { level = 1; }

  const spotlight = level >= 2 ? [...nearHome, ...oppNear] : [];
  return { level, label, tone, danger, spotlight, myHome: mh, leaderHome: leader.home, leader: leader.i, myPips, leaderPips: leader.pips };
}

/** "Final stage" gate used by the published second-chance rule. */
export function isFinalStage(g) {
  return g.players.some((p) => tokensHome(p) >= 2 || p.tokens.some((x) => x > LAST_TRACK && x < HOME));
}

/** Classify how a finished match should be presented. */
export function closeness(g, me) {
  const winner = g.winner;
  const others = g.players.map((p, i) => ({ i, pips: remainingPips(p), home: tokensHome(p) })).filter((x) => x.i !== winner);
  const runnerUp = others.reduce((a, b) => (b.pips < a.pips ? b : a), others[0]);
  const meP = { pips: remainingPips(g.players[me]), home: tokensHome(g.players[me]) };
  if (winner === me) {
    if (runnerUp.home === 3 && runnerUp.pips <= 6) return { kind: 'photo', title: 'PHOTO FINISH!', sub: 'One move difference' };
    if (runnerUp.home === 3) return { kind: 'epic', title: 'EPIC MATCH', sub: 'They had 3 tokens home' };
    if (runnerUp.home === 0) return { kind: 'flawless', title: 'FLAWLESS', sub: 'They never got a token home' };
    return { kind: 'win', title: 'YOU WON!', sub: null };
  }
  if (meP.home === 3 && meP.pips <= 6) return { kind: 'photo', title: 'PHOTO FINISH!', sub: 'You were one move away' };
  if (meP.home >= 3) return { kind: 'close', title: 'SO CLOSE!', sub: 'One token from victory' };
  if (meP.home >= 2) return { kind: 'close', title: 'SO CLOSE!', sub: `${meP.home} tokens home` };
  return { kind: 'loss', title: 'GOOD FIGHT', sub: 'Every match makes you stronger' };
}
