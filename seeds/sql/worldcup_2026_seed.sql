-- World Cup 2026 foundational seed (stadiums/teams/slots/matches skeleton)
-- Generated date baseline: 2026-05-06

BEGIN;

INSERT INTO "Stadium" (id, name, slug, city, country, timezone, "createdAt", "updatedAt") VALUES
('stad_azteca', 'Estadio Azteca', 'estadio-azteca', 'Mexico City', 'Mexico', 'America/Mexico_City', NOW(), NOW()),
('stad_metlife', 'MetLife Stadium', 'metlife-stadium', 'New York/New Jersey', 'USA', 'America/New_York', NOW(), NOW()),
('stad_bmo', 'BMO Field', 'bmo-field', 'Toronto', 'Canada', 'America/Toronto', NOW(), NOW());

INSERT INTO "TeamSlot" (id, kind, label, "groupCode", "groupPosition", "createdAt", "updatedAt") VALUES
('slot_group_a_winner', 'GROUP_PLACEHOLDER', 'Winner Group A', 'A', 1, NOW(), NOW()),
('slot_group_b_runner', 'GROUP_PLACEHOLDER', 'Runner-up Group B', 'B', 2, NOW(), NOW());

INSERT INTO "Match" (
  id, slug, stage, "matchNumber", "kickoffUtc", "kickoffTimezone", status, "predictionStatus",
  "stadiumId", "homeSlotId", "awaySlotId", "homeScore", "awayScore", "createdAt", "updatedAt"
) VALUES
(
  'match_081',
  'world-cup-2026-round-of-32-1-winner-group-a-vs-runner-up-group-b',
  'ROUND_OF_32',
  81,
  '2026-06-30T18:00:00Z',
  'UTC',
  'SCHEDULED',
  'COMING_SOON',
  'stad_metlife',
  'slot_group_a_winner',
  'slot_group_b_runner',
  0,
  0,
  NOW(),
  NOW()
);

COMMIT;
