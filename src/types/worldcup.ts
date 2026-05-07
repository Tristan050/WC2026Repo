export type MatchStage =
  | "GROUP"
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "THIRD_PLACE"
  | "FINAL";

export type MatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "HALFTIME"
  | "EXTRA_TIME"
  | "PENALTIES"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELED";

export interface TeamSlotRef {
  id: string;
  kind: "TEAM" | "GROUP_PLACEHOLDER" | "BRACKET_PLACEHOLDER";
  label: string;
  teamId?: string;
}

export interface MatchDTO {
  id: string;
  slug: string;
  stage: MatchStage;
  matchNumber: number;
  kickoffUtc: string;
  kickoffTimezone: string;
  status: MatchStatus;
  predictionStatus: "COMING_SOON" | "OPEN" | "LOCKED" | "SCORED";
  stadium: {
    id: string;
    name: string;
    city: string;
    timezone: string;
  };
  home: TeamSlotRef;
  away: TeamSlotRef;
  score: {
    home: number;
    away: number;
    homePen?: number | null;
    awayPen?: number | null;
  };
}

export interface LiveEventMessage {
  eventId: string;
  matchId: string;
  sequence: number;
  type:
    | "GOAL"
    | "YELLOW_CARD"
    | "RED_CARD"
    | "SUBSTITUTION"
    | "PENALTY_SCORED"
    | "PENALTY_MISSED"
    | "VAR_CHECK"
    | "VAR_OVERTURN"
    | "FULL_TIME";
  minute?: number;
  teamSlotId?: string;
  playerName?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface PredictionWindowMessage {
  windowId: string;
  matchId: string;
  status: "OPEN" | "LOCKED" | "SCORED";
  openAt: string;
  lockAt: string;
  resolveAt?: string;
}
