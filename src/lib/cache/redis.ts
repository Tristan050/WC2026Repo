import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not configured");
    redis = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
  }
  return redis;
}
