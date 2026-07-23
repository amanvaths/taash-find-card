<script>
	import { cardLabel } from '$lib/game/cards.js';

	/**
	 * @typedef {Object} Props
	 * @property {'won' | 'lost'} result
	 * @property {string} targetCardId
	 * @property {string | null} selectedCardId
	 * @property {() => void} onNewRound
	 */

	/** @type {Props} */
	let { result, targetCardId, selectedCardId, onNewRound } = $props();

	/** @type {HTMLHeadingElement | undefined} */
	let headingEl = $state();

	$effect(() => {
		headingEl?.focus();
	});
</script>

<div class="result-dialog" data-testid="result-dialog" role="dialog" aria-modal="true">
	<div class="result-dialog__panel" data-result={result}>
		<h2 bind:this={headingEl} tabindex="-1" data-testid="result-heading">
			{result === 'won' ? 'Winner' : 'Loser'}
		</h2>
		{#if result === 'won'}
			<p>You found {cardLabel(targetCardId)}.</p>
		{:else}
			<p>
				You selected {selectedCardId ? cardLabel(selectedCardId) : 'another card'}. The correct card
				was {cardLabel(targetCardId)}.
			</p>
		{/if}
		<button type="button" class="ui-button" data-testid="result-new-round" onclick={onNewRound}>
			New Round
		</button>
	</div>
</div>
