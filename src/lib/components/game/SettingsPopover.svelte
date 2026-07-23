<script>
	/**
	 * Minimal settings surface — mute is primary control in HUD.
	 * Kept for architecture completeness.
	 * @typedef {Object} Props
	 * @property {boolean} open
	 * @property {boolean} muted
	 * @property {() => void} onClose
	 * @property {() => void} onToggleMute
	 */

	/** @type {Props} */
	let { open = false, muted, onClose, onToggleMute } = $props();
</script>

{#if open}
	<div class="result-dialog" role="dialog" aria-modal="true" aria-label="Settings">
		<div class="result-dialog__panel">
			<h2>Settings</h2>
			<p>Audio is {muted ? 'muted' : 'on'}.</p>
			<div class="game-hud__actions" style="justify-content: center;">
				<button type="button" class="ui-button" onclick={onToggleMute}>
					{muted ? 'Unmute' : 'Mute'}
				</button>
				<button type="button" class="ui-button" onclick={onClose}>Close</button>
			</div>
		</div>
	</div>
{/if}
