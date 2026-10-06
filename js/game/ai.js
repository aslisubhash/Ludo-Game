// Personality-weighted move evaluator. Characters play differently, but they only ever
// choose among legal moves for the roll they actually got — the AI never sees future dice.
import { HOME, LAST_TRACK, YARD, absCell, capturesAt, cloneGame, isSafeAbs, threatsTo } from './rules.js';

/**
 * style: { aggression, safety, progress, risk, noise } each ~0..1.5
 */
export function chooseMove(g, pIdx, roll, moves, style, rnd = Math.random) {
  if (moves.length <= 1) return moves[0];
  let best = null;
  let bestScore = -Infinity;
  for (const m of moves) {
    const s = scoreMove(g, pIdx, roll, m, style) + (rnd() - 0.5) * 70 * (style.noise ?? 0.2);
    if (s > bestScore) { bestScore = s; best = m; }
  }
  return best;
}

export function scoreMove(g, pIdx, roll, m, style) {
  const { aggression = 1, safety = 1, progress = 1, risk = 0.5 } = style;
  const color = g.players[pIdx].color;
  let score = 0;

  if (m.to === HOME) score += 120;
  if (m.from === YARD) score += 45;
  if (m.from <= LAST_TRACK && m.to > LAST_TRACK && m.to < HOME) score += 34; // reach home column = safe

  const caps = capturesAt(g, pIdx, m.to);
  if (caps.length) {
    const victimProgress = caps.reduce((s, c) => s + g.players[c.player].tokens[c.token], 0);
    score += (90 + victimProgress * 0.8) * aggression;
  }

  const fromThreat = m.from >= 0 && m.from <= LAST_TRACK ? threatsTo(g, pIdx, m.from).length : 0;
  const sim = cloneGame(g);
  sim.players[pIdx].tokens[m.token] = m.to;
  caps.forEach((c) => { sim.players[c.player].tokens[c.token] = YARD; });
  const toThreat = m.to <= LAST_TRACK ? threatsTo(sim, pIdx, m.to).length : 0;

  if (fromThreat && !toThreat) score += 55 * safety;
  if (toThreat) score -= (60 - risk * 35) * safety * Math.min(2, toThreat);
  const toAbs = absCell(color, m.to);
  if (toAbs !== null && isSafeAbs(toAbs)) score += 22 * safety;

  score += (m.to - Math.max(0, m.from)) * 1.2 * progress;
  score += Math.max(0, m.from) * 0.25 * progress; // prefer advancing leaders slightly
  return score;
}
