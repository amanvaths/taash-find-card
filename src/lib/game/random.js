/**
 * Unbiased Fisher–Yates shuffle using a provided random integer source.
 * @template T
 * @param {T[]} items
 * @param {(maxExclusive: number) => number} randomInt
 * @returns {T[]}
 */
export function shuffleWith(items, randomInt) {
	const result = items.slice();
	for (let i = result.length - 1; i > 0; i -= 1) {
		const j = randomInt(i + 1);
		const tmp = result[i];
		result[i] = result[j];
		result[j] = tmp;
	}
	return result;
}

/**
 * Production secure random integer in [0, maxExclusive).
 * Uses crypto.getRandomValues — never Math.random().
 * @param {number} maxExclusive
 * @returns {number}
 */
export function secureRandomInt(maxExclusive) {
	if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
		throw new Error('maxExclusive must be a positive integer');
	}

	if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
		throw new Error('crypto.getRandomValues is unavailable');
	}

	// Rejection sampling avoids modulo bias.
	const limit = 0x100000000;
	const threshold = limit - (limit % maxExclusive);
	const buffer = new Uint32Array(1);

	for (;;) {
		crypto.getRandomValues(buffer);
		const value = buffer[0];
		if (value < threshold) {
			return value % maxExclusive;
		}
	}
}

/**
 * @template T
 * @param {T[]} items
 * @returns {T[]}
 */
export function secureShuffle(items) {
	return shuffleWith(items, secureRandomInt);
}

/**
 * Deterministic mulberry32 PRNG for tests.
 * @param {number} seed
 * @returns {() => number} floats in [0, 1)
 */
export function createSeededRng(seed) {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * @param {number} seed
 * @returns {(maxExclusive: number) => number}
 */
export function createSeededRandomInt(seed) {
	const next = createSeededRng(seed);
	return (maxExclusive) => {
		if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
			throw new Error('maxExclusive must be a positive integer');
		}
		return Math.floor(next() * maxExclusive);
	};
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} seed
 * @returns {T[]}
 */
export function seededShuffle(items, seed) {
	return shuffleWith(items, createSeededRandomInt(seed));
}
