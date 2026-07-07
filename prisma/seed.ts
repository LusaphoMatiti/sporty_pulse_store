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

const MUSCLES = [
  { name: "Chest", category: "upper-body" },
  { name: "Back", category: "upper-body" },
  { name: "Legs", category: "lower-body" },
  { name: "Shoulders", category: "upper-body" },
  { name: "Arms", category: "upper-body" },
  { name: "Core", category: "core" },
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
      "Rotating grips that ease wrist strain and deepen your push-up range of motion.",
    price: 180,
    image: imageUrl("1772573627753-Pushup handles.jpg"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Chest", "Arms", "Shoulders"],
  },
  {
    name: "Resistance Bands (Set)",
    company: "Sporty Pulse",
    description:
      "A graduated set of bands for strength, mobility, and warm-up work anywhere.",
    price: 330,
    image: imageUrl("1772642622870-Resistance bands.webp"),
    featured: true,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Arms", "Shoulders", "Legs"],
  },
  {
    name: "Weight Plate (20kg)",
    company: "Sporty Pulse",
    description:
      "A standard 20kg cast plate for loading barbells or standalone strength work.",
    price: 800,
    image: imageUrl("1772635203378-weight_plate.jpg"),
    featured: false,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Legs", "Back", "Arms"],
  },
  {
    name: "Yoga Mat",
    company: "Sporty Pulse",
    description:
      "Cushioned, non-slip mat for yoga, stretching, and floor-based training.",
    price: 250,
    image: imageUrl("1772643111457-Yoga_mat.webp"),
    featured: false,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Core"],
  },
  {
    name: "Home Dumbbells (2kg Pair)",
    company: "Sporty Pulse",
    description:
      "A lightweight pair of dumbbells, ideal for toning and beginner strength work.",
    price: 200,
    image: imageUrl("1772635722566-home_dumbells.jpg"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Arms", "Shoulders"],
  },
  {
    name: "Kettlebell (12kg)",
    company: "Sporty Pulse",
    description:
      "A versatile 12kg kettlebell for swings, squats, and full-body conditioning.",
    price: 600,
    image: imageUrl("1772640419333-Kettlebells.png"),
    featured: true,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Legs", "Back", "Arms", "Core"],
  },
  {
    name: "Sandbag (20kg)",
    company: "Sporty Pulse",
    description:
      "A shifting-load sandbag that builds functional strength and core stability.",
    price: 650,
    image: imageUrl("1772636784831-Sandbag.webp"),
    featured: false,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Legs", "Back", "Core"],
  },
  {
    name: "Pull-Up Bar (Doorway)",
    company: "Sporty Pulse",
    description:
      "A no-drill doorway bar for pull-ups, chin-ups, and hanging core work.",
    price: 300,
    image: imageUrl("1772637154487-Pull-up bar.webp"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Back", "Arms"],
  },
  {
    name: "Dip Bars",
    company: "Sporty Pulse",
    description:
      "Freestanding parallel bars for dips, push-ups, and leg raises.",
    price: 1400,
    image: imageUrl("1772634291560-Dip_bars.avif"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Chest", "Arms"],
  },
  {
    name: "Ab Wheel",
    company: "Sporty Pulse",
    description:
      "A simple rolling wheel that builds deep core and stabilizer strength.",
    price: 200,
    image: imageUrl("1772637459001-ab_wheel.jpg"),
    featured: false,
    category: "fitness",
    muscle: "core",
    muscleBadges: ["Core"],
  },
  {
    name: "Medicine Ball (6-8kg)",
    company: "Sporty Pulse",
    description:
      "A weighted ball for slams, throws, and rotational core training.",
    price: 650,
    image: imageUrl("1772638079743-Medicine_ball.png"),
    featured: false,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Core", "Arms", "Shoulders"],
  },
  {
    name: "Stability Ball",
    company: "Sporty Pulse",
    description:
      "A balance-training ball for core stability and controlled bodyweight work.",
    price: 300,
    image: imageUrl("1772638259600-Stability ball.jpg"),
    featured: false,
    category: "fitness",
    muscle: "core",
    muscleBadges: ["Core", "Back"],
  },
  {
    name: "Slider Discs",
    company: "Sporty Pulse",
    description:
      "Low-friction discs that add sliding resistance to core and leg exercises.",
    price: 100,
    image: imageUrl("1772639698667-slider_discs.avif"),
    featured: false,
    category: "fitness",
    muscle: "core",
    muscleBadges: ["Core", "Legs"],
  },
  {
    name: "Ankle Weights (2kg Pair)",
    company: "Sporty Pulse",
    description:
      "Adjustable ankle weights that add resistance to leg and cardio work.",
    price: 200,
    image: imageUrl("1772640683183-ankle_weights.jpg"),
    featured: false,
    category: "fitness",
    muscle: "lower-body",
    muscleBadges: ["Legs"],
  },
  {
    name: "Jump Rope",
    company: "Sporty Pulse",
    description: "A speed rope for cardio, footwork, and warm-up conditioning.",
    price: 100,
    image: imageUrl("1772641087810-skipping-rope.avif"),
    featured: false,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Legs", "Core"],
  },
  {
    name: "Foam Roller",
    company: "Sporty Pulse",
    description:
      "A firm foam roller for self-myofascial release and post-workout recovery.",
    price: 350,
    image: imageUrl("1772641359547-foam-rollerr.webp"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Back", "Legs"],
  },
  {
    name: "Adjustable Bench",
    company: "Sporty Pulse",
    description:
      "A multi-incline bench for presses, rows, and seated dumbbell work.",
    price: 4000,
    image: imageUrl("1772641809915-Adjustable Bench.jpg"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Chest", "Arms", "Shoulders"],
  },
  {
    name: "Massage Ball",
    company: "Sporty Pulse",
    description: "A small, firm ball for targeted trigger-point release.",
    price: 120,
    image: imageUrl("1772642140059-small-massage-ball-black.avif"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Back"],
  },
  {
    name: "Massage Gun",
    company: "Sporty Pulse",
    description: "A percussive massage device for fast, deep muscle recovery.",
    price: 1200,
    image: imageUrl("1772642436042-Massage_gun.jpg"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Back", "Legs"],
  },
  {
    name: "Hot/Cold Pack",
    company: "Sporty Pulse",
    description:
      "A reusable gel pack for heat or ice therapy on sore muscles and joints.",
    price: 180,
    image: imageUrl("1772642849483-Hot_Cold pack.jpg"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: [],
  },
  {
    name: "Epsom Salt (1kg)",
    company: "Sporty Pulse",
    description:
      "Magnesium-rich bath salts to ease muscle soreness after training.",
    price: 80,
    image: imageUrl("1772642954908-Epsom Salt.avif"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: [],
  },
  {
    name: "Adjustable Dumbbell",
    company: "Sporty Pulse",
    description:
      "A space-saving dumbbell with a quick-adjust weight dial for progressive loading.",
    price: 1999, // confirmed from actual PayFast test data earlier in this project
    image: imageUrl("1772639909761-Adjustable Dumbbell.jpg"),
    featured: true,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Arms", "Shoulders", "Chest"],
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
