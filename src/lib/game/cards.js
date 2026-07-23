import { RANKS, RANK_LABELS, SUITS, SUIT_LABELS } from './constants.js';

/**
 * @param {import('./constants.js').Suit} suit
 * @param {import('./constants.js').Rank} rank
 * @returns {string}
 */
export function cardId(suit, rank) {
	return `${suit}-${rank}`;
}

/**
 * @param {string} id
 * @returns {{ suit: import('./constants.js').Suit, rank: import('./constants.js').Rank }}
 */
export function parseCardId(id) {
	const separator = id.lastIndexOf('-');
	if (separator <= 0) {
		throw new Error(`Invalid card id: ${id}`);
	}

	const suit = /** @type {import('./constants.js').Suit} */ (id.slice(0, separator));
	const rank = /** @type {import('./constants.js').Rank} */ (id.slice(separator + 1));

	if (!SUITS.includes(suit) || !RANKS.includes(rank)) {
		throw new Error(`Invalid card id: ${id}`);
	}

	return { suit, rank };
}

/**
 * @param {string} id
 * @returns {string}
 */
export function cardLabel(id) {
	const { suit, rank } = parseCardId(id);
	return `${RANK_LABELS[rank]} of ${SUIT_LABELS[suit]}`;
}

/**
 * @param {import('./constants.js').Suit} suit
 * @returns {boolean}
 */
export function isRedSuit(suit) {
	return suit === 'hearts' || suit === 'diamonds';
}

/**
 * @param {import('./constants.js').Suit} suit
 * @returns {string}
 */
export function suitSymbol(suit) {
	switch (suit) {
		case 'spades':
			return '♠';
		case 'hearts':
			return '♥';
		case 'diamonds':
			return '♦';
		case 'clubs':
			return '♣';
		default:
			return '';
	}
}

/**
 * @returns {string[]}
 */
export function allCardIds() {
	/** @type {string[]} */
	const ids = [];
	for (const suit of SUITS) {
		for (const rank of RANKS) {
			ids.push(cardId(suit, rank));
		}
	}
	return ids;
}
