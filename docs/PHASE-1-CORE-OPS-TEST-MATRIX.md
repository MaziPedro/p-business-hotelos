# Phase 1 — Core Hotel Operations Verification Matrix

**Status:** implementation/verification checklist; not a claim of release readiness.  
**Tracker:** [Issue #7 — Core Hotel Operations MVP](https://github.com/MaziPedro/p-business-hotelos/issues/7)  
**Scope:** multi-property PMS core: property authorization, rooms, reservations, guest records, check-in/out, housekeeping, and audit-safe operational workflows.

## Existing foundation verified by source inspection

The API already has dedicated modules for `property`, `room`, `reservation`, `guest`, and `housekeeping`. Relevant existing controls/tests include:

- `PropertyScopeGuard` checks a request's `propertyId` against the authenticated user's property membership and rejects missing principals/non-scalar IDs on non-public property-scoped routes.
- Room and reservation foreign-key ownership tests reject room types/rate plans from another property before writes.
- Reservation status transitions are represented by `reservation-state-machine.ts`.
- `reservation-race.spec.ts` tests conditional-update conflict handling when another request wins a status transition.
- Housekeeping has service, completion, dashboard, and foreign-key ownership tests.

This is source-level inventory only. It does not prove all routes, production configuration, database behavior, or deployed integrations are secure. The tests must run against the current commit in CI, and the database queries need end-to-end review.

## Required verification matrix

| Area | Positive path | Negative/security path | Concurrency/data integrity | Evidence required |
|---|---|---|---|---|
| Authentication and property scope | Member accesses an assigned property | Missing user; foreign property; duplicated/array `propertyId`; property ID tampering in query/body/path | N/A | Guard tests plus controller/API integration tests |
| Platform administrator | Explicitly authorized cross-property administration | Ordinary staff cannot acquire platform scope through request parameters or headers | N/A | Role/permission tests and audit-log assertion |
| Rooms and room types | Create, update, list, change status within property | Foreign room-type reference; room ID from another property; unauthorized status update | Concurrent assignments/status changes must not leave inconsistent room state | Service and API integration tests with two properties |
| Reservations | Create, search availability, assign room, confirm, cancel, check-in/out | Foreign guest/room/room type/rate plan/folio reference; cross-property list/search/detail access | Competing confirmation, cancellation, assignment, and check-in requests; stale status transitions | Reservation ownership, state-machine, race, and integration tests |
| Guest records | Create/search/update guest under permitted property policy | Cross-property enumeration, unauthorized export, sensitive-field overexposure | Concurrent edits do not silently overwrite changes where versioning is required | Guest service tests plus API authorization/serialization tests |
| Check-in/check-out | Valid transition with required room/folio conditions | Invalid transition; wrong property; incomplete preconditions; repeated action | Duplicate requests are idempotent or return a clear conflict; no double charge/duplicate side effect | Lifecycle tests and transaction/side-effect assertions |
| Housekeeping | Assign, start, inspect, complete task for a permitted property | Foreign room/task/assignee references; unauthorized completion | Two staff cannot create contradictory completion/inspection outcomes | Existing housekeeping tests plus cross-property API tests |
| Lists, filters, search, exports | Correctly scoped results and pagination | Try foreign IDs, filters, search terms, export endpoints, and nested relation IDs | Stable pagination and bounded result sizes | Endpoint inventory and negative integration tests |
| Background jobs and events | Jobs operate on the originating property's data | Forged/missing tenant context; event payload references foreign entities | Retries do not duplicate side effects | Job/listener tests, tenant context assertions, idempotency evidence |
| Production configuration | Secure defaults with explicit secrets and supported auth | `AUTH_ENABLED=false`, insecure overrides, payment mocks, weak/missing secrets in production/staging | N/A | Bootstrap/config tests and deployment environment review |

## Required two-property test fixture

Use Property A and Property B with distinct staff users, rooms, room types, guests, reservations, folios, housekeeping tasks, and credentials. For every endpoint under test, run a normal same-property request and then repeat with a Property B identifier while authenticated as Property A staff. Assert no foreign data is returned, changed, deleted, exported, or leaked through error details. Test both direct object IDs and nested foreign-key references.

Platform-administrator tests must use the documented explicit role/permission mechanism; do not simulate platform access by supplying a client-controlled `propertyId` or role.

## Release gates

- [ ] Complete controller-to-service-to-database route inventory for every scoped resource, including nested routes, exports, WebSockets, listeners, and jobs.
- [ ] Run the relevant existing test suites and new API/database integration tests on the final commit.
- [ ] Run lint, typecheck, build, full test suite, release smoke, and demo smoke successfully.
- [ ] Run CodeQL after the final code commit; remediate or document remaining alerts with evidence, not assumptions.
- [ ] Confirm demo-only authentication bypasses and mock payment modes cannot be enabled in production/staging, including override paths.
- [ ] Test database migrations on a clean database and a representative upgrade; document rollback/restore procedure.
- [ ] Validate backups and restore, monitoring/alerting, secrets rotation, TLS, privacy/retention, payment handling, and operational incident process before a commercial pilot.
- [ ] Validate hardware/vendor integrations separately with real vendor credentials and compatible test devices; source code or a demo adapter alone is insufficient evidence.

## Known boundaries

- A property-scope guard is one layer, not a replacement for service-level ownership checks and tenant-scoped database queries.
- Unit tests with mocked database calls are useful but do not prove real database isolation, transactions, or query semantics.
- The current repository contains smart-lock adapter code, but CCTV/VMS, hotel PBX/intercom, and managed Wi-Fi integrations must be separately validated before being sold as supported production capabilities.
- Native mobile clients are not established by the current workspace inventory; keep the initial product web-first and responsive unless a separate native-client workstream is approved.

## Source files reviewed

- `apps/api/src/modules/auth/property-scope.guard.ts`
- `apps/api/src/modules/auth/property-scope.guard.spec.ts`
- `apps/api/src/modules/room/room-fk-ownership.spec.ts`
- `apps/api/src/modules/reservation/reservation-fk-ownership.spec.ts`
- `apps/api/src/modules/reservation/reservation-state-machine.ts`
- `apps/api/src/modules/reservation/reservation-race.spec.ts`
- `apps/api/src/modules/housekeeping/` (service and ownership test inventory)
