import { prisma } from "@/lib/db/prisma";

async function run() {
  const users = await prisma.user.findMany({ take: 10000, orderBy: { points: "desc" } });

  await prisma.leaderboardSnapshot.deleteMany({ where: { period: "TOURNAMENT", periodKey: "wc2026" } });

  if (users.length > 0) {
    await prisma.leaderboardSnapshot.createMany({
      data: users.map((u, idx) => ({
        period: "TOURNAMENT",
        periodKey: "wc2026",
        rank: idx + 1,
        userId: u.id,
        points: u.points,
        xp: u.xp
      }))
    });
  }

  console.log(`leaderboard rows=${users.length}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
