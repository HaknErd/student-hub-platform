<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import type { AvatarShape } from '$lib/types/profile';

	type Props = {
		href: string;
		id: string;
		firstName: string;
		lastName: string;
		displayName: string;
		role: string;
		profilePictureUrl: string | null;
		accentColor?: string | null;
		avatarBackgroundColor?: string | null;
		avatarShape?: AvatarShape;
	};

	let {
		href,
		id,
		firstName,
		lastName,
		displayName,
		role,
		profilePictureUrl,
		accentColor = null,
		avatarBackgroundColor = null,
		avatarShape = 'rounded-xl'
	}: Props = $props();
</script>

<a
	{href}
	class="flex items-center gap-3 border-b border-border/70 px-1 py-3 no-underline transition hover:border-primary/30 hover:bg-bg/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
>
	<Avatar
		userId={id}
		{firstName}
		{lastName}
		{profilePictureUrl}
		{accentColor}
		{avatarBackgroundColor}
		{avatarShape}
		size="md"
	/>
	<div class="min-w-0">
		<p class="truncate text-sm font-semibold text-text">{displayName}</p>
		<p class="text-xs capitalize text-text-muted">{role}</p>
	</div>
</a>
