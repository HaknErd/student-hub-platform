<script lang="ts">
	let { form } = $props();
</script>

<section class="auth-page">
	<h1>Login</h1>

	<form class="card form-stack" method="POST">
		<label class="form-row">
			<span>Email</span>
			<input class="field-control" name="email" type="email" autocomplete="email" placeholder="student@sgsc-students.com" required />
		</label>
		<label class="form-row">
			<span>Password</span>
			<input class="field-control" name="password" type="password" autocomplete="current-password" required />
		</label>
		{#if form?.error}
			<p class="form-error">{form.error}</p>
		{/if}
		<div class="form-actions">
			<button class="btn" type="submit">Sign in</button>
		</div>
	</form>
</section>
