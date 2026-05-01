create extension if not exists pgcrypto;

create table if not exists resources (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	description text not null default '',
	subject text not null,
	year_group int,
	curriculum text,
	level text check (level in ('HL', 'SL', 'OTHER') or level is null),
	format text check (
		format in (
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
		) or format is null
	),
	type text not null check (type in ('study_guide', 'notes', 'past_paper_link', 'mark_scheme_link', 'external_link', 'video')),
	status text not null default 'pending_review' check (status in ('pending_review', 'verified', 'rejected', 'archived', 'deleted')),
	created_by uuid not null references users(id) on delete restrict,
	verified_by uuid references users(id) on delete set null,
	rejected_by uuid references users(id) on delete set null,
	rejection_reason text,
	license_confirmed boolean not null default false,
	external_url text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	verified_at timestamptz,
	rejected_at timestamptz,
	deleted_at timestamptz
);

create table if not exists resource_files (
	id uuid primary key default gen_random_uuid(),
	resource_id uuid not null references resources(id) on delete cascade,
	object_key text not null,
	original_filename text not null,
	mime_type text not null,
	size_bytes bigint not null,
	sha256 text not null,
	created_at timestamptz not null default now()
);

create table if not exists saved_resources (
	user_id uuid not null references users(id) on delete cascade,
	resource_id uuid not null references resources(id) on delete cascade,
	created_at timestamptz not null default now(),
	primary key (user_id, resource_id)
);

create table if not exists feedback_items (
	id uuid primary key default gen_random_uuid(),
	category text not null,
	message text not null,
	anonymous_to_prefects boolean not null default false,
	created_by uuid not null references users(id) on delete restrict,
	status text not null default 'submitted' check (status in ('submitted', 'triaged', 'resolved', 'closed')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists reports (
	id uuid primary key default gen_random_uuid(),
	category text not null,
	message text not null,
	anonymous_to_prefects boolean not null default true,
	created_by uuid not null references users(id) on delete restrict,
	status text not null default 'submitted' check (status in ('submitted', 'triaged', 'escalated', 'resolved', 'closed')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists audit_log (
	id uuid primary key default gen_random_uuid(),
	actor_id uuid references users(id) on delete set null,
	action text not null,
	target_type text not null,
	target_id uuid,
	meta jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now()
);

create index if not exists resources_status_idx on resources(status);
create index if not exists resources_subject_idx on resources(subject);
create index if not exists resources_type_idx on resources(type);
create index if not exists resources_created_by_idx on resources(created_by);
create index if not exists resource_files_resource_id_idx on resource_files(resource_id);
create index if not exists feedback_items_status_idx on feedback_items(status);
create index if not exists reports_status_idx on reports(status);
create index if not exists audit_log_target_idx on audit_log(target_type, target_id);
