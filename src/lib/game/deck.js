import { allCardIds, parseCardId } from './cards.js';
import { RANKS, SUITS } from './constants.js';

/**
 * @returns {string[]}
 */
export function createDeck() {
	return allCardIds();
}

/**
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
			const { suit, rank } = parseCardId(id);
			bySuit[suit] += 1;
			if (!RANKS.includes(rank)) {
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
