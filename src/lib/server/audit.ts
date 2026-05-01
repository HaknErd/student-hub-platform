import { db } from '$lib/server/db';

export async function writeAudit(
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
