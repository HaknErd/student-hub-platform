<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';


	let { data, children } = $props();
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
