# World Cup 2026 Match Infrastructure (Production Blueprint)

Date baseline: May 6, 2026

## 1) System Overview
Goal: preload and operate all FIFA World Cup 2026 matches (104 target) with live updates, prediction windows, SEO generation, and social virality at million-user scale.

### Text Architecture Diagram
```text
[Sports Data Providers] -> [Ingestion API/Webhooks] -> [Event Queue]
                                               -> [Normalizer Worker]
                                                   -> [Postgres]
                                                   -> [Redis Hot Cache]
                                                   -> [Pub/Sub Channels]
                                                           -> [WebSocket Gateway]
                                                           -> [Edge API]
                                                               -> [Next.js App]
                                                               -> [ISR/SEO Pages]

[Prediction Cron Worker] -> opens/locks/scores windows -> [Postgres + Redis]
[Leaderboard Worker] -> incremental score batches -> [Leaderboard Tables + Redis Sorted Sets]
[Admin Panel] -> override/update/moderate -> [Audit Log + Event Replay]
```

## 2) Full Folder Structure
```text
WC2026/
  prisma/
    schema.prisma
    seed.ts
  seeds/
    sql/
      worldcup_2026_seed.sql
    json/
      worldcup_2026_matches.mock.json
    fixtures/
      match_events.fixture.json
  src/
    app/
      (marketing)/
      (app)/
      api/
        matches/
          live/route.ts
          [matchId]/route.ts
          [matchId]/events/route.ts
        predictions/
          windows/route.ts
          submit/route.ts
          score/route.ts
        leaderboard/
          global/route.ts
          daily/route.ts
        seo/
          regenerate/route.ts
        admin/
          matches/route.ts
          events/override/route.ts
          users/ban/route.ts
          windows/route.ts
    ws/
      channels.ts
      gateway.ts
    workers/
      match-event.worker.ts
      prediction-window.worker.ts
      leaderboard.worker.ts
      seo-generation.worker.ts
    lib/
      cache.ts
      scoring.ts
      bracket-resolver.ts
      share-card.ts
    types/
      worldcup.ts
  docs/
    architecture/
      worldcup_2026_infrastructure.md
```

## 3) Match Modeling Rules
- Group + knockout matches are preloaded.
- Unknown teams use placeholders (`Winner Group A`, `Runner-up Group B`, `Winner Match 81`).
- Resolver job replaces placeholders when source matches finish.
- All times are stored UTC + explicit venue timezone.
- Match rows include score, penalties, timeline support, odds placeholders, stats JSON.

## 4) Placeholder Auto-Replacement Flow
```text
Match finishes -> event FULL_TIME committed -> bracket-resolver finds downstream slots
-> set TeamSlot.kind=TEAM, teamId=<winner>, resolvedAt=now
-> update dependent match SEO metadata + cache invalidation + websocket push
```

## 5) Prediction Window Automation
- `openAt`: auto transitions `SCHEDULED -> OPEN`
- `lockAt`: auto transitions `OPEN -> LOCKED`
- `resolveAt` or terminal event: auto transitions `LOCKED -> SCORED`
- Scoring executed in batches (queue partitioned by matchId).
- Idempotency key: `windowId + scoringVersion`.

## 6) Live Match Engine
Transport and throughput:
- Ingest events into queue first (never direct fanout).
- Normalize to compact payload (delta only).
- Redis pub/sub channels per match and per leaderboard.
- WebSocket gateway sends diff frames every 500ms batch window.

Event types supported:
- goal, cards, substitutions, penalties, VAR, halftime/fulltime
- streak updates and leaderboard updates are emitted as separate channels.

## 7) SEO/ISR System
Pre-generate before tournament:
- every match page
- every team page
- every stadium page
- bracket pages
- coming-soon pages
- prediction articles
- trending player pages

Runtime:
- ISR for semi-static pages (revalidate 60-300s).
- dynamic metadata and OG image endpoints.
- sitemap split files: matches, teams, stadiums, predictions, players.

## 8) Viral/Social Automation
Auto-generated assets:
- prediction win cards
- upset cards
- streak cards
- "I predicted this" cards
- creator challenge links with referral params

Card pipeline:
- deterministic template + user score/streak + match context
- edge image generation + CDN cache

## 9) Indexing & DB Performance
Primary indexes already in Prisma schema. Add operational indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_event_match_sequence ON "MatchEvent"("matchId", sequence);
CREATE INDEX IF NOT EXISTS idx_pick_window_user ON "UserPick"("predictionWindowId", "userId");
CREATE INDEX IF NOT EXISTS idx_match_status_kickoff ON "Match"(status, "kickoffUtc");
```

Leaderboard optimization:
- write source-of-truth points to Postgres ledger
- maintain Redis sorted sets for hot reads
- snapshot back to `LeaderboardSnapshot` every N minutes

## 10) API Examples
```http
GET /api/matches/live
200 [{"id":"match_081","status":"LIVE","minute":67,...}]
```

```http
POST /api/predictions/submit
{
  "windowId":"pw_match_081_match_winner",
  "choice":"HOME"
}
201 {"ok":true,"locked":false}
```

```http
POST /api/admin/events/override
{
  "matchId":"match_081",
  "type":"GOAL",
  "minute":72,
  "teamSlotId":"slot_group_a_1",
  "reason":"manual correction"
}
```

## 11) Admin Panel (Lightweight)
Views:
- Matches table (status, stage, kickoff, slot labels)
- Event timeline editor with replay
- Prediction windows manager
- Anti-cheat center (suspicious velocity/device/fingerprint)
- Live ops metrics (queue lag, ws connected, cache hit)

## 12) Mobile UX Direction
- Vertical swipe-first prediction cards (Tinder-like)
- Live ticker and short-form event chips (TikTok pace)
- Thumb zone CTA at bottom sticky rail
- Haptics-like visual pulses, optimistic UI

Microinteractions:
- swipe confirm snap
- streak flame grows on consecutive wins
- glow pulse for upset hit
- skeleton shimmers on live card loading

Suggested audio:
- soft "tick" on submit
- low boom on goal event
- bright ping on correct pick
- subtle fail tone on miss

## 13) Gamification
- XP, streak, rank tiers
- upset multiplier
- seasonal rewards (matchday badges)
- creator badges and custom challenge rooms

## 14) Caching Strategy
- Cloudflare CDN for static + OG cards
- Redis for live snapshots (TTL 2-5s)
- Cache keys: `m:{id}:state`, `m:{id}:events:last`, `lb:{period}`
- SWR on client to reduce rerenders

## 15) Deployment Setup
- Frontend/API: Vercel
- Postgres: Supabase or Railway Postgres
- Redis: Upstash/Redis Cloud
- Queue/cron: QStash + Vercel cron or Railway workers
- Edge caching/WAF: Cloudflare

## 16) Scale Strategy (Millions)
- Event-driven writes, batched scoring
- WebSocket diff compression
- regional read replicas
- fallback long polling on ws pressure
- backpressure + queue retry with dead-letter

## 17) Auto-Generated Content Matrix
- Match pages: kickoff, slots, odds placeholders, countdown
- Prediction pages: active windows + lock timers
- Country pages: schedule, fan ranking, streak heroes
- Stadium pages: hosted matches + city guide hooks
- Bracket pages: live placeholder resolution
- Coming-soon pages: for unresolved knockout fixtures

## 18) Launch Checklist
- [ ] Run Prisma migration
- [ ] Seed 104 matches and placeholder slots
- [ ] Verify prediction window scheduler
- [ ] Generate initial sitemaps + OG cards
- [ ] Enable analytics + error tracking
- [ ] Validate mobile Web Vitals
- [ ] Dry-run admin override workflows

## 19) Production Checklist
- [ ] Queue lag alarms + pager
- [ ] Redis memory policy configured
- [ ] DB connection pooling + pgbouncer
- [ ] API rate limiting + bot mitigation
- [ ] Daily backup and recovery drill
- [ ] Canary release flow for scoring logic
- [ ] Incident runbook for data feed outage
