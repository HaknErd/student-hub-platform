import type { User } from '$lib/auth';
import { db } from '$lib/server/db';

export type AppSettings = {
	autoVerifyPrivilegedResourceSubmissions: boolean;
};

export const APP_SETTINGS_DEFAULTS: AppSettings = {
	autoVerifyPrivilegedResourceSubmissions: false
};

export function isAdmin(user: User | null | undefined) {
	return Boolean(user && user.role === 'admin');
}

export async function getAppSettings(): Promise<AppSettings> {
	const result = await db.query(
		`
			select key, value
			from app_settings
		`
	);

	const settings: AppSettings = { ...APP_SETTINGS_DEFAULTS };

	for (const row of result.rows) {
		const key = String(row.key);
		if (key === 'autoVerifyPrivilegedResourceSubmissions') {
			settings.autoVerifyPrivilegedResourceSubmissions = Boolean(row.value);
		}
	}

	return settings;
}

export async function updateAppSettings(input: Partial<AppSettings>) {
	const settings = {
		...APP_SETTINGS_DEFAULTS,
		...input
	};

	const client = await db.connect();
	try {
		await client.query('begin');
		await client.query(
			`
				insert into app_settings (key, value)
				values ('autoVerifyPrivilegedResourceSubmissions', $1::jsonb)
				on conflict (key) do update
				set value = excluded.value,
					updated_at = now()
			`,
			[JSON.stringify(settings.autoVerifyPrivilegedResourceSubmissions)]
		);

		await client.query('commit');
		return { ok: true as const };
	} catch (error) {
		await client.query('rollback');
		throw error;
	} finally {
		client.release();
	}
}

export async function getResourceFileUsageSummary() {
	const [totalsResult, perUserResult] = await Promise.all([
		db.query(
			`
				select
					count(f.id)::int as file_count,
					coalesce(sum(f.size_bytes), 0)::bigint as total_bytes
				from resource_files f
				join resources r on r.id = f.resource_id
				where r.deleted_at is null
			`
		),
		db.query(
			`
				select
					u.id,
					u.display_name,
					u.role,
					count(f.id)::int as file_count,
					coalesce(sum(f.size_bytes), 0)::bigint as total_bytes
				from users u
				left join resources r
					on r.created_by = u.id
					and r.deleted_at is null
				left join resource_files f on f.resource_id = r.id
				where u.disabled_at is null
				group by u.id, u.display_name, u.role
				having count(f.id) > 0
				order by total_bytes desc, file_count desc, u.display_name asc
			`
		)
	]);

	return {
		totals: {
			fileCount: Number(totalsResult.rows[0]?.file_count ?? 0),
			totalBytes: Number(totalsResult.rows[0]?.total_bytes ?? 0)
		},
		perUser: perUserResult.rows.map((row) => ({
			id: String(row.id),
			displayName: String(row.display_name),
			role: String(row.role),
			fileCount: Number(row.file_count),
			totalBytes: Number(row.total_bytes)
		}))
	};
}
