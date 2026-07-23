<script>
	import SuitGroup from './SuitGroup.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('$lib/game/round.js').SuitGroup[]} groups
	 * @property {string | null} selectedCardId
	 * @property {string | null} correctCardId
	 * @property {import('$lib/game/constants.js').Result | null} result
	 * @property {boolean} inputLocked
	 * @property {boolean} dealing
	 * @property {boolean} pulse
	 * @property {Set<string>} revealedIds
	 * @property {(cardId: string) => void} onSelect
	 */

	/** @type {Props} */
	let {
		groups,
		selectedCardId,
		correctCardId,
		result,
		inputLocked,
		dealing,
		pulse = false,
		revealedIds,
		onSelect
	} = $props();
</script>

<div class="game-board" class:board-pulse={pulse} data-testid="card-grid">
	{#each groups as group (group.suit)}
		<SuitGroup
			suit={group.suit}
			cardIds={group.cardIds}
			{selectedCardId}
			{correctCardId}
			{result}
			{inputLocked}
			{dealing}
			{revealedIds}
			{onSelect}
		/>
	{/each}
</div>
