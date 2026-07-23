import { isJoker, parseCardId } from './cards.js';
import { JOKER_CARD_ID, MODES, PHASES, RESULTS, SUITS } from './constants.js';
import { createDeck, validateDeck, validatePlayBoard } from './deck.js';
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
 * Classic board: only the hint/target suit's 13 cards + one joker (14 total).
 * @param {string[]} deck
 * @param {string} targetCardId
 * @param {number | null | undefined} seed
 * @returns {SuitGroup[]}
 */
function buildTargetSuitBoard(deck, targetCardId, seed) {
	const { suit } = parseCardId(targetCardId);
	if (isJoker(targetCardId) || suit === 'joker') {
		throw new Error('Target cannot be the joker');
	}

	const suitCards = deck.filter((id) => {
		const parsed = parseCardId(id);
		return !isJoker(id) && parsed.suit === suit;
	});

	if (suitCards.length !== 13) {
		throw new Error(`Expected 13 ${suit} cards, got ${suitCards.length}`);
	}

	const boardSeed = seed === null || seed === undefined ? null : seed + SUITS.indexOf(suit) + 1;
	return [
		{
			suit,
			cardIds: shuffleFor([...suitCards, JOKER_CARD_ID], boardSeed)
		}
	];
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
	const deckValidation = validateDeck(deck);
	if (!deckValidation.ok) {
		throw new Error(`Invalid source deck: ${deckValidation.errors.join('; ')}`);
	}

	const targetIndex = randomInt(deck.length);
	const targetCardId = deck[targetIndex];
	const groups = buildTargetSuitBoard(deck, targetCardId, seed);

	const flat = groups.flatMap((group) => group.cardIds);
	const validation = validatePlayBoard(flat, targetCardId);
	if (!validation.ok) {
		throw new Error(`Invalid play board: ${validation.errors.join('; ')}`);
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
	// Joker is never the target — tapping it always loses.
	const won = !isJoker(cardId) && cardId === round.targetCardId;

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
