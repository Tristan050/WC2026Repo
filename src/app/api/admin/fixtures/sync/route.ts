import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { syncOfficialFixturesFromFile } from "@/lib/fixtures/sync-official-fixtures";
import { verifyAdminRequest } from "@/lib/security/admin-guard";
import { applyRateLimit } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, { key: "admin-sync", limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  const denied = verifyAdminRequest(req);
  if (denied) return denied;

  const result = await syncOfficialFixturesFromFile();
  return NextResponse.json({ ok: true, ...result });
}
