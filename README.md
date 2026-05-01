# Student Hub

SvelteKit frontend with a server-side PostgreSQL auth layer.

## Local Development

```sh
pnpm install
docker compose up -d postgres
pnpm db:migrate
pnpm user:create -- --email=student@sgsc-students.com --name="Student" --password="change-this-password"
pnpm dev
```

The frontend does not expose signup. Create or reset users with `pnpm user:create`.

## Auth

- Passwords are hashed with Node `crypto.scrypt`.
- Sessions are stored in PostgreSQL as SHA-256 token hashes.
- Browser cookies are HTTP-only, `SameSite=Lax`, and `secure` outside dev.
- `POST /api/auth/login` verifies credentials and creates a session.
- `POST /api/auth/logout` deletes the current session.

## Commands

```sh
pnpm check
pnpm db:migrate
pnpm user:create -- --email=user@example.com --name="User Name" --password="at-least-12-chars"
```

