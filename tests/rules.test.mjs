// Run: node tests/rules.test.mjs
import assert from 'node:assert/strict';
import { createGame, legalMoves, applyMove, capturesAt, absCell, HOME, YARD, threatsTo, nextPlayer } from '../js/game/rules.js';
import { chooseMove } from '../js/game/ai.js';
import { fairDie } from '../js/core/rng.js';

let passed = 0;
const t = (name, fn) => { fn(); passed++; console.log('✓', name); };

t('needs a six to leave the yard', () => {
  const g = createGame(['blue', 'green']);
  assert.equal(legalMoves(g, 0, 5).length, 0);
  const m = legalMoves(g, 0, 6);
  assert.equal(m.length, 1);
  assert.deepEqual([m[0].from, m[0].to], [YARD, 0]);
});

t('exact roll required for home', () => {
  const g = createGame(['blue', 'green']);
  g.players[0].tokens = [53, HOME, HOME, HOME];
  assert.equal(legalMoves(g, 0, 4).length, 0);
  assert.equal(legalMoves(g, 0, 3)[0].to, HOME);
});

t('capture sends opponent home and grants extra turn', () => {
  const g = createGame(['blue', 'green']);
  // blue abs = 39 + pos ; green abs = 13 + pos. Put green on abs 45 (pos 32), blue at pos 3 (abs 42) -> roll 3.
  g.players[1].tokens[0] = 32;
  g.players[0].tokens[0] = 3;
  assert.equal(absCell('green', 32), 45);
  const res = applyMove(g, 0, { token: 0, from: 3, to: 6 }, 3);
  assert.equal(res.captured.length, 1);
  assert.equal(g.players[1].tokens[0], YARD);
  assert.equal(res.extraTurn, true);
});

t('no capture on safe cells', () => {
  const g = createGame(['blue', 'green']);
  g.players[1].tokens[0] = 34; // green abs 47 (star)
  g.players[0].tokens[0] = 5; // blue abs 44
  assert.equal(capturesAt(g, 0, 8).length, 0);
});

t('six grants extra turn, normal roll does not', () => {
  const g = createGame(['blue', 'green']);
  g.players[0].tokens[0] = 10;
  assert.equal(applyMove(g, 0, { token: 0, from: 10, to: 16 }, 6).extraTurn, true);
  assert.equal(applyMove(g, 0, { token: 0, from: 16, to: 18 }, 2).extraTurn, false);
});

t('threat detection', () => {
  const g = createGame(['blue', 'green']);
  g.players[0].tokens[0] = 5; // abs 44
  g.players[1].tokens[0] = 28; // abs 41, 3 behind
  assert.equal(threatsTo(g, 0, 5).length, 1);
});

t('fair die distribution', () => {
  const counts = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 60000; i++) counts[fairDie() - 1]++;
  counts.forEach((c) => assert.ok(Math.abs(c - 10000) < 500, `face count ${c}`));
});

t('bot-vs-bot games always finish (2P and 4P)', () => {
  const styles = [{ aggression: 1.4, safety: 0.6, progress: 1, risk: 0.9, noise: 0.2 }, { aggression: 0.6, safety: 1.4, progress: 1, risk: 0.2, noise: 0.5 }];
  for (const colors of [['blue', 'green'], ['red', 'green', 'yellow', 'blue']]) {
    for (let n = 0; n < 200; n++) {
      const g = createGame(colors);
      let guard = 0;
      while (g.winner === null && guard++ < 5000) {
        const roll = fairDie();
        if (roll === 6) g.sixesInRow++; else g.sixesInRow = 0;
        if (g.sixesInRow === 3) { g.sixesInRow = 0; g.turn = nextPlayer(g); continue; }
        const moves = legalMoves(g, g.turn, roll);
        if (!moves.length) { g.sixesInRow = 0; g.turn = nextPlayer(g); continue; }
        const m = chooseMove(g, g.turn, roll, moves, styles[g.turn % 2]);
        const r = applyMove(g, g.turn, m, roll);
        if (r.won) break;
        if (!r.extraTurn) { g.sixesInRow = 0; g.turn = nextPlayer(g); }
      }
      assert.notEqual(g.winner, null, 'game did not finish');
    }
  }
});

console.log(`\n${passed} passed`);
