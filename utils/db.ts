import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
      max: Number(process.env.DB_POOL_MAX ?? 3),
    }),
  });

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
