import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRedis } from "@/lib/cache/redis";

type RateLimitConfig = {
  key: string;
  limit: number;
  windowSeconds: number;
};

export async function applyRateLimit(req: NextRequest, cfg: RateLimitConfig) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const k = `rl:${cfg.key}:${ip}`;
  const redis = getRedis();
  if (redis.status !== "ready") await redis.connect();

  const count = await redis.incr(k);
  if (count === 1) await redis.expire(k, cfg.windowSeconds);

  if (count > cfg.limit) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "retry-after": String(cfg.windowSeconds) }
      }
    );
  }

  return null;
}
