<script>
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/styles/game.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Taash — Find the Card</title>
	<meta
		name="description"
		content="Find the matching card in a classic 52-card layout. One tap. No betting."
	/>
	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="icon" href={favicon} type="image/svg+xml" />
</svelte:head>

{@render children()}
