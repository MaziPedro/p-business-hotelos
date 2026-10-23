# P-Business HotelOS — Repository Map

**Snapshot:** `main` at the Phase 0 source review. Counts are from the Git tree and may change as upstream evolves. This is a source inventory, not proof that every module is production-ready.

## Workspace layout

| Path | Purpose indicated by the repository | HotelOS relevance |
|---|---|---|
| `apps/api` | NestJS API and domain modules | Main backend for hotel operations, authorization, integrations and automation |
| `apps/dashboard` | Web dashboard application | Primary browser-based staff/admin interface; verify feature coverage and mobile responsiveness during runtime testing |
| `apps/booking` | Booking application | Guest-facing booking flow and booking-related UI |
| `packages/database` | Database schema, migrations and data access | Tenant/property ownership and data integrity must be verified here before SaaS onboarding |
| `packages/shared` | Shared TypeScript types/utilities | Common contracts between applications and packages |
| `packages/booking-requests` | Booking request package | Booking workflow logic shared outside the main API |
| `integrations/demos` | Integration demonstrations and scripts | Useful reference material; a demo is not by itself proof of a supported production connector |
| `ops/harden` | Hardening scripts | Review before production deployment and keep configuration aligned with documented security gates |
| `tools/repo-control` | Repository control tooling | Separate developer tooling; inspect its purpose and permissions before use in CI |

The Git tree snapshot contained approximately 1,820 files: 992 under `apps/`, 173 under `packages/`, 444 under `integrations/`, 52 under `docs/`, 34 under `ops/`, 7 under `scripts/`, and 78 under `tools/`. These are path counts, not code-quality or completeness scores.

## Existing hotel-domain capabilities to evaluate

The API source tree already includes modules for:

- **Core hotel operations:** properties, rooms, reservations, availability, rate plans, groups, guest profiles, check-in/check-out, housekeeping, night audit, waitlists, service requests, and reporting.
- **Front-office finances:** folios, cashier, accounting, house accounts, deposits, payment gateways, tax/fiscal integrations, and accounting exports.
- **Restaurant/POS:** an API `pos` module exists. Verify the actual workflows, peripherals, inventory/recipe support, kitchen tickets, cashier shifts, offline behavior, and reconciliation before treating it as a complete restaurant POS.
- **Distribution and booking:** booking engine, channel management/adapters, inbound reservations, booking requests, and iCal.
- **AI/automation:** `agent` and `llm` modules, plus guest communication and revenue-management-related submodules. Validate permissions, data grounding, cost controls, and auditability before enabling autonomous actions.
- **Smart access:** a `door-lock` module, provider factory/interface, credential service, listeners, and provider implementations/tests for Nuki, Salto KS, and TTLock, plus console/webhook providers. Verify live credentials, vendor APIs, licensing, webhook validation, and hardware compatibility independently.
- **Supporting functions:** authentication/roles, media/storage, notifications, reviews, loyalty, import/migration, integrations, and health endpoints.

## Smart-hotel gaps that remain open

The repository contains smart-lock integration code, but the source inventory alone does not establish that it supports the devices or vendors needed by P-Business customers. No confirmed first-party production module for CCTV video management, hotel IP intercom/PBX provisioning, or managed Wi-Fi controller operations was established in this pass. These should be treated as candidate new integration adapters, not assumed existing features.

For each hardware family, design an adapter boundary rather than hard-coding a vendor into room or reservation logic. Store vendor credentials in a secrets manager, scope every command to a property and authorized operator, and audit sensitive events such as credential creation/revocation and remote unlock. AI must not independently unlock doors; require explicit authorization and human confirmation for physical-security actions.

## SaaS and cross-platform direction

The repository's visible workspaces are web applications and TypeScript packages. This is a sensible starting point for a web-first, responsive SaaS. The tree inventory does **not** establish the existence of maintained native Windows, macOS, Android, or iOS clients. Before promising native applications, evaluate responsive web/PWA coverage and decide whether later desktop/mobile wrappers or dedicated native clients are justified.

Before enabling multiple customer hotels, verify the database ownership model and authorization boundaries end-to-end. A `propertyId` guard is one layer; it is not a substitute for service-level ownership checks, tenant-aware database queries, background-job authorization, storage isolation, and negative cross-tenant tests.

## Suggested implementation sequence

1. Reproduce install/build/test and Docker demo using the existing CI and documented commands.
2. Trace tenant/property ownership from JWT claims through controllers, services, database queries, jobs, exports, and WebSockets; add cross-property negative tests.
3. Inventory current PMS/POS workflows and identify missing operational requirements with one pilot hotel.
4. Define a vendor-neutral smart-hotel integration contract for locks, CCTV events, intercom/PBX, and Wi-Fi controller telemetry/control.
5. Build a responsive web-first experience, then add property onboarding, subscription/billing boundaries, tenant provisioning, observability, and backup/restore before commercial SaaS launch.
6. Only after the security and runtime gates pass, begin vendor integrations and pilot deployment with test data.

## Evidence links

- [Foundation audit](FOUNDATION-AUDIT.md)
- [Architecture and operations](ARCHITECTURE-AND-OPERATIONS.md)
- [Product roadmap](PRODUCT-ROADMAP.md)
- [CI workflow](../.github/workflows/ci.yml)
