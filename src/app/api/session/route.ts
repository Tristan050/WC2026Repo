import type { NextRequest } from "next/server";
import { ensureSessionResponse } from "@/lib/session/user-session";
import { applyRateLimit } from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, { key: "session", limit: 60, windowSeconds: 60 });
  if (limited) return limited;
  return ensureSessionResponse(req);
}
