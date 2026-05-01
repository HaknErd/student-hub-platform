<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Avatar from '$lib/components/Avatar.svelte';
	import AvatarEditorModal from '$lib/components/AvatarEditorModal.svelte';
	import BannerEditorModal from '$lib/components/BannerEditorModal.svelte';
	import ResourceCard from '$lib/components/resources/ResourceCard.svelte';
	import PageShell from '$lib/components/ui/PageShell.svelte';

	let { data } = $props();

	const PRESET_COLORS = [
		'#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
		'#ca8a04', '#16a34a', '#0891b2', '#4f46e5', '#9333ea'
	];

	let showAvatarModal = $state(false);
	let showBannerModal = $state(false);
	let showCustomizeModal = $state(false);
	let editingBio = $state(false);

	let bioValue = $state('');
	let customAccentColor = $state('#2563eb');
	let customAvatarColor = $state('#2563eb');
	let mediaError = $state('');
	let roleSaving = $state(false);
	let roleError = $state('');

	let profileVersion = $derived(data.profile.profilePictureHash || data.profile.profilePictureUrl);
	let bannerVersion = $derived(data.profile.bannerPictureHash || data.profile.bannerPictureUrl);
	let profileImageUrl = $derived(data.profile.profilePictureUrl ? `/api/avatar/${data.profile.id}?v=${profileVersion}` : null);
	let bannerImageUrl = $derived(data.profile.bannerPictureUrl ? `/api/banner/${data.profile.id}?v=${bannerVersion}` : null);

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

<PageShell wide={true}>
<section class="profile-page-card">
	<button
		type="button"
		class="profile-banner-trigger"
		onclick={data.isOwnProfile ? () => (showBannerModal = true) : undefined}
		aria-label={data.isOwnProfile ? 'Edit banner image' : 'Profile banner'}
	>
		{#if bannerImageUrl}
			<img class="profile-banner-image" src={bannerImageUrl} alt="" />
		{:else}
			<div class="profile-banner-image" style="background-color: {data.profile.accentColor || 'var(--color-border)'}"></div>
		{/if}
		{#if data.isOwnProfile}
			<span class="profile-banner-edit-chip">Edit banner</span>
		{/if}
	</button>
	<div class="profile-page-content">
		<div class="profile-header-row">
			<div class="profile-avatar-frame">
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
				<div class="profile-owner-actions">
					<button class="btn-ghost h-9 px-3" type="button" onclick={() => (showCustomizeModal = true)}>Customize profile</button>
					<a class="btn-ghost h-9 px-3" href="/account">Settings</a>
				</div>
			{/if}
		</div>
		<div class="profile-body">
			<h1 class="profile-display-name">{data.profile.displayName}</h1>
			<p class="profile-role-text">{data.profile.role}</p>
			{#if editingBio && data.isOwnProfile}
				<form method="POST" action="?/updateSettings" use:enhance={handleBioSubmit} class="profile-bio-form">
					<textarea name="bio" rows="3" class="profile-bio-input" bind:value={bioValue}></textarea>
					<div class="profile-inline-actions">
						<button type="submit" class="btn mt-0 h-9 px-3">Save</button>
						<button type="button" class="btn-ghost h-9 px-3" onclick={() => (editingBio = false)}>Cancel</button>
					</div>
				</form>
			{:else if data.profile.settings?.bio}
				<button type="button" class="profile-bio-display" onclick={data.isOwnProfile ? () => (editingBio = true) : undefined}>
					{data.profile.settings.bio}
				</button>
			{:else if data.isOwnProfile}
				<button type="button" class="profile-bio-empty" onclick={() => (editingBio = true)}>Add a profile description</button>
			{/if}
		</div>
		<section class="profile-resources">
			<div class="profile-section-header">
				<h2>Submitted resources</h2>
				<span>{data.submittedResources.length}</span>
			</div>
			{#if data.submittedResources.length === 0}
				<p class="profile-empty-note">{data.isOwnProfile ? 'You have not submitted any resources yet.' : 'No submitted resources yet.'}</p>
			{:else}
				<div class="profile-resource-grid">
					{#each data.submittedResources as resource}
						<ResourceCard {resource} showAuthor={false} />
					{/each}
				</div>
			{/if}
		</section>
		{#if data.canManageRole && !data.isOwnProfile}
			<section class="profile-admin-panel">
				<h2>Admin controls</h2>
				<div class="profile-admin-row">
					<span>Role</span>
					<div class="profile-inline-actions">
						<select class="profile-admin-select" aria-label="User role" onchange={handleRoleChange} disabled={roleSaving}>
							{#each data.roleOptions as role}
								<option value={role} selected={data.profile.role === role}>{role}</option>
							{/each}
						</select>
						{#if roleSaving}<span class="profile-muted-xs">Saving...</span>{/if}
					</div>
				</div>
				{#if roleError}<p class="profile-error-xs">{roleError}</p>{/if}
			</section>
		{/if}
	</div>
</section>
</PageShell>

{#if showCustomizeModal}
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
		<div class="w-full max-w-2xl rounded-xl border border-border bg-surface p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-base font-semibold text-text">Customize profile</h2>
				<button type="button" class="btn-ghost h-9 px-3" onclick={() => (showCustomizeModal = false)}>Done</button>
			</div>
			{#if mediaError}
				<p class="form-error">{mediaError}</p>
			{/if}
			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">Avatar shape</p>
					<div class="flex gap-2">
						<button type="button" class="btn-ghost h-9 px-3" onclick={() => handleAvatarShapeChange('rounded-xl')}>Rounded square</button>
						<button type="button" class="btn-ghost h-9 px-3" onclick={() => handleAvatarShapeChange('rounded-full')}>Circle</button>
					</div>
				</div>
				<div class="space-y-2">
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">Photos</p>
					<div class="flex gap-2">
						<button type="button" class="btn-ghost h-9 px-3" onclick={() => (showAvatarModal = true)}>Edit avatar</button>
						<button type="button" class="btn-ghost h-9 px-3" onclick={() => (showBannerModal = true)}>Edit banner</button>
					</div>
				</div>
			</div>
			<div class="mt-4 grid gap-4 md:grid-cols-2">
				<form method="POST" action="?/updateColor" use:enhance={handleColorSubmit} class="space-y-2">
					<input type="hidden" name="colorField" value="accentColor" />
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">Accent color</p>
					<div class="flex flex-wrap gap-2">
						{#each PRESET_COLORS as color}
							<button type="submit" name="value" value={color} class="h-7 w-7 rounded-md border border-border" style="background-color: {color}" aria-label="Accent color {color}"></button>
						{/each}
						<input type="color" name="value" class="h-7 w-7 rounded-md border border-border bg-bg p-0" bind:value={customAccentColor} onchange={(event) => (event.currentTarget as HTMLInputElement).form?.requestSubmit()} />
					</div>
				</form>
				<form method="POST" action="?/updateColor" use:enhance={handleColorSubmit} class="space-y-2">
					<input type="hidden" name="colorField" value="avatarBackgroundColor" />
					<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">Avatar background</p>
					<div class="flex flex-wrap gap-2">
						{#each PRESET_COLORS as color}
							<button type="submit" name="value" value={color} class="h-7 w-7 rounded-md border border-border" style="background-color: {color}" aria-label="Avatar color {color}"></button>
						{/each}
						<input type="color" name="value" class="h-7 w-7 rounded-md border border-border bg-bg p-0" bind:value={customAvatarColor} onchange={(event) => (event.currentTarget as HTMLInputElement).form?.requestSubmit()} />
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

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
