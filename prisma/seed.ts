// Prisma seed: CSV veri setini içe aktarır (idempotent)
import { runImport } from "../scripts/import-csv";
import { prisma } from "../src/lib/prisma";

runImport()
  .then(async () => {
    console.log("\nSeed tamamlandı.");
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Seed hatası:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
