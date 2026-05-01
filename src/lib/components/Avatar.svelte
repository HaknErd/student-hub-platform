<script lang="ts">
	import type { AvatarShape } from '$lib/auth';

	type Props = {
		userId: string;
		firstName: string;
		lastName: string;
		profilePictureUrl: string | null;
		accentColor?: string | null;
		avatarBackgroundColor?: string | null;
		avatarShape?: AvatarShape;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		editable?: boolean;
		onclickavatar?: () => void;
	};

	let {
		userId,
		firstName,
		lastName,
		profilePictureUrl,
		accentColor = null,
		avatarBackgroundColor = null,
		avatarShape = 'rounded-xl',
		size = 'md',
		editable = false,
		onclickavatar = undefined
	}: Props = $props();

	let imageFailed = $state(false);

	const initials = $derived(`${firstName[0]}${lastName[0]}`);
	const avatarUrl = $derived(!profilePictureUrl ? null : `/api/avatar/${userId}`);

	function onImageError() {
		imageFailed = true;
	}

	function handleClick() {
		if (editable && onclickavatar) {
			onclickavatar();
		}
	}
</script>

{#if editable && onclickavatar}
	<button type="button" class="avatar-editable {avatarShape}" onclick={handleClick}>
		{#if profilePictureUrl && !imageFailed}
			<img
				class="avatar {size} {avatarShape}"
				src={avatarUrl!}
				alt={`${firstName} ${lastName}`}
				onerror={onImageError}
			/>
			<div class="avatar-overlay">Change</div>
		{:else}
			<div
				class="avatar {size} {avatarShape}"
				style:background-color={avatarBackgroundColor || accentColor || undefined}
				aria-hidden="true"
			>
				{initials}
			</div>
			<div class="avatar-overlay">Add photo</div>
		{/if}
	</button>
{:else if profilePictureUrl && !imageFailed}
	<img
		class="avatar {size} {avatarShape}"
		src={avatarUrl!}
		alt={`${firstName} ${lastName}`}
		onerror={onImageError}
	/>
{:else}
	<div
		class="avatar {size} {avatarShape}"
		style:background-color={avatarBackgroundColor || accentColor || undefined}
		aria-hidden="true"
	>
		{initials}
	</div>
{/if}
