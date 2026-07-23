<script>
	/**
	 * @typedef {Object} Props
	 * @property {boolean} muted
	 * @property {() => void} onToggleMute
	 * @property {() => void} onNewRound
	 * @property {boolean} canNewRound
	 * @property {string} statusText
	 */

	/** @type {Props} */
	let { muted, onToggleMute, onNewRound, canNewRound, statusText } = $props();
</script>

<header class="game-hud" data-testid="game-hud">
	<div>
		<p class="game-hud__brand">Taash</p>
		<p class="status-text" data-testid="status-text">{statusText}</p>
	</div>
	<div class="game-hud__actions">
		<button
			type="button"
			class="ui-button"
			data-testid="mute-toggle"
			aria-pressed={muted}
			onclick={onToggleMute}
		>
			{muted ? 'Unmute' : 'Mute'}
		</button>
		<button
			type="button"
			class="ui-button"
			data-testid="new-round"
			disabled={!canNewRound}
			onclick={onNewRound}
		>
			New Round
		</button>
	</div>
</header>

<style>
	.status-text {
		margin: 0.15rem 0 0;
		font-size: 0.9rem;
		color: color-mix(in srgb, var(--color-hud-text) 78%, transparent);
	}
</style>
