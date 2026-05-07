-- CreateEnum
CREATE TYPE "MatchStage" AS ENUM ('GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'HALFTIME', 'EXTRA_TIME', 'PENALTIES', 'FINISHED', 'POSTPONED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('COMING_SOON', 'OPEN', 'LOCKED', 'SCORED');

-- CreateEnum
CREATE TYPE "TeamSlotKind" AS ENUM ('TEAM', 'GROUP_PLACEHOLDER', 'BRACKET_PLACEHOLDER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('KICKOFF', 'GOAL', 'OWN_GOAL', 'PENALTY_AWARDED', 'PENALTY_SCORED', 'PENALTY_MISSED', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'VAR_CHECK', 'VAR_OVERTURN', 'INJURY_TIME', 'HALF_TIME', 'FULL_TIME');

-- CreateEnum
CREATE TYPE "WindowStatus" AS ENUM ('SCHEDULED', 'OPEN', 'LOCKED', 'SCORED');

-- CreateEnum
CREATE TYPE "PredictionKind" AS ENUM ('MATCH_WINNER', 'NEXT_GOAL_TEAM', 'BOTH_TEAMS_SCORE', 'TOTAL_GOALS_OVER_UNDER', 'FIRST_CARD_TEAM', 'CLEAN_SHEET', 'PENALTY_IN_MATCH', 'UPSET_PICK');

-- CreateEnum
CREATE TYPE "LeaderboardPeriod" AS ENUM ('DAILY', 'MATCHDAY', 'TOURNAMENT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "fifaCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "confederation" TEXT,
    "isQualified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stadium" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stadium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSlot" (
    "id" TEXT NOT NULL,
    "kind" "TeamSlotKind" NOT NULL,
    "label" TEXT NOT NULL,
    "groupCode" TEXT,
    "groupPosition" INTEGER,
    "sourceMatchId" TEXT,
    "sourceMatchOutcome" TEXT,
    "teamId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "slug" TEXT NOT NULL,
    "stage" "MatchStage" NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "kickoffUtc" TIMESTAMP(3) NOT NULL,
    "kickoffTimezone" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "predictionStatus" "PredictionStatus" NOT NULL DEFAULT 'COMING_SOON',
    "stadiumId" TEXT NOT NULL,
    "homeSlotId" TEXT NOT NULL,
    "awaySlotId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL DEFAULT 0,
    "awayScore" INTEGER NOT NULL DEFAULT 0,
    "homeScorePenalties" INTEGER,
    "awayScorePenalties" INTEGER,
    "minute" INTEGER,
    "second" INTEGER,
    "stoppageMinute" INTEGER,
    "oddsHomeWin" DECIMAL(8,3),
    "oddsDraw" DECIMAL(8,3),
    "oddsAwayWin" DECIMAL(8,3),
    "statsJson" JSONB,
    "lineupJson" JSONB,
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "minute" INTEGER,
    "second" INTEGER,
    "stoppageMinute" INTEGER,
    "type" "EventType" NOT NULL,
    "teamSlotId" TEXT,
    "playerName" TEXT,
    "assistName" TEXT,
    "subject" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionWindow" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "kind" "PredictionKind" NOT NULL,
    "title" TEXT NOT NULL,
    "openAt" TIMESTAMP(3) NOT NULL,
    "lockAt" TIMESTAMP(3) NOT NULL,
    "resolveAt" TIMESTAMP(3),
    "status" "WindowStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scoringRuleJson" JSONB NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictionWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "points" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streakCurrent" INTEGER NOT NULL DEFAULT 0,
    "streakBest" INTEGER NOT NULL DEFAULT 0,
    "bannedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPick" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "predictionWindowId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "confidence" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scoredAt" TIMESTAMP(3),
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "isCorrect" BOOLEAN,

    CONSTRAINT "UserPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "period" "LeaderboardPeriod" NOT NULL,
    "periodKey" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "xp" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "note" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_fifaCode_key" ON "Team"("fifaCode");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Stadium_slug_key" ON "Stadium"("slug");

-- CreateIndex
CREATE INDEX "TeamSlot_kind_groupCode_groupPosition_idx" ON "TeamSlot"("kind", "groupCode", "groupPosition");

-- CreateIndex
CREATE INDEX "TeamSlot_sourceMatchId_idx" ON "TeamSlot"("sourceMatchId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_externalId_key" ON "Match"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_slug_key" ON "Match"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Match_matchNumber_key" ON "Match"("matchNumber");

-- CreateIndex
CREATE INDEX "Match_kickoffUtc_idx" ON "Match"("kickoffUtc");

-- CreateIndex
CREATE INDEX "Match_stage_kickoffUtc_idx" ON "Match"("stage", "kickoffUtc");

-- CreateIndex
CREATE INDEX "Match_status_kickoffUtc_idx" ON "Match"("status", "kickoffUtc");

-- CreateIndex
CREATE INDEX "Match_predictionStatus_kickoffUtc_idx" ON "Match"("predictionStatus", "kickoffUtc");

-- CreateIndex
CREATE INDEX "MatchEvent_matchId_createdAt_idx" ON "MatchEvent"("matchId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchEvent_matchId_sequence_key" ON "MatchEvent"("matchId", "sequence");

-- CreateIndex
CREATE INDEX "PredictionWindow_matchId_status_idx" ON "PredictionWindow"("matchId", "status");

-- CreateIndex
CREATE INDEX "PredictionWindow_openAt_lockAt_idx" ON "PredictionWindow"("openAt", "lockAt");

-- CreateIndex
CREATE INDEX "PredictionWindow_kind_status_idx" ON "PredictionWindow"("kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "UserPick_predictionWindowId_submittedAt_idx" ON "UserPick"("predictionWindowId", "submittedAt");

-- CreateIndex
CREATE INDEX "UserPick_userId_scoredAt_idx" ON "UserPick"("userId", "scoredAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPick_userId_predictionWindowId_key" ON "UserPick"("userId", "predictionWindowId");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_period_periodKey_rank_idx" ON "LeaderboardSnapshot"("period", "periodKey", "rank");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_userId_period_createdAt_idx" ON "LeaderboardSnapshot"("userId", "period", "createdAt");

-- CreateIndex
CREATE INDEX "UserAward_userId_awardedAt_idx" ON "UserAward"("userId", "awardedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAward_userId_badgeCode_key" ON "UserAward"("userId", "badgeCode");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entityType_entityId_createdAt_idx" ON "AdminAuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminUserId_createdAt_idx" ON "AdminAuditLog"("adminUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "TeamSlot" ADD CONSTRAINT "TeamSlot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_stadiumId_fkey" FOREIGN KEY ("stadiumId") REFERENCES "Stadium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeSlotId_fkey" FOREIGN KEY ("homeSlotId") REFERENCES "TeamSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awaySlotId_fkey" FOREIGN KEY ("awaySlotId") REFERENCES "TeamSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionWindow" ADD CONSTRAINT "PredictionWindow_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPick" ADD CONSTRAINT "UserPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPick" ADD CONSTRAINT "UserPick_predictionWindowId_fkey" FOREIGN KEY ("predictionWindowId") REFERENCES "PredictionWindow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAward" ADD CONSTRAINT "UserAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
