# Architecture

Sporty Pulse Store is a gym-equipment storefront. It sells products that unlock entitlements in the companion app, Sporty Pulse Pro.

## Stack

| Layer     | Choice                                                                  |
| --------- | ----------------------------------------------------------------------- |
| Framework | Next.js 15 (App Router), React 18, TypeScript                           |
| UI        | Tailwind CSS 4, HeroUI, Radix                                           |
| Auth      | NextAuth v4, JWT sessions, Google and email/password (bcrypt) providers |
| Database  | Postgres on Supabase, Prisma 7 with `@prisma/adapter-pg`                |
| Payments  | PayFast (ITN webhook)                                                   |
| Images    | Supabase Storage, `next/image` remote patterns in `next.config.js`      |
| Hosting   | Vercel, function region `sin1` (Singapore), next to the Supabase pooler |
| Tests     | Vitest                                                                  |

## Request flow

- `middleware.ts` runs on every non-static route. Public: `/`, `/about`, `/sign-in`, `/sign-up`, `/api/payfast/notify`, `/api/health`, and the prefixes `/equipments`, `/category`, `/api/auth`. Everything else needs a JWT. `/admin` also requires `token.email === ADMIN_EMAIL` (fails closed).
- Pages are server components that call functions in `utils/actions/*`.
- `utils/action.ts` is a re-export barrel for older imports. New code should import from the domain module.

## Server actions (`utils/actions/`)

| Module                 | Responsibility                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| `catalog`              | Public product reads                                                    |
| `admin`                | Admin-only product and order operations; every export is guarded        |
| `favorites`, `reviews` | User-scoped data                                                        |
| `cart`                 | Cart reads and mutations; `updateCart` recalculates and persists totals |
| `orders`               | Order creation and history                                              |
| `session`              | `getAuthUser` default export                                            |

Shared helpers: `utils/guards.ts` (auth guards), `utils/validation.ts` (quantity and price rules), `utils/pricing.ts` (`calculateCartTotals`, pure functions, whole Rand). Action modules start with `"use server"` and export only async functions; `tests/action-modules.test.ts` enforces this.

## Data model (`prisma/schema.prisma`)

`User` owns `Products`, `Cart` (one per user), `Order`, `Favorite`, `Review`. `Products` link to `Muscle` through `ProductMuscle` and to `Category` through an implicit many-to-many. `Order` has `OrderItems`, an `isPaid` flag and `entitlementsGrantedAt`. Prices and totals are whole-Rand integers.

## Database connections

- Runtime: `utils/db.ts` creates one `PrismaClient` per instance (cached on `globalThis` outside production), using `DATABASE_URL` (the Supabase pooler).
- Schema changes: `prisma.config.ts` uses `DIRECT_URL`. Apply with `npx prisma db push` then `npx prisma generate`.
- Pool size is capped per serverless instance via `DB_POOL_MAX` (default 3) in `utils/db.ts`.

## Operations

- `GET /api/health` runs `select 1`. Intended for uptime monitoring.
- Load test: `loadtests/store.js` (k6, per-route thresholds, p95 under 800 ms). Baseline from 2026-11-07 at `sin1`: public catalog pages p95 about 630-770 ms; network floor from Cape Town about 414 ms.
- Logs: `utils/logger.ts` (`withLogging`) for request lines; `logItn` in the PayFast notify route for payment events.

## Architecture decisions

1. **Server actions over a REST layer**: less boilerplate, at the cost of coupling to Next.js.
2. **Server-side price authority**: totals are recalculated from database prices at cart update, order creation and checkout initiation. The client never supplies amounts.
3. **ITN is the only path to "paid"**: the browser return URL changes nothing.
4. **Idempotent, retryable webhook**: atomic `updateMany` guards and a persisted `entitlementsGrantedAt`. Failures return 500 so PayFast retries.
5. **JWT sessions**: no session table lookups per request.
6. **Function region matched to the database**: moving from `iad1` to `sin1` cut detail-page p95 from 7.7 s to about 0.77 s.
7. **`db push`, not migrations**: current workflow. Revisit before multiple environments or a team.

## Known gaps

- The `/checkout` page and admin pages were not reviewed when this was written.
- A comment in `utils/guards.ts` still refers to Clerk; auth is NextAuth.
- `next.config.js` sets `eslint.ignoreDuringBuilds`; linting is enforced in CI instead (see `.github/workflows/ci.yml`).
- The Pro entitlement endpoint is implemented in the Pro repo; see `docs/payment-flow.md` for the Store side.
