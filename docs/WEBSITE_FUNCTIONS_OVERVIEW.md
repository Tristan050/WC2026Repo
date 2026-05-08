# WorldCupClutch - Current Website Function Overview

This document describes what the website currently does, based on the codebase as of May 7, 2026.

## 1) Product Summary

WorldCupClutch (PredictBattle WC26) is a Next.js app for World Cup prediction gameplay.
Users can:
- view live/upcoming matches
- see bracket-stage fixture counts
- submit predictions during open windows
- track tournament leaderboard snapshots

The app uses:
- PostgreSQL via Prisma (`DATABASE_URL`)
- Redis for rate limiting and event publish (`REDIS_URL`)

## 2) Frontend Features

Main page: `/`
- Auto-calls `/api/session` to ensure a signed user session cookie exists.
- Loads match data from:
  - `/api/matches/live`
  - `/api/matches/bracket`
- Auto-refreshes data every 30 seconds.
- Shows:
  - live/upcoming match list (selectable)
  - active prediction card (home/away/draw)
  - stage tiles with fixture counts
  - simple KPIs (hardcoded total matches/windows + computed next kickoff countdown)
- Shows toast error if initial data/session flow fails:
  - `"Could not load live data. Check API/DB connection."`

Prediction interactions
- Buttons submit to `/api/predictions/submit` with:
  - `windowId`
  - `choice` (`HOME`, `AWAY`, `DRAW` in current UI)
  - `confidence` (currently fixed `3`)

## 3) Session & Identity

Endpoint: `GET /api/session`
- Rate limited.
- Creates/reuses cookie `pb_uid`.
- Cookie value is HMAC-signed with `SESSION_SECRET`.
- If session does not exist, creates UUID-based user identity.

Session implementation details
- Cookie name: `pb_uid`
- SameSite: `lax`
- HttpOnly: true
- Secure: true in production
- Max age: 30 days

## 4) Public API Endpoints

### `GET /api/matches/live`
- Returns live/in-play matches plus near-window matches.
- Primary query includes:
  - statuses: `LIVE`, `HALFTIME`, `EXTRA_TIME`, `PENALTIES`
  - kickoff window: from 2h ago to 24h ahead
- Includes:
  - stadium
  - home/away slots
  - prediction windows (`OPEN`, `SCHEDULED`, `LOCKED`)
- Fallback: if none found, returns next 20 upcoming matches.

### `GET /api/matches/bracket`
- Returns knockout stages grouped by:
  - `ROUND_OF_32`, `ROUND_OF_16`, `QUARTER_FINAL`, `SEMI_FINAL`, `THIRD_PLACE`, `FINAL`
- Includes home/away slot objects per match.

### `GET /api/matches/[matchId]`
- Returns one match detail by ID with:
  - stadium
  - home/away slots with team relation
  - up to 300 ordered events
  - prediction windows
- Returns 404 if missing.

### `POST /api/predictions/submit`
- Rate limited.
- Requires valid session cookie (`/api/session` first).
- Validates JSON payload via Zod:
  - `windowId` string
  - `choice` string
  - optional `confidence` int 1-5
- Validates that prediction window exists and is `OPEN`.
- Upserts a user record (username format: `fan_<first8OfSessionId>`).
- Upserts one pick per user per window.

### `GET /api/leaderboard/global`
- Returns top 100 rows from `LeaderboardSnapshot`
- Filter: period `TOURNAMENT`, periodKey `wc2026`
- Ordered by ascending rank.

## 5) Admin API Endpoints

All admin endpoints use:
- API key header: `x-admin-key`
- `ADMIN_API_KEY` must be set and not equal to `dev-admin-key`
- optional IP allowlist (`ADMIN_IP_ALLOWLIST`, comma-separated)
- route-level rate limiting

### `POST /api/admin/fixtures/sync`
- Runs official fixture sync from JSON file:
  - `seeds/json/worldcup_2026_official_fixtures.json`
- Updates match metadata by `matchNumber`:
  - stage, kickoff UTC/timezone, stadium, slot bindings
- Returns `{ ok: true, updated: <count> }`

### `POST /api/admin/events/override`
- Creates manual match events (override/admin injection).
- Validates payload with Zod (matchId, sequence, event type, optional metadata).
- Writes to:
  - `MatchEvent`
  - `AdminAuditLog` (action `EVENT_OVERRIDE`)

## 6) Background Jobs / Workers / Cron

### `worker:windows` (`src/workers/prediction-window.runner.ts`)
- Opens scheduled windows whose `openAt <= now`.
- Locks open windows whose `lockAt <= now`.

### `worker:events` (`src/workers/match-event.runner.ts`)
- Loads recent events (last 5 minutes, up to 500).
- Publishes each event to Redis channel:
  - `wc26:match:<matchId>:events`

### `worker:leaderboard` (`src/workers/leaderboard.runner.ts`)
- Rebuilds tournament leaderboard snapshots:
  - reads users by points desc
  - clears existing `TOURNAMENT/wc2026` rows
  - inserts ranked snapshot rows

### `cron:tick` (`src/cron/tick.ts`)
- Sequentially imports/runs:
  - prediction window runner
  - leaderboard runner
  - match-event runner
- Logs `"tick complete"`.

## 7) Websocket/Gateway Status

`src/ws/gateway.ts` is currently a stub HTTP server, not a full websocket implementation.
- Health response example: `{ ok: true, service: "ws-gateway-stub" }`

Channel naming utilities exist in `src/ws/channels.ts`:
- match event
- match state
- leaderboard
- prediction window

## 8) Data Model (High-Level)

Core Prisma entities:
- `Team`, `Stadium`, `TeamSlot`
- `Match`, `MatchEvent`
- `PredictionWindow`, `UserPick`
- `User`, `UserAward`
- `LeaderboardSnapshot`
- `AdminAuditLog`

Important enums include:
- `MatchStage`, `MatchStatus`, `PredictionStatus`
- `EventType`, `WindowStatus`, `PredictionKind`
- `LeaderboardPeriod`, `UserRole`

## 9) Required Environment Variables

Required for production stability:
- `DATABASE_URL` (Supabase/Neon/etc, no localhost)
- `REDIS_URL` (Upstash `rediss://...`)
- `SESSION_SECRET` (>=16 chars; strong random recommended)
- `ADMIN_API_KEY` (strong random, not default)
- `NEXT_PUBLIC_SITE_URL` (e.g. `https://worldcupclutch.com`)

Optional:
- `ADMIN_IP_ALLOWLIST` (comma-separated IPs)

## 10) Operational Notes

- If app errors with missing table (Prisma `P2021`), schema was not applied to target DB yet.
- Run schema + data bootstrap for a fresh DB:
  - `npm run prisma:deploy` (or `npx prisma db push` if migration state mismatch)
  - `npm run seed`
- The homepage can show API/DB error toast if `/api/session` fails (for example, missing Redis or missing `SESSION_SECRET` in production).

