# P-Business HotelOS — Foundation Audit

**Status:** Source review expanded; runtime verification pending  
**Repository:** [MaziPedro/p-business-hotelos](https://github.com/MaziPedro/p-business-hotelos)  
**Scope:** Initial setup, security boundaries, CI configuration, and readiness for multi-property SaaS development

## Summary

The repository is being evaluated as the upstream foundation for P-Business HotelOS. The immediate goal is to establish a reproducible local development environment and understand existing behavior before adding hotel-specific features.

This document separates source observations from checks that still need to be performed. A source-file review is not proof that the application builds, tests pass, or deployment is secure.

## Findings from the source review

- The root `package.json` specifies Node.js 20+ and pnpm 9+ and pins pnpm 9.15.4 as the package manager.
- The project is a TypeScript monorepo with API, booking, dashboard, database, and shared-package areas.
- A GitHub Actions CI workflow exists at [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). It defines lint/typecheck, test, release-smoke, build, and Docker demo-smoke jobs. These jobs are configuration only until a run completes successfully.
- The workflow-run query made during this audit returned no runs for `main`; therefore CI status is **unverified**, not passing. Check repository Actions settings and run history if no new run appears after a commit.
- The `JwtAuthGuard` and `PropertyScopeGuard` both default `AUTH_ENABLED` to `true`, and both bypass enforcement when it is explicitly set to the string `false`. This is useful for local demo mode but makes production environment/configuration separation a release blocker.
- The property-scope guard checks a scalar `propertyId` from query, body, or route params against the authenticated user's `propertyIds`, with platform-role exceptions. The source includes explicit fail-closed behavior for duplicate/array IDs and missing users on non-public routes.
- A unit test file exists for the property-scope guard and covers same-property access, foreign-property denial, body IDs, platform admins, missing IDs, public routes, array IDs, missing users, and the `AUTH_ENABLED=false` bypass. These tests have been inspected but **not executed in this audit**.
- `@Public()` routes bypass the global guard and therefore need their own appropriate authentication/signature checks where applicable (for example inbound webhooks). The source review does not establish that every public endpoint is correctly protected.
- The local/demo Compose configuration includes authentication-disabled and insecure-mode settings. Treat it as local-demo-only. Do not expose it to the public internet or use it with real guest, payment, access-control, or staff data.

## Reproducible development verification

Run these steps in a disposable development environment, following the repository's current README and deployment documentation:

1. Install the documented Node.js and pnpm versions.
2. Review environment templates and ensure no production secrets are present.
3. Start the local dependencies using the documented Docker Compose command.
4. Install workspace dependencies using the repository's lockfile and documented package-manager command.
5. Run the documented database migration, build, lint, type-check, and test commands.
6. Record the exact commands, versions, results, and any failures in the Phase 0 issue tracker.
7. Confirm that the application is reachable locally and that a fresh database can be initialized from documented steps.
8. Confirm that the repository's GitHub Actions CI jobs run and inspect any failed job's earliest failing step.

**Verification status:** No local install, Docker startup, migration, build, lint, type-check, or test command has been executed as part of this source-only audit. No claim is made that the application currently builds or passes tests.

## Security review checklist

### Tenant and property isolation
- [ ] Identify the tenant/property ownership model and how authenticated identity maps to permitted properties.
- [ ] Test that a user from Property A cannot read, modify, export, or delete Property B data by changing IDs or API parameters.
- [ ] Verify authorization on background jobs, exports, webhooks, file access, reports, and WebSocket/event channels—not only HTTP route guards.
- [ ] Document platform-admin and support-staff exceptions; require least privilege and audit trails.
- [ ] Add automated negative tests for cross-tenant access at controller/service and data-access boundaries.

### Authentication and secrets
- [ ] Ensure authentication-disabled and insecure-mode flags cannot be enabled accidentally in production.
- [ ] Fail closed when production secrets or identity-provider settings are missing.
- [ ] Keep credentials, tokens, encryption keys, and guest information out of Git, logs, and client bundles.
- [ ] Review session expiry, password/reset flows, MFA options, rate limits, and account recovery.
- [ ] Review every `@Public()` route for its own authentication, signature validation, replay protection, and rate limits as appropriate.

### Data and operations
- [ ] Review database roles, migrations, backups, restore drills, retention, and encryption in transit/at rest.
- [ ] Verify TLS and reverse-proxy configuration before any public deployment.
- [ ] Audit dependency licenses, known vulnerabilities, lockfile integrity, and secret scanning.
- [ ] Add health checks, structured logs, alerting, and an incident-response procedure.

### Smart-hotel integrations
- [ ] Treat smart-lock, CCTV, intercom, Wi-Fi, and PBX credentials as secrets.
- [ ] Use least-privilege service accounts and network segmentation for on-site devices.
- [ ] Log remote unlock and other security-sensitive actions, with actor, property, timestamp, and outcome.
- [ ] Require explicit authorization and human confirmation for AI-triggered door access or other physical-security actions.

## Production-readiness gate

Do not onboard a real hotel or real guest data until the team has documented and verified:

1. Reproducible build and passing relevant automated tests.
2. Tenant-isolation tests and a reviewed authorization model.
3. Production authentication enabled by default and demo bypasses blocked.
4. Secure secrets management, TLS, backup/restore, monitoring, and incident response.
5. Privacy, payment, and data-retention requirements applicable to the deployment.

## Next actions

1. Reproduce local setup and capture exact results.
2. Map modules, routes, schema, and integration points.
3. Complete tenant-isolation and role-authorization tests.
4. Verify license notices and dependency/supply-chain controls.
5. Separate demo-only authentication settings from all production paths.

Related planning: [Product roadmap](PRODUCT-ROADMAP.md) · [Architecture and operations](ARCHITECTURE-AND-OPERATIONS.md)
