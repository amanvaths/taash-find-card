/**
 * Web Audio API manager with procedural sounds.
 * Audio starts only after a user gesture via ensureStarted().
 * Does not autoplay on page load.
 */

const MUTE_KEY = 'taash-mute';

export function createAudioManager() {
	/** @type {AudioContext | null} */
	let context = null;
	/** @type {GainNode | null} */
	let master = null;
	let muted = false;
	let started = false;
	/** @type {Set<ReturnType<typeof setTimeout>>} */
	const pendingTimers = new Set();
	/** @type {Set<AudioNode>} */
	const activeNodes = new Set();

	if (typeof localStorage !== 'undefined') {
		muted = localStorage.getItem(MUTE_KEY) === '1';
	}

	function ensureContext() {
		if (context) return context;
		const Ctx = window.AudioContext || window.webkitAudioContext;
		if (!Ctx) {
			throw new Error('Web Audio API unavailable');
		}
		context = new Ctx();
		master = context.createGain();
		master.gain.value = muted ? 0 : 0.35;
		master.connect(context.destination);
		return context;
	}

	async function ensureStarted() {
		try {
			const ctx = ensureContext();
			if (ctx.state === 'suspended') {
				await ctx.resume();
			}
			started = true;
		} catch {
			started = false;
		}
	}

	/**
	 * @param {() => void} fn
	 * @param {number} ms
	 */
	function schedule(fn, ms) {
		const id = setTimeout(() => {
			pendingTimers.delete(id);
			fn();
		}, ms);
		pendingTimers.add(id);
		return id;
	}

	/**
	 * @param {number} frequency
	 * @param {number} duration
	 * @param {OscillatorType} type
	 * @param {number} [gainValue]
	 */
	function tone(frequency, duration, type = 'sine', gainValue = 0.2) {
		if (!started || muted || !context || !master) return;
		const now = context.currentTime;
		const osc = context.createOscillator();
		const gain = context.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(frequency, now);
		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
		osc.connect(gain);
		gain.connect(master);
		activeNodes.add(osc);
		activeNodes.add(gain);

		const release = () => {
			try {
				osc.disconnect();
			} catch {
				/* already disconnected */
			}
			try {
				gain.disconnect();
			} catch {
				/* already disconnected */
			}
			activeNodes.delete(osc);
			activeNodes.delete(gain);
		};

		osc.onended = release;
		osc.start(now);
		osc.stop(now + duration + 0.02);
	}

	function playDeal() {
		tone(220, 0.08, 'triangle', 0.12);
		schedule(() => tone(280, 0.06, 'triangle', 0.08), 40);
	}

	function playFlip() {
		tone(420, 0.09, 'square', 0.08);
		tone(180, 0.12, 'sine', 0.05);
	}

	function playWin() {
		tone(523.25, 0.12, 'sine', 0.16);
		schedule(() => tone(659.25, 0.12, 'sine', 0.16), 90);
		schedule(() => tone(783.99, 0.18, 'sine', 0.18), 180);
	}

	function playLose() {
		tone(220, 0.16, 'sawtooth', 0.1);
		schedule(() => tone(165, 0.22, 'sawtooth', 0.08), 120);
	}

	function playTap() {
		tone(660, 0.04, 'square', 0.05);
	}

	function setMuted(value) {
		muted = Boolean(value);
		if (master) {
			master.gain.value = muted ? 0 : 0.35;
		}
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
		}
	}

	function toggleMute() {
		setMuted(!muted);
		return muted;
	}

	function isMuted() {
		return muted;
	}

	function isStarted() {
		return started;
	}

	function getActiveNodeCount() {
		return activeNodes.size;
	}

	function getPendingTimerCount() {
		return pendingTimers.size;
	}

	function dispose() {
		for (const id of pendingTimers) {
			clearTimeout(id);
		}
		pendingTimers.clear();

		for (const node of activeNodes) {
			try {
				if ('stop' in node && typeof node.stop === 'function') {
					node.stop();
				}
			} catch {
				/* already stopped */
			}
			try {
				node.disconnect();
			} catch {
				/* already disconnected */
			}
		}
		activeNodes.clear();

		if (master) {
			try {
				master.disconnect();
			} catch {
				/* ignore */
			}
		}
		master = null;

		if (context) {
			context.close().catch(() => {});
		}
		context = null;
		started = false;
	}

	return {
		ensureStarted,
		playDeal,
		playFlip,
		playWin,
		playLose,
		playTap,
		setMuted,
		toggleMute,
		isMuted,
		isStarted,
		getActiveNodeCount,
		getPendingTimerCount,
		dispose
	};
}
