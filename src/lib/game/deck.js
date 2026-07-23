import { allCardIds, isJoker, parseCardId } from './cards.js';
import { JOKER_CARD_ID, RANKS, SUITS } from './constants.js';

/**
 * @returns {string[]}
 */
export function createDeck() {
	return allCardIds();
}

/**
 * Full 52-card source deck (no joker). Target is always drawn from this.
 * @param {string[]} cardIds
 * @param {string} [targetCardId]
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
export function validateDeck(cardIds, targetCardId) {
	/** @type {string[]} */
	const errors = [];

	if (!Array.isArray(cardIds)) {
		return { ok: false, errors: ['Deck must be an array'] };
	}

	if (cardIds.length !== 52) {
		errors.push(`Expected 52 cards, got ${cardIds.length}`);
	}

	const unique = new Set(cardIds);
	if (unique.size !== cardIds.length) {
		errors.push('Deck contains duplicate card ids');
	}

	/** @type {Record<string, number>} */
	const bySuit = Object.fromEntries(SUITS.map((suit) => [suit, 0]));

	for (const id of cardIds) {
		try {
			const parsed = parseCardId(id);
			if (isJoker(id) || parsed.suit === 'joker') {
				errors.push('Full deck must not include the joker');
				continue;
			}
			bySuit[parsed.suit] += 1;
			if (!RANKS.includes(parsed.rank)) {
				errors.push(`Unexpected rank in ${id}`);
			}
		} catch {
			errors.push(`Invalid card id: ${id}`);
		}
	}

	for (const suit of SUITS) {
		if (bySuit[suit] !== 13) {
			errors.push(`Suit ${suit} has ${bySuit[suit]} cards, expected 13`);
		}
	}

	if (SUITS.length !== 4) {
		errors.push('Expected exactly four suits');
	}

	if (targetCardId !== undefined) {
		const matches = cardIds.filter((id) => id === targetCardId);
		if (matches.length !== 1) {
			errors.push(`Target ${targetCardId} appears ${matches.length} times, expected 1`);
		}
	}

	return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

/**
 * Play board: exactly the target suit's 13 cards + one joker (14 total).
 * @param {string[]} cardIds
 * @param {string} targetCardId
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
export function validatePlayBoard(cardIds, targetCardId) {
	/** @type {string[]} */
	const errors = [];

	if (!Array.isArray(cardIds)) {
		return { ok: false, errors: ['Play board must be an array'] };
	}

	if (cardIds.length !== 14) {
		errors.push(`Expected 14 board cards (13 + joker), got ${cardIds.length}`);
	}

	const unique = new Set(cardIds);
	if (unique.size !== cardIds.length) {
		errors.push('Play board contains duplicate card ids');
	}

	let targetSuit;
	try {
		const parsed = parseCardId(targetCardId);
		if (isJoker(targetCardId) || parsed.suit === 'joker') {
			return { ok: false, errors: ['Target cannot be the joker'] };
		}
		targetSuit = parsed.suit;
	} catch {
		return { ok: false, errors: [`Invalid target card id: ${targetCardId}`] };
	}

	const jokers = cardIds.filter((id) => isJoker(id));
	if (jokers.length !== 1) {
		errors.push(`Expected exactly 1 joker, got ${jokers.length}`);
	}

	const suitCards = cardIds.filter((id) => !isJoker(id));
	if (suitCards.length !== 13) {
		errors.push(`Expected 13 suit cards, got ${suitCards.length}`);
	}

	for (const id of suitCards) {
		try {
			const { suit, rank } = parseCardId(id);
			if (suit !== targetSuit) {
				errors.push(`Board card ${id} is not target suit ${targetSuit}`);
			}
			if (!RANKS.includes(rank)) {
				errors.push(`Unexpected rank in ${id}`);
			}
		} catch {
			errors.push(`Invalid card id: ${id}`);
		}
	}

	for (const rank of RANKS) {
		const id = `${targetSuit}-${rank}`;
		if (!suitCards.includes(id)) {
			errors.push(`Missing ${id} on play board`);
		}
	}

	if (!cardIds.includes(targetCardId)) {
		errors.push(`Target ${targetCardId} missing from play board`);
	}

	if (!cardIds.includes(JOKER_CARD_ID) && jokers.length === 0) {
		errors.push('Joker missing from play board');
	}

	return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
