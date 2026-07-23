import { createRound, markReady, selectCard } from '../game/round.js';
import { PHASES } from '../game/constants.js';

/**
 * Seed injection is allowed only in local development or automated browsers
 * (Playwright sets navigator.webdriver). Production users cannot predict the
 * target from `?seed=`.
 * @param {{
 *   dev?: boolean,
 *   webdriver?: boolean,
 *   allowFlag?: boolean
 * }} [env]
 * @returns {boolean}
 */
export function isTestSeedAllowed(env = {}) {
	const dev = env.dev ?? (typeof import.meta !== 'undefined' && import.meta.env?.DEV === true);
	const allowFlag =
		env.allowFlag ??
		(typeof import.meta !== 'undefined' && import.meta.env?.VITE_ALLOW_TEST_SEED === 'true');
	const webdriver =
		env.webdriver ?? (typeof navigator !== 'undefined' && navigator.webdriver === true);
	return Boolean(dev || allowFlag || webdriver);
}

/**
 * Parse optional deterministic seed from the URL for tests.
 * @param {string} [search]
 * @param {{ allowSeed?: boolean }} [options]
 * @returns {number | null}
 */
export function readSeedFromSearch(search = '', options = {}) {
	const allowSeed = options.allowSeed ?? isTestSeedAllowed();
	if (!allowSeed) return null;

	const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
	const raw = params.get('seed');
	if (raw === null || raw === '') return null;
	const seed = Number(raw);
	return Number.isFinite(seed) ? seed >>> 0 : null;
}

/**
 * @param {{
 *   seed?: number | null,
 *   reducedMotion?: boolean,
 *   dealDelayMs?: number
 * }} [options]
 */
export function createGameSession(options = {}) {
	let seed = options.seed ?? null;
	let reducedMotion = options.reducedMotion ?? false;
	let dealDelayMs = options.dealDelayMs ?? (reducedMotion ? 0 : 420);

	/** @type {import('../game/round.js').Round} */
	let round = createRound({ seed });
	/** @type {ReturnType<typeof setTimeout> | null} */
	let dealTimer = null;
	/** @type {Set<() => void>} */
	const listeners = new Set();

	function notify() {
		for (const listener of listeners) listener();
	}

	function clearDealTimer() {
		if (dealTimer !== null) {
			clearTimeout(dealTimer);
			dealTimer = null;
		}
	}

	function scheduleReady() {
		clearDealTimer();
		if (dealDelayMs <= 0) {
			round = markReady(round);
			notify();
			return;
		}
		dealTimer = setTimeout(() => {
			dealTimer = null;
			if (round.phase === PHASES.DEALING) {
				round = markReady(round);
				notify();
			}
		}, dealDelayMs);
	}

	scheduleReady();

	return {
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		getRound() {
			return round;
		},
		getSeed() {
			return seed;
		},
		isInputLocked() {
			return round.phase !== PHASES.READY;
		},
		/**
		 * @param {string} cardId
		 */
		choose(cardId) {
			const next = selectCard(round, cardId);
			if (next === round) return round;
			round = next;
			notify();
			return round;
		},
		/**
		 * @param {{ seed?: number | null }} [nextOptions]
		 */
		newRound(nextOptions = {}) {
			if (nextOptions.seed !== undefined) {
				seed = nextOptions.seed;
			}
			round = createRound({ seed });
			notify();
			scheduleReady();
			return round;
		},
		/**
		 * @param {boolean} value
		 */
		setReducedMotion(value) {
			reducedMotion = value;
			dealDelayMs = value ? 0 : 420;
		},
		destroy() {
			clearDealTimer();
			listeners.clear();
		}
	};
}
