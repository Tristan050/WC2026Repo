import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyAdminRequest } from "@/lib/security/admin-guard";
import { applyRateLimit } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  matchId: z.string().min(1),
  sequence: z.number().int().positive(),
  type: z.enum([
    "KICKOFF","GOAL","OWN_GOAL","PENALTY_AWARDED","PENALTY_SCORED","PENALTY_MISSED",
    "YELLOW_CARD","RED_CARD","SUBSTITUTION","VAR_CHECK","VAR_OVERTURN","INJURY_TIME","HALF_TIME","FULL_TIME"
  ]),
  minute: z.number().int().min(0).max(130).optional(),
  teamSlotId: z.string().optional(),
  playerName: z.string().optional(),
  subject: z.string().optional(),
  payload: z.record(z.any()).optional(),
  note: z.string().optional()
});

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, { key: "admin-events", limit: 30, windowSeconds: 60 });
  if (limited) return limited;

  const denied = verifyAdminRequest(req);
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const event = await prisma.matchEvent.create({
    data: {
      matchId: payload.matchId,
      sequence: payload.sequence,
      type: payload.type,
      minute: payload.minute,
      teamSlotId: payload.teamSlotId,
      playerName: payload.playerName,
      subject: payload.subject,
      payload: payload.payload
    }
  });

  await prisma.adminAuditLog.create({
    data: {
      adminUserId: "admin_system",
      action: "EVENT_OVERRIDE",
      entityType: "MatchEvent",
      entityId: event.id,
      note: payload.note,
      payload: payload as unknown as object
    }
  });

  return NextResponse.json({ ok: true, eventId: event.id });
}
