import type { AvatarShape } from '$lib/types/profile';

export type User = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	displayName: string;
	role: string;
	profilePictureUrl: string | null;
	profilePictureHash: string | null;
	accentColor: string | null;
	avatarBackgroundColor: string | null;
	avatarShape: AvatarShape;
	bannerPictureUrl: string | null;
	bannerPictureHash: string | null;
	settings: Record<string, unknown>;
};

export type PublicProfile = {
	id: string;
	firstName: string;
	lastName: string;
	displayName: string;
	role: string;
	profilePictureUrl: string | null;
	profilePictureHash: string | null;
	accentColor: string | null;
	avatarBackgroundColor: string | null;
	avatarShape: AvatarShape;
	bannerPictureUrl: string | null;
	bannerPictureHash: string | null;
	settings: Record<string, unknown>;
};

const MODERATION_ROLES = new Set(['prefect', 'teacher', 'admin']);

export function canModerateRole(role: string | null | undefined): boolean {
	return Boolean(role && MODERATION_ROLES.has(role));
}

export function isAdminRole(role: string | null | undefined): boolean {
	return role === 'admin';
}
