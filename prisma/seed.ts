import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.muscle.createMany({
    data: [
      { name: "Chest", category: "upper-body" },
      { name: "Back", category: "upper-body" },
      { name: "Legs", category: "lower-body" },
      { name: "Shoulders", category: "upper-body" },
      { name: "Arms", category: "upper-body" },
      { name: "Core", category: "core" },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
