import { prisma } from "@/lib/db/prisma";
import { getRedis } from "@/lib/cache/redis";
import { CHANNELS } from "@/ws/channels";

async function run() {
  const redis = getRedis();
  await redis.connect();

  const pending = await prisma.matchEvent.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
    orderBy: [{ matchId: "asc" }, { sequence: "asc" }],
    take: 500
  });

  for (const event of pending) {
    await redis.publish(CHANNELS.MATCH_EVENT(event.matchId), JSON.stringify(event));
  }

  await redis.quit();
  console.log(`published ${pending.length} recent events`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
