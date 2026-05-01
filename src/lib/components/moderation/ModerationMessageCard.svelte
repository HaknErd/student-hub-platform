<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	type Item = {
		id: string;
		category: string;
		message: string;
		status: string;
		createdBy: {
			displayName: string;
			email: string;
		} | null;
	};

	type Props = {
		item: Item;
		kind: 'feedback' | 'report';
	};

	let { item, kind }: Props = $props();

	let currentStatus = $state('');
	let pending = $state(false);
	let error = $state('');
	let saveState = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let resetSavedState: ReturnType<typeof setTimeout> | null = null;

	const action = $derived(
		kind === 'feedback' ? '/moderation/feedback?/feedbackStatus' : '/moderation/reports?/reportStatus'
	);
	const danger = $derived(kind === 'report');
	const readableStatus = (value: string) => value.replaceAll('_', ' ');
	const statusTone = $derived(`status-pill-${currentStatus}`);
	const saveMessage = $derived.by(() => {
		if (saveState === 'saving') return 'Saving...';
		if (saveState === 'saved') return 'Saved';
		if (saveState === 'error') return error || 'Could not save';
		return '';
	});

	function clearSavedTimer() {
		if (resetSavedState) {
			clearTimeout(resetSavedState);
			resetSavedState = null;
		}
	}

	function queueSavedReset() {
		clearSavedTimer();
		resetSavedState = setTimeout(() => {
			saveState = 'idle';
		}, 1600);
	}

	$effect(() => {
		if (!pending) currentStatus = item.status;
	});
</script>

<article class="moderation-card" class:danger-card={danger}>
	<div class="moderation-card-body">
		<div class="moderation-card-top">
			<p class="resource-card-meta">
				<span>{readableStatus(item.category)}</span>
			</p>

			<span class={`status-pill ${statusTone}`}>{readableStatus(currentStatus)}</span>
		</div>

		<p class="moderation-message">{item.message}</p>

		<small>
			{#if item.createdBy}
				By {item.createdBy.displayName} · {item.createdBy.email}
			{:else}
				Anonymous to prefects
			{/if}
		</small>
	</div>

	<form
		method="POST"
		action={action}
		class="moderation-inline moderation-status-form"
		use:enhance={({ formData }) => {
			const nextStatus = String(formData.get('status') ?? currentStatus);
			const previousStatus = currentStatus;

			clearSavedTimer();
			currentStatus = nextStatus;
			pending = true;
			error = '';
			saveState = 'saving';

			return async ({ result }) => {
				pending = false;

				if (result.type === 'success') {
					saveState = 'saved';
					queueSavedReset();
					await invalidateAll();
					return;
				}

				currentStatus = previousStatus;
				saveState = 'error';
				error = 'Could not save';
			};
		}}
	>
		<input type="hidden" name="id" value={item.id} />

		<label class="moderation-status-field">
			<span>Status</span>
			<select
				name="status"
				value={currentStatus}
				disabled={pending}
				aria-label={`Update ${kind} status`}
				onchange={(event) => event.currentTarget.form?.requestSubmit()}
			>
			<option value="triaged">Triaged</option>

			{#if kind === 'report'}
				<option value="escalated">Escalated</option>
			{/if}

			<option value="resolved">Resolved</option>
			<option value="closed">Closed</option>
			</select>
		</label>

		{#if saveMessage}
			<p class="moderation-status-hint" data-state={saveState}>{saveMessage}</p>
		{/if}
	</form>
</article>
