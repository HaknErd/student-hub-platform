<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import AvatarEditorModal from '$lib/components/AvatarEditorModal.svelte';
	import InlineEditableField from '$lib/components/InlineEditableField.svelte';

	let { data, form } = $props();

	const PRESET_COLORS = [
		'#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
		'#ca8a04', '#16a34a', '#0891b2', '#4f46e5', '#9333ea'
	];

	let showAvatarModal = $state(false);
	let savingAvatar = $state(false);

	function openAvatarModal() {
		showAvatarModal = true;
	}

	function closeAvatarModal() {
		showAvatarModal = false;
	}

	function handleAvatarSave(blob: Blob, shape: 'rounded-xl' | 'rounded-full') {
		savingAvatar = true;
		const formData = new FormData();
		formData.append('avatar', blob, 'avatar.webp');
		formData.append('avatarShape', shape);

		fetch(`/profile/${data.profile.id}?/updateAvatar`, {
			method: 'POST',
			body: formData
		}).then((res) => {
			if (res.ok) {
				showAvatarModal = false;
				location.reload();
			}
			savingAvatar = false;
		}).catch(() => {
			savingAvatar = false;
		});
	}

	function handleRemoveAvatar() {
		const formData = new FormData();
		formData.append('remove', '1');
		fetch(`/profile/${data.profile.id}?/updateAvatar`, {
			method: 'POST',
			body: formData
		}).then(() => location.reload());
	}

	function handleColorSubmit() {
		return ({ result }: { result: { type: string } }) => {
			void result;
		};
	}

	function handleAvatarShapeChange(shape: 'rounded-xl' | 'rounded-full') {
		const formData = new FormData();
		formData.append('value', shape);
		fetch(`/profile/${data.profile.id}?/updateAvatarShape`, {
			method: 'POST',
			body: formData
		}).then(() => location.reload());
	}
</script>

<section class="profile-page">
	<header class="profile-hero-new">
		<div class="profile-hero-avatar">
			<Avatar
				userId={data.profile.id}
				firstName={data.profile.firstName}
				lastName={data.profile.lastName}
				profilePictureUrl={data.profile.profilePictureUrl}
				accentColor={data.profile.accentColor}
				avatarBackgroundColor={data.profile.avatarBackgroundColor}
				avatarShape={data.profile.avatarShape}
				size="xl"
				editable={data.isOwnProfile}
				onclickavatar={data.isOwnProfile ? openAvatarModal : undefined}
			/>
		</div>

		<div class="profile-hero-info">
			<p class="profile-hero-role">{data.profile.role}</p>
			<h1 class="profile-hero-name">{data.profile.displayName}</h1>

			{#if data.isOwnProfile}
				<div class="profile-hero-actions">
					{#if data.profile.profilePictureUrl}
						<button type="button" class="profile-hero-action-btn" onclick={handleRemoveAvatar}>
							Remove picture
						</button>
					{/if}
					<div class="profile-hero-shape-toggle">
						<button
							type="button"
							class="profile-shape-btn"
							class:active={data.profile.avatarShape === 'rounded-xl'}
							onclick={() => handleAvatarShapeChange('rounded-xl')}
							aria-label="Square avatar"
						>
							<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
								<rect x="2" y="2" width="10" height="10" rx="2" />
							</svg>
						</button>
						<button
							type="button"
							class="profile-shape-btn"
							class:active={data.profile.avatarShape === 'rounded-full'}
							onclick={() => handleAvatarShapeChange('rounded-full')}
							aria-label="Circle avatar"
						>
							<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
								<circle cx="7" cy="7" r="5" />
							</svg>
						</button>
					</div>
				</div>
			{/if}
		</div>

		{#if data.isOwnProfile}
			<a href="/account" class="btn-ghost">Settings</a>
		{/if}
	</header>

	{#if data.isOwnProfile}
		<div class="profile-grid">
			<section class="profile-card">
				<header class="profile-card-header">
					<h2>Profile</h2>
					<p>Click any field to edit. Changes save automatically.</p>
				</header>

				<dl class="field-list-new">
					<InlineEditableField
						label="First name"
						value={data.profile.firstName}
						field="firstName"
						action="?/updateField"
					/>

					<InlineEditableField
						label="Last name"
						value={data.profile.lastName}
						field="lastName"
						action="?/updateField"
					/>

					<InlineEditableField
						label="Email"
						value={data.ownEmail || ''}
						field="email"
						action="?/updateField"
						type="email"
					/>

					<div class="inline-edit-row" style="cursor: default">
						<dt class="inline-edit-label">Role</dt>
						<dd class="inline-edit-value">{data.profile.role}</dd>
					</div>
				</dl>
			</section>

			<section class="profile-card">
				<header class="profile-card-header">
					<h2>Colors</h2>
					<p>Click a swatch to apply instantly.</p>
				</header>

				<div class="color-section">
					<div class="color-field">
						<p class="color-field-label">Accent color</p>
						<form method="POST" action="?/updateColor" use:enhance={handleColorSubmit} class="color-picker-form">
							<input type="hidden" name="colorField" value="accentColor" />
							{#each PRESET_COLORS as color}
								<button
									type="submit"
									name="value"
									value={color}
									class="color-swatch color-swatch-lg"
									class:active={data.profile.accentColor === color}
									style="background-color: {color}"
									aria-label="Accent color {color}"
								></button>
							{/each}
						</form>
					</div>

					<div class="color-field">
						<p class="color-field-label">Avatar background</p>
						<form method="POST" action="?/updateColor" use:enhance={handleColorSubmit} class="color-picker-form">
							<input type="hidden" name="colorField" value="avatarBackgroundColor" />
							{#each PRESET_COLORS as color}
								<button
									type="submit"
									name="value"
									value={color}
									class="color-swatch color-swatch-lg"
									class:active={data.profile.avatarBackgroundColor === color}
									style="background-color: {color}"
									aria-label="Avatar color {color}"
								></button>
							{/each}
						</form>
					</div>
				</div>
			</section>
		</div>
	{:else}
		<div class="profile-grid">
			<section class="profile-card">
				<header class="profile-card-header">
					<h2>Profile</h2>
					<p>Basic account details visible inside Student Hub.</p>
				</header>

				<dl class="field-list-new">
					<div class="inline-edit-row">
						<dt class="inline-edit-label">First name</dt>
						<dd class="inline-edit-value">{data.profile.firstName}</dd>
					</div>
					<div class="inline-edit-row">
						<dt class="inline-edit-label">Last name</dt>
						<dd class="inline-edit-value">{data.profile.lastName}</dd>
					</div>
					<div class="inline-edit-row">
						<dt class="inline-edit-label">Role</dt>
						<dd class="inline-edit-value">{data.profile.role}</dd>
					</div>
				</dl>
			</section>
		</div>
	{/if}
</section>

{#if showAvatarModal}
	<AvatarEditorModal
		currentShape={data.profile.avatarShape}
		onclose={closeAvatarModal}
		onsave={handleAvatarSave}
	/>
{/if}
