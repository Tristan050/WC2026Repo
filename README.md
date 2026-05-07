# WC2026 Runbook

## 1) Install
- `npm install`

## 2) Configure env
- copy `.env.example` to `.env`
- required:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `NEXT_PUBLIC_SITE_URL`
  - `ADMIN_API_KEY` (must not be default)
  - `SESSION_SECRET` (16+ chars)
- optional:
  - `ADMIN_IP_ALLOWLIST` (comma-separated IPs)

## 3) Generate + migrate + seed
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run seed`

## 4) Start app
- `npm run dev`

## 5) Run workers
- `npm run worker:windows`
- `npm run worker:events`
- `npm run worker:leaderboard`

## 6) Cron tick (all)
- `npm run cron:tick`

## 7) Official fixture sync
- `npm run fixtures:sync`

## Core API endpoints
- `GET /api/session`
- `GET /api/matches/live`
- `GET /api/matches/{matchId}`
- `POST /api/predictions/submit`
- `GET /api/leaderboard/global`
- `POST /api/admin/events/override` (header: `x-admin-key`)
- `POST /api/admin/fixtures/sync` (header: `x-admin-key`)
