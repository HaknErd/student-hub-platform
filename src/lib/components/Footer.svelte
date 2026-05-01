<script>
	import Email from "$lib/components/Email.svelte";
	import {CONTACT} from "$lib/config";
</script>

<footer class="site-footer">
	<div class="site-footer__inner">
		<div class="site-footer__brand">
			<div class="site-footer__title">Student Hub</div>
			<div class="site-footer__tagline">A simple place for students to find what they need.</div>
			</div>

			<nav class="site-footer__links" aria-label="Footer">
				<a href="/">Home</a>
				<a href="/about">About</a>
			</nav>
		</div>

	<div class="site-footer__meta">
		<span>Built by <Email email={CONTACT.Hakan}>Hakan</Email>. Managed by <Email email={CONTACT.Yasmina}>Yasmina</Email></span>
	</div>
</footer>
