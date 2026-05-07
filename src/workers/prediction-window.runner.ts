import { prisma } from "@/lib/db/prisma";

async function run() {
  const now = new Date();

  const opened = await prisma.predictionWindow.updateMany({
    where: { status: "SCHEDULED", openAt: { lte: now } },
    data: { status: "OPEN" }
  });

  const locked = await prisma.predictionWindow.updateMany({
    where: { status: "OPEN", lockAt: { lte: now } },
    data: { status: "LOCKED" }
  });

  console.log(`opened=${opened.count} locked=${locked.count}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
