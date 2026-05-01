<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Avatar from '$lib/components/Avatar.svelte';
	import AvatarEditorModal from '$lib/components/AvatarEditorModal.svelte';
	import BannerEditorModal from '$lib/components/BannerEditorModal.svelte';
	import InlineEditableField from '$lib/components/InlineEditableField.svelte';
	import ResourceCard from '$lib/components/resources/ResourceCard.svelte';

	let { data } = $props();

	const PRESET_COLORS = [
		'#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
		'#ca8a04', '#16a34a', '#0891b2', '#4f46e5', '#9333ea'
	];

	let showAvatarModal = $state(false);
	let showBannerModal = $state(false);
	let isEditingProfile = $state(false);

	const canOpenProfileEditor = $derived(data.isOwnProfile || data.canManageRole);
	let bioValue = $state('');
	let customAccentColor = $state('#2563eb');
	let customAvatarColor = $state('#2563eb');
	let mediaError = $state('');
	let roleSaving = $state(false);
	let roleError = $state('');

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

	async function handleAvatarSave(blob: Blob, shape: 'rounded-xl' | 'rounded-full') {
		mediaError = '';

		const formData = new FormData();
		formData.append('avatar', blob, 'avatar.webp');
		formData.append('avatarShape', shape);

		const res = await fetch(`/profile/${data.profile.id}?/updateAvatar`, {
			method: 'POST',
			body: formData
		});

		if (!res.ok) {
			mediaError = 'Could not update profile picture.';
			throw new Error(mediaError);
		}

		showAvatarModal = false;
		await reloadProfileData();
	}

	async function handleBannerSave(blob: Blob) {
		mediaError = '';

		const formData = new FormData();
		formData.append('banner', blob, 'banner.webp');

		const res = await fetch(`/profile/${data.profile.id}?/updateBanner`, {
			method: 'POST',
			body: formData
		});

		if (!res.ok) {
			mediaError = 'Could not update banner image.';
			throw new Error(mediaError);
		}

		showBannerModal = false;
		await reloadProfileData();
	}

	async function handleRemoveAvatar() {
		mediaError = '';
		const formData = new FormData();
		formData.append('remove', '1');

		const res = await fetch(`/profile/${data.profile.id}?/updateAvatar`, {
			method: 'POST',
			body: formData
		});

		if (!res.ok) {
			mediaError = 'Could not remove profile picture.';
			throw new Error(mediaError);
		}

		await reloadProfileData();
	}

	async function handleRemoveBanner() {
		mediaError = '';
		const formData = new FormData();
		formData.append('remove', '1');

		const res = await fetch(`/profile/${data.profile.id}?/updateBanner`, {
			method: 'POST',
			body: formData
		});

		if (!res.ok) {
			mediaError = 'Could not remove banner image.';
			throw new Error(mediaError);
		}

		await reloadProfileData();
	}

	const handleColorSubmit: SubmitFunction = () => {
		mediaError = '';
		return async ({ update }) => {
			await update();
		};
	};

	async function handleRoleChange(event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		const previousRole = data.profile.role;
		const role = select.value;

		roleSaving = true;
		roleError = '';

		const formData = new FormData();
		formData.append('role', role);

		try {
			const res = await fetch(`/profile/${data.profile.id}?/updateRole`, {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				select.value = previousRole;
				roleError = 'Could not update role.';
				return;
			}

			await reloadProfileData();
		} catch {
			select.value = previousRole;
			roleError = 'Could not update role.';
		} finally {
			roleSaving = false;
		}
	}

	async function handleAvatarShapeChange(shape: 'rounded-xl' | 'rounded-full') {
		mediaError = '';
		const formData = new FormData();
		formData.append('value', shape);

		const res = await fetch(`/profile/${data.profile.id}?/updateAvatarShape`, {
			method: 'POST',
			body: formData
		});

		if (!res.ok) {
			mediaError = 'Could not update avatar shape.';
			return;
		}

		await reloadProfileData();
	}

	const handleBioSubmit: SubmitFunction = () => {
		return async ({ update }) => {
			await update();
		};
	};
</script>

<div class="profile-layout">
	{#if data.isOwnProfile}
		<button
			type="button"
			class="profile-banner-wrap editable-banner"
			onclick={() => (showBannerModal = true)}
			aria-label="Edit banner image"
		>
			{#if bannerImageUrl}
				<img class="profile-banner-img" src={bannerImageUrl} alt="" />
			{:else}
				<div
					class="profile-banner"
					style="background-color: {data.profile.accentColor || 'var(--color-border)'}"
				></div>
			{/if}

			<span class="profile-banner-overlay">Edit banner</span>
		</button>
	{:else}
		<div class="profile-banner-wrap" aria-label="Profile banner">
			{#if bannerImageUrl}
				<img class="profile-banner-img" src={bannerImageUrl} alt="" />
			{:else}
				<div
					class="profile-banner"
					style="background-color: {data.profile.accentColor || 'var(--color-border)'}"
				></div>
			{/if}
		</div>
	{/if}

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

			{#if canOpenProfileEditor}
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
				{#if data.isOwnProfile}
					<div class="profile-edit-section">
						<h2 class="profile-edit-heading">Personal Details</h2>

						<div class="field-list-new">
							<InlineEditableField label="First name" value={data.profile.firstName} field="firstName" action="?/updateField" />
							<InlineEditableField label="Last name" value={data.profile.lastName} field="lastName" action="?/updateField" />

							{#if data.canEditEmail}
								<InlineEditableField label="Email" value={data.ownEmail || ''} field="email" action="?/updateField" type="email" />
							{:else}
								<div class="inline-edit-row" style="cursor: default">
									<span class="inline-edit-label">Email</span>
									<span class="inline-edit-value">{data.ownEmail || ''}</span>
								</div>
							{/if}

							<div class="inline-edit-row" style="cursor: default">
								<span class="inline-edit-label">Role</span>
								<span class="inline-edit-value">{data.profile.role}</span>
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

						{#if mediaError}
							<p class="form-error">{mediaError}</p>
						{/if}

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
				{:else if data.canManageRole}
					<div class="profile-edit-section admin-role-panel">
						<h2 class="profile-edit-heading">Admin Controls</h2>

						<div class="field-list-new">
							<div class="inline-edit-row" style="cursor: default">
								<span class="inline-edit-label">User</span>
								<span class="inline-edit-value">{data.profile.displayName}</span>
							</div>

							<div class="inline-edit-row role-edit-row" style="cursor: default">
								<div>
									<span class="inline-edit-label">Role</span>
									<span class="role-edit-help">Changing this dropdown saves automatically.</span>
								</div>

								<div class="role-edit-control">
									<select aria-label="User role" onchange={handleRoleChange} disabled={roleSaving}>
										{#each data.roleOptions as role}
											<option value={role} selected={data.profile.role === role}>{role}</option>
										{/each}
									</select>

									{#if roleSaving}
										<span class="settings-status-muted">Saving...</span>
									{/if}
								</div>

								{#if roleError}
									<span class="inline-edit-error">{roleError}</span>
								{/if}
							</div>
						</div>
					</div>
				{/if}
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

			<section class="profile-resources-section">
				<div class="search-group-header">
					<h2>Submitted resources</h2>
					<span>{data.submittedResources.length}</span>
				</div>

				{#if data.submittedResources.length === 0}
					<p class="search-group-empty">
						{data.isOwnProfile ? 'You have not submitted any resources yet.' : 'No submitted resources yet.'}
					</p>
				{:else}
					<div class="resource-grid">
						{#each data.submittedResources as resource}
							<ResourceCard {resource} showAuthor={false} />
						{/each}
					</div>
				{/if}
			</section>
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
