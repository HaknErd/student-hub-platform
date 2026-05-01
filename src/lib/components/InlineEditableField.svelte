<script lang="ts">
	import { enhance } from '$app/forms';

	type Props = {
		label: string;
		value: string;
		field: string;
		action: string;
		type?: 'text' | 'email';
		autofocus?: boolean;
	};

	let {
		label,
		value,
		field,
		action,
		type = 'text',
		autofocus = false
	}: Props = $props();

	let editing = $state(false);
	let fieldValue = $state(value);
	let saving = $state(false);
	let error = $state('');
	let inputEl = $state<HTMLInputElement | undefined>(undefined);

	function startEdit() {
		editing = true;
		fieldValue = value;
		error = '';
	}

	function cancelEdit() {
		editing = false;
		fieldValue = value;
		error = '';
	}

	function handleSubmit() {
		saving = true;
		error = '';
		return ({ result }: { result: { type: string; data?: Record<string, unknown> } }) => {
			saving = false;
			if (result.type === 'failure') {
				error = (result.data as { error?: string } | undefined)?.error ?? 'Failed to save.';
			} else if (result.type === 'success') {
				editing = false;
			}
		};
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			cancelEdit();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const form = (e.target as HTMLElement).closest('form') as HTMLFormElement | null;
			form?.requestSubmit();
		}
	}
</script>

{#if editing}
	<div class="inline-edit-row editing">
		<dt class="inline-edit-label">{label}</dt>
		<form method="POST" action={action} use:enhance={handleSubmit}>
			<input type="hidden" name="field" value={field} />
			<!-- svelte-ignore a11y_autofocus -->
			<input
				class="inline-edit-input"
				type={type}
				name="value"
				bind:value={fieldValue}
				onkeydown={handleKeydown}
				onblur={() => setTimeout(() => editing && cancelEdit(), 150)}
				bind:this={inputEl}
				{autofocus}
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
