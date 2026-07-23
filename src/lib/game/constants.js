/** @typedef {'spades' | 'hearts' | 'diamonds' | 'clubs'} Suit */
/** @typedef {'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'} Rank */
/** @typedef {'classic'} GameMode */
/** @typedef {'idle' | 'dealing' | 'ready' | 'resolving' | 'won' | 'lost'} Phase */
/** @typedef {'won' | 'lost'} Result */

export const SUITS = /** @type {const} */ (['spades', 'hearts', 'diamonds', 'clubs']);

export const RANKS = /** @type {const} */ ([
	'A',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'10',
	'J',
	'Q',
	'K'
]);

/** Only Classic is implemented and tested. */
export const MODES = /** @type {const} */ ({
	CLASSIC: 'classic'
});

export const PHASES = /** @type {const} */ ({
	IDLE: 'idle',
	DEALING: 'dealing',
	READY: 'ready',
	RESOLVING: 'resolving',
	WON: 'won',
	LOST: 'lost'
});

export const RESULTS = /** @type {const} */ ({
	WON: 'won',
	LOST: 'lost'
});

export const SUIT_LABELS = /** @type {const} */ ({
	spades: 'Spades',
	hearts: 'Hearts',
	diamonds: 'Diamonds',
	clubs: 'Clubs'
});

/** Gameplay board includes one wild joker alongside the target suit's 13 cards. */
export const JOKER_CARD_ID = 'joker';

/** Face-down board layout: 6 rows totaling 14 (13 suit + joker). */
export const BOARD_ROW_SIZES = /** @type {const} */ ([1, 3, 3, 3, 3, 1]);

export const RANK_LABELS = /** @type {const} */ ({
	A: 'Ace',
	2: '2',
	3: '3',
	4: '4',
	5: '5',
	6: '6',
	7: '7',
	8: '8',
	9: '9',
	10: '10',
	J: 'Jack',
	Q: 'Queen',
	K: 'King'
});
