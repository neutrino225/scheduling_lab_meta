# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- A [zrok](https://zrok.io) account + enable token (free tier works)
- Meta (Facebook) Graph API access token with `pages_manage_posts` and `instagram_basic` permissions for each connected account

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env: set META_ACCESS_TOKEN, ZROK2_ENABLE_TOKEN, and APP_URL

# 2. Start everything
docker compose up -d

# 3. Create DB schema
docker compose exec metalab-app npx drizzle-kit push

# 4. Seed test accounts (dev only)
curl -X POST http://localhost:3000/api/test-db

# 5. Get the public URL
docker compose logs zrok-share
# Look for the line like: fc82xzhh0tnp.shares.zrok.io
# Set this as APP_URL in .env, then:
docker compose up -d metalab-app metalab-worker

# 6. Open the app
open https://<your-share>.shares.zrok.io
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `META_ACCESS_TOKEN` | Yes | Facebook/Instagram Graph API token |
| `ZROK2_ENABLE_TOKEN` | Yes | zrok enable token from https://zrok.io |
| `APP_URL` | Yes | Public URL Meta's servers can reach to fetch media |
| `META_DRY_RUN` | No | `true` to skip real API calls (default: `false`) |
| `MINIO_STORAGE_MODE` | No | `local` or `minio` (default: `local`) |
| `AUTH_USERNAME`/`AUTH_PASSWORD` | No | Basic auth for dashboard |

## Architecture

Three Docker containers:

```
metalab-app     → Next.js server (port 3000, API + UI)
metalab-worker  → Node.js worker (polls DB, publishes via Meta API)
zrok-share      → Public tunnel to metalab-app
```

Data persisted in named Docker volumes:
- `metalab-db` — SQLite database
- `metalab-data` — Uploaded media files

## Monitoring

```bash
# Worker logs (shows publish attempts)
docker compose logs -f metalab-worker

# App logs
docker compose logs -f metalab-app

# Tunnel logs
docker compose logs -f zrok-share
```

## Updating

```bash
git pull
docker compose build
docker compose up -d
```

## Resetting the Database

```bash
docker compose down
docker volume rm <project>_metalab-db
docker compose up -d
docker compose exec metalab-app npx drizzle-kit push
```

## Troubleshooting

**"Missing or invalid image file"** — Facebook can't reach the media URL. Ensure `APP_URL` is set to the actual zrok share URL (or your domain) and restart the containers (not just `restart`, use `up -d` to re-read env).

**Share name conflict** — If zrok fails with "name is already in use", change the share name or use auto-generated names. The zrok-share service currently uses auto-generated names for reliability.

**Post saves as draft** — The scheduled time must be in the future. Both the form and server validate this.

**Worker not processing** — Check `META_DRY_RUN=false` in `.env` and verify the worker container is running (`docker compose ps`).

## Custom Domain (Nginx)

For production, uncomment the `nginx` service in `docker-compose.yml` and configure `nginx.conf.template` to proxy to `metalab-app:3000`. Set `APP_URL` to your domain.
