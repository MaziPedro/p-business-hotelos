# P-Business HotelOS — Foundation Audit

**Status:** Initial documentation review; runtime verification pending  
**Repository:** [MaziPedro/p-business-hotelos](https://github.com/MaziPedro/p-business-hotelos)  
**Scope:** Initial setup, security boundaries, and readiness for multi-property SaaS development

## Summary

The repository is being evaluated as the upstream foundation for P-Business HotelOS. The immediate goal is to establish a reproducible local development environment and understand existing behavior before adding hotel-specific features.

This document separates observations from checks that still need to be performed. A source-file review is not proof that the application builds, tests pass, or deployment is secure.

## Observations from the initial review

- The documented toolchain specifies Node.js 20+ and pnpm 9+.
- The project is organized as a TypeScript monorepo with API, booking, dashboard, database, and shared-package areas.
- The repository documents Docker-based local development and a separate production deployment configuration.
- The local/demo Compose configuration includes authentication-disabled and insecure-mode settings. Treat this configuration as local-demo-only. Do not expose it to the public internet or use it with real guest, payment, access-control, or staff data.
- Property-scoped authorization code exists. Its complete coverage, bypass rules, role assignment, and enforcement across all routes and data access paths still require testing.

## Reproducible development verification

Run these steps in a disposable development environment, following the repository's current README and deployment documentation:

1. Install the documented Node.js and pnpm versions.
2. Review environment templates and ensure no production secrets are present.
3. Start the local dependencies using the documented Docker Compose command.
4. Install workspace dependencies using the repository's lockfile and documented package-manager command.
5. Run the documented database migration, build, lint, type-check, and test commands.
6. Record the exact commands, versions, results, and any failures in the Phase 0 issue tracker.
7. Confirm that the application is reachable locally and that a fresh database can be initialized from documented steps.

**Verification status:** Not yet executed in this audit. No claim is made that the application currently builds or passes tests.

## Security review checklist

### Tenant and property isolation
- [ ] Identify the tenant/property ownership model and how authenticated identity maps to permitted properties.
- [ ] Test that a user from Property A cannot read, modify, export, or delete Property B data by changing IDs or API parameters.
- [ ] Verify authorization on background jobs, exports, webhooks, file access, reports, and WebSocket/event channels—not only HTTP route guards.
- [ ] Document platform-admin and support-staff exceptions; require least privilege and audit trails.
- [ ] Add automated negative tests for cross-tenant access.

### Authentication and secrets
- [ ] Ensure authentication-disabled and insecure-mode flags cannot be enabled accidentally in production.
- [ ] Fail closed when production secrets or identity-provider settings are missing.
- [ ] Keep credentials, tokens, encryption keys, and guest information out of Git, logs, and client bundles.
- [ ] Review session expiry, password/reset flows, MFA options, rate limits, and account recovery.

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
