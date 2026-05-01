<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';


	let { data, children } = $props();

	const theme = $derived(String(data.user?.settings?.theme ?? 'system'));

	$effect(() => {
		if (typeof document === 'undefined') return;

		const root = document.documentElement;

		if (theme === 'light' || theme === 'dark') {
			root.dataset.theme = theme;
		} else {
			delete root.dataset.theme;
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="app-shell">
	<Header user={data.user} />
	<main class="app-main">
		<div class="page-container app-content">
			{@render children()}
		</div>
	</main>
	<Footer />
</div>
