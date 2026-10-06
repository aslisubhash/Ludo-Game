// Pure Ludo rules engine — no DOM, no randomness. Fully testable in Node.
//
// Board model
//   Shared track of 52 cells (absolute index 0..51), clockwise.
//   Token position is relative to its owner:
//     -1        in the yard
//     0..50     on the shared track (0 = own start cell)
//     51..55    own home column
//     56        home (finished)
//
// House rules (shown in-game under "How to play"):
//   • A 6 is needed to leave the yard.
//   • Rolling a 6, capturing, or bringing a token home grants an extra roll.
//   • Three 6s in a row forfeit the turn.
//   • Start cells and star cells are safe — no captures there.
//   • A token must land on home with an exact roll.
//   • The first player to bring all four tokens home wins.

export const COLORS = ['red', 'green', 'yellow', 'blue'];
export const START = { red: 0, green: 13, yellow: 26, blue: 39 };
export const STAR_CELLS = [8, 21, 34, 47];
export const SAFE = new Set([0, 13, 26, 39, ...STAR_CELLS]);
export const YARD = -1;
export const LAST_TRACK = 50;
export const HOME = 56;
export const TOKENS = 4;

export function createGame(colors) {
  return {
    players: colors.map((color) => ({ color, tokens: [YARD, YARD, YARD, YARD] })),
    turn: 0,
    sixesInRow: 0,
    winner: null,
    turns: 0,
    captures: colors.map(() => 0),
    log: [],
  };
}

export function cloneGame(g) {
  return { ...g, players: g.players.map((p) => ({ ...p, tokens: p.tokens.slice() })), captures: g.captures.slice(), log: g.log };
}

/** Absolute track index for a relative position, or null when off the shared track. */
export function absCell(color, pos) {
  if (pos < 0 || pos > LAST_TRACK) return null;
  return (START[color] + pos) % 52;
}

export function isSafeAbs(abs) { return SAFE.has(abs); }

export function legalMoves(g, pIdx, roll) {
  const p = g.players[pIdx];
  const moves = [];
  const seen = new Set();
  p.tokens.forEach((pos, t) => {
    let to = null;
    if (pos === YARD) { if (roll === 6) to = 0; }
    else if (pos < HOME && pos + roll <= HOME) to = pos + roll;
    if (to === null) return;
    // Tokens stacked on the same spot produce identical moves — keep one per (from) but remember all.
    const key = `${pos}`;
    if (seen.has(key)) return;
    seen.add(key);
    moves.push({ token: t, from: pos, to });
  });
  return moves;
}

/** Opponent tokens that would be captured by moving `color` to relative `to`. */
export function capturesAt(g, pIdx, to) {
  const color = g.players[pIdx].color;
  const abs = absCell(color, to);
  if (abs === null || isSafeAbs(abs)) return [];
  const hits = [];
  g.players.forEach((op, oi) => {
    if (oi === pIdx) return;
    op.tokens.forEach((pos, t) => { if (absCell(op.color, pos) === abs) hits.push({ player: oi, token: t }); });
  });
  return hits;
}

/**
 * Apply a move in place. Returns what happened so the presentation layer can react.
 */
export function applyMove(g, pIdx, move, roll) {
  const p = g.players[pIdx];
  const captured = capturesAt(g, pIdx, move.to);
  p.tokens[move.token] = move.to;
  captured.forEach(({ player, token }) => { g.players[player].tokens[token] = YARD; });
  if (captured.length) g.captures[pIdx] += captured.length;
  const reachedHome = move.to === HOME;
  const won = p.tokens.every((x) => x === HOME);
  if (won && g.winner === null) g.winner = pIdx;
  const extraTurn = !won && (roll === 6 || captured.length > 0 || reachedHome);
  return { captured, reachedHome, won, extraTurn };
}

export function nextPlayer(g) {
  return (g.turn + 1) % g.players.length;
}

/* ---------- Analysis helpers (used by AI, tension, results) ---------- */

export const tokensHome = (p) => p.tokens.filter((x) => x === HOME).length;
export const tokensOut = (p) => p.tokens.filter((x) => x >= 0 && x < HOME).length;

/** Total pips still needed to finish (yard tokens count as 57). */
export function remainingPips(p) {
  return p.tokens.reduce((s, x) => s + (x === YARD ? HOME + 1 : HOME - x), 0);
}

/** Opponents that could capture the token at relative `pos` with a single roll (1..6). */
export function threatsTo(g, pIdx, pos) {
  const color = g.players[pIdx].color;
  const abs = absCell(color, pos);
  if (abs === null || isSafeAbs(abs)) return [];
  const out = [];
  g.players.forEach((op, oi) => {
    if (oi === pIdx) return;
    op.tokens.forEach((opos, t) => {
      const oabs = absCell(op.color, opos);
      if (oabs === null) return;
      const d = (abs - oabs + 52) % 52;
      if (d >= 1 && d <= 6 && opos + d <= LAST_TRACK) out.push({ player: oi, token: t, distance: d });
    });
  });
  return out;
}

export function isInDanger(g, pIdx, tokenIdx) {
  const pos = g.players[pIdx].tokens[tokenIdx];
  return threatsTo(g, pIdx, pos).length > 0;
}
