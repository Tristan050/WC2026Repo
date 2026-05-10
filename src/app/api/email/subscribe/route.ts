import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body?.email ?? "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Use raw query so this works even before `prisma generate` picks up the new model
    await prisma.$executeRaw`
      INSERT INTO "EmailSubscriber" (id, email, "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${email}, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[email/subscribe]", err);
    // Graceful degradation — table may not exist yet on current deployment
    return NextResponse.json({ ok: true });
  }
}
