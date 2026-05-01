<script lang="ts">
	import { BUG_EMAIL } from '$lib/config';
	import Email from '$lib/components/Email.svelte';

	let { data } = $props();
</script>

	<section class="home">
	{#if data.user}
		<h1>Hi {data.user.firstName}, welcome to the Student Hub</h1>
	{:else}
		<h1>Welcome to the Student Hub</h1>
	{/if}

	<p>
		It is still in its earliest stages. For any bugs:
		<Email email={BUG_EMAIL}></Email>
	</p>

	<h2>To be added</h2>
	<ul class="status-list" aria-label="Features">
		<li class="is-done">Accounts</li>
		<li>Search</li>
		<li class="is-done">Academic resources</li>
		<li>Subject resources</li>
		<li class="is-done">Past paper links</li>
		<li>Study tips</li>
		<li>School events</li>
		<li>School calendar</li>
		<li>Student timetable</li>
		<li>Student articles</li>
		<li class="is-done">Feedback system</li>
		<li>Mental health resources</li>
		<li>Student profiles</li>
		<li>Academic tracking</li>
	</ul>
</section>
