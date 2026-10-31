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
    image: imageUrl("1767303867494-Pushup handles.png"),
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
    image: imageUrl("1767304007508-Resistance bands.png"),
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
    image: imageUrl("Weight_Plate.png"),
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
    image: imageUrl("Yoga_Mat.png"),
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
    image: imageUrl("1783539067521-home_dumbells.png"),
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
    image: imageUrl("1767536947286-Kettlebells.png"),
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
    image: imageUrl("Sandbag.png"),
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
    image: imageUrl("1767303555430-Pull-up bar.png"),
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
    image: imageUrl("1783518758135-dip bars.png"),
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
    image: imageUrl("1767536239405-ab_wheel.png"),
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
    image: imageUrl("Medicine-Balls.png"),
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
    image: imageUrl("1767304795692-Stability ball.png"),
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
    image: imageUrl("1767538148476-slider_discs.png"),
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
    image: imageUrl("1767536520653-ankle_weights.png"),
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
    image: imageUrl("1767538044440-skipping-rope.png"),
    featured: false,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Legs", "Arms", "Core", "Full-body"],
  },
  {
    name: "Foam Roller",
    company: "Sporty Pulse",
    description:
      "A firm foam roller for self-myofascial release and post-workout recovery. Rolling out tight muscles after training helps ease soreness, restore range of motion, and speed up recovery between sessions, an essential companion to any serious full-body training routine.",
    price: 350,
    image: imageUrl("1783518566070-soft-massaging-foam-roller-blue.png"),
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
    image: imageUrl("Adjustable Bench.png"),
    featured: true,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Chest", "Back", "Shoulders", "Arms", "Legs"],
  },
  {
    name: "Massage Ball",
    company: "Sporty Pulse",
    description:
      "A small, firm ball designed for targeted trigger-point release. Its size lets you reach tight, specific spots that larger recovery tools can't, shoulders, feet, glutes, delivering precise pressure exactly where you need it after a demanding session.",
    price: 120,
    image: imageUrl("1767539124681-small-massage-ball-black.png"),
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
    image: imageUrl("Massage-gun.png"),
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
    image: imageUrl("1767305990836-Hot_Cold pack.png"),
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
    image: imageUrl("1767306079448-Epsom Salt.png"),
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
    image: imageUrl("1767536369668-Adjustable Dumbbell.png"),
    featured: true,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Chest", "Back", "Shoulders", "Arms", "Legs", "Full-body"],
  },
  {
    name: "Stretch Strap",
    company: "Sporty Pulse",
    description:
      "A durable, looped stretch strap that extends your reach for deeper, safer stretching. The multiple grip loops let you ease into hamstring, shoulder, and hip stretches with control, making it a simple but essential tool for any post-training recovery routine.",
    price: 150, // TODO: confirm price
    image: imageUrl("1783540498702-Stretch_strap.png"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Recovery", "Full-body", "Legs", "Shoulders"],
  },
  {
    name: "Compression Sleeve",
    company: "Sporty Pulse",
    description:
      "A supportive compression sleeve that promotes circulation and reduces muscle fatigue during and after training. Consistent, graduated pressure helps ease swelling and soreness, making it a quiet, everyday recovery aid for anyone training regularly.",
    price: 220, // TODO: confirm price
    image: imageUrl("1783518666229-compression_sleeve.png"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Recovery"],
  },
  // UPPER BODY
  {
    name: "Push-Up Board",
    company: "Sporty Pulse",
    description:
      "Add variety to your home push-up routine with a compact board offering multiple handle positions. Adjust your hand placement to change the emphasis across your chest, shoulders and triceps while your core works to keep your body aligned. A practical choice for structured upper-body sessions without bulky equipment.",
    price: 299,
    image: imageUrl("wall-mounted push-up_board.png"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Chest", "Shoulders", "Triceps", "Core"],
  },
  {
    name: "Compact Parallettes",
    company: "Sporty Pulse",
    description:
      "Build bodyweight strength with compact parallel bars suited to elevated push-ups, tuck holds and L-sit progressions. The raised grips provide clearance for controlled movements and allow a neutral wrist position. Easy to incorporate into a small home training area for strength and calisthenics practice.",
    price: 449,
    image: imageUrl("parallettes.png"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Chest", "Shoulders", "Triceps", "Core", "Hip Flexors"],
  },
  {
    name: "Adjustable Hand Grip Strengthener",
    company: "Sporty Pulse",
    description:
      "Train your grip with adjustable resistance that lets you progress from lighter squeezes to more demanding holds. Designed for focused work on the hand and forearm muscles used in gripping and carrying. Its compact size makes it easy to add short grip sessions to your existing strength routine.",
    price: 129,
    image: imageUrl("Adjustable_Hand_Grip_Strengthener.png"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Forearms", "Hand Muscles"],
  },
  {
    name: "Finger Resistance Bands",
    company: "Sporty Pulse",
    description:
      "Complement squeezing exercises with resistance that challenges your fingers as you open your hand. These small bands target finger extension, adding variety to hand and forearm training. A lightweight accessory for controlled repetitions at home or as part of a broader grip routine.",
    price: 79,
    image: imageUrl("Finger_Resistance_Bands.png"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Forearm Extensors", "Hand Muscles"],
  },
  {
    name: "Resistance Tubes with Handles",
    company: "Sporty Pulse",
    description:
      "Bring versatile resistance training into a small workout space with tubes and easy-to-hold handles. Use them for curls, presses, lateral raises and rows, choosing an appropriate setup for each movement. Suitable for upper-body circuits and controlled strength sessions without a rack of weights.",
    price: 249,
    image: imageUrl("Resistance_Tubes_with_Handles.png"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Chest", "Shoulders", "Back", "Biceps", "Triceps"],
  },
  {
    name: "Resistance Band Door Anchor",
    company: "Sporty Pulse",
    description:
      "Expand the exercises available with your compatible resistance bands or tubes by adding a door attachment point. Different anchor heights allow movements such as rows, chest presses and triceps pushdowns. Use only with a suitable, securely closed door and follow the anchor's installation guidance.",
    price: 99,
    image: imageUrl("1772646341495-Suspension Trainer.png"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Back", "Chest", "Shoulders", "Biceps", "Triceps"],
  },
  {
    name: "Portable Dip Bars",
    company: "Sporty Pulse",
    description:
      "Create a dedicated station for dips, support holds and knee-raise progressions in your home workout area. Dip variations challenge the chest and triceps, while supported holds and raises bring the shoulders and core into the session. Check the bars' stability, dimensions and load rating before training.",
    price: 999,
    image: imageUrl("1767536651134-Dip_bars.png"),
    featured: false,
    category: "fitness",
    muscle: "upper-body",
    muscleBadges: ["Triceps", "Chest", "Shoulders", "Core", "Hip Flexors"],
  },

  // CORE
  {
    name: "Ab Mat",
    company: "Sporty Pulse",
    description:
      "Add contoured support to floor-based abdominal exercises with an ab mat positioned beneath the lower back. Use it for controlled sit-up variations, selecting a range of motion that feels comfortable. A simple accessory for focused core sessions that stores easily alongside your exercise mat.",
    price: 229,
    image: imageUrl("ab_mat.png"),
    featured: false,
    category: "fitness",
    muscle: "core",
    muscleBadges: ["Abs"],
  },
  {
    name: "Pilates Ring",
    company: "Sporty Pulse",
    description:
      "Introduce gentle resistance to Pilates exercises with a ring you can press between your hands or thighs. Use controlled squeezes during seated, standing or floor routines to challenge the inner thighs, chest and arms while maintaining core control. A versatile addition to low-impact home training.",
    price: 199,
    image: imageUrl("Pilates_Ring.png"),
    featured: false,
    category: "fitness",
    muscle: "core",
    muscleBadges: ["Core", "Inner Thighs", "Chest", "Shoulders"],
  },
  {
    name: "Pilates Mini Ball",
    company: "Sporty Pulse",
    description:
      "Add support or a stability challenge to Pilates and floor exercises with a small inflatable ball. Position it between the knees, beneath the pelvis or behind the back according to the movement. Useful for controlled abdominal work, inner-thigh squeezes and bridge variations in a compact workout space.",
    price: 129,
    image: imageUrl("Plates_Mini_Ball.png"),
    featured: false,
    category: "fitness",
    muscle: "core",
    muscleBadges: ["Abs", "Obliques", "Inner Thighs", "Glutes"],
  },
  {
    name: "Balance Cushion",
    company: "Sporty Pulse",
    description:
      "Introduce an unstable surface to standing balance drills and selected floor exercises. The cushion encourages small adjustments through the trunk, hips and ankles as you maintain your position. Start with supported movements and progress gradually as your balance and control improve.",
    price: 249,
    image: imageUrl("Balance_Cushion.png"),
    featured: false,
    category: "fitness",
    muscle: "core",
    muscleBadges: ["Core", "Glutes", "Calves", "Ankle Stabilizers"],
  },
  {
    name: "Compact Balance Board",
    company: "Sporty Pulse",
    description:
      "Practise balance and body control with a compact board that challenges you to maintain a steady position. Standing drills engage the core and lower-body stabilizers as the board shifts beneath your feet. Use near a stable support and build confidence with short, controlled sessions.",
    price: 349,
    image: imageUrl("wooden_balance_board.png"),
    featured: false,
    category: "fitness",
    muscle: "core",
    muscleBadges: ["Core", "Glutes", "Quads", "Calves", "Ankle Stabilizers"],
  },
  {
    name: "Pilates Resistance Bar Kit",
    company: "Sporty Pulse",
    description:
      "Combine bar-guided movements with band resistance for a varied home Pilates routine. Use the kit for compatible squat, row, curl and standing core exercises, adjusting your setup to maintain control throughout each repetition. A space-conscious option for training several muscle groups with one kit.",
    price: 399,
    image: imageUrl("Pilates_Resistance_Bar_Kit.png"),
    featured: false,
    category: "fitness",
    muscle: "core",
    muscleBadges: ["Core", "Back", "Shoulders", "Biceps", "Glutes", "Quads"],
  },

  // LOWER BODY
  {
    name: "Fabric Hip Bands",
    company: "Sporty Pulse",
    description:
      "Add resistance to lateral steps, seated hip abductions and glute-bridge variations with fabric loop bands. Positioned around the thighs, they challenge the muscles that move and stabilize your hips. Useful for lower-body warm-ups, glute-focused circuits and controlled accessory work.",
    price: 199,
    image: imageUrl("Fabric_Resistance_Band.png"),
    featured: false,
    category: "fitness",
    muscle: "lower-body",
    muscleBadges: ["Glutes", "Hip Abductors"],
  },
  {
    name: "Resistance Ankle Cuffs",
    company: "Sporty Pulse",
    description:
      "Connect compatible resistance bands to your ankles for targeted lower-body exercises. Use the cuffs for standing kickbacks, leg curls and inward or outward leg movements with a secure anchoring setup. A practical accessory for adding focused hip and thigh work to your home routine.",
    price: 179,
    image: imageUrl("resistance_ankle_cuffs.png"),
    featured: false,
    category: "fitness",
    muscle: "lower-body",
    muscleBadges: ["Glutes", "Hamstrings", "Hip Abductors", "Inner Thighs"],
  },
  {
    name: "Squat Wedge Blocks",
    company: "Sporty Pulse",
    description:
      "Elevate your heels during squat variations with angled blocks that change your starting position. This setup can make a more upright squat feel accessible and place greater emphasis on the quadriceps. Use on a stable surface and select a squat depth and load you can control.",
    price: 249,
    image: imageUrl("squat_wedge_blocks.png"),
    featured: false,
    category: "fitness",
    muscle: "lower-body",
    muscleBadges: ["Quads", "Glutes"],
  },
  {
    name: "Adjustable Aerobic Step",
    company: "Sporty Pulse",
    description:
      "Bring step-ups, aerobic intervals and controlled lower-body circuits into your home workout space. Adjustable height lets you change the challenge to suit the movement and your experience. Use it for steady conditioning sessions or add suitable resistance for more demanding leg training.",
    price: 549,
    image: imageUrl("adjustable_Aerobic_step.png"),
    featured: false,
    category: "fitness",
    muscle: "lower-body",
    muscleBadges: ["Quads", "Glutes", "Hamstrings", "Calves"],
  },

  // FULL BODY
  {
    name: "Suspension Trainer with Door Anchor",
    company: "Sporty Pulse",
    description:
      "Use bodyweight resistance for rows, chest presses, assisted squats and core exercises with a suspension trainer. Changing your body angle adjusts the challenge while the straps demand control throughout the movement. Install the door anchor exactly as directed and use only a suitable door and frame.",
    price: 699,
    image: imageUrl("Suspension_Trainer_with_Door_Anchor.png"),
    featured: false,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: [
      "Back",
      "Chest",
      "Shoulders",
      "Biceps",
      "Triceps",
      "Core",
      "Glutes",
      "Quads",
      "Hamstrings",
    ],
  },
  {
    name: "Weighted Vest",
    company: "Sporty Pulse",
    description:
      "Add external resistance to familiar movements such as walking, squats, step-ups and push-ups. A weighted vest keeps the load on your torso, leaving your hands free during training. Choose a manageable weight and build up gradually while maintaining your usual movement control.",
    price: 899,
    image: imageUrl("adjustable_weight_training_weight_vest.png"),
    featured: false,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: ["Quads", "Glutes", "Calves", "Core", "Chest", "Triceps"],
  },
  {
    name: "Compact Weighted Workout Bar",
    company: "Sporty Pulse",
    description:
      "Train with a manageable fixed load for squats, hip hinges, rows, curls and overhead presses. The compact bar provides a simple two-handed option for home strength circuits and movement practice. Select a weight that suits your exercises and the space available around you.",
    price: 449,
    image: imageUrl("Compact_Weighted_Workout_Bar.png"),
    featured: false,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: [
      "Quads",
      "Glutes",
      "Hamstrings",
      "Back",
      "Shoulders",
      "Biceps",
      "Triceps",
      "Core",
    ],
  },
  {
    name: "Portable Resistance Training Board",
    company: "Sporty Pulse",
    description:
      "Build a compact resistance station around a portable board and compatible bands or attachments. Depending on the setup, use it for squats, hip hinges, rows, curls and presses. Follow the board's attachment guidance and resistance limits when assembling each exercise.",
    price: 1299,
    image: imageUrl("Portable_Resistance_Training_Board.png"),
    featured: false,
    category: "fitness",
    muscle: "full-body",
    muscleBadges: [
      "Quads",
      "Glutes",
      "Hamstrings",
      "Back",
      "Chest",
      "Shoulders",
      "Biceps",
      "Triceps",
      "Core",
    ],
  },

  // RECOVERY & MOBILITY
  {
    name: "Yoga Blocks",
    company: "Sporty Pulse",
    description:
      "Bring the floor closer during supported stretches and yoga poses with blocks that offer multiple positioning heights. Use them beneath your hands, hips or other supported areas to adapt a movement to your current range. Useful for comfortable hamstring, hip, chest and shoulder mobility work.",
    price: 179,
    image: imageUrl("Yoga_mat_block.png"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Hamstrings", "Glutes", "Hip Flexors", "Chest", "Shoulders"],
  },
  {
    name: "Massage Stick",
    company: "Sporty Pulse",
    description:
      "Apply controlled rolling pressure to accessible muscles with a handheld massage stick. Guide it over the calves, thighs or forearms and adjust the pressure using your hands. A compact option for a post-workout self-massage routine, avoiding joints, bones and injured areas.",
    price: 179,
    image: imageUrl("Massage_stick.png"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Calves", "Quads", "Hamstrings", "Forearms"],
  },
  {
    name: "Peanut Massage Ball",
    company: "Sporty Pulse",
    description:
      "Use a twin-ball shape for targeted self-massage against a wall or on the floor. The central groove allows positioning beside the spine while keeping direct pressure off the vertebrae. Also suitable for controlled work on the glutes and calves, using light pressure to start.",
    price: 129,
    image: imageUrl("Peanut_Massage_Ball.png"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Upper Back", "Spinal Erectors", "Glutes", "Calves"],
  },
  {
    name: "Yoga Bolster",
    company: "Sporty Pulse",
    description:
      "Add cushioned support to restorative yoga, gentle stretching and relaxed floor positions. Place the bolster beneath your torso, hips or knees to make supported poses more comfortable. Useful for longer, unhurried sessions involving the chest, back and hips without forcing your range of motion.",
    price: 599,
    image: imageUrl("Yoga_Bolsters.png"),
    featured: false,
    category: "recovery",
    muscle: "recovery",
    muscleBadges: ["Chest", "Back", "Glutes", "Hip Flexors", "Inner Thighs"],
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL must be set so seeded products have an owner");
  }

  // Same email the Google sign-in upserts on, so the admin's first sign-in
  // reuses this row instead of creating a second one.
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail },
    select: { id: true },
  });

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
          userId: admin.id,
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
