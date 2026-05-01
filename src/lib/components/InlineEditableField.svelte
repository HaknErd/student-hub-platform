<script lang="ts">
	import { enhance } from '$app/forms';

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

	function handleSubmit() {
		saving = true;
		error = '';

		return ({ result, update }: any) => {
			saving = false;

			if (result.type === 'failure') {
				error = result.data?.error ?? 'Failed to save.';
				return;
			}

			if (result.type === 'success') {
				editing = false;
				update();
			}
		};
	}

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

	function handleBlur() {
		setTimeout(() => {
			if (!editing) return;

			if (fieldValue.trim() !== value) {
				const form = inputEl?.closest('form');
				form?.requestSubmit();
			} else {
				cancelEdit();
			}
		}, 100);
	}

	$effect(() => {
		if (!editing) fieldValue = value;
	});
</script>

{#if editing}
	<div class="inline-edit-row editing">
		<dt class="inline-edit-label">{label}</dt>

		<form method="POST" action={action} use:enhance={handleSubmit}>
			<input type="hidden" name="field" value={field} />
			<input
				bind:this={inputEl}
				class="inline-edit-input"
				type={type}
				name="value"
				bind:value={fieldValue}
				onkeydown={handleKeydown}
				onblur={handleBlur}
			/>
		</form>

		{#if saving}
			<span class="inline-edit-status">Saving...</span>
		{/if}

		{#if error}
			<span class="inline-edit-error">{error}</span>
		{/if}
	</div>
{:else}
	<button type="button" class="inline-edit-row" onclick={startEdit}>
		<dt class="inline-edit-label">{label}</dt>
		<dd class="inline-edit-value">{value}</dd>
	</button>
{/if}
