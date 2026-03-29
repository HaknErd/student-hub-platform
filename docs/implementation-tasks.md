# Student Hub Task Breakdown

This plan breaks the roadmap into concrete work items with shared outputs so frontend and backend can progress in parallel.

## Working agreement

- Every milestone starts from a locked contract, not from open questions.
- Frontend builds against OpenAPI-generated types plus checked-in fixtures.
- Backend returns contract-compliant `501` errors for planned-but-unfinished routes.
- Shared enums, seed data, and example payloads are versioned with the codebase.

## Milestone 0 - Decision freeze and shared foundations

### 1. Lock launch decisions
- [ ] Freeze auth/session model: school email + password, short-lived JWT access token, rotating refresh token cookie.
- [ ] Freeze the access matrix for anonymous, student, prefect, teacher, and admin roles.
- [ ] Freeze workflow states for resources, articles, feedback, reports, and calendar subscriptions.
- [ ] Freeze the v1 resource taxonomy, moderation policy, retention policy, and deployment defaults.

Done when:
- No MVP endpoint or screen depends on a policy decision that is still open.
- The specification contains a clear decision log.

### 2. Shared scaffolding
- [ ] Publish OpenAPI v1 for all MVP endpoints.
- [ ] Add example request/response payloads and fixture data for MVP screens.
- [ ] Seed subjects, resource types, calendar categories, and workflow statuses.
- [ ] Add local dev Compose setup for Postgres and object storage.

Done when:
- Frontend fixtures and backend seed data use the same enums and reference records.
- New team members can start the stack and understand the contract without extra meetings.

## Milestone 1 - Platform foundation

### 3. Backend track
- [ ] Create the backend Go module and package layout.
- [ ] Implement `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, and `GET /auth/me`.
- [ ] Implement `GET /users/me` and `PATCH /users/me`.
- [ ] Implement `GET /subjects`, `GET /subjects/{subject_id}`, and `GET /resource-types`.
- [ ] Implement `POST /uploads/presign`, `GET /healthz`, `GET /readyz`, and `GET /openapi.json`.

### 4. Frontend track
- [ ] Create the frontend SvelteKit app with TypeScript.
- [ ] Add app shell, auth screens, session store, and route guards.
- [ ] Add typed API client generation from OpenAPI.
- [ ] Add fixture/mock mode for auth bootstrap, subjects, resource types, and presign responses.
- [ ] Build subject navigation and the resource upload form shell.

### 5. Integration gate
- [ ] Verify app bootstrap works in both fixture mode and live API mode.
- [ ] Verify route guards use the same role and access rules as the backend.
- [ ] Verify subjects and resource types load from real and fixture data without UI changes.

Done when:
- Both apps run locally.
- Frontend can keep shipping screens even if some backend routes are not finished.

## Milestone 2 - Resources and moderation MVP

### 6. Backend track
- [ ] Implement `GET /resources`, `POST /resources`, `GET /resources/{resource_id}`, `PATCH /resources/{resource_id}`, `DELETE /resources/{resource_id}`, and `GET /resources/{resource_id}/download`.
- [ ] Implement resource status transitions: `pending_review`, `verified`, `rejected`, `deleted`.
- [ ] Implement `POST /resources/{resource_id}/verify` and `POST /resources/{resource_id}/reject`.
- [ ] Add the first moderation queue view in `GET /admin/queue` for pending resources.

### 7. Frontend track
- [ ] Build subject list and subject detail pages.
- [ ] Build resource listing, detail, upload, and download flows.
- [ ] Build student submission states for pending, verified, and rejected resources.
- [ ] Build moderator approve/reject actions and queue filters.

### 8. Integration gate
- [ ] Verify students can upload a resource from a presigned upload through record creation.
- [ ] Verify prefects can review and change resource status without leaving the shared queue.
- [ ] Verify soft-deleted resources disappear from student lists but remain auditable for moderators.

Done when:
- Students can browse and submit resources.
- Prefects can moderate the resource pipeline end-to-end.

## Milestone 3 - Calendar MVP

### 9. Backend track
- [ ] Implement `GET /calendar/categories`.
- [ ] Implement calendar event CRUD with audit logging.
- [ ] Enforce role-based permissions for prefect, teacher, and admin event management.

### 10. Frontend track
- [ ] Build upcoming events list and event detail view.
- [ ] Build event filters by category and date range.
- [ ] Build staff event create/edit/delete screens.

### 11. Integration gate
- [ ] Verify students can browse upcoming events from live or fixture data.
- [ ] Verify staff can create and update events with audit information preserved.

Done when:
- Calendar browsing and event management work without the subscription worker.

## Milestone 4 - Community and safety workflows

### 12. Backend track
- [ ] Implement article draft, submit, publish, archive, and list/detail endpoints.
- [ ] Implement feedback submission and moderation endpoints.
- [ ] Implement report submission, triage, escalation, assignment, and resolution endpoints.
- [ ] Expand `GET /admin/queue` to include articles, feedback, and reports.

### 13. Frontend track
- [ ] Build article draft editor, submission flow, and published article pages.
- [ ] Build anonymous-to-moderator feedback and report forms.
- [ ] Build unified moderation workspace for articles, feedback, and reports.

### 14. Integration gate
- [ ] Verify article status transitions match the contract exactly.
- [ ] Verify anonymous submissions hide reporter identity in prefect workflows.
- [ ] Verify serious reports follow the escalation path without custom side channels.

Done when:
- Community submissions are safe, reviewable, and consistent across frontend and backend.

## Milestone 5 - Search and personalization

### 15. Backend track
- [ ] Implement flat `GET /search` results for resources first, then events, then articles.
- [ ] Implement saved resources and year-group filtering/profile fields.
- [ ] Keep moderator-only content out of search results unless the caller has permission.

### 16. Frontend track
- [ ] Build empty, loading, and no-result search states.
- [ ] Add saved resources UX.
- [ ] Add year-group-aware content filtering and basic profile settings.

### 17. Integration gate
- [ ] Verify the same search UI works as additional content types are enabled.
- [ ] Verify personalization changes affect API results and frontend filters consistently.

Done when:
- Users can discover and save relevant content without contract changes.

## Milestone 6 - Platform hardening

### 18. Backend track
- [ ] Implement calendar subscription CRUD, sync queue, retry/backoff, and tokenized `.ics` feeds.
- [ ] Add structured logging, request correlation IDs, and error reporting.
- [ ] Add HTTP cache headers and resource invalidation strategy.

### 19. Frontend track
- [ ] Build calendar subscription management screens and sync status states.
- [ ] Complete accessibility review for keyboard navigation, labels, and contrast.
- [ ] Complete responsive/mobile polish and resilient error states.

### 20. Integration gate
- [ ] Verify subscriptions work without blocking event CRUD or event browsing.
- [ ] Verify observability covers auth, resources, moderation, and calendar flows.
- [ ] Verify Lighthouse, accessibility, and mobile targets are met.

Done when:
- The launch scope is stable, observable, and ready to operate.

## Non-launch scope

- [ ] Timetable, conduct, and grade/report integrations stay out of the launch contract.
- [ ] Live notifications stay out unless moderation or calendar workflows prove the need.
- [ ] Forums and peer tutoring stay out until moderation capacity is proven.
