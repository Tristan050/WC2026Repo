import { syncOfficialFixturesFromFile } from "@/lib/fixtures/sync-official-fixtures";

async function run() {
  const result = await syncOfficialFixturesFromFile();
  console.log(`official fixtures synced: ${result.updated}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
