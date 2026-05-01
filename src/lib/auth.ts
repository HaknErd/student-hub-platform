export type AvatarShape = 'rounded-xl' | 'rounded-full';

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
