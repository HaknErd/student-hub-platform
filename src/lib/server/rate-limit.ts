import { db } from '$lib/server/db';

export async function enforceUserActionRateLimit(
	action: string,
	userId: string,
	maxAttempts: number,
	windowMinutes: number
) {
	const result = await db.query(
		`
			select count(*)::int as total
			from action_rate_limits
			where action = $1
				and user_id = $2
				and created_at > now() - ($3::text)::interval
		`,
		[action, userId, `${windowMinutes} minutes`]
	);

	if (Number(result.rows[0]?.total ?? 0) >= maxAttempts) {
		return false;
	}

	await db.query(
		`
			insert into action_rate_limits (action, user_id)
			values ($1, $2)
		`,
		[action, userId]
	);

	return true;
}
