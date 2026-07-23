import { parseCardId } from './cards.js';
import { MODES, PHASES, RESULTS, SUITS } from './constants.js';
import { createDeck, validateDeck } from './deck.js';
import { createSeededRandomInt, secureRandomInt, seededShuffle, secureShuffle } from './random.js';
import { assertTransition, canSelectCard } from './state-machine.js';

/**
 * @typedef {{
 *   suit: import('./constants.js').Suit,
 *   cardIds: string[]
 * }} SuitGroup
 *
 * @typedef {{
 *   roundId: string,
 *   seed: number | null,
 *   mode: import('./constants.js').GameMode,
 *   phase: import('./constants.js').Phase,
 *   targetCardId: string,
 *   groups: SuitGroup[],
 *   selectedCardId: string | null,
 *   result: import('./constants.js').Result | null,
 *   correctCardId: string | null,
 *   startedAt: number,
 *   resolvedAt: number | null
 * }} Round
 *
 * @typedef {{
 *   mode?: import('./constants.js').GameMode,
 *   seed?: number | null,
 *   now?: number,
 *   roundId?: string
 * }} CreateRoundOptions
 */

let roundCounter = 0;

/**
 * @param {number | null | undefined} seed
 * @returns {(maxExclusive: number) => number}
 */
function randomIntFor(seed) {
	if (seed === null || seed === undefined) {
		return secureRandomInt;
	}
	return createSeededRandomInt(seed);
}

/**
 * @template T
 * @param {T[]} items
 * @param {number | null | undefined} seed
 * @returns {T[]}
 */
function shuffleFor(items, seed) {
	if (seed === null || seed === undefined) {
		return secureShuffle(items);
	}
	return seededShuffle(items, seed);
}

/**
 * Classic mode: shuffle 13 ranks independently inside each suit.
 * @param {string[]} deck
 * @param {number | null | undefined} seed
 * @returns {SuitGroup[]}
 */
function buildClassicGroups(deck, seed) {
	/** @type {Record<string, string[]>} */
	const bySuit = Object.fromEntries(SUITS.map((suit) => [suit, []]));

	for (const id of deck) {
		const { suit } = parseCardId(id);
		bySuit[suit].push(id);
	}

	return SUITS.map((suit, index) => {
		const suitSeed = seed === null || seed === undefined ? null : seed + index + 1;
		return {
			suit,
			cardIds: shuffleFor(bySuit[suit], suitSeed)
		};
	});
}

/**
 * @param {CreateRoundOptions} [options]
 * @returns {Round}
 */
export function createRound(options = {}) {
	const mode = options.mode ?? MODES.CLASSIC;
	if (mode !== MODES.CLASSIC) {
		throw new Error(`Unsupported mode: ${mode}. Only classic is implemented.`);
	}

	const seed = options.seed ?? null;
	const now = options.now ?? Date.now();
	const randomInt = randomIntFor(seed);

	const deck = createDeck();
	const targetIndex = randomInt(deck.length);
	const targetCardId = deck[targetIndex];
	const groups = buildClassicGroups(deck, seed);

	const flat = groups.flatMap((group) => group.cardIds);
	const validation = validateDeck(flat, targetCardId);
	if (!validation.ok) {
		throw new Error(`Invalid round deck: ${validation.errors.join('; ')}`);
	}

	roundCounter += 1;
	const roundId =
		options.roundId ?? `round-${now}-${roundCounter}-${seed === null ? 'r' : seed}-${targetCardId}`;

	return {
		roundId,
		seed,
		mode,
		phase: PHASES.DEALING,
		targetCardId,
		groups,
		selectedCardId: null,
		result: null,
		correctCardId: null,
		startedAt: now,
		resolvedAt: null
	};
}

/**
 * @param {Round} round
 * @returns {Round}
 */
export function markReady(round) {
	return {
		...round,
		phase: assertTransition(round.phase, PHASES.READY)
	};
}

/**
 * @param {Round} round
 * @param {string} cardId
 * @param {{ now?: number }} [options]
 * @returns {Round}
 */
export function selectCard(round, cardId, options = {}) {
	if (!canSelectCard(round.phase)) {
		return round;
	}

	const flat = round.groups.flatMap((group) => group.cardIds);
	if (!flat.includes(cardId)) {
		throw new Error(`Invalid card id for this round: ${cardId}`);
	}

	const now = options.now ?? Date.now();
	const won = cardId === round.targetCardId;

	/** @type {Round} */
	let next = {
		...round,
		phase: assertTransition(round.phase, PHASES.RESOLVING),
		selectedCardId: cardId,
		correctCardId: round.targetCardId
	};

	const resultPhase = won ? PHASES.WON : PHASES.LOST;
	next = {
		...next,
		phase: assertTransition(next.phase, resultPhase),
		result: won ? RESULTS.WON : RESULTS.LOST,
		resolvedAt: now
	};

	return next;
}

/**
 * @param {Round} round
 * @param {CreateRoundOptions} [options]
 * @returns {Round}
 */
export function startNewRound(_round, options = {}) {
	return createRound({
		mode: options.mode ?? MODES.CLASSIC,
		seed: options.seed === undefined ? null : options.seed,
		now: options.now,
		roundId: options.roundId
	});
}

/**
 * @param {Round} round
 * @returns {string[]}
 */
export function allRoundCardIds(round) {
	return round.groups.flatMap((group) => group.cardIds);
}
