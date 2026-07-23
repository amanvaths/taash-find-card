<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { createAudioManager } from '$lib/audio/audio-manager.js';
	import CardGrid from '$lib/components/game/CardGrid.svelte';
	import GameHud from '$lib/components/game/GameHud.svelte';
	import ResultDialog from '$lib/components/game/ResultDialog.svelte';
	import TargetPreview from '$lib/components/game/TargetPreview.svelte';
	import { PHASES } from '$lib/game/constants.js';
	import { applyParallax, updateEffects } from '$lib/renderer/three/effects.js';
	import { disposeScene } from '$lib/renderer/three/dispose.js';
	import { resizeRenderer } from '$lib/renderer/three/resize.js';
	import {
		createGameSession,
		isTestSeedAllowed,
		readSeedFromSearch
	} from '$lib/stores/game-session.js';

	const forceNoWebgl = browser && new URLSearchParams(window.location.search).get('webgl') === '0';
	const motionParam = browser ? new URLSearchParams(window.location.search).get('motion') : null;
	const prefersReduced =
		browser &&
		(motionParam === '0' || window.matchMedia('(prefers-reduced-motion: reduce)').matches);

	const seedAllowed = browser ? isTestSeedAllowed() : false;
	const initialSeed = browser
		? readSeedFromSearch(window.location.search, { allowSeed: seedAllowed })
		: null;
	const session = createGameSession({
		seed: initialSeed,
		reducedMotion: Boolean(prefersReduced),
		dealDelayMs: prefersReduced || motionParam === '0' ? 0 : 420
	});

	let round = $state(session.getRound());
	const audio = createAudioManager();
	let muted = $state(audio.isMuted());
	let pulse = $state(false);
	let showResult = $state(false);
	let webglFailed = $state(false);
	/** @type {Set<string>} */
	let revealedIds = $state(new Set());
	/** @type {HTMLDivElement | undefined} */
	let webglHost = $state();

	const dealing = $derived(round.phase === PHASES.DEALING);
	const inputLocked = $derived(round.phase !== PHASES.READY);
	const canNewRound = $derived(
		round.phase === PHASES.WON || round.phase === PHASES.LOST || round.phase === PHASES.READY
	);
	const statusText = $derived.by(() => {
		if (round.phase === PHASES.DEALING) return 'Dealing cards…';
		if (round.phase === PHASES.READY) return 'Find the matching card. One tap only.';
		if (round.phase === PHASES.WON) return 'Winner — exact match.';
		if (round.phase === PHASES.LOST) return 'Loser — wrong card.';
		return 'Resolving…';
	});

	session.subscribe(() => {
		round = session.getRound();
	});

	/** @type {ReturnType<typeof setTimeout> | null} */
	let revealTimer = null;
	/** @type {ReturnType<typeof setTimeout> | null} */
	let resultTimer = null;
	/** @type {'idle' | 'win' | 'lose'} */
	let effectMode = 'idle';
	let effectStartedAt = 0;
	/** @type {(() => void) | null} */
	let requestSceneFrame = null;

	function clearTimers() {
		if (revealTimer) clearTimeout(revealTimer);
		if (resultTimer) clearTimeout(resultTimer);
		revealTimer = null;
		resultTimer = null;
	}

	/**
	 * @param {'win' | 'lose'} mode
	 */
	function triggerEffect(mode) {
		effectMode = mode;
		effectStartedAt = performance.now();
		requestSceneFrame?.();
	}

	/**
	 * Resolve synchronously first so rapid click/touch cannot double-resolve
	 * while audio context is starting.
	 * @param {string} cardId
	 */
	async function handleSelect(cardId) {
		const previous = round;
		const next = session.choose(cardId);
		if (next === previous) return;

		await audio.ensureStarted();
		audio.playTap();
		audio.playFlip();
		revealedIds = new Set([cardId]);

		if (next.result === 'won') {
			audio.playWin();
			triggerEffect('win');
			resultTimer = setTimeout(
				() => {
					showResult = true;
				},
				prefersReduced ? 0 : 280
			);
			return;
		}

		audio.playLose();
		pulse = true;
		triggerEffect('lose');
		const delay = prefersReduced ? 0 : 420;
		revealTimer = setTimeout(() => {
			revealedIds = new Set([cardId, next.targetCardId]);
			pulse = false;
			showResult = true;
		}, delay);
	}

	async function handleNewRound() {
		await audio.ensureStarted();
		audio.playTap();
		clearTimers();
		showResult = false;
		pulse = false;
		revealedIds = new Set();
		session.newRound({ seed: null });
		round = session.getRound();
		audio.playDeal();
	}

	async function handleToggleMute() {
		await audio.ensureStarted();
		muted = audio.toggleMute();
	}

	onMount(() => {
		// No audio autoplay on mount — sounds start only after user gestures.

		if (forceNoWebgl || !webglHost) {
			webglFailed = true;
			return () => {
				clearTimers();
				session.destroy();
				audio.dispose();
			};
		}

		let disposed = false;
		/** @type {any} */
		let sceneApi = null;
		let raf = 0;
		let running = false;
		/** @type {(() => void) | null} */
		let cleanupExtras = null;

		async function boot() {
			try {
				const { createScene } = await import('$lib/renderer/three/create-scene.js');
				if (disposed || !webglHost) return;
				sceneApi = createScene(webglHost);

				const onContextLost = (/** @type {Event} */ event) => {
					event.preventDefault();
					webglFailed = true;
					cleanupExtras?.();
					if (sceneApi) {
						disposeScene(sceneApi);
						sceneApi = null;
					}
				};
				sceneApi.onContextLost = onContextLost;
				sceneApi.renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

				const onResize = () => {
					if (!sceneApi || !webglHost) return;
					resizeRenderer(sceneApi.renderer, sceneApi.camera, webglHost);
				};
				window.addEventListener('resize', onResize);

				const onPointer = (/** @type {PointerEvent} */ event) => {
					if (!sceneApi) return;
					const nx = (event.clientX / window.innerWidth) * 2 - 1;
					const ny = (event.clientY / window.innerHeight) * 2 - 1;
					applyParallax(sceneApi.camera, nx * 0.35, -ny * 0.25);
					kickLoop();
				};
				window.addEventListener('pointermove', onPointer, { passive: true });

				const onVisibility = () => {
					if (document.hidden) stopLoop();
					else kickLoop();
				};
				document.addEventListener('visibilitychange', onVisibility);

				function frame() {
					if (!sceneApi || disposed) return;
					const elapsed = (performance.now() - effectStartedAt) / 1000;
					const active = updateEffects(sceneApi.particles, effectMode, elapsed);
					sceneApi.renderer.render(sceneApi.scene, sceneApi.camera);
					if (!active && effectMode !== 'idle') {
						effectMode = 'idle';
					}
					const material = /** @type {import('three').PointsMaterial} */ (
						sceneApi.particles.material
					);
					if (effectMode === 'idle' && material.opacity <= 0.01) {
						running = false;
						raf = 0;
						return;
					}
					raf = requestAnimationFrame(frame);
				}

				function kickLoop() {
					if (running || disposed || document.hidden) return;
					running = true;
					raf = requestAnimationFrame(frame);
				}

				function stopLoop() {
					running = false;
					if (raf) cancelAnimationFrame(raf);
					raf = 0;
				}

				requestSceneFrame = kickLoop;
				sceneApi.renderer.render(sceneApi.scene, sceneApi.camera);

				cleanupExtras = () => {
					window.removeEventListener('resize', onResize);
					window.removeEventListener('pointermove', onPointer);
					document.removeEventListener('visibilitychange', onVisibility);
					stopLoop();
					requestSceneFrame = null;
				};
			} catch {
				webglFailed = true;
			}
		}

		boot();

		return () => {
			disposed = true;
			cleanupExtras?.();
			clearTimers();
			session.destroy();
			audio.dispose();
			if (sceneApi) {
				disposeScene(sceneApi);
				sceneApi = null;
			}
		};
	});
</script>

<div
	class="game-shell"
	data-testid="game-shell"
	data-round-id={round.roundId}
	data-phase={round.phase}
	data-webgl={webglFailed ? 'fallback' : 'on'}
	data-seed-active={initialSeed !== null ? '1' : '0'}
>
	<div class="game-webgl" bind:this={webglHost} aria-hidden="true" data-testid="webgl-host"></div>

	<div class="game-content">
		<GameHud
			{muted}
			{statusText}
			{canNewRound}
			onToggleMute={handleToggleMute}
			onNewRound={handleNewRound}
		/>

		<p class="status-live" aria-live="polite" data-testid="aria-status">{statusText}</p>

		<CardGrid
			groups={round.groups}
			selectedCardId={round.selectedCardId}
			correctCardId={round.correctCardId}
			result={round.result}
			{inputLocked}
			{dealing}
			{pulse}
			{revealedIds}
			onSelect={handleSelect}
		/>
	</div>

	<TargetPreview targetCardId={round.targetCardId} />

	{#if showResult && round.result}
		<ResultDialog
			result={round.result}
			targetCardId={round.targetCardId}
			selectedCardId={round.selectedCardId}
			onNewRound={handleNewRound}
		/>
	{/if}
</div>
