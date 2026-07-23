<script>
	import { cardLabel, isRedSuit, parseCardId, suitSymbol } from '$lib/game/cards.js';

	/**
	 * @typedef {Object} Props
	 * @property {string} targetCardId
	 */

	/** @type {Props} */
	let { targetCardId } = $props();

	const parsed = $derived(parseCardId(targetCardId));
	const red = $derived(isRedSuit(parsed.suit));
	const label = $derived(`Find this card: ${cardLabel(targetCardId)}`);
</script>

<aside
	class="target-preview"
	data-testid="target-preview"
	data-interactive="false"
	aria-label={label}
>
	<span class="target-preview__label">Find this card</span>
	<div
		class="target-preview__card"
		class:card-red={red}
		class:card-black={!red}
		role="img"
		aria-label={label}
		data-rank={parsed.rank}
		data-suit={parsed.suit}
	>
		<span class="card-corner">
			<span>{parsed.rank}</span>
			<span>{suitSymbol(parsed.suit)}</span>
		</span>
		<span class="card-center" aria-hidden="true">{suitSymbol(parsed.suit)}</span>
		<span class="card-corner card-corner--bl">
			<span>{parsed.rank}</span>
			<span>{suitSymbol(parsed.suit)}</span>
		</span>
	</div>
</aside>
