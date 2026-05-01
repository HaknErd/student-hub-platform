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

The frontend does not expose signup. Create or reset users with the CLI scripts.

## Commands

```sh
pnpm check                   # type-check
pnpm db:migrate              # apply database/schema.sql
pnpm user:create -- --email=user@example.com --name="User Name" --password="at-least-12-chars"
pnpm user:reset-password -- --email=user@example.com
pnpm user:reset-password -- --id=<uuid>
```

`user:reset-password` assigns a random password and invalidates all existing sessions by default. Pass `--invalidate-sessions=false` to keep sessions alive.

## Auth

- Passwords are hashed with Node `crypto.scrypt` (N=16384, r=8, p=1).
- Sessions are stored in PostgreSQL as SHA-256 token hashes.
- Browser cookies are HTTP-only, `SameSite=Lax`, and `secure` outside dev.
- `POST /api/auth/login` verifies credentials and creates a session.
- `POST /api/auth/logout` deletes the current session.
- Rate-limited login: 5 failed attempts per email+IP, 20 per IP, rolling 15-min window.

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `STORAGE_DIR` | No | `./data` | Directory for avatars and banners |

## Production deployment

1. Provision a PostgreSQL 16 instance and create a database + user.
2. Set `DATABASE_URL` to the production connection string.
3. Set `STORAGE_DIR` to a persistent path (e.g. `/var/lib/student-hub/data`).
4. Place a `.env` file in the project root or export the env vars.
5. Run the schema migration:
   ```sh
   pnpm db:migrate
   ```
6. Create at least one admin account:
   ```sh
   pnpm user:create -- --email=admin@school.edu --first=Admin --last=User --role=admin --password="<secure-password>"
   ```
7. Build and start the production server:
   ```sh
   pnpm build
   NODE_ENV=production node build
   ```
8. Put a reverse proxy (nginx, Caddy, Cloudflare) in front. The `__Host-` session cookie prefix requires the app to be served over HTTPS.

### Docker (production)

For a containerised deployment, extend `docker-compose.yml` to add the app service:
```yaml
services:
  app:
    build: .
    restart: unless-stopped
    env_file: .env
    ports:
      - "3000:3000"
    volumes:
      - student_hub_data:/app/data
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  student_hub_pg:
  student_hub_data:
```
