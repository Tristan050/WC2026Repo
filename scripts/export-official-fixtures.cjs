const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

(async () => {
  const rows = await prisma.match.findMany({ orderBy: { matchNumber: 'asc' }, include: { stadium: true } });
  const payload = {
    version: new Date().toISOString().slice(0, 10),
    source: 'local-db-export',
    generatedAt: new Date().toISOString(),
    fixtures: rows.map(r => ({
      matchNumber: r.matchNumber,
      stage: r.stage,
      kickoffUtc: r.kickoffUtc.toISOString(),
      kickoffTimezone: r.kickoffTimezone,
      stadiumSlug: r.stadium.slug,
      homeSlotId: r.homeSlotId,
      awaySlotId: r.awaySlotId
    }))
  };

  const out = path.join(process.cwd(), 'seeds', 'json', 'worldcup_2026_official_fixtures.json');
  fs.writeFileSync(out, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`exported ${payload.fixtures.length} fixtures to ${out}`);
  await prisma.$disconnect();
})();
