import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RequestEvent } from '@sveltejs/kit';
import type { User } from '$lib/auth';
import { getAppSettings } from '$lib/server/app-settings';
import { db } from '$lib/server/db';

const FILE_MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.oasis.opendocument.text',
	'text/plain',
	'application/rtf',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/vnd.oasis.opendocument.presentation',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.oasis.opendocument.spreadsheet',
	'image/png',
	'image/jpeg',
	'image/webp'
]);

const fileDir = join(process.cwd(), 'data', 'resource-files');

export const RESOURCE_TYPES = [
	'study_guide',
	'notes',
	'past_paper_link',
	'mark_scheme_link',
	'external_link',
	'video',
	'worksheet',
	'textbook',
	'syllabus',
	'other'
] as const;

export const RESOURCE_FORMATS = [
	'pdf',
	'docx',
	'odt',
	'txt',
	'rtf',
	'pptx',
	'odp',
	'xlsx',
	'ods',
	'image',
	'video',
	'website',
	'youtube',
	'other'
] as const;

export const RESOURCE_FORMAT_GROUPS = {
	documents: ['pdf', 'docx', 'odt', 'txt', 'rtf'],
	presentations: ['pptx', 'odp'],
	spreadsheets: ['xlsx', 'ods'],
	media: ['image', 'video'],
	links: ['website', 'youtube']
} as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];
export type ResourceFormat = (typeof RESOURCE_FORMATS)[number];
export type ResourceFormatGroup = keyof typeof RESOURCE_FORMAT_GROUPS;

export type ResourceStatus =
	| 'pending_review'
	| 'verified'
	| 'rejected'
	| 'archived'
	| 'deleted';

export type ResourceListItem = {
	id: string;
	title: string;
	description: string;
	subject: string;
	yearGroup: number | null;
	curriculum: string | null;
	level: string | null;
	format: ResourceFormat | null;
	type: ResourceType;
	status: ResourceStatus;
	externalUrl: string | null;
	licenseConfirmed: boolean;
	createdAt: string;
	updatedAt: string;
	createdBy: {
		id: string;
		displayName: string;
		role: string;
	};
	verifiedBy: {
		id: string;
		displayName: string;
	} | null;
	file: {
		id: string;
		originalFilename: string;
		mimeType: string;
		sizeBytes: number;
	} | null;
};

export type ResourceDetail = ResourceListItem & {
	rejectionReason: string | null;
};

export type FeedbackItem = {
	id: string;
	category: string;
	message: string;
	anonymousToPrefects: boolean;
	status: string;
	createdAt: string;
	createdBy: {
		id: string;
		displayName: string;
		email: string;
	} | null;
};

export type ReportItem = FeedbackItem;

export function isModerator(user: User | null | undefined) {
	return Boolean(user && ['prefect', 'teacher', 'admin'].includes(user.role));
}

export function isTeacherOrAdmin(user: User | null | undefined) {
	return Boolean(user && ['teacher', 'admin'].includes(user.role));
}

function cleanText(value: FormDataEntryValue | null, max = 500) {
	return String(value ?? '').trim().slice(0, max);
}

function cleanOptionalText(value: FormDataEntryValue | null, max = 500) {
	const v = cleanText(value, max);
	return v ? v : null;
}

function parseYearGroup(value: FormDataEntryValue | null) {
	const raw = String(value ?? '').trim();
	if (!raw) return null;

	const year = Number(raw);
	if (!Number.isInteger(year) || year < 8 || year > 13) return null;
	return year;
}

function isResourceType(value: string): value is ResourceType {
	return (RESOURCE_TYPES as readonly string[]).includes(value);
}

function isResourceFormat(value: string): value is ResourceFormat {
	return (RESOURCE_FORMATS as readonly string[]).includes(value);
}

function isResourceFormatGroup(value: string): value is ResourceFormatGroup {
	return value in RESOURCE_FORMAT_GROUPS;
}

function mapResource(row: Record<string, unknown>): ResourceListItem {
	return {
		id: String(row.id),
		title: String(row.title),
		description: String(row.description ?? ''),
		subject: String(row.subject),
		yearGroup: row.year_group === null ? null : Number(row.year_group),
		curriculum: row.curriculum ? String(row.curriculum) : null,
		level: row.level ? String(row.level) : null,
		format: row.format ? String(row.format) as ResourceFormat : null,
		type: String(row.type) as ResourceType,
		status: String(row.status) as ResourceStatus,
		externalUrl: row.external_url ? String(row.external_url) : null,
		licenseConfirmed: Boolean(row.license_confirmed),
		createdAt: String(row.created_at),
		updatedAt: String(row.updated_at),
		createdBy: {
			id: String(row.created_by_id),
			displayName: String(row.created_by_name),
			role: String(row.created_by_role)
		},
		verifiedBy: row.verified_by_id
			? {
					id: String(row.verified_by_id),
					displayName: String(row.verified_by_name)
				}
			: null,
		file: row.file_id
			? {
					id: String(row.file_id),
					originalFilename: String(row.original_filename),
					mimeType: String(row.mime_type),
					sizeBytes: Number(row.size_bytes)
				}
			: null
	};
}

function resourceSelectSql() {
	return `
		select
			r.id,
			r.title,
			r.description,
			r.subject,
			r.year_group,
			r.curriculum,
			r.level,
			r.format,
			r.type,
			r.status,
			r.external_url,
			r.revision_of,
			r.license_confirmed,
			r.rejection_reason,
			r.created_at,
			r.updated_at,
			creator.id as created_by_id,
			creator.display_name as created_by_name,
			creator.role as created_by_role,
			verifier.id as verified_by_id,
			verifier.display_name as verified_by_name,
			f.id as file_id,
			f.original_filename,
			f.mime_type,
			f.size_bytes
		from resources r
		join users creator on creator.id = r.created_by
		left join users verifier on verifier.id = r.verified_by
		left join resource_files f on f.resource_id = r.id
	`;
}

export async function listResources(input: {
	query?: string;
	subject?: string;
	curriculum?: string;
	level?: string;
	type?: string;
	format?: string;
	formatGroup?: string;
	limit?: number;
	offset?: number;
	includePendingForUserId?: string | null;
	createdByUserId?: string | null;
}) {
	const query = input.query?.trim() ?? '';
	const subject = input.subject?.trim() ?? '';
	const curriculum = input.curriculum?.trim() ?? '';
	const level = input.level?.trim() ?? '';
	const type = input.type?.trim() ?? '';
	const format = input.format?.trim() ?? '';
	const formatGroup = input.formatGroup?.trim() ?? '';
	const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
	const offset = Math.max(input.offset ?? 0, 0);

	const clauses = [`r.deleted_at is null`];
	const args: unknown[] = [];

	if (input.includePendingForUserId) {
		args.push(input.includePendingForUserId);
		clauses.push(`(r.status = 'verified' or r.created_by = $${args.length})`);
	} else {
		clauses.push(`r.status = 'verified'`);
	}

	if (query) {
		args.push(`%${query}%`);
		clauses.push(
			`(r.title ilike $${args.length} or r.description ilike $${args.length} or r.subject ilike $${args.length} or creator.display_name ilike $${args.length})`
		);
	}

	if (input.createdByUserId) {
		args.push(input.createdByUserId);
		clauses.push(`r.created_by = $${args.length}`);
	}

	if (subject) {
		args.push(subject);
		clauses.push(`r.subject = $${args.length}`);
	}

	if (curriculum) {
		args.push(curriculum);
		clauses.push(`r.curriculum = $${args.length}`);
	}

	if (level) {
		args.push(level);
		clauses.push(`r.level = $${args.length}`);
	}

	if (type && isResourceType(type)) {
		args.push(type);
		clauses.push(`r.type = $${args.length}`);
	}

	if (format && isResourceFormat(format)) {
		args.push(format);
		clauses.push(`r.format = $${args.length}`);
	}

	if (formatGroup && isResourceFormatGroup(formatGroup)) {
		const groupFormats = RESOURCE_FORMAT_GROUPS[formatGroup];
		const placeholders = groupFormats.map((groupFormat) => {
			args.push(groupFormat);
			return `$${args.length}`;
		});

		clauses.push(`r.format in (${placeholders.join(', ')})`);
	}

	args.push(limit);
	const limitParam = args.length;
	args.push(offset);
	const offsetParam = args.length;

	const result = await db.query(
		`
			${resourceSelectSql()}
			where ${clauses.join(' and ')}
			order by
				case when r.status = 'verified' then 0 else 1 end,
				r.updated_at desc
			limit $${limitParam}
			offset $${offsetParam}
		`,
		args
	);

	return result.rows.map(mapResource);
}

export async function countResources(input: {
	query?: string;
	subject?: string;
	curriculum?: string;
	level?: string;
	type?: string;
	format?: string;
	formatGroup?: string;
	includePendingForUserId?: string | null;
	createdByUserId?: string | null;
}) {
	const query = input.query?.trim() ?? '';
	const subject = input.subject?.trim() ?? '';
	const curriculum = input.curriculum?.trim() ?? '';
	const level = input.level?.trim() ?? '';
	const type = input.type?.trim() ?? '';
	const format = input.format?.trim() ?? '';
	const formatGroup = input.formatGroup?.trim() ?? '';

	const clauses = [`r.deleted_at is null`];
	const args: unknown[] = [];

	if (input.includePendingForUserId) {
		args.push(input.includePendingForUserId);
		clauses.push(`(r.status = 'verified' or r.created_by = $${args.length})`);
	} else {
		clauses.push(`r.status = 'verified'`);
	}

	if (query) {
		args.push(`%${query}%`);
		clauses.push(
			`(r.title ilike $${args.length} or r.description ilike $${args.length} or r.subject ilike $${args.length} or u.display_name ilike $${args.length})`
		);
	}

	if (input.createdByUserId) {
		args.push(input.createdByUserId);
		clauses.push(`r.created_by = $${args.length}`);
	}

	if (subject) {
		args.push(subject);
		clauses.push(`r.subject = $${args.length}`);
	}

	if (curriculum) {
		args.push(curriculum);
		clauses.push(`r.curriculum = $${args.length}`);
	}

	if (level) {
		args.push(level);
		clauses.push(`r.level = $${args.length}`);
	}

	if (type && isResourceType(type)) {
		args.push(type);
		clauses.push(`r.type = $${args.length}`);
	}

	if (format && isResourceFormat(format)) {
		args.push(format);
		clauses.push(`r.format = $${args.length}`);
	}

	if (formatGroup && isResourceFormatGroup(formatGroup)) {
		const groupFormats = RESOURCE_FORMAT_GROUPS[formatGroup];
		const placeholders = groupFormats.map((groupFormat) => {
			args.push(groupFormat);
			return `$${args.length}`;
		});

		clauses.push(`r.format in (${placeholders.join(', ')})`);
	}

	const result = await db.query(
		`
			select count(*)::int as total
			from resources r
			join users u on u.id = r.created_by
			where ${clauses.join(' and ')}
		`,
		args
	);

	return Number(result.rows[0]?.total ?? 0);
}

export async function getResourceById(id: string, user: User | null): Promise<ResourceDetail | null> {
	const result = await db.query(
		`
			${resourceSelectSql()}
			where r.id = $1
				and r.deleted_at is null
			limit 1
		`,
		[id]
	);

	if (result.rowCount !== 1) return null;

	const resource = mapResource(result.rows[0]) as ResourceDetail;
	resource.rejectionReason = result.rows[0].rejection_reason ? String(result.rows[0].rejection_reason) : null;

	const canView =
		resource.status === 'verified' ||
		(user && user.id === resource.createdBy.id) ||
		isModerator(user);

	return canView ? resource : null;
}

export async function createResourceSubmission(event: RequestEvent, user: User) {
	const form = await event.request.formData();

	const title = cleanText(form.get('title'), 120);
	const description = cleanText(form.get('description'), 2000);
	const subject = cleanText(form.get('subject'), 80);
	const yearGroup = parseYearGroup(form.get('yearGroup'));
	const curriculumRaw = cleanText(form.get('curriculum'), 40);
	const levelRaw = cleanText(form.get('level'), 20);
	const typeRaw = cleanText(form.get('type'), 40);

	const formatRaw = cleanText(form.get('format'), 40);

	const curriculum = ['IGCSE', 'IB', 'OTHER'].includes(curriculumRaw) ? curriculumRaw : null;
	const level = ['HL', 'SL', 'OTHER'].includes(levelRaw) ? levelRaw : null;
	const format = isResourceFormat(formatRaw) ? formatRaw : null;
	const externalUrl = cleanOptionalText(form.get('externalUrl'), 1000);
	const licenseConfirmed = form.get('licenseConfirmed') === 'on';

	if (!title || !subject || !isResourceType(typeRaw)) {
		return { ok: false as const, reason: 'invalid_input' };
	}

	if (!licenseConfirmed) {
		return { ok: false as const, reason: 'license_required' };
	}

	if (externalUrl) {
		try {
			const url = new URL(externalUrl);
			if (url.protocol !== 'https:' && url.protocol !== 'http:') {
				return { ok: false as const, reason: 'invalid_url' };
			}
		} catch {
			return { ok: false as const, reason: 'invalid_url' };
		}
	}

	const file = form.get('resourceFile');
	const hasFile = file instanceof File && file.size > 0;

	if (!externalUrl && !hasFile) {
		return { ok: false as const, reason: 'missing_content' };
	}

	const appSettings = await getAppSettings();
	const autoVerifyPrivileged =
		appSettings.autoVerifyPrivilegedResourceSubmissions && isModerator(user);
	const status = autoVerifyPrivileged ? 'verified' : 'pending_review';

	const resourceResult = await db.query(
		`
			insert into resources (
				title,
				description,
				subject,
				year_group,
				curriculum,
				level,
				format,
				type,
				status,
				created_by,
				verified_by,
				verified_at,
				license_confirmed,
				external_url
			)
			values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, case when $11::uuid is null then null else now() end, $12, $13)
			returning id
		`,
		[
			title,
			description,
			subject,
			yearGroup,
			curriculum,
			level,
			format,
			typeRaw,
			status,
			user.id,
			status === 'verified' ? user.id : null,
			licenseConfirmed,
			externalUrl
		]
	);

	const resourceId = String(resourceResult.rows[0].id);

	if (hasFile) {
		const upload = await saveResourceFile(resourceId, file);
		if (!upload.ok) {
			await db.query('delete from resources where id = $1', [resourceId]);
			return upload;
		}
	}

	await writeAudit(user.id, 'resource.create', 'resource', resourceId, { status, type: typeRaw });

	return { ok: true as const, id: resourceId, status };
}

async function saveResourceFile(resourceId: string, file: File) {
	if (!ALLOWED_FILE_TYPES.has(file.type)) {
		return { ok: false as const, reason: 'invalid_file_type' };
	}

	if (file.size > FILE_MAX_BYTES) {
		return { ok: false as const, reason: 'file_too_large' };
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const sha256 = createHash('sha256').update(buffer).digest('hex');
	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160) || 'file';
	const objectKey = `${randomBytes(16).toString('hex')}-${safeName}`;

	await mkdir(fileDir, { recursive: true });
	await writeFile(join(fileDir, objectKey), buffer);

	await db.query(
		`
			insert into resource_files (
				resource_id,
				object_key,
				original_filename,
				mime_type,
				size_bytes,
				sha256
			)
			values ($1, $2, $3, $4, $5, $6)
		`,
		[resourceId, objectKey, file.name, file.type, file.size, sha256]
	);

	return { ok: true as const };
}

export async function updateResourceByModerator(event: RequestEvent, moderator: User, resourceId: string) {
	if (!isModerator(moderator)) return { ok: false as const, reason: 'forbidden' };

	const form = await event.request.formData();

	const title = cleanText(form.get('title'), 120);
	const description = cleanText(form.get('description'), 2000);
	const subject = cleanText(form.get('subject'), 80);
	const yearGroup = parseYearGroup(form.get('yearGroup'));

	const curriculumRaw = cleanText(form.get('curriculum'), 40);
	const levelRaw = cleanText(form.get('level'), 20);
	const formatRaw = cleanText(form.get('format'), 40);
	const typeRaw = cleanText(form.get('type'), 40);
	const externalUrl = cleanOptionalText(form.get('externalUrl'), 1000);
	const licenseConfirmed = form.get('licenseConfirmed') === 'on';

	const curriculum = ['IGCSE', 'IB', 'OTHER'].includes(curriculumRaw) ? curriculumRaw : null;
	const level = ['HL', 'SL', 'OTHER'].includes(levelRaw) ? levelRaw : null;
	const format = isResourceFormat(formatRaw) ? formatRaw : null;

	if (!title || !subject || !isResourceType(typeRaw)) {
		return { ok: false as const, reason: 'invalid_input' };
	}

	if (!licenseConfirmed) {
		return { ok: false as const, reason: 'license_required' };
	}

	if (externalUrl) {
		try {
			const url = new URL(externalUrl);
			if (url.protocol !== 'https:' && url.protocol !== 'http:') {
				return { ok: false as const, reason: 'invalid_url' };
			}
		} catch {
			return { ok: false as const, reason: 'invalid_url' };
		}
	}

	const result = await db.query(
		`
			update resources
			set title = $2,
				description = $3,
				subject = $4,
				year_group = $5,
				curriculum = $6,
				level = $7,
				format = $8,
				type = $9,
				external_url = $10,
				license_confirmed = $11,
				updated_at = now()
			where id = $1
				and deleted_at is null
			returning id
		`,
		[
			resourceId,
			title,
			description,
			subject,
			yearGroup,
			curriculum,
			level,
			format,
			typeRaw,
			externalUrl,
			licenseConfirmed
		]
	);

	if (result.rowCount !== 1) return { ok: false as const, reason: 'not_found' };

	await writeAudit(moderator.id, 'resource.update', 'resource', resourceId, {
		title,
		subject,
		curriculum,
		level,
		format,
		type: typeRaw
	});

	return { ok: true as const };
}

export async function updateOwnSubmission(event: RequestEvent, actor: User, resourceId: string) {
	const resource = await db.query(
		`
			select
				r.id,
				r.created_by,
				r.status
			from resources r
			where r.id = $1
				and r.deleted_at is null
			limit 1
		`,
		[resourceId]
	);

	if (resource.rowCount !== 1) return { ok: false as const, reason: 'not_found' };

	const row = resource.rows[0];
	if (String(row.created_by) !== actor.id) return { ok: false as const, reason: 'forbidden' };

	const status = String(row.status);
	if (status !== 'pending_review' && status !== 'rejected') {
		return { ok: false as const, reason: 'forbidden' };
	}

	const form = await event.request.formData();
	const title = cleanText(form.get('title'), 120);
	const description = cleanText(form.get('description'), 2000);
	const subject = cleanText(form.get('subject'), 80);
	const yearGroup = parseYearGroup(form.get('yearGroup'));
	const curriculumRaw = cleanText(form.get('curriculum'), 40);
	const levelRaw = cleanText(form.get('level'), 20);
	const formatRaw = cleanText(form.get('format'), 40);
	const typeRaw = cleanText(form.get('type'), 40);
	const externalUrl = cleanOptionalText(form.get('externalUrl'), 1000);
	const licenseConfirmed = form.get('licenseConfirmed') === 'on';

	const curriculum = ['IGCSE', 'IB', 'OTHER'].includes(curriculumRaw) ? curriculumRaw : null;
	const level = ['HL', 'SL', 'OTHER'].includes(levelRaw) ? levelRaw : null;
	const format = isResourceFormat(formatRaw) ? formatRaw : null;

	if (!title || !subject || !isResourceType(typeRaw)) {
		return { ok: false as const, reason: 'invalid_input' };
	}

	if (!licenseConfirmed) {
		return { ok: false as const, reason: 'license_required' };
	}

	if (externalUrl) {
		try {
			const url = new URL(externalUrl);
			if (url.protocol !== 'https:' && url.protocol !== 'http:') {
				return { ok: false as const, reason: 'invalid_url' };
			}
		} catch {
			return { ok: false as const, reason: 'invalid_url' };
		}
	}

	const result = await db.query(
		`
			update resources
			set title = $2,
				description = $3,
				subject = $4,
				year_group = $5,
				curriculum = $6,
				level = $7,
				format = $8,
				type = $9,
				external_url = $10,
				license_confirmed = $11,
				status = 'pending_review',
				rejected_by = null,
				rejected_at = null,
				rejection_reason = null,
				updated_at = now()
			where id = $1
				and deleted_at is null
			returning id
		`,
		[
			resourceId,
			title,
			description,
			subject,
			yearGroup,
			curriculum,
			level,
			format,
			typeRaw,
			externalUrl,
			licenseConfirmed
		]
	);

	if (result.rowCount !== 1) return { ok: false as const, reason: 'not_found' };

	await writeAudit(actor.id, 'resource.submission.update', 'resource', resourceId, {
		title,
		subject,
		curriculum,
		level,
		format,
		type: typeRaw
	});

	return { ok: true as const };
}

export async function submitResourceRevision(event: RequestEvent, actor: User, resourceId: string) {
	const original = await db.query(
		`
			select
				r.id,
				r.created_by,
				r.status,
				r.external_url,
				exists(select 1 from resource_files f where f.resource_id = r.id) as has_file
			from resources r
			where r.id = $1
				and r.deleted_at is null
			limit 1
		`,
		[resourceId]
	);

	if (original.rowCount !== 1) return { ok: false as const, reason: 'not_found' };

	const row = original.rows[0];
	if (String(row.created_by) !== actor.id) return { ok: false as const, reason: 'forbidden' };
	if (String(row.status) !== 'verified') return { ok: false as const, reason: 'not_found' };

	const form = await event.request.formData();
	const title = cleanText(form.get('title'), 120);
	const description = cleanText(form.get('description'), 2000);
	const subject = cleanText(form.get('subject'), 80);
	const yearGroup = parseYearGroup(form.get('yearGroup'));
	const curriculumRaw = cleanText(form.get('curriculum'), 40);
	const levelRaw = cleanText(form.get('level'), 20);
	const formatRaw = cleanText(form.get('format'), 40);
	const typeRaw = cleanText(form.get('type'), 40);
	const externalUrl = cleanOptionalText(form.get('externalUrl'), 1000);
	const licenseConfirmed = form.get('licenseConfirmed') === 'on';

	const curriculum = ['IGCSE', 'IB', 'OTHER'].includes(curriculumRaw) ? curriculumRaw : null;
	const level = ['HL', 'SL', 'OTHER'].includes(levelRaw) ? levelRaw : null;
	const format = isResourceFormat(formatRaw) ? formatRaw : null;

	if (!title || !subject || !isResourceType(typeRaw)) {
		return { ok: false as const, reason: 'invalid_input' };
	}

	if (!licenseConfirmed) {
		return { ok: false as const, reason: 'license_required' };
	}

	if (externalUrl) {
		try {
			const url = new URL(externalUrl);
			if (url.protocol !== 'https:' && url.protocol !== 'http:') {
				return { ok: false as const, reason: 'invalid_url' };
			}
		} catch {
			return { ok: false as const, reason: 'invalid_url' };
		}
	}

	const hasExistingFile = Boolean(row.has_file);
	const existingExternalUrl = row.external_url ? String(row.external_url) : null;
	if (!externalUrl && !hasExistingFile && !existingExternalUrl) {
		return { ok: false as const, reason: 'missing_content' };
	}

	const result = await db.query(
		`
			insert into resources (
				title,
				description,
				subject,
				year_group,
				curriculum,
				level,
				format,
				type,
				status,
				created_by,
				verified_by,
				verified_at,
				license_confirmed,
				external_url,
				revision_of
			)
			values ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_review', $9, null, null, $10, $11, $12)
			returning id
		`,
		[
			title,
			description,
			subject,
			yearGroup,
			curriculum,
			level,
			format,
			typeRaw,
			actor.id,
			licenseConfirmed,
			externalUrl ?? existingExternalUrl,
			resourceId
		]
	);

	const revisionId = String(result.rows[0].id);

	if (hasExistingFile) {
		await db.query(
			`
				insert into resource_files (
					resource_id,
					object_key,
					original_filename,
					mime_type,
					size_bytes,
					sha256
				)
				select
					$2,
					object_key,
					original_filename,
					mime_type,
					size_bytes,
					sha256
				from resource_files
				where resource_id = $1
			`,
			[resourceId, revisionId]
		);
	}

	await writeAudit(actor.id, 'resource.revision.submit', 'resource', revisionId, {
		revisionOf: resourceId
	});

	return { ok: true as const, id: revisionId };
}


export async function listPendingResources() {
	const result = await db.query(
		`
			${resourceSelectSql()}
			where r.status = 'pending_review'
				and r.deleted_at is null
			order by r.created_at asc
			limit 100
		`
	);

	return result.rows.map(mapResource);
}

export async function approveResource(id: string, moderator: User) {
	if (!isModerator(moderator)) return { ok: false as const, reason: 'forbidden' };

	const result = await db.query(
		`
			update resources
			set status = 'verified',
				verified_by = $2,
				verified_at = now(),
				rejected_by = null,
				rejected_at = null,
				rejection_reason = null,
				updated_at = now()
			where id = $1
				and status = 'pending_review'
				and deleted_at is null
			returning id, revision_of
		`,
		[id, moderator.id]
	);

	if (result.rowCount !== 1) return { ok: false as const, reason: 'not_found' };

	const revisionOf = result.rows[0].revision_of ? String(result.rows[0].revision_of) : null;
	if (revisionOf) {
		await db.query(
			`
				update resources
				set status = 'archived',
					updated_at = now()
				where id = $1
					and status = 'verified'
					and deleted_at is null
			`,
			[revisionOf]
		);
	}

	await writeAudit(moderator.id, 'resource.approve', 'resource', id, {});
	return { ok: true as const };
}

export async function rejectResource(id: string, moderator: User, reason: string) {
	if (!isModerator(moderator)) return { ok: false as const, reason: 'forbidden' };

	const cleanReason = reason.trim().slice(0, 1000) || 'Rejected by moderator.';

	const result = await db.query(
		`
			update resources
			set status = 'rejected',
				rejected_by = $2,
				rejected_at = now(),
				rejection_reason = $3,
				updated_at = now()
			where id = $1
				and status = 'pending_review'
				and deleted_at is null
			returning id
		`,
		[id, moderator.id, cleanReason]
	);

	if (result.rowCount !== 1) return { ok: false as const, reason: 'not_found' };

	await writeAudit(moderator.id, 'resource.reject', 'resource', id, { reason: cleanReason });
	return { ok: true as const };
}

export async function getResourceFileForDownload(fileId: string, user: User | null) {
	const result = await db.query(
		`
			select
				f.id,
				f.object_key,
				f.original_filename,
				f.mime_type,
				f.size_bytes,
				r.status,
				r.created_by
			from resource_files f
			join resources r on r.id = f.resource_id
			where f.id = $1
				and r.deleted_at is null
			limit 1
		`,
		[fileId]
	);

	if (result.rowCount !== 1) return null;

	const row = result.rows[0];
	const canDownload =
		row.status === 'verified' ||
		(user && String(row.created_by) === user.id) ||
		isModerator(user);

	if (!canDownload) return null;

	const data = await readFile(join(fileDir, String(row.object_key)));

	return {
		data,
		filename: String(row.original_filename),
		mimeType: String(row.mime_type)
	};
}

export async function submitFeedback(user: User, form: FormData) {
	const category = cleanText(form.get('category'), 80);
	const message = cleanText(form.get('message'), 3000);
	const anonymous = form.get('anonymousToPrefects') === 'on';

	if (!category || !message) return { ok: false as const, reason: 'invalid_input' };

	const result = await db.query(
		`
			insert into feedback_items (category, message, anonymous_to_prefects, created_by)
			values ($1, $2, $3, $4)
			returning id
		`,
		[category, message, anonymous, user.id]
	);

	const id = String(result.rows[0].id);
	await writeAudit(user.id, 'feedback.submit', 'feedback', id, { category, anonymous });
	return { ok: true as const, id };
}

export async function submitReport(user: User, form: FormData) {
	const category = cleanText(form.get('category'), 80);
	const message = cleanText(form.get('message'), 3000);
	const anonymous = form.get('anonymousToPrefects') !== null;

	if (!category || !message) return { ok: false as const, reason: 'invalid_input' };

	const result = await db.query(
		`
			insert into reports (category, message, anonymous_to_prefects, created_by)
			values ($1, $2, $3, $4)
			returning id
		`,
		[category, message, anonymous, user.id]
	);

	const id = String(result.rows[0].id);
	await writeAudit(user.id, 'report.submit', 'report', id, { category, anonymous });
	return { ok: true as const, id };
}

export async function listFeedbackForModeration(viewer: User, includeClosed = false) {
	if (!isModerator(viewer)) return [];

	const result = await db.query(
		`
			select
				f.id,
				f.category,
				f.message,
				f.anonymous_to_prefects,
				f.status,
				f.created_at,
				u.id as user_id,
				u.display_name,
				u.email
			from feedback_items f
			join users u on u.id = f.created_by
			where ($1::boolean or f.status in ('submitted', 'triaged'))
			order by f.created_at asc
			limit 100
		`,
		[includeClosed]
	);

	return result.rows.map((row) => ({
		id: String(row.id),
		category: String(row.category),
		message: String(row.message),
		anonymousToPrefects: Boolean(row.anonymous_to_prefects),
		status: String(row.status),
		createdAt: String(row.created_at),
		createdBy:
			Boolean(row.anonymous_to_prefects) && !isTeacherOrAdmin(viewer)
				? null
				: {
						id: String(row.user_id),
						displayName: String(row.display_name),
						email: String(row.email)
					}
	})) satisfies FeedbackItem[];
}

export async function listReportsForModeration(viewer: User, includeClosed = false) {
	if (!isModerator(viewer)) return [];

	const result = await db.query(
		`
			select
				r.id,
				r.category,
				r.message,
				r.anonymous_to_prefects,
				r.status,
				r.created_at,
				u.id as user_id,
				u.display_name,
				u.email
			from reports r
			join users u on u.id = r.created_by
			where ($1::boolean or r.status in ('submitted', 'triaged', 'escalated'))
			order by r.created_at asc
			limit 100
		`,
		[includeClosed]
	);

	return result.rows.map((row) => ({
		id: String(row.id),
		category: String(row.category),
		message: String(row.message),
		anonymousToPrefects: Boolean(row.anonymous_to_prefects),
		status: String(row.status),
		createdAt: String(row.created_at),
		createdBy:
			Boolean(row.anonymous_to_prefects) && !isTeacherOrAdmin(viewer)
				? null
				: {
						id: String(row.user_id),
						displayName: String(row.display_name),
						email: String(row.email)
					}
	})) satisfies ReportItem[];
}

export async function updateFeedbackStatus(id: string, status: 'triaged' | 'resolved' | 'closed', actor: User) {
	if (!isModerator(actor)) return { ok: false as const, reason: 'forbidden' };

	const result = await db.query(
		`
			update feedback_items
			set status = $2,
				updated_at = now()
			where id = $1
			returning id
		`,
		[id, status]
	);

	if (result.rowCount !== 1) return { ok: false as const, reason: 'not_found' };
	await writeAudit(actor.id, `feedback.${status}`, 'feedback', id, {});
	return { ok: true as const };
}

export async function updateReportStatus(
	id: string,
	status: 'triaged' | 'escalated' | 'resolved' | 'closed',
	actor: User
) {
	if (!isModerator(actor)) return { ok: false as const, reason: 'forbidden' };

	if (status === 'escalated' && !isModerator(actor)) {
		return { ok: false as const, reason: 'forbidden' };
	}

	const result = await db.query(
		`
			update reports
			set status = $2,
				updated_at = now()
			where id = $1
			returning id
		`,
		[id, status]
	);

	if (result.rowCount !== 1) return { ok: false as const, reason: 'not_found' };
	await writeAudit(actor.id, `report.${status}`, 'report', id, {});
	return { ok: true as const };
}

async function writeAudit(
	actorId: string | null,
	action: string,
	targetType: string,
	targetId: string | null,
	meta: Record<string, unknown>
) {
	await db.query(
		`
			insert into audit_log (actor_id, action, target_type, target_id, meta)
			values ($1, $2, $3, $4, $5::jsonb)
		`,
		[actorId, action, targetType, targetId, JSON.stringify(meta)]
	);
}
