<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	type Props = {
		label: string;
		value: string;
		field: string;
		action: string;
		type?: 'text' | 'email';
	};

	let { label, value, field, action, type = 'text' }: Props = $props();

	let editing = $state(false);
	let fieldValue = $state('');
	let saving = $state(false);
	let error = $state('');
	let inputEl = $state<HTMLInputElement | undefined>();

	function startEdit() {
		editing = true;
		fieldValue = value;
		error = '';

		requestAnimationFrame(() => {
			inputEl?.focus();
			inputEl?.select();
		});
	}

	function cancelEdit() {
		editing = false;
		fieldValue = value;
		error = '';
	}

	const handleSubmit: SubmitFunction = () => {
		saving = true;
		error = '';

		return async ({ result, update }) => {
			saving = false;

			if (result.type === 'failure') {
				error = result.data?.error ?? 'Failed to save.';
				return;
			}

			if (result.type === 'success') {
				editing = false;
				await update();
			}
		};
	};

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			cancelEdit();
			return;
		}

		if (event.key === 'Enter') {
			event.preventDefault();
			const form = (event.currentTarget as HTMLElement).closest('form');
			form?.requestSubmit();
		}
	}

	$effect(() => {
		if (!editing) fieldValue = value;
	});
</script>

{#if editing}
	<div class="inline-edit-row editing">
		<span class="inline-edit-label">{label}</span>

		<form method="POST" action={action} use:enhance={handleSubmit} class="inline-edit-form">
			<input type="hidden" name="field" value={field} />
			<input
				bind:this={inputEl}
				class="inline-edit-input"
				type={type}
				name="value"
				bind:value={fieldValue}
				onkeydown={handleKeydown}
			/>

			<div class="inline-edit-actions">
				<button type="submit" class="btn btn-sm" disabled={saving}>
					{saving ? 'Saving...' : 'Save'}
				</button>
				<button type="button" class="btn-ghost btn-sm" onclick={cancelEdit} disabled={saving}>
					Cancel
				</button>
			</div>
		</form>

		{#if error}
			<span class="inline-edit-error">{error}</span>
		{/if}
	</div>
{:else}
	<button type="button" class="inline-edit-row" onclick={startEdit}>
		<span class="inline-edit-label">{label}</span>
		<span class="inline-edit-value">{value}</span>
	</button>
{/if}
