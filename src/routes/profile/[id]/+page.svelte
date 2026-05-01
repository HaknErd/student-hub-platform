<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import AvatarEditorModal from '$lib/components/AvatarEditorModal.svelte';
	import InlineEditableField from '$lib/components/InlineEditableField.svelte';

	let { data } = $props();

	const PRESET_COLORS = [
		'#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
		'#ca8a04', '#16a34a', '#0891b2', '#4f46e5', '#9333ea'
	];

	let showAvatarModal = $state(false);
	let savingAvatar = $state(false);
	let isEditingProfile = $state(false);
	let bioValue = $state('');

	$effect(() => {
		bioValue = String(data.profile.settings?.bio || '');
	});

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
		return ({ update }: any) => {
			update();
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

	function handleBioSubmit() {
		return ({ update }: any) => {
			update();
		};
	}
</script>

<div class="profile-layout">
	<!-- Banner -->
	<div
		class="profile-banner"
		style="background-color: {data.profile.accentColor || 'var(--color-border)'}"
	></div>

	<!-- Content Container -->
	<div class="profile-container">
		<div class="profile-top-row">
			<div class="profile-avatar-wrapper">
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

			{#if data.isOwnProfile}
				<div class="profile-actions-wrapper">
					<button
						class="btn-ghost"
						onclick={() => isEditingProfile = !isEditingProfile}
					>
						{isEditingProfile ? 'Done' : 'Edit profile'}
					</button>
					<a href="/account" class="btn-ghost" aria-label="Settings">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="3" />
							<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
						</svg>
					</a>
				</div>
			{/if}
		</div>

		<!-- View Mode vs Edit Mode -->
		{#if isEditingProfile}
			<!-- Editing Mode -->
			<div class="profile-edit-grid">
				<div class="profile-edit-section">
					<h2 class="profile-edit-heading">Personal Details</h2>
					<div class="field-list-new">
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
					</div>

					<!-- Bio Edit -->
					<div class="bio-edit-group">
						<label for="bio-input" class="inline-edit-label block mb-1">Description (Bio)</label>
						<form method="POST" action="?/updateSettings" use:enhance={handleBioSubmit}>
							<textarea
								id="bio-input"
								name="bio"
								rows="3"
								class="profile-bio-textarea"
								placeholder="Add a bio to your profile..."
								bind:value={bioValue}
							></textarea>
							<div class="flex justify-end mt-2">
								<button type="submit" class="btn" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">Save Bio</button>
							</div>
						</form>
					</div>
				</div>

				<div class="profile-edit-section">
					<h2 class="profile-edit-heading">Profile Customization</h2>
					
					{#if data.profile.profilePictureUrl}
						<div class="mb-4">
							<button type="button" class="text-sm text-danger hover:underline" onclick={handleRemoveAvatar}>
								Remove profile picture
							</button>
						</div>
					{/if}

					<div class="mb-5">
						<p class="inline-edit-label mb-2">Avatar Shape</p>
						<div class="profile-hero-shape-toggle inline-flex">
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

					<div class="color-section">
						<div class="color-field">
							<p class="inline-edit-label mb-2">Accent color</p>
							<form method="POST" action="?/updateColor" use:enhance={handleColorSubmit} class="color-picker-form">
								<input type="hidden" name="colorField" value="accentColor" />
								{#each PRESET_COLORS as color}
									<button
										type="submit"
										name="value"
										value={color}
										class="color-swatch color-swatch-md"
										class:active={data.profile.accentColor === color}
										style="background-color: {color}"
										aria-label="Accent color {color}"
									></button>
								{/each}
							</form>
						</div>

						<div class="color-field">
							<p class="inline-edit-label mb-2">Avatar background</p>
							<form method="POST" action="?/updateColor" use:enhance={handleColorSubmit} class="color-picker-form">
								<input type="hidden" name="colorField" value="avatarBackgroundColor" />
								{#each PRESET_COLORS as color}
									<button
										type="submit"
										name="value"
										value={color}
										class="color-swatch color-swatch-md"
										class:active={data.profile.avatarBackgroundColor === color}
										style="background-color: {color}"
										aria-label="Avatar color {color}"
									></button>
								{/each}
							</form>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- View Mode -->
			<div class="profile-info">
				<h1 class="profile-name">{data.profile.displayName}</h1>
				<p class="profile-role">{data.profile.role}</p>
				
				{#if data.profile.settings?.bio}
					<div class="profile-bio-text">
						{data.profile.settings.bio}
					</div>
				{:else if data.isOwnProfile}
					<div class="profile-bio-empty">
						No description yet. <button type="button" class="text-primary hover:underline" onclick={() => isEditingProfile = true}>Add a bio</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

{#if showAvatarModal}
	<AvatarEditorModal
		currentShape={data.profile.avatarShape}
		onclose={closeAvatarModal}
		onsave={handleAvatarSave}
	/>
{/if}