create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

create table if not exists users (
	id uuid primary key default gen_random_uuid(),
	email citext not null unique,
	first_name text,
	last_name text,
	display_name text not null,
	password_hash text not null,
	role text not null default 'student',
	disabled_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint users_email_not_blank check (length(trim(email::text)) > 0),
	constraint users_display_name_not_blank check (length(trim(display_name)) > 0),
	constraint users_role_not_blank check (length(trim(role)) > 0),
	constraint users_role_valid check (role in ('student', 'prefect', 'admin'))
);

alter table users
	add column if not exists first_name text;

alter table users
	add column if not exists last_name text;

update users
set first_name = split_part(display_name, ' ', 1),
	last_name = nullif(trim(substring(display_name from position(' ' in display_name) + 1)), '')
where first_name is null
	or last_name is null;

alter table users
	alter column first_name set not null,
	alter column last_name set not null;

alter table users
	drop constraint if exists users_first_name_not_blank;

alter table users
	drop constraint if exists users_last_name_not_blank;

alter table users
	add constraint users_first_name_not_blank check (length(trim(first_name)) > 0);

alter table users
	add constraint users_last_name_not_blank check (length(trim(last_name)) > 0);

create table if not exists sessions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references users(id) on delete cascade,
	token_hash text not null unique,
	expires_at timestamptz not null,
	created_at timestamptz not null default now(),
	last_seen_at timestamptz not null default now(),
	user_agent text,
	ip_address text
);

alter table sessions
	alter column ip_address type text using ip_address::text;

create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_expires_at_idx on sessions(expires_at);

create table if not exists login_attempts (
	id bigserial primary key,
	email citext not null,
	ip_address text,
	success boolean not null,
	created_at timestamptz not null default now()
);

alter table users
	drop constraint if exists users_role_valid;

alter table users
	add constraint users_role_valid check (role in ('student', 'prefect', 'admin'));

create index if not exists login_attempts_lookup_idx
	on login_attempts(email, ip_address, created_at desc);

alter table users
	add column if not exists profile_picture_url text,
	add column if not exists profile_picture_hash text,
	add column if not exists accent_color text,
	add column if not exists avatar_background_color text,
	add column if not exists settings jsonb not null default '{}'::jsonb;

create index if not exists users_first_name_trgm_idx on users using gin (first_name gin_trgm_ops);
create index if not exists users_last_name_trgm_idx on users using gin (last_name gin_trgm_ops);
create index if not exists users_display_name_trgm_idx on users using gin (display_name gin_trgm_ops);
create index if not exists users_email_trgm_idx on users using gin ((email::text) gin_trgm_ops);
