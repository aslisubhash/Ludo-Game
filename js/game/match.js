// Turn controller. Owns the game loop and calls presentation hooks; the presentation
// never touches the rules or the dice. `busy` is true while dice roll or tokens move,
// and the ads layer refuses to show anything while it is set.
import { createGame, legalMoves, applyMove, nextPlayer } from './rules.js';
import { chooseMove } from './ai.js';
import { isFinalStage } from './tension.js';
import { fairDie } from '../core/rng.js';
import { wait } from '../core/ui.js';
import { ARCHETYPES } from '../content/personalities.js';

export class Match {
  /**
   * seats: [{ kind: 'me'|'bot'|'local', color, char?, name }]
   * hooks: { awaitRoll(i), awaitPick(i, moves), dice(i), view, onEvent(type, data), offerSecondChance(i), onTurn(i) }
   */
  constructor(seats, hooks, { startTurn = 0, secondChance = true } = {}) {
    this.seats = seats;
    this.hooks = hooks;
    this.g = createGame(seats.map((s) => s.color));
    this.g.turn = startTurn;
    this.busy = false;
    this.aborted = false;
    this.paused = false;
    this._resume = null;
    this.secondChanceAvailable = secondChance;
    this.secondChanceUsed = false;
    this.stats = { sixes: seats.map(() => 0), captures: seats.map(() => 0), turns: 0, started: Date.now() };
  }

  abort() { this.aborted = true; this.resume(); }
  pause() { this.paused = true; }
  resume() { this.paused = false; this._resume?.(); this._resume = null; }
  async gate() {
    if (this.paused) await new Promise((r) => { this._resume = r; });
    if (this.aborted) throw new Error('aborted');
  }

  async run() {
    try {
      while (this.g.winner === null) {
        await this.gate();
        await this.turn(this.g.turn);
      }
      this.hooks.onEvent('end', { winner: this.g.winner });
      return this.g.winner;
    } catch (e) {
      if (e.message !== 'aborted') throw e;
      return null;
    }
  }

  async turn(i) {
    const seat = this.seats[i];
    const g = this.g;
    this.stats.turns++;
    this.hooks.onTurn(i);

    if (seat.kind === 'bot') {
      const a = ARCHETYPES[seat.char.archetype];
      await wait(a.think[0] + Math.random() * (a.think[1] - a.think[0]));
    } else {
      await this.hooks.awaitRoll(i);
    }
    await this.gate();

    let roll = fairDie();
    this.busy = true;
    await this.hooks.dice(i).roll(roll);
    this.busy = false;
    await this.gate();
    this.hooks.onEvent('roll', { player: i, roll });

    if (roll === 6) {
      g.sixesInRow++;
      this.stats.sixes[i]++;
      if (g.sixesInRow === 3) {
        this.hooks.onEvent('triple-six', { player: i });
        g.sixesInRow = 0;
        await wait(700);
        return this.pass();
      }
    }

    let moves = legalMoves(g, i, roll);
    if (!moves.length) {
      // Published second-chance rule: once per match, in the final stage, a roll with no
      // legal move can be retried by watching an ad. Same rule for every human seat.
      if (seat.kind === 'me' && this.secondChanceAvailable && !this.secondChanceUsed && isFinalStage(g)) {
        this.hooks.onEvent('no-move', { player: i, roll, offer: true });
        const accepted = await this.hooks.offerSecondChance(i, roll);
        await this.gate();
        if (accepted) {
          this.secondChanceUsed = true;
          this.hooks.onEvent('second-chance', { player: i });
          await this.hooks.awaitRoll(i);
          roll = fairDie();
          this.busy = true;
          await this.hooks.dice(i).roll(roll);
          this.busy = false;
          this.hooks.onEvent('roll', { player: i, roll, extra: true });
          moves = legalMoves(g, i, roll);
        }
      } else {
        this.hooks.onEvent('no-move', { player: i, roll });
      }
      if (!moves.length) {
        await wait(seat.kind === 'bot' ? 450 : 750);
        return this.pass();
      }
    }

    let move;
    if (seat.kind === 'bot') {
      const a = ARCHETYPES[seat.char.archetype];
      move = chooseMove(g, i, roll, moves, a.style);
      await wait(260);
    } else if (moves.length === 1) {
      move = moves[0];
      await wait(180);
    } else {
      move = await this.hooks.awaitPick(i, moves);
    }
    await this.gate();

    this.busy = true;
    const color = g.players[i].color;
    await this.hooks.view.animateMove(i, move.token, move.from, move.to, color);
    const res = applyMove(g, i, move, roll);
    if (res.captured.length) {
      this.stats.captures[i] += res.captured.length;
      await this.hooks.view.animateCapture(res.captured);
    }
    this.hooks.view.layoutAll();
    this.busy = false;
    this.hooks.onEvent('moved', { player: i, move, roll, ...res });

    if (res.won) return;
    if (res.extraTurn) {
      if (roll !== 6) g.sixesInRow = 0;
      this.hooks.onEvent('extra-turn', { player: i, reason: res.captured.length ? 'capture' : res.reachedHome ? 'home' : 'six' });
      return;
    }
    return this.pass();
  }

  pass() {
    this.g.sixesInRow = 0;
    this.g.turn = nextPlayer(this.g);
  }
}
