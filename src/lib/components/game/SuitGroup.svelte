<script>
	import { SUIT_LABELS } from '$lib/game/constants.js';
	import CardButton from './CardButton.svelte';

	/** 13 cards → 6 rows: center, 3×3 block, pair, center (not 14). */
	const ROW_SIZES = /** @type {const} */ ([1, 3, 3, 3, 2, 1]);

	/**
	 * @typedef {Object} Props
	 * @property {import('$lib/game/constants.js').Suit} suit
	 * @property {string[]} cardIds
	 * @property {string | null} selectedCardId
	 * @property {string | null} correctCardId
	 * @property {import('$lib/game/constants.js').Result | null} result
	 * @property {boolean} inputLocked
	 * @property {boolean} dealing
	 * @property {Set<string>} revealedIds
	 * @property {(cardId: string) => void} onSelect
	 */

	/** @type {Props} */
	let {
		suit,
		cardIds,
		selectedCardId,
		correctCardId,
		result,
		inputLocked,
		dealing,
		revealedIds,
		onSelect
	} = $props();

	/** @type {{ size: number, ids: string[], startIndex: number }[]} */
	const rows = $derived.by(() => {
		/** @type {{ size: number, ids: string[], startIndex: number }[]} */
		const built = [];
		let offset = 0;
		for (const size of ROW_SIZES) {
			built.push({
				size,
				ids: cardIds.slice(offset, offset + size),
				startIndex: offset
			});
			offset += size;
		}
		return built;
	});
</script>

<section
	class="suit-group"
	data-suit={suit}
	data-testid="suit-group"
	aria-label={`${SUIT_LABELS[suit]} cards`}
>
	<h2 class="suit-group__label">{SUIT_LABELS[suit]}</h2>
	<div class="suit-group__cards">
		{#each rows as row, rowIndex (rowIndex)}
			<div class="suit-group__row" data-row-size={row.size} style={`--row-size: ${row.size}`}>
				{#each row.ids as id, i (id)}
					<CardButton
						cardId={id}
						index={row.startIndex + i}
						{suit}
						{dealing}
						revealed={revealedIds.has(id)}
						disabled={inputLocked}
						selected={selectedCardId === id}
						correct={result === 'lost' && correctCardId === id}
						wrong={result === 'lost' && selectedCardId === id}
						{onSelect}
					/>
				{/each}
			</div>
		{/each}
	</div>
</section>
