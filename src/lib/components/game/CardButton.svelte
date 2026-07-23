<script>
	import { cardLabel, isRedSuit, parseCardId, suitSymbol } from '$lib/game/cards.js';
	import { SUIT_LABELS } from '$lib/game/constants.js';

	/**
	 * @typedef {Object} Props
	 * @property {string} cardId
	 * @property {number} index
	 * @property {import('$lib/game/constants.js').Suit} suit
	 * @property {boolean} revealed
	 * @property {boolean} disabled
	 * @property {boolean} selected
	 * @property {boolean} correct
	 * @property {boolean} wrong
	 * @property {boolean} dealing
	 * @property {(cardId: string) => void} onSelect
	 */

	/** @type {Props} */
	let {
		cardId,
		index,
		suit,
		revealed = false,
		disabled = false,
		selected = false,
		correct = false,
		wrong = false,
		dealing = false,
		onSelect
	} = $props();

	const parsed = $derived(parseCardId(cardId));
	const red = $derived(isRedSuit(parsed.suit));
	const label = $derived(
		revealed
			? cardLabel(cardId)
			: `Hidden card ${index + 1} in ${SUIT_LABELS[suit].toLowerCase()} row`
	);
</script>

<button
	type="button"
	class="card-button"
	class:is-revealed={revealed}
	class:is-selected={selected}
	class:is-correct={correct}
	class:is-wrong={wrong}
	class:is-dealing={dealing}
	class:is-dealt={!dealing}
	style={`transition-delay: ${Math.min(index * 18, 220)}ms`}
	data-card-id={cardId}
	data-testid="card"
	aria-label={label}
	{disabled}
	onclick={() => onSelect(cardId)}
>
	<span class="card-inner">
		<span class="card-face card-face--back" aria-hidden="true"></span>
		<span class="card-face card-face--front" class:card-red={red} class:card-black={!red}>
			<span class="card-corner">
				<span>{parsed.rank}</span>
				<span>{suitSymbol(parsed.suit)}</span>
			</span>
			<span class="card-center" aria-hidden="true">{suitSymbol(parsed.suit)}</span>
			<span class="card-corner card-corner--bl">
				<span>{parsed.rank}</span>
				<span>{suitSymbol(parsed.suit)}</span>
			</span>
		</span>
	</span>
</button>
