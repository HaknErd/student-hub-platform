# Student Hub Implementation Roadmap

## Goal
Build a useful student hub without overbuilding the first release. The launch plan is contract-first and parallel by default: frontend and backend work from the same locked decisions, OpenAPI contract, fixtures, and reference data.

See `docs/implementation-tasks.md` for the detailed task breakdown.
See `docs/api-contract.md` for the endpoint contract.
See `student-hub-specification.md` for the locked product and technical choices.

## Launch rules

- No milestone starts with unresolved auth, access, moderation, or data-model decisions.
- Backend ships contract-compliant `501` responses for unfinished routes instead of unstable partial shapes.
- Frontend keeps a fixture/mock mode so screens can be built before live endpoints land.
- Shared enums, seed data, and example payloads are source-of-truth artifacts, not tribal knowledge.

## Priority lanes

### P0 - Decision freeze and platform foundation
- Lock auth/session model, RBAC, access matrix, moderation states, resource taxonomy, and deployment defaults.
- Publish OpenAPI contract plus example payloads for all MVP endpoints.
- Create backend service skeleton, frontend app shell, seeded reference data, and local dev stack.
- Implement auth, profile bootstrap, subjects, resource types, and upload presign flow.

### P1 - Resources and calendar MVP
- Resource browse, upload, download, verification, soft delete, and a minimal moderation queue.
- Calendar event CRUD, upcoming events UI, category filters, and audit logging.
- Frontend moderation views and backend status transitions ship in the same milestone.
- Search starts with resources, then expands to events.

### P2 - Community and personalization
- Article drafts, submission, and publishing with locked moderation rules.
- Feedback and issue reporting with anonymous-to-moderator handling and escalation workflow.
- Saved resources, year-group filtering, and flat global search across shipped content types.
- Admin queue unifies resources, articles, feedback, and reports.

### P3 - Platform hardening
- Calendar subscription CRUD, sync worker, retry/backoff, and tokenized `.ics` feeds.
- Accessibility pass, mobile polish, structured logging, error reporting, and cache headers.
- Background processing, storage hygiene, and operational runbooks.

### Later - Optional integrations
- Timetable, conduct, and grade/report integrations after school-system approval.
- Live notifications only if moderation or calendar workflows genuinely need them.
- Forums, peer tutoring, and broader community tooling after moderation capacity is proven.

## Delivery model

### Milestone 0 - Contract freeze
Shared outputs:
- Decision log in the specification.
- Stable OpenAPI v1 plus example payloads.
- Seed data for subjects, resource types, calendar categories, and workflow statuses.
- Frontend design tokens and navigation map.

Finish when:
- Frontend can build against fixtures without backend availability.
- Backend can implement routes without waiting on UI decisions.

### Milestone 1 - Platform foundation
Backend track:
- Auth/session endpoints, `GET /auth/me`, and `GET/PATCH /users/me`.
- `GET /subjects`, `GET /resource-types`, and `POST /uploads/presign`.
- Health, readiness, and OpenAPI endpoints.

Frontend track:
- App shell, auth screens, session store, and route guards.
- Subject navigation, upload form shell, and shared API client/types.
- Fixture-backed integration tests for bootstrap flows.

Finish when:
- Live API and fixture mode both satisfy the same contract.

### Milestone 2 - Resources and moderation
Backend track:
- Resource CRUD, verification workflow, soft delete, and moderation queue slice.

Frontend track:
- Resource list/detail/upload/download screens and moderator approve/reject actions.

Finish when:
- Students can submit resources and prefects can process them end-to-end.

### Milestone 3 - Calendar MVP
Backend track:
- Event CRUD, categories, and audit log.

Frontend track:
- Upcoming events list, filters, and event management screens.

Finish when:
- Staff can manage events and students can browse them without the subscription worker.

### Milestone 4 - Community MVP
Backend track:
- Articles, feedback, reports, and the shared moderation queue.

Frontend track:
- Article draft/submit flows, feedback/report forms, and moderator workspace.

Finish when:
- Community submissions follow the locked status models and escalation rules.

### Milestone 5 - Discovery and hardening
- Expand search from resources to events to articles with one flat response shape.
- Add saved resources and year-group filtering.
- Add calendar sync, observability, accessibility, and performance work without changing core contracts.

## Guardrails

- Keep the schema strict where data quality matters.
- Use JSONB only where the shape is genuinely variable.
- Prefer simple flows over speculative integrations.
- Keep optional school-system integrations outside the launch contract.
