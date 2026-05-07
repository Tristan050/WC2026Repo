import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getSessionUserId } from "@/lib/session/user-session";
import { applyRateLimit } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  windowId: z.string().min(1),
  choice: z.string().min(1),
  confidence: z.number().int().min(1).max(5).optional()
});

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, { key: "pred-submit", limit: 20, windowSeconds: 60 });
  if (limited) return limited;

  const sessionUserId = getSessionUserId(req);
  if (!sessionUserId) {
    return NextResponse.json({ error: "Session required. Call /api/session first." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { windowId, choice, confidence } = parsed.data;

  const window = await prisma.predictionWindow.findUnique({ where: { id: windowId } });
  if (!window) return NextResponse.json({ error: "Prediction window not found" }, { status: 404 });
  if (window.status !== "OPEN") return NextResponse.json({ error: "Window is not open" }, { status: 409 });
  const username = `fan_${sessionUserId.slice(0, 8)}`;
  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: { id: sessionUserId, username }
  });

  const pick = await prisma.userPick.upsert({
    where: { userId_predictionWindowId: { userId: user.id, predictionWindowId: windowId } },
    update: { choice, confidence },
    create: { userId: user.id, predictionWindowId: windowId, choice, confidence }
  });

  return NextResponse.json({ ok: true, pickId: pick.id, userId: user.id });
}
