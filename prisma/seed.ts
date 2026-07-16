import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const STORAGE_BASE =
  "https://xewudrozihbinbtsihvw.supabase.co/storage/v1/object/public/loomora-bucket/";

const imageUrl = (filename: string) =>
  STORAGE_BASE + encodeURIComponent(filename);

// NOTE: Full-body and Recovery were added here as proper badge categories
// (not just top-level `muscle` scalar values) because several products
// belong to more than one group at once -- e.g. Resistance Bands is
// Chest + Shoulders + Arms + Core + Legs + Recovery simultaneously, which
// the single `muscle` scalar field on Products can't represent. Grouping
// now runs entirely through productMuscles badges for consistency.
const MUSCLES = [
  { name: "Chest", category: "upper-body" },
  { name: "Back", category: "upper-body" },
  { name: "Legs", category: "lower-body" },
  { name: "Shoulders", category: "upper-body" },
  { name: "Arms", category: "upper-body" },
  { name: "Core", category: "core" },
  { name: "Full-body", category: "full-body" },
  { name: "Recovery", category: "recovery" },
] as const;

type ProductSeed = {
  name: string;
  company: string;
  description: string;
  price: number; // whole Rand -- matches how checkout/PayFast already read this field
  image: string;
  featured: boolean;
  category: "fitness" | "recovery";
  muscle: "full-body" | "upper-body" | "lower-body" | "core" | "recovery";
  muscleBadges: string[]; // matched against MUSCLES by name
};

const PRODUCTS: ProductSeed[] = [
  {
    name: "Push-Up Handlers",
    company: "Sporty Pulse",
    description:
      "Rotating grips engineered to take pressure off the wrists while deepening your push-up range of motion. The freely spinning handles let your hands track naturally through the movement, reducing joint strain during high-volume sessions. A compact, travel-friendly addition to any chest or arm-focused routine, at home or on the road.",
    price: 180,
    image: imageUrl("1772573627753-Pushup handles.jpg"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Chest", "Shoulders", "Arms", "Core"],
  },
  {
    name: "Resistance Bands (Set)",
    company: "Sporty Pulse",
    description:
      "A graduated set of resistance bands covering everything from light mobility work to heavy-load strength training. Durable, portable, and endlessly versatile, they scale to any exercise -- presses, rows, squats, or core rotations -- and pack down small enough to travel anywhere. A genuine full-body training system in a single pouch.",
    price: 330,
    image: imageUrl("1772642622870-Resistance bands.webp"),
    featured: true,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: [
      "Chest",
      "Back",
      "Shoulders",
      "Arms",
      "Core",
      "Legs",
      "Recovery",
      "Full-body",
    ],
  },
  {
    name: "Weight Plate (20kg)",
    company: "Sporty Pulse",
    description:
      "A standard 20kg cast iron plate built for serious progressive loading. Whether stacked on a barbell for presses or held for weighted movements, it delivers the dense, stable resistance needed to build real chest and upper-body strength over time. A foundational piece for any home strength setup.",
    price: 800,
    image: imageUrl("1767542523631-weight_plate.jpg"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Chest", "Back", "Shoulders", "Core", "Legs", "Full-body"],
  },
  {
    name: "Yoga Mat",
    company: "Sporty Pulse",
    description:
      "A cushioned, non-slip mat that gives you a stable, comfortable surface for yoga, stretching, and floor-based training. The dense foam absorbs impact during core work while the grippy texture holds firm through sweat and movement. Equally at home in a chest-and-core session or a slow, deliberate recovery flow.",
    price: 250,
    image: imageUrl("1772637273304-Yoga_mat.webp"),
    featured: false,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Chest", "Core", "Recovery", "Legs", "Full-body"],
  },
  {
    name: "Home Dumbbells (2kg Pair)",
    company: "Sporty Pulse",
    description:
      "A lightweight pair of dumbbells suited to toning work, higher-rep shoulder isolation, and beginner-friendly strength building. Compact enough to keep within reach for spontaneous sessions, they're the easiest entry point into structured resistance training without committing to a full rack.",
    price: 200,
    image: imageUrl("1772634446303-home_dumbells.jpg"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Chest", "Shoulders", "Arms", "Legs"],
  },
  {
    name: "Kettlebell (12kg)",
    company: "Sporty Pulse",
    description:
      "A versatile 12kg kettlebell built for swings, squats, presses, and full-body conditioning circuits. Its offset center of mass challenges stability and grip in ways a standard dumbbell can't, making it a staple for building explosive power through the shoulders and legs alike.",
    price: 600,
    image: imageUrl("1772635860054-Kettlebells.png"),
    featured: true,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Shoulders", "Back", "Core", "Legs", "Full-body"],
  },
  {
    name: "Sandbag (20kg)",
    company: "Sporty Pulse",
    description:
      "A shifting-load sandbag that forces your stabilizer muscles to work overtime with every rep. Unlike fixed weights, the internal filler moves unpredictably as you carry, press, or squat, building functional strength and control that transfers directly to real-world movement.",
    price: 650,
    image: imageUrl("1772640890934-Sandbag.webp"),
    featured: false,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Shoulders", "Back", "Core", "Legs", "Full-body"],
  },
  {
    name: "Pull-Up Bar (Doorway)",
    company: "Sporty Pulse",
    description:
      "A no-drill doorway bar that turns any hallway into a pull-up station. Quick to mount and remove, it supports pull-ups, chin-ups, and hanging core work -- one of the most efficient full-body movements you can add to a home routine without any dedicated equipment space.",
    price: 300,
    image: imageUrl("1772637154487-Pull-up bar.webp"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Back", "Arms", "Core"],
  },
  {
    name: "Dip Bars",
    company: "Sporty Pulse",
    description:
      "Freestanding parallel bars purpose-built for dips, push-ups, and controlled leg raises. The stable, elevated grip lets you load bodyweight-only movements far more effectively than the floor, making it one of the most efficient tools for building arm and tricep strength at home.",
    price: 1400,
    image: imageUrl("1767536651134-Dip_bars.avif"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Chest", "Shoulders", "Arms", "Core"],
  },
  {
    name: "Ab Wheel",
    company: "Sporty Pulse",
    description:
      "A deceptively simple rolling wheel that exposes weak links in your core fast. Rolling out under control builds deep abdominal and stabilizer strength that crunches alone can't reach, making it one of the highest-return tools for genuine core conditioning.",
    price: 200,
    image: imageUrl("1772570329516-ab_wheel.jpg"),
    featured: false,
    category: "fitness",
    muscle: "core",
    muscleBadges: ["Core", "Shoulders"],
  },
  {
    name: "Medicine Ball (6-8kg)",
    company: "Sporty Pulse",
    description:
      "A weighted ball built for slams, throws, and rotational core training. The added mass turns simple movements into powerful, explosive core work, developing the rotational strength and power transfer that flat, static core exercises tend to miss entirely.",
    price: 650,
    image: imageUrl("1767542652257-Medicine_ball.png"),
    featured: true,
    category: "fitness",
    muscle: "core",
    muscleBadges: ["Core", "Legs", "Shoulders", "Full-body"],
  },
  {
    name: "Stability Ball",
    company: "Sporty Pulse",
    description:
      "A balance-training ball that turns ordinary bodyweight exercises into genuine core and stability challenges. Every rep demands controlled engagement to stay balanced, building the kind of deep core and postural strength that carries over into everything from lifting to daily movement.",
    price: 300,
    image: imageUrl("1772638259600-Stability ball.jpg"),
    featured: false,
    category: "fitness",
    muscle: "core",
    muscleBadges: ["Core", "Back", "Legs"],
  },
  {
    name: "Slider Discs",
    company: "Sporty Pulse",
    description:
      "Low-friction discs that add a sliding, controlled resistance element to core exercises. The instability they introduce forces your core to work continuously through the full range of motion, turning familiar movements like mountain climbers and plank slides into serious core builders.",
    price: 100,
    image: imageUrl("1767538148476-slider_discs.avif"),
    featured: false,
    category: "fitness",
    muscle: "core",
    muscleBadges: ["Core", "Arms", "Legs"],
  },
  {
    name: "Ankle Weights (2kg Pair)",
    company: "Sporty Pulse",
    description:
      "Adjustable ankle weights that add extra resistance to leg lifts, cardio drills, and lower-body conditioning work. Secure, low-profile straps keep them locked in place through fast movement, making them an easy way to progressively overload leg-focused training without extra equipment.",
    price: 200,
    image: imageUrl("1772634151122-ankle_weights.jpg"),
    featured: false,
    category: "fitness",
    muscle: "lower-body",
    muscleBadges: ["Legs"],
  },
  {
    name: "Jump Rope",
    company: "Sporty Pulse",
    description:
      "A speed rope built for fast, efficient cardio and footwork conditioning. Just minutes of skipping raises the heart rate and sharpens coordination in a way few other tools can match, making it one of the most compact and effective full-body warm-up or finisher options available.",
    price: 100,
    image: imageUrl("1772568249311-skipping-rope.avif"),
    featured: false,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Legs", "Arms", "Core", "Full-body"],
  },
  {
    name: "Foam Roller",
    company: "Sporty Pulse",
    description:
      "A firm foam roller for self-myofascial release and post-workout recovery. Rolling out tight muscles after training helps ease soreness, restore range of motion, and speed up recovery between sessions -- an essential companion to any serious full-body training routine.",
    price: 350,
    image: imageUrl("1767538937346-soft-massaging-foam-roller-blue.avif"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Recovery", "Back", "Legs", "Full-body"],
  },
  {
    name: "Adjustable Bench",
    company: "Sporty Pulse",
    description:
      "A multi-incline bench built for presses, rows, and seated dumbbell work. Adjustable positioning lets you target different angles across a full-body routine from a single piece of equipment, making it one of the most versatile additions you can make to a home training space.",
    price: 4000,
    image: imageUrl("1772641809915-Adjustable Bench.jpg"),
    featured: true,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Chest", "Back", "Shoulders", "Arms", "Legs"],
  },
  {
    name: "Massage Ball",
    company: "Sporty Pulse",
    description:
      "A small, firm ball designed for targeted trigger-point release. Its size lets you reach tight, specific spots that larger recovery tools can't -- shoulders, feet, glutes -- delivering precise pressure exactly where you need it after a demanding session.",
    price: 120,
    image: imageUrl("1767539124681-small-massage-ball-black.avif"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Recovery", "Back", "Shoulders", "Legs"],
  },
  {
    name: "Massage Gun",
    company: "Sporty Pulse",
    description:
      "A percussive massage device that delivers fast, deep recovery exactly where muscles need it most. Multiple speed settings and interchangeable heads let you dial in pressure for anything from a light pre-workout activation to deep post-session muscle release.",
    price: 1200,
    image: imageUrl("1767539258614-Massage_gun.jpg"),
    featured: true,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Recovery", "Back", "Legs", "Full-body"],
  },
  {
    name: "Hot/Cold Pack",
    company: "Sporty Pulse",
    description:
      "A reusable gel pack for heat or ice therapy on sore muscles and joints. Heat loosens tight tissue before training while cold reduces inflammation after -- one pack, two essential recovery tools, ready whenever soreness needs attention.",
    price: 180,
    image: imageUrl("1772642849483-Hot_Cold pack.jpg"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Recovery"],
  },
  {
    name: "Epsom Salt (1kg)",
    company: "Sporty Pulse",
    description:
      "Magnesium-rich bath salts that help ease muscle soreness and tension after intense training. A warm soak is one of the simplest, most effective recovery rituals available, easing stiffness while giving both body and mind a genuine chance to reset.",
    price: 80,
    image: imageUrl("1772642954908-Epsom Salt.avif"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Recovery", "Full-body"],
  },
  {
    name: "Adjustable Dumbbell",
    company: "Sporty Pulse",
    description:
      "A space-saving dumbbell with a quick-adjust weight dial for progressive loading. One compact tool replaces an entire rack, letting you scale resistance instantly across chest, arm, and leg movements without breaking your training flow to switch equipment.",
    price: 1999, // confirmed from actual PayFast test data earlier in this project
    image: imageUrl("1772639909761-Adjustable Dumbbell.jpg"),
    featured: true,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Chest", "Back", "Shoulders", "Arms", "Legs", "Full-body"],
  },
  // TODO: replace placeholder image filename and confirm price before seeding.
  // No existing Cloudinary asset for this product yet.
  {
    name: "Stretch Strap",
    company: "Sporty Pulse",
    description:
      "A durable, looped stretch strap that extends your reach for deeper, safer stretching. The multiple grip loops let you ease into hamstring, shoulder, and hip stretches with control, making it a simple but essential tool for any post-training recovery routine.",
    price: 150, // TODO: confirm price
    image: imageUrl(
      "https://xewudrozihbinbtsihvw.supabase.co/storage/v1/object/public/loomora-bucket/Stretch_strap.jpg",
    ), // TODO: this file is not yet in loomora-bucket -- upload it, then confirm this filename matches exactly
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Recovery", "Full-body", "Legs", "Shoulders"],
  },
  // TODO: replace placeholder image filename and confirm price before seeding.
  // No existing Cloudinary asset for this product yet.
  {
    name: "Compression Sleeve",
    company: "Sporty Pulse",
    description:
      "A supportive compression sleeve that promotes circulation and reduces muscle fatigue during and after training. Consistent, graduated pressure helps ease swelling and soreness, making it a quiet, everyday recovery aid for anyone training regularly.",
    price: 220, // TODO: confirm price
    image: imageUrl(
      "https://xewudrozihbinbtsihvw.supabase.co/storage/v1/object/public/loomora-bucket/compression_sleeve.jpg",
    ), // TODO: this file is not yet in loomora-bucket -- upload it, then confirm this filename matches exactly
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Recovery"],
  },
];

async function main() {
  console.log("Seeding muscles...");
  await prisma.muscle.createMany({ data: [...MUSCLES], skipDuplicates: true });

  const muscleRecords = await prisma.muscle.findMany();
  const muscleIdByName = new Map(muscleRecords.map((m) => [m.name, m.id]));

  console.log(`Seeding ${PRODUCTS.length} products...`);
  for (const p of PRODUCTS) {
    try {
      const badgeIds = p.muscleBadges
        .map((name) => muscleIdByName.get(name))
        .filter((id): id is string => Boolean(id));

      // Products.name has no unique constraint, so a blind `.create()` here
      // inserts a fresh duplicate row (with its own duplicate productMuscles
      // badges) every single time this script runs. Checking for an existing
      // row by name first makes the script idempotent -- safe to re-run.
      const existing = await prisma.products.findFirst({
        where: { name: p.name },
      });

      if (existing) {
        await prisma.products.update({
          where: { id: existing.id },
          data: {
            company: p.company,
            description: p.description,
            price: p.price,
            image: p.image,
            featured: p.featured,
            muscle: p.muscle,
            category: {
              connectOrCreate: {
                where: { name: p.category },
                create: { name: p.category },
              },
            },
            productMuscles: {
              deleteMany: {},
              create: badgeIds.map((muscleId) => ({
                muscle: { connect: { id: muscleId } },
              })),
            },
          },
        });
        console.log(`  Updated: ${p.name}  (id: ${existing.id})`);
        continue;
      }

      const created = await prisma.products.create({
        data: {
          name: p.name,
          company: p.company,
          description: p.description,
          price: p.price,
          image: p.image,
          featured: p.featured,
          muscle: p.muscle,
          category: {
            connectOrCreate: {
              where: { name: p.category },
              create: { name: p.category },
            },
          },
          productMuscles: {
            create: badgeIds.map((muscleId) => ({
              muscle: { connect: { id: muscleId } },
            })),
          },
          // userId intentionally left unset -- still optional until the
          // auth migration's backfill step runs.
        },
      });
      console.log(`  Created: ${p.name}  (id: ${created.id})`);
    } catch (error) {
      console.error(`  Failed: ${p.name}`, error);
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
