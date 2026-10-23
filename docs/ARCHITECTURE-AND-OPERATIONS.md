# P-Business HotelOS — Architecture and Operating Decisions

## Starting point
This repository is a fork of TelivityAI/haip. Preserve upstream attribution and notices. Re-check the upstream license and all dependency licenses before distributing or hosting a modified version.

## Proposed deployment shape
- Web/PWA client first for Windows, macOS, Android and iOS browsers.
- Existing HAIP API/backend retained unless code audit identifies a justified change.
- PostgreSQL as the system of record, using the project's supported migration path.
- Redis/queue only where the upstream implementation already uses or needs it.
- HTTPS reverse proxy, private database/network, managed secrets, monitoring and scheduled backups.
- Separate development, staging and production environments.
- CI for lint, type checks, tests, migrations and dependency/security checks.

Do not assume every listed service exists in the current codebase; confirm from package files, compose files, environment examples and source before changing deployment.

## Multi-tenant data safety
- Identify tenant/property scope for every business entity.
- Enforce scope in server-side authorization and database access; never rely on frontend filtering.
- Add negative tests proving Tenant A cannot read, update, export or infer Tenant B's records.
- Include tenant scope in background jobs, exports, reports, websocket events and file access.
- Log privileged changes and sensitive record access where appropriate.
- Keep tenant-aware backups and define a tested restore procedure.

## Integrations
Use a provider interface/adapter per capability (locks, PBX, Wi-Fi, payment, CCTV). Store credentials in server-side secret storage, never in browser code. Implement timeouts, retries with idempotency, event verification, health status and an operator-visible error trail.

## Nigeria readiness
- Default display currency: NGN; timezone: Africa/Lagos, configurable per property.
- Taxes and service charges must be configurable and reviewed by a Nigerian accounting/compliance professional.
- Support receipts, bank-transfer reconciliation and payment provider test mode.
- Follow the Nigeria Data Protection Act and applicable NDPC guidance: data minimization, access control, retention rules, secure processing and a documented incident process.

## Budget strategy
Keep local development and early testing on existing hardware. Do not expose a local dev server or database to the public internet. Before a real hotel pilot, budget for reliable hosting, domain/TLS, backups, monitoring, support and any provider fees. “₦0” is suitable for a prototype, not a promise of free production operations.

## First technical audit checklist
- [ ] Read README and setup docs; record exact commands.
- [ ] Identify frontend, backend, database, migrations and test suites.
- [ ] Inspect .env.example and .env.production.example; confirm no secrets are committed.
- [ ] Inspect docker-compose files and health checks.
- [ ] Verify license file and dependency license inventory.
- [ ] Run tests and record failures without silently bypassing them.
- [ ] Map authentication, roles, tenant scoping and audit logging.
- [ ] Document existing POS, AI, API and hardware capabilities with code references.
