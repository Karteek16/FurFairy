# FurFairy — Requirements, Scope & Build Status

This document captures the agreed scope and tracks what is actually implemented.
It is the single source of truth for "is this feature real yet?" — a feature is
only marked done when it exists in code and compiles/boots.

## Chosen stack (defaults applied)

- Backend: Node.js + TypeScript + Fastify
- ORM/DB: Prisma + PostgreSQL
- Architecture: modular monolith, versioned API under `/api/v1`
- Multi-tenancy: shared schema, every tenant row carries `shopId`, scoped server-side
- Auth: JWT access + rotating refresh tokens, bcrypt password hashing
- Money: integer paise
- External integrations: sandbox only; live mode gated behind `INTEGRATION_MODE`

## Implemented (compiles, boots, routes registered)

| Milestone | Area | Status |
|-----------|------|--------|
| M0 | Project foundation, config, error handling | Done |
| M0 | Prisma schema (all core + M1–M6 entities) + initial migration | Done |
| M0 | Auth: login/refresh/logout, password reset (sandbox), `/auth/me` | Done |
| M0 | RBAC: permission catalog, default roles, backend permission guards | Done |
| M0 | Tenant scoping helpers + append-only audit log | Done |
| M1 | Shop registration, admin approval/reject/suspend, public listing/page | Done |
| M1 | Branding, branches, documents, module enable/disable | Done |
| M2 | Roles CRUD, employee CRUD, role change, activate/deactivate | Done |
| M3 | Customer email register + sandbox mobile OTP, pet CRUD, docs, vaccinations | Done |
| M4 | Products/variants/categories, CSV import (per-row report), suppliers | Done |
| M4 | Inventory: receive, adjust (reason), reserve/release/commit, low-stock | Done |
| M5 | Boarding packages (4 tiers; Gold/Platinum COMING_SOON enforced), capacity | Done |
| M5 | Reservations (status machine), in-store/home transport, care tasks + completion | Done |
| M6 | Grooming services, in-store + home booking, anti-double-book, status machine | Done |

### Key business rules enforced in code

- Gold/Platinum boarding packages cannot be set `ACTIVE` in Phase 1 and are not
  bookable even when their card is visible (`boarding.service.ts`).
- Boarding capacity checked against overlapping reservations inside a transaction
  to prevent overbooking.
- Inventory reservation uses an availability check + reserved counter inside a
  transaction to prevent overselling; releases on cancel/expire; commits on sale.
- Permissions are checked by backend guards (`requirePermissions`), never only
  hidden in UI. Cross-tenant access is rejected by `resolveShopScope`.
- Shops are not publicly visible until `APPROVED`.
- Care-task medication/other instructions are stored verbatim; nothing is invented.
- Important actions write to the audit log.
- All external integrations are sandbox-only; no live transactions.

## Not yet implemented (next milestones — not claimed as working)

- M7 Orders/cart/checkout/delivery (single-shop cart, shipping adapters)
- M8 Billing/POS, GST invoices with branding + numbering
- M9 Payments & refunds (gateway/UPI sandbox adapters, webhooks, reconciliation)
- M10 Finance, subscriptions, commissions, settlements, reports
- M11 Marketplace discovery/favourites-first, reviews, notifications, chat, support
- M12 Hardening: concurrency/negative tests, backups + restore, monitoring, CI/CD
- Frontends: customer web, shop web, admin portal
- Mobile: customer app, shop app
- Phase 2: advanced per-pet care plans, camera feeds, premium services, AI assistant

## Still-open decisions (do not treat as settled)

Launch languages; provider selections (payment/UPI, SMS/WA/email/push, shipping);
commission & settlement model; GST/TCS specifics; payment custody model; DPDP data
handling; veterinary clinical scope. These were proposed in the review but need
your confirmation before the relevant milestones are built.
