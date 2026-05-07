import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { signValue, verifySignedValue } from "@/lib/security/crypto";

const COOKIE_NAME = "pb_uid";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function getSessionUserId(req: NextRequest) {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifySignedValue(raw);
}

export function ensureSessionResponse(req: NextRequest) {
  const existing = getSessionUserId(req);
  const userId = existing ?? randomUUID();

  const res = NextResponse.json({ ok: true, userId, isNew: !existing });
  if (!existing) {
    res.cookies.set({
      name: COOKIE_NAME,
      value: signValue(userId),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS
    });
  }

  return res;
}
