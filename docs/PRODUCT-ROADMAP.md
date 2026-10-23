# P-Business HotelOS — Product Roadmap

## Product vision
P-Business HotelOS is a web-first, multi-property hotel operations platform built by P-Business Hub & Tech Solutions. It starts from the upstream HAIP codebase and adds a carefully verified Nigeria-ready product layer.

**Positioning:** One platform for hotel operations, with smart-hotel integrations as the differentiator.

## Non-negotiable product principles
- Tenant isolation: one hotel group must never access another tenant's records.
- Auditability: log sensitive financial, guest-data, permissions and device actions.
- API-first integrations: vendor adapters must not leak vendor-specific assumptions into core workflows.
- Secure-by-default: least privilege, MFA for privileged accounts where supported, secret management, backups and restore tests.
- Human approval for consequential AI actions.
- Never claim a feature is production-ready until it is tested and documented.

## MVP — Phase 0: prove the foundation
1. Run upstream in a local development environment using its documented setup.
2. Record exact versions, services, migrations, environment variables and test commands.
3. Map existing workflows: property setup, room inventory, reservations, check-in/out, folios, invoices, housekeeping and reporting.
4. Review dependencies, license notices, authentication, authorization, tenancy, audit logs, backup/restore and open issues.
5. Keep a baseline branch and use feature branches for every customization.

**Exit criteria:** repeatable local setup; smoke tests pass; a written gap analysis exists; no production deployment until tenant boundaries and authorization are tested.

## MVP — Phase 1: pilot hotel
- Branding and configurable property settings.
- Hotel group, property, user and role model.
- Room types, rates, availability, reservations, guest profiles, check-in/out and folios.
- Housekeeping status and maintenance tickets.
- Cashier shifts, receipts, expenses and daily reconciliation.
- CSV import/export and basic occupancy/revenue reporting.
- Nigeria configuration: NGN, Africa/Lagos, configurable tax and service-charge rules, receipt fields and payment-provider adapter.
- Responsive web/PWA interface for desktop and mobile browsers.

**Pilot gate:** run a realistic end-to-end test with a demo hotel and a separate tenant; verify backups, access control, data export and incident recovery.

## Phase 2: restaurant POS
- Menu and modifier management, tables, orders, kitchen tickets and void/refund controls.
- Stock movements, recipe costing and low-stock alerts where scope permits.
- Room-charge posting to the guest folio with idempotency and audit trails.
- Cashier shift close and reconciliation.
- Payment gateway integration using provider test mode first; verify signed webhooks and server-side payment status.

## Phase 3: smart-hotel integrations
Deliver one integration at a time through adapters and documented capability checks:
1. Smart locks: vendor-supported API, credential expiry, access audit, revocation and safe fallback.
2. IP PBX/intercom: guest-room extensions and call-event mapping where supported.
3. Wi-Fi: guest access vouchers or captive portal through vendor-supported interfaces.
4. CCTV: link to the approved VMS interface; avoid copying video into the PMS unless there is a justified, compliant need.

Never assume devices support an API because they are network-connected. Confirm the exact make/model, firmware, local controller and vendor access before implementation.

## Phase 4: AI assistance
- Read-only operational summaries and natural-language report queries.
- Housekeeping workload suggestions and guest-message drafts.
- Knowledge assistant grounded in approved hotel policies.
- Human approval for refunds, price changes, door access, account changes and external messages.
- Track AI input/output, permissions, costs and feedback; minimize personal data sent to external models.

## Phase 5: SaaS hardening and platform expansion
- Tenant isolation tests, rate limits, security headers, MFA, secret rotation and audit review.
- Monitoring, alerts, backup retention and tested disaster recovery.
- CI checks, dependency scanning and release notes.
- App packaging only after web/PWA workflows stabilize; native iOS/Android or desktop wrappers only where there is a validated need.
- Subscription billing, tenant onboarding, support workflow and service-level targets.

## Suggested GitHub milestones
1. Foundation audit and reproducible dev setup
2. Tenant safety and roles
3. Front-desk pilot
4. Finance and Nigeria localization
5. Restaurant POS
6. First hardware integration
7. AI assistant and reporting
8. Pilot readiness and SaaS hardening

## Definition of done
Every change has a test or documented manual verification, permission checks, migration/rollback notes where relevant, user-facing documentation, and no secrets or real guest data in source control.
