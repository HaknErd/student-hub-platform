# Student Hub Platform — Agent Guide

## Stack
- **SvelteKit 5** (adapter-node), **Svelte 5** (runes mode), **TypeScript**, **Tailwind CSS 4**
- **PostgreSQL 16** via `pg` (no ORM), **pnpm**
- **Docker** containerized deployment

## Dev environment
```sh
pnpm install
docker compose up -d postgres
pnpm db:migrate
pnpm user:create -- --email=your@email.com --first=First --last=Last --password="min-12-chars"
pnpm dev
```

## Production deployment

**Target:** `ssh nc` (Debian, x86_64), app lives at `/home/hakan/student-hub`

**Infrastructure:**
- PostgreSQL 16 Alpine runs as Docker container `pg16-alpine`, shared across apps via `pg-shared` Docker network
- App runs as Docker container on internal port 3000, exposed at `127.0.0.1:3007`
- nginx reverse-proxies `student.hknx.de` → `127.0.0.1:3007` with Cloudflare SSL

**Deploy:**
```sh
./scripts/deploy.sh
```
This builds a `linux/amd64` image (cross-compiled from Apple Silicon), SCPs to nc, loads and restarts.

**SSL:** Uses Let's Encrypt wildcard cert at `/etc/letsencrypt/live/hknx.de/` (shared across all hknx.de subdomains).

**DNS:** A record `student.hknx.de` → `152.53.246.157` (Cloudflare proxy on).

**Networking:** App joins existing `pg-shared` Docker network to reach PG container via hostname `postgres`.

### Environment (set via docker-compose.prod.yml, not .env file)
| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgres://student_hub:student_hub@pg16-alpine:5432/student_hub` |
| `ORIGIN` | `https://student.hknx.de` |
| `STORAGE_DIR` | `/app/data` |

### Key files
| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage build (builder → runner) for linux/amd64 |
| `docker-compose.prod.yml` | Production compose uploaded to nc as `docker-compose.yml` |
| `scripts/deploy.sh` | Full deploy pipeline: build → save → SCP → load → up |
| `scripts/nginx-student.conf` | Nginx vhost template (installed manually on nc) |
| `database/schema.sql` | Main schema (extensions, users, sessions, rate limits) |
| `sql/p0_student_hub.sql` | Resources, feedback, reports, audit_log schema |

### Build caveat
SvelteKit's post-build analysis imports server modules including `db.ts`, which requires `DATABASE_URL` at module level. The Dockerfile sets a dummy `DATABASE_URL` during build to bypass this; the real URL is set at container runtime via Docker environment.

### Admin operations (against production DB)

Since Node.js is NOT installed bare-metal on nc, admin scripts run **locally** through an SSH tunnel to the PG container:

```sh
# Open a tunnel (keep this running in a separate terminal)
ssh -L 5432:127.0.0.1:5432 nc -N
```

Alternatively, run scripts inside the running app container (it has Node.js + pg):

```sh
ssh nc 'docker exec student-hub-app-1 node -e "..."'
```

```sh
# Open a tunnel (keep this running in a separate terminal)
ssh -L 5432:127.0.0.1:5432 nc -N

# Then in another terminal, use .env pointing at the tunnel:
DATABASE_URL=postgres://student_hub:student_hub@localhost:5432/student_hub pnpm user:create -- \
  --email=hakan.erdogan@sgsc-students.com \
  --first=Hakan --last=Erdogan \
  --password="new-min-12-char-password"

# user:create upserts by email — it's also how you reset passwords
# pnpm user:reset-password is a planned script but does NOT exist yet
```

### Viewing logs on the server

```sh
ssh nc 'docker logs student-hub-app-1 -f --tail 50'
ssh nc 'docker ps | grep student-hub'
ssh nc 'docker restart student-hub-app-1'
```

### Manually restarting

```sh
ssh nc 'docker compose -f /home/hakan/student-hub/docker-compose.yml up -d'
```

### Server setup notes
- `/etc/hosts` on nc includes `student.hknx.de` on the `10.0.1.1` Tailscale line for internal resolution
- PG container (`pg16-alpine`) is shared — do NOT create a second PG instance; join the `pg-shared` network instead
- No Node.js installed bare-metal; everything runs in Docker
- Port allocation on nc: 3007 for this app (3000-3006 taken by other services)
