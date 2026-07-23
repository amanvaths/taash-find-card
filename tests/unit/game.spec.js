import { afterEach, describe, expect, it, vi } from 'vitest';
import { allCardIds, cardId, cardLabel, parseCardId } from '../../src/lib/game/cards.js';
import { PHASES, RANKS, RESULTS, SUITS } from '../../src/lib/game/constants.js';
import { createDeck, validateDeck } from '../../src/lib/game/deck.js';
import { createSeededRandomInt, secureShuffle, seededShuffle } from '../../src/lib/game/random.js';
import { createRound, markReady, selectCard, startNewRound } from '../../src/lib/game/round.js';
import {
	assertTransition,
	canSelectCard,
	canTransition,
	isTerminalPhase
} from '../../src/lib/game/state-machine.js';
import { isTestSeedAllowed, readSeedFromSearch } from '../../src/lib/stores/game-session.js';
import { createAudioManager } from '../../src/lib/audio/audio-manager.js';

describe('deck', () => {
	it('U01: deck count is 52', () => {
		expect(createDeck()).toHaveLength(52);
	});

	it('U02: deck IDs are unique', () => {
		const deck = createDeck();
		expect(new Set(deck).size).toBe(52);
		expect(validateDeck(deck).ok).toBe(true);
	});

	it('U03: four suits each contain 13 cards', () => {
		const deck = createDeck();
		for (const suit of SUITS) {
			expect(deck.filter((id) => id.startsWith(`${suit}-`))).toHaveLength(13);
		}
	});

	it('U04: all expected ranks exist in every suit', () => {
		const deck = createDeck();
		for (const suit of SUITS) {
			for (const rank of RANKS) {
				expect(deck).toContain(cardId(suit, rank));
			}
		}
		expect(allCardIds()).toHaveLength(52);
	});
});

describe('cards', () => {
	it('parses and labels card ids', () => {
		expect(parseCardId('spades-A')).toEqual({ suit: 'spades', rank: 'A' });
		expect(cardLabel('hearts-10')).toBe('10 of Hearts');
		expect(cardLabel('diamonds-Q')).toBe('Queen of Diamonds');
		expect(cardLabel('clubs-K')).toBe('King of Clubs');
	});
});

describe('random', () => {
	it('U05: secure shuffle returns a permutation', () => {
		const input = createDeck();
		const shuffled = secureShuffle(input);
		expect(shuffled).toHaveLength(52);
		expect(new Set(shuffled).size).toBe(52);
		expect([...shuffled].sort()).toEqual([...input].sort());
	});

	it('U06: deterministic seed repeats exactly', () => {
		const input = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
		expect(seededShuffle(input, 42)).toEqual(seededShuffle(input, 42));
		const ints = createSeededRandomInt(7);
		expect([ints(10), ints(10), ints(10)]).toEqual(
			(() => {
				const again = createSeededRandomInt(7);
				return [again(10), again(10), again(10)];
			})()
		);
	});

	it('U07: different seeds produce different output in fixture', () => {
		const input = createDeck();
		expect(seededShuffle(input, 42)).not.toEqual(seededShuffle(input, 99));
	});
});

describe('round', () => {
	it('U08: target exists exactly once in gameplay deck', () => {
		const round = createRound({ seed: 12345, now: 1 });
		const flat = round.groups.flatMap((g) => g.cardIds);
		expect(validateDeck(flat, round.targetCardId).ok).toBe(true);
		expect(flat.filter((id) => id === round.targetCardId)).toHaveLength(1);
	});

	it('same seed produces same target and layout', () => {
		const a = createRound({ seed: 777, now: 1, roundId: 'r1' });
		const b = createRound({ seed: 777, now: 1, roundId: 'r1' });
		expect(a.targetCardId).toBe(b.targetCardId);
		expect(a.groups).toEqual(b.groups);
	});

	it('U09: correct selection returns won', () => {
		let round = markReady(createRound({ seed: 10, now: 1 }));
		round = selectCard(round, round.targetCardId, { now: 2 });
		expect(round.result).toBe(RESULTS.WON);
		expect(round.phase).toBe(PHASES.WON);
	});

	it('U10: incorrect selection returns lost', () => {
		let round = markReady(createRound({ seed: 10, now: 1 }));
		const wrong = round.groups.flatMap((g) => g.cardIds).find((id) => id !== round.targetCardId);
		round = selectCard(round, /** @type {string} */ (wrong), { now: 2 });
		expect(round.result).toBe(RESULTS.LOST);
		expect(round.correctCardId).toBe(round.targetCardId);
	});

	it('U11: same rank wrong suit loses', () => {
		let round = markReady(createRound({ seed: 10, now: 1 }));
		const { suit, rank } = parseCardId(round.targetCardId);
		const otherSuit = SUITS.find((s) => s !== suit);
		const wrong = cardId(
			/** @type {import('../../src/lib/game/constants.js').Suit} */ (otherSuit),
			rank
		);
		expect(wrong).not.toBe(round.targetCardId);
		round = selectCard(round, wrong, { now: 2 });
		expect(round.result).toBe(RESULTS.LOST);
	});

	it('U12: same suit wrong rank loses', () => {
		let round = markReady(createRound({ seed: 10, now: 1 }));
		const { suit, rank } = parseCardId(round.targetCardId);
		const otherRank = RANKS.find((r) => r !== rank);
		const wrong = cardId(
			suit,
			/** @type {import('../../src/lib/game/constants.js').Rank} */ (otherRank)
		);
		round = selectCard(round, wrong, { now: 2 });
		expect(round.result).toBe(RESULTS.LOST);
	});

	it('U13: repeated selection is ignored', () => {
		let round = markReady(createRound({ seed: 10, now: 1 }));
		const first = round.targetCardId;
		const second = round.groups.flatMap((g) => g.cardIds).find((id) => id !== first);
		round = selectCard(round, first, { now: 2 });
		const after = selectCard(round, /** @type {string} */ (second), { now: 3 });
		expect(after).toEqual(round);
		expect(after.selectedCardId).toBe(first);
	});

	it('U14: unknown card id is rejected', () => {
		const round = markReady(createRound({ seed: 10, now: 1 }));
		expect(() => selectCard(round, 'not-a-card')).toThrow(/Invalid card id/);
	});

	it('U15: new round clears old result to a clean dealing state', () => {
		let round = markReady(createRound({ seed: 10, now: 1 }));
		round = selectCard(round, round.targetCardId, { now: 2 });
		const next = startNewRound(round, { seed: 11, now: 3, roundId: 'fresh' });
		expect(next.roundId).toBe('fresh');
		expect(next.result).toBeNull();
		expect(next.selectedCardId).toBeNull();
		expect(next.correctCardId).toBeNull();
		expect(next.phase).toBe(PHASES.DEALING);
		expect(markReady(next).phase).toBe(PHASES.READY);
	});

	it('rejects unsupported modes', () => {
		expect(() => createRound({ mode: /** @type {any} */ ('hard'), seed: 1, now: 1 })).toThrow(
			/Unsupported mode/
		);
	});
});

describe('state-machine', () => {
	it('U16: every legal state transition passes', () => {
		expect(canTransition(PHASES.IDLE, PHASES.DEALING)).toBe(true);
		expect(canTransition(PHASES.DEALING, PHASES.READY)).toBe(true);
		expect(canTransition(PHASES.READY, PHASES.RESOLVING)).toBe(true);
		expect(canTransition(PHASES.RESOLVING, PHASES.WON)).toBe(true);
		expect(canTransition(PHASES.RESOLVING, PHASES.LOST)).toBe(true);
		expect(canTransition(PHASES.WON, PHASES.DEALING)).toBe(true);
		expect(canTransition(PHASES.LOST, PHASES.DEALING)).toBe(true);
		expect(assertTransition(PHASES.DEALING, PHASES.READY)).toBe(PHASES.READY);
		expect(canSelectCard(PHASES.READY)).toBe(true);
		expect(isTerminalPhase(PHASES.WON)).toBe(true);
	});

	it('illegal transitions fail closed', () => {
		expect(canTransition(PHASES.READY, PHASES.WON)).toBe(false);
		expect(canTransition(PHASES.IDLE, PHASES.READY)).toBe(false);
		expect(canSelectCard(PHASES.DEALING)).toBe(false);
		expect(() => assertTransition(PHASES.READY, PHASES.WON)).toThrow(/Illegal phase/);
	});
});

describe('seed gating', () => {
	it('allows seed parsing when explicitly permitted', () => {
		expect(readSeedFromSearch('?seed=42', { allowSeed: true })).toBe(42);
	});

	it('blocks seed parsing for production users', () => {
		expect(readSeedFromSearch('?seed=42', { allowSeed: false })).toBeNull();
		expect(isTestSeedAllowed({ dev: false, webdriver: false, allowFlag: false })).toBe(false);
	});

	it('allows seed in automated/test environments', () => {
		expect(isTestSeedAllowed({ dev: true, webdriver: false, allowFlag: false })).toBe(true);
		expect(isTestSeedAllowed({ dev: false, webdriver: true, allowFlag: false })).toBe(true);
	});
});

describe('audio manager', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('does not start until ensureStarted after gesture path', () => {
		const audio = createAudioManager();
		expect(audio.isStarted()).toBe(false);
		audio.playDeal();
		expect(audio.getActiveNodeCount()).toBe(0);
		audio.dispose();
	});

	it('mute prevents tones and dispose clears pending work', async () => {
		class FakeOsc {
			constructor() {
				this.onended = null;
			}
			connect() {}
			disconnect() {}
			start() {}
			stop() {
				this.onended?.();
			}
			frequency = { setValueAtTime() {} };
		}
		class FakeGain {
			connect() {}
			disconnect() {}
			gain = {
				setValueAtTime() {},
				exponentialRampToValueAtTime() {}
			};
		}
		class FakeCtx {
			state = 'running';
			currentTime = 0;
			destination = {};
			createOscillator() {
				return new FakeOsc();
			}
			createGain() {
				return new FakeGain();
			}
			resume = async () => {
				this.state = 'running';
			};
			close = async () => {};
		}

		vi.stubGlobal('window', {
			AudioContext: FakeCtx,
			webkitAudioContext: FakeCtx
		});
		vi.stubGlobal('AudioContext', FakeCtx);
		vi.stubGlobal('localStorage', {
			getItem: () => null,
			setItem: () => {}
		});

		const audio = createAudioManager();
		await audio.ensureStarted();
		expect(audio.isStarted()).toBe(true);
		audio.setMuted(true);
		audio.playWin();
		expect(audio.getActiveNodeCount()).toBe(0);
		audio.setMuted(false);
		audio.playWin();
		expect(audio.getPendingTimerCount()).toBeGreaterThan(0);
		audio.dispose();
		expect(audio.getPendingTimerCount()).toBe(0);
		expect(audio.getActiveNodeCount()).toBe(0);
		expect(audio.isStarted()).toBe(false);
	});
});
