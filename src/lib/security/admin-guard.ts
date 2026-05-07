import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/security/crypto";

export function verifyAdminRequest(req: NextRequest) {
  const apiKey = req.headers.get("x-admin-key") ?? "";
  const expected = process.env.ADMIN_API_KEY ?? "";

  if (!expected || expected === "dev-admin-key") {
    return NextResponse.json({ error: "Admin key is not configured securely" }, { status: 503 });
  }

  if (!safeEqual(apiKey, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allow = process.env.ADMIN_IP_ALLOWLIST;
  if (allow) {
    const allowSet = new Set(allow.split(",").map((x) => x.trim()).filter(Boolean));
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
    if (!allowSet.has(ip)) {
      return NextResponse.json({ error: "IP not allowed" }, { status: 403 });
    }
  }

  return null;
}
