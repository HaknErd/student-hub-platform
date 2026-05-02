<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Avatar from '$lib/components/Avatar.svelte';
	import ImageEditorModal from '$lib/components/ImageEditorModal.svelte';
	import ResourceCard from '$lib/components/resources/ResourceCard.svelte';
	import PageShell from '$lib/components/ui/PageShell.svelte';
	import {
		BANNER_ASPECT_RATIO,
		BANNER_OUTPUT_HEIGHT,
		BANNER_OUTPUT_WIDTH
	} from '$lib/constants/media';
	import { PROFILE_PRESET_COLORS } from '$lib/constants/profile';
	import type { AvatarShape } from '$lib/types/profile';

	let { data } = $props();

	let showAvatarModal = $state(false);
	let showBannerModal = $state(false);
	let showCustomizeModal = $state(false);
	let editingBio = $state(false);

	let bioValue = $state('');
	let customAccentColor = $state('#2563eb');
	let customAvatarColor = $state('#2563eb');
	let mediaError = $state('');
	let mediaNotice = $state('');
	let mediaSaving = $state(false);
	let roleSaving = $state(false);
	let roleError = $state('');

	let profileVersion = $derived(data.profile.profilePictureHash || data.profile.profilePictureUrl);
	let bannerVersionLocal = $state('');
	let bannerVersion = $derived(bannerVersionLocal || data.profile.bannerPictureHash || data.profile.bannerPictureUrl);
	let profileImageUrl = $derived(data.profile.profilePictureUrl ? `/api/avatar/${data.profile.id}?v=${profileVersion}` : null);
	let bannerImageUrl = $derived(data.profile.bannerPictureUrl ? `/api/banner/${data.profile.id}?v=${bannerVersion}` : null);

	$effect(() => {
		bioValue = String(data.profile.settings?.bio || '');
		customAccentColor = data.profile.accentColor ?? '#2563eb';
		customAvatarColor = data.profile.avatarBackgroundColor ?? '#2563eb';
	});

	$effect(() => {
		if (!mediaSaving) {
			bannerVersionLocal = data.profile.bannerPictureHash || data.profile.bannerPictureUrl || '';
		}
	});

	async function reloadProfileData() {
		await invalidateAll();
	}

	async function readActionError(res: Response, fallback: string): Promise<string> {
		const contentType = res.headers.get('content-type') ?? '';
		if (contentType.includes('application/json')) {
			try {
				const payload = (await res.json()) as { error?: string; message?: string };
				return payload.error || payload.message || fallback;
			} catch {
				return fallback;
			}
		}
		return `${fallback} (${res.status})`;
	}

	async function readActionPayload(res: Response): Promise<Record<string, unknown> | null> {
		const contentType = res.headers.get('content-type') ?? '';
		if (!contentType.includes('application/json')) return null;
		try {
			return (await res.json()) as Record<string, unknown>;
		} catch {
			return null;
		}
	}

	async function handleAvatarSave(blob: Blob, shape: AvatarShape) {
		mediaError = '';
		mediaNotice = '';
		mediaSaving = true;

		const formData = new FormData();
		formData.append('avatar', blob, 'avatar.webp');
		formData.append('avatarShape', shape);

		try {
			const res = await fetch(`/profile/${data.profile.id}?/updateAvatar`, {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				mediaError = await readActionError(res, 'Could not update profile picture.');
				throw new Error(mediaError);
			}

			showAvatarModal = false;
			await reloadProfileData();
			mediaNotice = 'Profile picture updated.';
		} finally {
			mediaSaving = false;
		}
	}

	async function handleBannerSave(blob: Blob) {
		mediaError = '';
		mediaNotice = '';
		mediaSaving = true;

		const formData = new FormData();
		formData.append('banner', blob, 'banner.webp');

		try {
			const res = await fetch(`/profile/${data.profile.id}?/updateBanner`, {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				mediaError = await readActionError(res, 'Could not update banner image.');
				throw new Error(mediaError);
			}

			const payload = await readActionPayload(res);
			const newFilename = typeof payload?.newFilename === 'string' ? payload.newFilename : '';
			if (newFilename) {
				bannerVersionLocal = `${newFilename}-${Date.now()}`;
			}

			showBannerModal = false;
			await reloadProfileData();
			mediaNotice = 'Banner updated.';
		} finally {
			mediaSaving = false;
		}
	}

	async function handleRemoveAvatar() {
		mediaError = '';
		mediaNotice = '';
		mediaSaving = true;
		const formData = new FormData();
		formData.append('remove', '1');

		try {
			const res = await fetch(`/profile/${data.profile.id}?/updateAvatar`, {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				mediaError = await readActionError(res, 'Could not remove profile picture.');
				throw new Error(mediaError);
			}

			await reloadProfileData();
			mediaNotice = 'Profile picture removed.';
		} finally {
			mediaSaving = false;
		}
	}

	async function handleRemoveBanner() {
		mediaError = '';
		mediaNotice = '';
		mediaSaving = true;
		const formData = new FormData();
		formData.append('remove', '1');

		try {
			const res = await fetch(`/profile/${data.profile.id}?/updateBanner`, {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				mediaError = await readActionError(res, 'Could not remove banner image.');
				throw new Error(mediaError);
			}

			await reloadProfileData();
			mediaNotice = 'Banner removed.';
		} finally {
			mediaSaving = false;
		}
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

	async function handleAvatarShapeChange(shape: AvatarShape) {
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
<section class="w-full overflow-hidden rounded-2xl border border-border bg-surface">
	{#if data.isOwnProfile}
		<button
			type="button"
			class="profile-banner-trigger is-editable"
			style:aspect-ratio={`${BANNER_ASPECT_RATIO} / 1`}
			disabled={mediaSaving}
			onclick={() => (showBannerModal = true)}
			aria-label="Edit banner image"
		>
			{#if bannerImageUrl}
				<img class="profile-banner-image" src={bannerImageUrl} alt="" />
			{:else}
				<div class="profile-banner-image" style="background-color: {data.profile.accentColor || 'var(--color-border)'}"></div>
			{/if}
			<span class="profile-banner-edit-chip">{mediaSaving ? 'Saving…' : 'Edit banner'}</span>
		</button>
	{:else}
		<div class="profile-banner-trigger" style:aspect-ratio={`${BANNER_ASPECT_RATIO} / 1`} aria-hidden="true">
			{#if bannerImageUrl}
				<img class="profile-banner-image" src={bannerImageUrl} alt="" />
			{:else}
				<div class="profile-banner-image" style="background-color: {data.profile.accentColor || 'var(--color-border)'}"></div>
			{/if}
		</div>
	{/if}
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
					editable={data.isOwnProfile && !mediaSaving}
					onclickavatar={data.isOwnProfile ? () => (showAvatarModal = true) : undefined}
				/>
			</div>
			{#if data.isOwnProfile}
				<div class="profile-owner-actions">
					<button class="btn-secondary" type="button" onclick={() => (showCustomizeModal = true)} disabled={mediaSaving}>Customize profile</button>
					<a class="btn-secondary" href="/account" aria-disabled={mediaSaving}>Settings</a>
				</div>
			{/if}
		</div>
		<div class="profile-body">
			<h1>{data.profile.displayName}</h1>
			<p class="profile-role-text">{data.profile.role}</p>
			{#if editingBio && data.isOwnProfile}
				<form method="POST" action="?/updateSettings" use:enhance={handleBioSubmit} class="profile-bio-form">
					<textarea name="bio" rows="3" class="profile-bio-input" bind:value={bioValue}></textarea>
					<div class="profile-inline-actions">
						<button type="submit" class="btn">Save</button>
						<button type="button" class="btn-secondary" onclick={() => (editingBio = false)}>Cancel</button>
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
		{#if mediaNotice}
			<p class="profile-status profile-status-success">{mediaNotice}</p>
		{/if}
		{#if mediaError}
			<p class="profile-status profile-status-error">{mediaError}</p>
		{/if}
	</div>
</section>
</PageShell>

{#if showCustomizeModal}
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
		<div class="w-full max-w-2xl rounded-xl border border-border bg-surface p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2>Customize profile</h2>
				<button type="button" class="btn-secondary" onclick={() => (showCustomizeModal = false)}>Done</button>
			</div>
			{#if mediaError}
				<p class="form-error">{mediaError}</p>
			{/if}
			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<p class="section-eyebrow">Avatar shape</p>
					<div class="flex gap-2">
						<button type="button" class="btn-secondary" onclick={() => handleAvatarShapeChange('rounded-xl')}>Rounded square</button>
						<button type="button" class="btn-secondary" onclick={() => handleAvatarShapeChange('rounded-full')}>Circle</button>
					</div>
				</div>
				<div class="space-y-2">
					<p class="section-eyebrow">Photos</p>
					<div class="flex gap-2">
						<button type="button" class="btn-secondary" onclick={() => (showAvatarModal = true)}>Edit avatar</button>
						<button type="button" class="btn-secondary" onclick={() => (showBannerModal = true)}>Edit banner</button>
					</div>
				</div>
			</div>
			<div class="mt-4 grid gap-4 md:grid-cols-2">
				<form method="POST" action="?/updateColor" use:enhance={handleColorSubmit} class="space-y-2">
					<input type="hidden" name="colorField" value="accentColor" />
					<p class="section-eyebrow">Accent color</p>
					<div class="flex flex-wrap gap-2">
						{#each PROFILE_PRESET_COLORS as color}
							<button type="submit" name="value" value={color} class="h-7 w-7 rounded-md border border-border" style="background-color: {color}" aria-label="Accent color {color}"></button>
						{/each}
						<input type="color" name="value" class="h-7 w-7 rounded-md border border-border bg-bg p-0" bind:value={customAccentColor} onchange={(event) => (event.currentTarget as HTMLInputElement).form?.requestSubmit()} />
					</div>
				</form>
				<form method="POST" action="?/updateColor" use:enhance={handleColorSubmit} class="space-y-2">
					<input type="hidden" name="colorField" value="avatarBackgroundColor" />
					<p class="section-eyebrow">Avatar background</p>
					<div class="flex flex-wrap gap-2">
						{#each PROFILE_PRESET_COLORS as color}
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
	<ImageEditorModal
		kind="avatar"
		title="Profile picture"
		allowShape={true}
		currentShape={data.profile.avatarShape}
		currentImageUrl={profileImageUrl}
		onclose={() => (showAvatarModal = false)}
		onremove={handleRemoveAvatar}
		onsave={handleAvatarSave}
	/>
{/if}

{#if showBannerModal}
	<ImageEditorModal
		kind="banner"
		title="Banner image"
		currentShape="rounded-xl"
		aspectRatio={BANNER_ASPECT_RATIO}
		outputWidth={BANNER_OUTPUT_WIDTH}
		outputHeight={BANNER_OUTPUT_HEIGHT}
		allowShape={false}
		currentImageUrl={bannerImageUrl}
		onclose={() => (showBannerModal = false)}
		onremove={handleRemoveBanner}
		onsave={handleBannerSave}
	/>
{/if}
