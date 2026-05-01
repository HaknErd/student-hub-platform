<script lang="ts">
	import { onMount } from 'svelte';
	import TextFieldHero from '../lib/components/TextFieldHero.svelte';

	let { data } = $props();

	const firstName = $derived(data.user?.firstName ?? null);
	const accessName = $derived(firstName?.toUpperCase() ?? null);

	onMount(() => {
		document.documentElement.dataset.homeTheme = 'terminal';

		return () => {
			delete document.documentElement.dataset.homeTheme;
		};
	});
</script>

<svelte:head>
	<title>Student Hub</title>
</svelte:head>

<section class="student-terminal-home">
	<TextFieldHero signature={accessName} />

	<div class="terminal-vignette"></div>
	<div class="terminal-intro" aria-hidden="true"></div>

	<div class="terminal-actions" aria-label="Primary actions">
		<a href="/resources">Resources</a>
		{#if data.user}
			<a href="/search">Search</a>
		{:else}
			<a href="/login">Login</a>
		{/if}
	</div>
</section>

<style>
	:global(html[data-home-theme='terminal']) {
		background: #161713;
		color-scheme: dark;
	}

	:global(.page-container.app-content:has(.student-terminal-home)) {
		width: 100%;
		max-width: none;
		padding: 0;
	}

	:global(body:has(.student-terminal-home) .site-header) {
		position: relative;
		z-index: 50;
	}

	:global(html[data-home-theme='terminal'] body),
	:global(html[data-home-theme='terminal'] .app-shell) {
		background: #161713;
		color: #f2f1ec;
	}

	:global(html[data-home-theme='terminal'] .page-container.app-content) {
		max-width: none;
		padding: 0;
	}

	:global(html[data-home-theme='terminal'] .site-header),
	:global(html[data-home-theme='terminal'] .site-footer) {
		background: #161713;
		border-color: rgba(242, 241, 236, 0.14);
		color: #f2f1ec;
		font-family: 'Berkeley Mono', 'IBM Plex Mono', 'JetBrains Mono', monospace;
	}

	:global(html[data-home-theme='terminal'] .site-header a),
	:global(html[data-home-theme='terminal'] .site-footer a),
	:global(html[data-home-theme='terminal'] .site-footer__title) {
		color: #f2f1ec;
	}

	:global(html[data-home-theme='terminal'] .site-header a:hover),
	:global(html[data-home-theme='terminal'] .site-footer a:hover) {
		color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 8%, transparent);
	}

	:global(html[data-home-theme='terminal'] .site-footer__tagline),
	:global(html[data-home-theme='terminal'] .site-footer__meta) {
		color: rgba(242, 241, 236, 0.58);
	}

	:global(html[data-home-theme='terminal'] .auth-login),
	:global(html[data-home-theme='terminal'] .auth-chip),
	:global(html[data-home-theme='terminal'] .site-header input),
	:global(html[data-home-theme='terminal'] button) {
		border-color: rgba(242, 241, 236, 0.18);
		background: rgba(22, 23, 19, 0.82);
		color: #f2f1ec;
	}

	.student-terminal-home {
		position: relative;
		width: 100vw;
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
		min-height: calc(100svh - 3.5rem);
		overflow: hidden;
		background:
			linear-gradient(90deg, rgba(242, 241, 236, 0.055) 1px, transparent 1px),
			linear-gradient(180deg, rgba(242, 241, 236, 0.05) 1px, transparent 1px),
			#161713;
		background-size: 6px 8px;
		color: #f2f1ec;
		font-family: 'Berkeley Mono', 'IBM Plex Mono', 'JetBrains Mono', monospace;
	}

	.terminal-vignette {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			linear-gradient(90deg, rgba(22, 23, 19, 0.22) 0%, rgba(22, 23, 19, 0.12) 42%, rgba(22, 23, 19, 0.04) 72%),
			linear-gradient(180deg, rgba(22, 23, 19, 0.08) 0%, rgba(22, 23, 19, 0.24) 100%);
	}

	.terminal-intro {
		position: fixed;
		inset: 0;
		z-index: 40;
		display: grid;
		place-items: center;
		overflow: hidden;
		pointer-events: none;
		background:
			linear-gradient(90deg, rgba(242, 241, 236, 0.08) 1px, transparent 1px),
			linear-gradient(180deg, rgba(242, 241, 236, 0.07) 1px, transparent 1px),
			linear-gradient(180deg, rgba(22, 23, 19, 0.42), rgba(22, 23, 19, 0.78)),
			#161713;
		background-size: 6px 8px, 6px 8px, auto, auto;
		animation: terminal-intro-away 920ms cubic-bezier(0.68, 0, 0.2, 1) 620ms both;
	}

	.terminal-actions {
		position: absolute;
		left: clamp(16px, 5vw, 80px);
		bottom: clamp(20px, 6vh, 72px);
		z-index: 2;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		animation: terminal-content-in 640ms cubic-bezier(0.2, 0.84, 0.2, 1) 1.32s both;
	}

	.terminal-actions a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		border: 1px solid rgba(242, 241, 236, 0.2);
		padding: 0 16px;
		color: #f2f1ec;
		background: rgba(22, 23, 19, 0.58);
		font-size: 0.94rem;
		text-decoration: none;
	}

	.terminal-actions a:first-child {
		border-color: var(--color-accent);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
	}

	.terminal-actions a:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.terminal-actions a:first-child:hover {
		color: var(--color-accent-contrast);
		background: var(--color-accent-hover);
	}
	@keyframes terminal-content-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes terminal-intro-away {
		from {
			opacity: 1;
			clip-path: inset(0 0 0 0);
		}
		to {
			opacity: 0;
			clip-path: inset(0 0 100% 0);
		}
	}

	@media (max-width: 1023px) {
		.student-terminal-home {
			min-height: calc(100svh - 3.5rem);
		}

		.terminal-vignette {
			background: linear-gradient(180deg, rgba(22, 23, 19, 0.08), rgba(22, 23, 19, 0.32));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.terminal-intro {
			display: none;
		}

		.terminal-actions {
			animation: none;
		}
	}
</style>
