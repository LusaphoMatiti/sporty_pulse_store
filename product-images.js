import fs from "node:fs/promises";
import path from "node:path";

// Adjust this if your seed file lives somewhere else in the repo.
const SEED_PATH = path.resolve("prisma/seed.ts");
const OUT_DIR = path.resolve("product-images-original");

const STORAGE_BASE =
  "https://xewudrozihbinbtsihvw.supabase.co/storage/v1/object/public/loomora-bucket/";

async function main() {
  const source = await fs.readFile(SEED_PATH, "utf8");

  const matches = [...source.matchAll(/imageUrl\(\s*"([^"]+)"\s*\)/g)];
  const filenames = [...new Set(matches.map((m) => m[1]))];

  if (filenames.length === 0) {
    console.error(
      `No imageUrl(...) calls found in ${SEED_PATH}. Check the path is correct.`,
    );
    process.exit(1);
  }

  console.log(`Found ${filenames.length} unique image(s) in seed.ts`);

  await fs.mkdir(OUT_DIR, { recursive: true });

  let succeeded = 0;
  let failed = 0;

  for (const filename of filenames) {
    const url = STORAGE_BASE + encodeURIComponent(filename);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`  Failed (${res.status}): ${filename}`);
        failed++;
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(path.join(OUT_DIR, filename), buffer);
      console.log(`  Downloaded: ${filename}`);
      succeeded++;
    } catch (err) {
      console.error(`  Error downloading ${filename}:`, err.message);
      failed++;
    }
  }

  console.log(
    `\nDone. ${succeeded} downloaded, ${failed} failed. Saved to ${OUT_DIR}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
