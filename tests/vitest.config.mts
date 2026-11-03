import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    // Matches the "@/..." import alias used across the project.
    alias: { "@": root },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      // Safety net: these tests replace the database completely. If a test
      // ever imported the real Prisma client by accident, it would fail to
      // connect instead of touching your Supabase database.
      DATABASE_URL: "postgresql://nobody:nothing@127.0.0.1:1/never_used",
      DIRECT_URL: "postgresql://nobody:nothing@127.0.0.1:1/never_used",
    },
  },
});
