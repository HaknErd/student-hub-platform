<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Avatar from '$lib/components/Avatar.svelte';
	import AvatarEditorModal from '$lib/components/AvatarEditorModal.svelte';
	import BannerEditorModal from '$lib/components/BannerEditorModal.svelte';
	import InlineEditableField from '$lib/components/InlineEditableField.svelte';

	let { data } = $props();

	const PRESET_COLORS = [
		'#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
		'#ca8a04', '#16a34a', '#0891b2', '#4f46e5', '#9333ea'
	];

	let showAvatarModal = $state(false);
	let showBannerModal = $state(false);
	let savingAvatar = $state(false);
	let savingBanner = $state(false);
	let isEditingProfile = $state(false);
	let bioValue = $state('');
	let customAccentColor = $state('#2563eb');
	let customAvatarColor = $state('#2563eb');

	let profileImageUrl = $derived(data.profile.profilePictureUrl ? `/api/avatar/${data.profile.id}?v=${data.profile.profilePictureUrl}` : null);
	let bannerImageUrl = $derived(data.profile.bannerPictureUrl ? `/api/banner/${data.profile.id}?v=${data.profile.bannerPictureUrl}` : null);

	$effect(() => {
		bioValue = String(data.profile.settings?.bio || '');
		customAccentColor = data.profile.accentColor ?? '#2563eb';
		customAvatarColor = data.profile.avatarBackgroundColor ?? '#2563eb';
	});

	async function reloadProfileData() {
		await invalidateAll();
	}

	function handleAvatarSave(blob: Blob, shape: 'rounded-xl' | 'rounded-full') {
		savingAvatar = true;

		const formData = new FormData();
		formData.append('avatar', blob, 'avatar.webp');
		formData.append('avatarShape', shape);

		fetch(`/profile/${data.profile.id}?/updateAvatar`, {
			method: 'POST',
			body: formData
		})
			.then(async (res) => {
				if (res.ok) {
					showAvatarModal = false;
					await reloadProfileData();
				}
			})
			.finally(() => {
				savingAvatar = false;
			});
	}

	function handleBannerSave(blob: Blob) {
		savingBanner = true;

		const formData = new FormData();
		formData.append('banner', blob, 'banner.webp');

		fetch(`/profile/${data.profile.id}?/updateBanner`, {
			method: 'POST',
			body: formData
		})
			.then(async (res) => {
				if (res.ok) {
					showBannerModal = false;
					await reloadProfileData();
				}
			})
			.finally(() => {
				savingBanner = false;
			});
	}

	function handleRemoveAvatar() {
		const formData = new FormData();
		formData.append('remove', '1');

		fetch(`/profile/${data.profile.id}?/updateAvatar`, {
			method: 'POST',
			body: formData
		}).then(reloadProfileData);
	}

	function handleRemoveBanner() {
		const formData = new FormData();
		formData.append('remove', '1');

		fetch(`/profile/${data.profile.id}?/updateBanner`, {
			method: 'POST',
			body: formData
		}).then(reloadProfileData);
	}

	function handleColorSubmit() {
		return ({ update }: any) => update();
	}

	function handleAvatarShapeChange(shape: 'rounded-xl' | 'rounded-full') {
		const formData = new FormData();
		formData.append('value', shape);

		fetch(`/profile/${data.profile.id}?/updateAvatarShape`, {
			method: 'POST',
			body: formData
		}).then(reloadProfileData);
	}

	function handleBioSubmit() {
		return ({ update }: any) => update();
	}
</script>

<div class="profile-layout">
	<button
		type="button"
		class="profile-banner-wrap"
		class:editable-banner={data.isOwnProfile}
		disabled={!data.isOwnProfile}
		onclick={() => data.isOwnProfile && (showBannerModal = true)}
		aria-label={data.isOwnProfile ? 'Edit banner image' : 'Profile banner'}
	>
		{#if bannerImageUrl}
			<img class="profile-banner-img" src={bannerImageUrl} alt="" />
		{:else}
			<div
				class="profile-banner"
				style="background-color: {data.profile.accentColor || 'var(--color-border)'}"
			></div>
		{/if}

		{#if data.isOwnProfile}
			<span class="profile-banner-overlay">Edit banner</span>
		{/if}
	</button>

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
					onclickavatar={data.isOwnProfile ? () => (showAvatarModal = true) : undefined}
				/>
			</div>

			{#if data.isOwnProfile}
				<div class="profile-actions-wrapper">
<button
						type="button"
						class="btn-ghost"
						onclick={() => (isEditingProfile = !isEditingProfile)}
					>
						{isEditingProfile ? 'Done' : 'Edit profile'}
					</button>
					<a href="/account" class="btn-ghost icon-btn" aria-label="Settings">
						<span aria-hidden="true">⚙</span>
					</a>
				</div>
			{/if}
		</div>

		{#if isEditingProfile}
			<div class="profile-edit-grid">
				<div class="profile-edit-section">
					<h2 class="profile-edit-heading">Personal Details</h2>
					<div class="field-list-new">
						<InlineEditableField label="First name" value={data.profile.firstName} field="firstName" action="?/updateField" />
						<InlineEditableField label="Last name" value={data.profile.lastName} field="lastName" action="?/updateField" />
						<InlineEditableField label="Email" value={data.ownEmail || ''} field="email" action="?/updateField" type="email" />
						<div class="inline-edit-row" style="cursor: default">
							<dt class="inline-edit-label">Role</dt>
							<dd class="inline-edit-value">{data.profile.role}</dd>
						</div>
					</div>

					<div class="bio-edit-group">
						<label for="bio-input" class="inline-edit-label block mb-1">Description</label>
						<form method="POST" action="?/updateSettings" use:enhance={handleBioSubmit}>
							<textarea
								id="bio-input"
								name="bio"
								rows="3"
								class="profile-bio-textarea"
								placeholder="Add a short profile description..."
								bind:value={bioValue}
							></textarea>
							<div class="flex justify-end mt-2">
								<button type="submit" class="btn btn-sm">Save description</button>
							</div>
						</form>
					</div>
				</div>

				<div class="profile-edit-section">
					<h2 class="profile-edit-heading">Profile Customization</h2>

					<div class="profile-media-actions">
						<button type="button" class="btn-ghost" onclick={() => (showAvatarModal = true)}>
							Edit profile picture
						</button>
</div>

					<div>
						<p class="inline-edit-label mb-2">Avatar shape</p>
						<div class="profile-hero-shape-toggle">
							<button
								type="button"
								class="profile-shape-btn"
								class:active={data.profile.avatarShape === 'rounded-xl'}
								onclick={() => handleAvatarShapeChange('rounded-xl')}
								aria-label="Rounded square avatar"
							>
								■
							</button>
							<button
								type="button"
								class="profile-shape-btn"
								class:active={data.profile.avatarShape === 'rounded-full'}
								onclick={() => handleAvatarShapeChange('rounded-full')}
								aria-label="Circle avatar"
							>
								●
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
								<label
									class="custom-color-control"
									style="background-color: {customAccentColor}"
									aria-label="Custom accent color"
								>
									<input
										type="color"
										name="value"
										bind:value={customAccentColor}
										onchange={(event) => (event.currentTarget as HTMLInputElement).form?.requestSubmit()}
									/>
								</label>
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
								<label
									class="custom-color-control"
									style="background-color: {customAvatarColor}"
									aria-label="Custom avatar background"
								>
									<input
										type="color"
										name="value"
										bind:value={customAvatarColor}
										onchange={(event) => (event.currentTarget as HTMLInputElement).form?.requestSubmit()}
									/>
								</label>
							</form>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="profile-info">
				<h1 class="profile-name">{data.profile.displayName}</h1>
				<p class="profile-role">{data.profile.role}</p>

				{#if data.profile.settings?.bio}
					<div class="profile-bio-text">
						{data.profile.settings.bio}
					</div>
				{:else if data.isOwnProfile}
					<div class="profile-bio-empty">
						No description yet. <button type="button" class="text-primary hover:underline" onclick={() => (isEditingProfile = true)}>Add one</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

{#if showAvatarModal}
	<AvatarEditorModal
		currentShape={data.profile.avatarShape}
		currentImageUrl={profileImageUrl}
		onclose={() => (showAvatarModal = false)}
		onremove={handleRemoveAvatar}
		onsave={handleAvatarSave}
	/>
{/if}

{#if showBannerModal}
	<BannerEditorModal
		currentImageUrl={bannerImageUrl}
		onclose={() => (showBannerModal = false)}
		onremove={handleRemoveBanner}
		onsave={handleBannerSave}
	/>
{/if}
