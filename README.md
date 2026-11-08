# Sporty Pulse Store

E-commerce store for gym equipment, built with Next.js. Purchases unlock entitlements in the companion app, Sporty Pulse Pro.

## Stack

Next.js 15 (App Router), React, TypeScript, Tailwind CSS, NextAuth (Google and email/password), Postgres on Supabase via Prisma 7, PayFast payments, Supabase Storage for images, Vercel hosting, Vitest.

## Why these choices

- **Next.js App Router and Server Actions**: server-first data access, no separate API layer for most features. Trade-off: coupling to Next.js.
- **PostgreSQL**: relational integrity for products, orders and payments. Trade-off: more upfront schema planning.
- **PayFast**: the payment provider for South African customers. Orders are marked paid only by PayFast's server-to-server notification (ITN), never by the browser return.
- **Server-side pricing**: totals are recalculated from database prices at cart update, order creation and checkout.

Full detail: [`docs/architecture.md`](docs/architecture.md) and [`docs/payment-flow.md`](docs/payment-flow.md).

## Getting started

```bash
npm install            # also runs prisma generate
cp .env.example .env   # then fill in values (see below)
npx prisma db push
npm run db:seed
npm run dev
```

### Environment variables

Names only; never commit values.

| Variable                                                                            | Purpose                                                     |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`                                                                      | Runtime connection (Supabase pooler)                        |
| `DIRECT_URL`                                                                        | Direct connection for `prisma db push`                      |
| `DB_POOL_MAX`                                                                       | Optional pool size per instance (default 3)                 |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET`                                                   | NextAuth; `NEXTAUTH_URL` is also used to build PayFast URLs |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                                          | Google sign-in                                              |
| `ADMIN_EMAIL`                                                                       | The one admin account; unset means no admins                |
| `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_MODE` | PayFast (`sandbox` or `live`)                               |
| `STORE_BRIDGE_SECRET`, `PRO_API_BASE_URL`                                           | Entitlement delivery to Sporty Pulse Pro                    |

## Scripts

| Command              | What it does                           |
| -------------------- | -------------------------------------- |
| `npm run dev`        | Dev server                             |
| `npm run build`      | `prisma generate` and production build |
| `npm test`           | Vitest                                 |
| `npm run lint:check` | ESLint, read-only (used by CI)         |
| `npm run lint`       | ESLint with `--fix` (changes files)    |
| `npx tsc --noEmit`   | Typecheck                              |

## Quality checks

GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, lint and tests on every pull request and push to `main`. Next's build-time lint is disabled in `next.config.js`, so CI is where linting is enforced.

## Operations

- Health check: `GET /api/health`
- Load test: `k6 run loadtests/store.js -e BASE_URL=<url> -e PRODUCT_ID=<id>`
- Vercel function region: `sin1`, matching the Supabase pooler.

## Screenshots

![Desktop](screenshots/desktop.png)
![Mobile](screenshots/mobile.png)
