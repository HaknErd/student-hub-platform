<script lang="ts">
	import TextFieldHero from '../lib/components/TextFieldHero.svelte';

	let { data } = $props();

	const firstName = $derived(data.user?.firstName ?? null);
	const accessName = $derived(firstName?.toUpperCase() ?? null);
</script>

<svelte:head>
	<title>Student Hub</title>
</svelte:head>

<section class="student-home">
	<TextFieldHero signature={accessName} />

	<div class="home-vignette"></div>

	<div class="home-actions" data-hero-reveal aria-label="Primary actions">
		<a href="/resources">Resources</a>
		{#if data.user}
			<a href="/search">Search</a>
		{:else}
			<a href="/login">Login</a>
		{/if}
	</div>
</section>

<style>
	:global(.page-container.app-content:has(.student-home)) {
		width: 100%;
		max-width: none;
		padding: 0;
	}

	.student-home {
		position: relative;
		width: 100vw;
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
		min-height: calc(100svh - 3.5rem);
		overflow: hidden;
		background:
			linear-gradient(90deg, color-mix(in srgb, var(--color-text) 6%, transparent) 1px, transparent 1px),
			linear-gradient(180deg, color-mix(in srgb, var(--color-text) 5%, transparent) 1px, transparent 1px),
			var(--color-bg);
		background-size: 6px 8px;
		color: var(--color-text);
	}

	.home-vignette {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			linear-gradient(90deg, color-mix(in srgb, var(--color-bg) 22%, transparent) 0%, color-mix(in srgb, var(--color-bg) 12%, transparent) 42%, transparent 72%),
			linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 8%, transparent) 0%, color-mix(in srgb, var(--color-bg) 24%, transparent) 100%);
	}


	.home-actions {
		position: absolute;
		left: clamp(16px, 5vw, 80px);
		bottom: clamp(20px, 6vh, 72px);
		z-index: 2;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.home-actions a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		border: 1px solid var(--color-border);
		padding: 0 16px;
		color: var(--color-text);
		background: color-mix(in srgb, var(--color-bg) 82%, transparent);
		font-size: 0.94rem;
		text-decoration: none;
	}

	.home-actions a:first-child {
		border-color: var(--color-accent);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
	}

	.home-actions a:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.home-actions a:first-child:hover {
		color: var(--color-accent-contrast);
		background: var(--color-accent-hover);
	}
	@media (max-width: 1023px) {
		.student-home {
			min-height: calc(100svh - 3.5rem);
		}

		.home-vignette {
			background: linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 8%, transparent), color-mix(in srgb, var(--color-bg) 32%, transparent));
		}
	}

</style>
