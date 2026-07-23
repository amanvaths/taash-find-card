import { PHASES } from './constants.js';

/** @type {Record<string, string[]>} */
const TRANSITIONS = {
	[PHASES.IDLE]: [PHASES.DEALING],
	[PHASES.DEALING]: [PHASES.READY],
	[PHASES.READY]: [PHASES.RESOLVING],
	[PHASES.RESOLVING]: [PHASES.WON, PHASES.LOST],
	[PHASES.WON]: [PHASES.DEALING],
	[PHASES.LOST]: [PHASES.DEALING]
};

/**
 * @param {import('./constants.js').Phase} from
 * @param {import('./constants.js').Phase} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
	const allowed = TRANSITIONS[from] ?? [];
	return allowed.includes(to);
}

/**
 * @param {import('./constants.js').Phase} from
 * @param {import('./constants.js').Phase} to
 * @returns {import('./constants.js').Phase}
 */
export function assertTransition(from, to) {
	if (!canTransition(from, to)) {
		throw new Error(`Illegal phase transition: ${from} -> ${to}`);
	}
	return to;
}

/**
 * @param {import('./constants.js').Phase} phase
 * @returns {boolean}
 */
export function canSelectCard(phase) {
	return phase === PHASES.READY;
}

/**
 * @param {import('./constants.js').Phase} phase
 * @returns {boolean}
 */
export function isTerminalPhase(phase) {
	return phase === PHASES.WON || phase === PHASES.LOST;
}
