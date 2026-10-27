# Sporty Pulse

**Full‑Stack SaaS E‑commerce Platform**

Sporty Pulse is a production‑ready SaaS e‑commerce platform focused on solving real purchasing friction in online sports retail. The platform prioritizes fast product discovery, scalable backend architecture, and a smooth checkout experience across devices.

---

## Problem Statement

Most small‑to‑medium e‑commerce platforms struggle with three core issues:

1. **Slow product discovery** – Poor filtering, bloated client‑side logic, and unstructured URLs make it hard for users to find products quickly.
2. **Fragile scalability** – Business logic tightly coupled to the frontend makes growth, refactoring, and feature expansion risky.
3. **Inconsistent buying experience** – Many platforms break down on mobile, suffer performance issues, or complicate checkout flows.

**Sporty Pulse** addresses these problems by:

- Using URL‑driven filters for predictable navigation and SEO
- Handling data fetching and mutations server‑side for consistency and performance
- Delivering a fast, responsive, mobile‑first purchasing flow

---

## Screenshots

### Desktop

![Desktop](screenshots/desktop.png)

### Mobile

![Mobile](screenshots/mobile.png)

---

## Tech Stack

- **Next.js (App Router)**
- **React & TypeScript**
- **PostgreSQL**
- **Server Actions**
- **Tailwind CSS**
- **Cloudinary** (media delivery)
- **PayFast** (payments)

---

## Technical Decisions

### Why Next.js (App Router)

- Enables **server‑first architecture** with fine‑grained control over rendering
- Supports **Server Actions**, reducing the need for a separate API layer
- Built‑in routing, layouts, and metadata improve maintainability and SEO
- Ideal for SaaS products that require both performance and flexibility

### Why Server Actions

- Centralizes business logic on the server
- Reduces client bundle size and network round‑trips
- Improves security by keeping sensitive logic off the client
- Simplifies data mutations compared to traditional REST patterns

### Why PostgreSQL

- Strong relational integrity for products, orders, users, and payments
- Well‑suited for transactional e‑commerce workloads
- Scales cleanly as data volume and complexity increase

### Why Tailwind CSS

- Enables rapid UI iteration without CSS bloat
- Encourages consistent spacing, typography, and layout
- Keeps styling colocated with components for clarity

### Why Cloudinary

- Optimized image delivery and automatic format selection
- Reduces load times across devices and network conditions
- Offloads media processing from the application server

### Why Payfast

- Secure, production‑grade payment handling
- Webhook‑based flow for reliable order processing
- Scales internationally without custom payment logic

---

## Performance & SEO Considerations

- **Server‑side rendering** for critical pages improves Time‑to‑First‑Byte
- **URL‑based filtering** enables crawlable, shareable product views
- **Optimized images** via Cloudinary reduce payload size
- **Minimal client JavaScript** by leaning on Server Components
- **Structured metadata** using Next.js App Router conventions

These decisions ensure the platform performs well under load and remains SEO‑friendly as the catalog grows.

---

## Tradeoffs

- **Server Actions vs REST API**

  - Pro: Cleaner architecture, less boilerplate
  - Con: Tighter coupling to Next.js ecosystem

- **App Router complexity**

  - Pro: Powerful composition and data flow
  - Con: Steeper learning curve and stricter conventions

- **Relational database over NoSQL**

  - Pro: Data consistency and transactional safety
  - Con: Requires more upfront schema planning

Each tradeoff was made intentionally with long‑term maintainability and SaaS scalability in mind.

---

## Summary

Sporty Pulse is not a demo project—it is a **realistic SaaS e‑commerce foundation** built with production concerns in mind: performance, scalability, and clean architecture. The project reflects how modern full‑stack applications should be designed when growth and maintainability matter.
