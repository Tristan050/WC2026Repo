export const CHANNELS = {
  MATCH_EVENT: (matchId: string) => `wc26:match:${matchId}:events`,
  MATCH_STATE: (matchId: string) => `wc26:match:${matchId}:state`,
  LEADERBOARD: (period: string) => `wc26:leaderboard:${period}`,
  PREDICTION_WINDOW: (matchId: string) => `wc26:match:${matchId}:windows`
};

export type EngineEvent =
  | { type: "MATCH_EVENT_INGESTED"; matchId: string; sequence: number }
  | { type: "PREDICTION_WINDOW_OPEN"; windowId: string; matchId: string }
  | { type: "PREDICTION_WINDOW_LOCK"; windowId: string; matchId: string }
  | { type: "PREDICTION_WINDOW_SCORED"; windowId: string; matchId: string }
  | { type: "LEADERBOARD_REFRESH"; period: "DAILY" | "MATCHDAY" | "TOURNAMENT" };
