# Student Hub API Contract

This is the backend/frontend contract. It describes what each endpoint does, how it behaves, and what clients can rely on.

## Base rules

- Base URL: `/api/v1`
- Auth: `Authorization: Bearer <jwt>` for protected routes
- Refresh token transport: `HttpOnly`, `Secure` cookie named `refresh_token`
- Access token lifetime: 15 minutes; refresh token lifetime: 14 days with rotation on every refresh
- Content type: `application/json` unless uploading files
- All timestamps are ISO-8601 UTC strings
- IDs are UUID strings
- List endpoints support pagination unless noted otherwise

## Common response shapes

### Success
```json
{ "data": {} }
```

### List
```json
{
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 134 }
}
```

### Error
```json
{
  "error": {
    "code": "validation_error",
    "message": "title is required",
    "fields": { "title": ["required"] }
  }
}
```

## Conventions

- `404` means the resource does not exist or is hidden.
- `403` means the user exists but lacks permission.
- `409` means a business rule conflict, like duplicate slug or invalid status transition.
- `422` means validation failed.
- Soft-deleted resources should not appear in normal list endpoints.
- Admin/moderation endpoints should return full records, including hidden state.

## Access model

- Public endpoints: `GET /healthz`, `GET /readyz`, `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, and `GET /openapi.json`.
- Authenticated student endpoints: subjects, resources, calendar browsing, articles, feedback/report submission, search, and personal calendar subscriptions.
- Prefect/teacher endpoints: moderation, resource verification, event management, article publication, and queue processing.
- Admin-only endpoints: user listing, role management, audit log, and identity reveal for escalated anonymous submissions.

## Workflow states

- Resource status: `pending_review`, `verified`, `rejected`, `deleted`
- Article status: `draft`, `submitted`, `published`, `archived`
- Feedback status: `pending`, `reviewed`, `actioned`
- Report status: `submitted`, `triaged`, `escalated`, `resolved`, `closed`
- Calendar subscription status: `pending_first_sync`, `active`, `paused`, `error`

## Shared object types

### User
```json
{
  "id": "uuid",
  "email": "student@sgsc-students.com",
  "full_name": "Student Name",
  "year_group": 12,
  "roles": ["student"],
  "is_active": true,
  "created_at": "2026-03-29T10:00:00Z",
  "updated_at": "2026-03-29T10:00:00Z"
}
```

### Subject
```json
{ "id": "uuid", "name": "Maths", "code": "MA-HL" }
```

### Resource
```json
{
  "id": "uuid",
  "title": "Algebra revision pack",
  "description": "Topic summary and practice questions",
  "subject": { "id": "uuid", "name": "Maths" },
  "type": { "id": "uuid", "name": "study_guide" },
  "file_url": "https://storage/...",
  "file_size": 234422,
  "content_hash": "sha256hex",
  "metadata": {},
  "author": { "id": "uuid", "full_name": "Student Name" },
  "status": "pending_review",
  "created_at": "2026-03-29T10:00:00Z",
  "updated_at": "2026-03-29T10:00:00Z",
  "deleted_at": null
}
```

### Event
```json
{
  "id": "uuid",
  "title": "IB deadlines week",
  "description": "EE and IA deadline reminders",
  "category": { "id": "uuid", "name": "academic" },
  "start_time": "2026-04-01T08:00:00Z",
  "end_time": "2026-04-01T09:00:00Z",
  "location": "Main hall",
  "is_all_day": false,
  "created_by": { "id": "uuid", "full_name": "Prefect Name" },
  "created_at": "2026-03-29T10:00:00Z",
  "updated_at": "2026-03-29T10:00:00Z"
}
```

## Health

### `GET /healthz`
- Public.
- Returns a lightweight liveness check.
- Must not touch the database.

### `GET /readyz`
- Public.
- Returns readiness for API + database + storage dependencies.
- Used by deployment checks.

---

## Auth

### `POST /auth/register`
Creates the initial account.

- Public, but email domain must be allowed.
- If the address is not `@sgsc-students.com`, return `422`.
- If the email already exists, return `409`.
- Must create a `student` role by default unless an invite/admin flow sets otherwise.

Request:
```json
{ "email": "student@sgsc-students.com", "full_name": "Student Name", "password": "..." }
```

Response:
```json
{ "data": { "user": {}, "access_token": "..." } }
```

- Also sets the `refresh_token` cookie.

### `POST /auth/login`
Authenticates a user and returns JWT tokens.

- Public.
- Invalid credentials return `401`.
- Inactive users return `403`.
- Returns the access token in the response body and the refresh token as the `refresh_token` cookie.

Request:
```json
{ "email": "student@sgsc-students.com", "password": "..." }
```

### `POST /auth/refresh`
Exchanges a refresh token for a new access token.

- Public.
- Reads the refresh token from the `refresh_token` cookie; request body is empty.
- Missing, invalid, or expired refresh tokens return `401`.
- Always rotates the refresh token on success.

### `POST /auth/logout`
Invalidates the current session.

- Auth required.
- Clears the `refresh_token` cookie and revokes the stored refresh token.
- Always succeeds from the client perspective.

### `GET /auth/me`
Returns the current authenticated user.

- Auth required.
- Used by frontend bootstrapping and route guards.

---

## Users and roles

### `GET /users/me`
Returns the current user profile.

- Auth required.
- Includes roles and year group.
- Frontend should call this on app load.

### `PATCH /users/me`
Updates profile fields the user can edit.

- Auth required.
- Allowed fields in v1: `full_name` only.
- `year_group` is admin-managed and cannot be changed here.

### `GET /users`
Lists users.

- Admin only.
- Supports search by name/email and filtering by year group/role.

### `GET /users/{user_id}`
Returns a user record.

- Admin only.
- Used for audit, support, and role-management workflows.

### `GET /roles`
Returns available roles.

- Admin only.
- Used for assignment UIs and moderation tools.

---

## Subjects and resource types

### `GET /subjects`
Lists all subjects.

- Auth required.
- Used by navigation, filtering, and upload forms.

### `GET /subjects/{subject_id}`
Returns one subject and basic counts if available.

- Auth required.
- Should return `404` for missing subjects.

### `GET /resource-types`
Lists resource categories such as `past_paper` or `study_guide`.

- Auth required.
- Used to drive upload options.

---

## Resources

### `GET /resources`
Lists visible resources.

- Auth required.
- Filters: `subject_id`, `type_id`, `year_group`, `status`, `q`, `sort`, `page`, `limit`.
- Must exclude soft-deleted rows.
- Search should rank title first, then description and metadata.

### `POST /uploads/presign`
Creates a signed upload target for file storage.

- Auth required.
- Used before resource creation.
- Returns `upload_url`, `file_url`, `headers`, and an upload expiry.
- If the file type is not allowed, return `422`.

Request:
```json
{ "purpose": "resource_file", "filename": "paper.pdf", "content_type": "application/pdf", "size": 123456 }
```

### `POST /resources`
Creates a resource record after upload.

- Auth required.
- Student submissions always start as `pending_review`.
- Prefects, teachers, and admins may create resources directly in `verified` state.
- Must reject unknown subjects/types.
- If `content_hash` already exists for the same file, return `409`.

Request:
```json
{
  "title": "Algebra revision pack",
  "description": "Topic summary and practice questions",
  "subject_id": "uuid",
  "type_id": "uuid",
  "file_url": "https://storage/...",
  "file_size": 234422,
  "content_hash": "sha256hex",
  "metadata": { "year": 12, "exam_board": "IB" }
}
```

### `GET /resources/{resource_id}`
Returns one resource.

- Auth required.
- Hidden resources return `404` unless the caller can moderate them.

### `PATCH /resources/{resource_id}`
Updates resource metadata.

- Auth required.
- Authors can edit only while the resource is `pending_review` or `rejected`.
- Prefects, teachers, and admins can edit any non-deleted resource metadata.
- Changing the file should require a new upload or a new `file_url` and `content_hash`.

### `DELETE /resources/{resource_id}`
Soft deletes a resource.

- Auth required.
- Authors can delete only their own `pending_review` or `rejected` resources.
- Prefects and admins can soft delete any resource.
- Should set `deleted_at` rather than physically removing the row.
- Deleted resources must disappear from normal list endpoints.

### `POST /resources/{resource_id}/verify`
Marks a resource as verified.

- Prefect, teacher, or admin only.
- Should be idempotent.
- Return the updated resource state.

### `POST /resources/{resource_id}/reject`
Marks a resource as rejected.

- Prefect, teacher, or admin only.
- Requires a rejection reason.
- Should be idempotent for already rejected resources.

### `GET /resources/{resource_id}/download`
Returns or redirects to a download URL.

- Auth required.
- Should issue a short-lived signed URL if file storage is private.

---

## Calendar

### `GET /calendar/events`
Lists calendar events.

- Auth required.
- Filters: `category_id`, `from`, `to`, `q`, `page`, `limit`.
- All-day events must sort correctly with timed events.

### `POST /calendar/events`
Creates an event.

- Prefect, teacher, or admin only.
- Required fields: `title`, `category_id`, `start_time`.
- If `end_time` exists it must be after `start_time`.
- Response should include the created record.

### `GET /calendar/events/{event_id}`
Returns one event.

- Auth required.
- Hidden events should return `404` unless the caller can manage them.

### `PATCH /calendar/events/{event_id}`
Updates an event.

- Prefect, teacher, or admin only.
- Partial updates allowed.
- Must preserve audit timestamps.

### `DELETE /calendar/events/{event_id}`
Deletes an event.

- Prefect, teacher, or admin only.
- Use soft delete in v1 so audit history remains intact.

### `GET /calendar/categories`
Lists event categories.

- Auth required.
- Used for filters and event creation forms.

### `POST /calendar/subscriptions`
Creates a personal external calendar subscription.

- Auth required.
- Requires external `.ics` URL and a display name.
- Backend should validate that the URL is reachable later, not block the request on slow fetches.
- New subscriptions start in `pending_first_sync` state.

### `GET /calendar/subscriptions`
Lists the caller’s subscriptions.

- Auth required.
- Returns only the caller's subscriptions unless an admin passes `user_id`.

### `PATCH /calendar/subscriptions/{subscription_id}`
Updates sync settings.

- Auth required.
- Allowed edits: `name` and `active`.
- Refresh interval is fixed at 6 hours in v1.

### `DELETE /calendar/subscriptions/{subscription_id}`
Removes a subscription.

- Auth required.
- Should stop future syncs immediately.

### `POST /calendar/subscriptions/{subscription_id}/sync`
Triggers a sync attempt.

- Auth required; owner or admin only.
- Should return `202` if sync is queued.
- If the feed has not changed, no events should be rewritten.
- Manual sync is limited to once every 15 minutes.

### `GET /calendar/feed.ics`
Returns a generated iCal feed.

- Public with a required `token` query parameter.
- Not part of the MVP milestone; the endpoint may return `501` until calendar subscriptions ship.
- Should be cacheable.

---

## Articles

### `GET /articles`
Lists published articles.

- Auth required.
- Drafts only visible to authors and moderators.
- Filters: `author_id`, `status`, `q`, `page`, `limit`.

### `POST /articles`
Creates a new article draft.

- Auth required.
- Any authenticated student can create a `draft`.
- The backend generates the slug on create and keeps it stable after publication.

### `GET /articles/{article_id}`
Returns one article.

- Auth required.
- Published articles are visible to any authenticated user.
- Drafts and submitted articles are visible only to the author and moderators.

### `PATCH /articles/{article_id}`
Updates an article.

- Auth required.
- Authors can edit only while the article is in `draft` or `submitted` state.
- Moderators can edit status and moderation fields.
- Publishing should be an explicit state change.

### `DELETE /articles/{article_id}`
Deletes a draft or archives a submitted/published article.

- Auth required.
- Authors can delete only their own drafts.
- Published or submitted articles are archived by prefects or admins; no hard delete in v1.

### `POST /articles/{article_id}/publish`
Publishes a draft.

- Prefect or admin only.
- Sets `published_at`.
- Should fail unless the article is in `submitted` state.

### `POST /articles/{article_id}/archive`
Moves an article out of the public feed.

- Prefect or admin only.

---

## Feedback

### `POST /feedback`
Submits anonymous or signed feedback.

- Auth required.
- If `is_anonymous` is `true`, moderator views must hide reporter identity.
- Only admins may reveal reporter identity during an escalated safeguarding workflow.
- Returns `201` and a tracking id.

Request:
```json
{ "content": "The homework page is hard to find", "is_anonymous": true }
```

### `GET /feedback`
Lists feedback items.

- Prefect/admin only.
- Filters: `status`, `page`, `limit`.

### `PATCH /feedback/{feedback_id}`
Updates feedback status.

- Prefect/admin only.
- Allowed statuses: `pending`, `reviewed`, `actioned`.

---

## Reports

### `GET /report-categories`
Lists report categories.

- Auth required.
- Used by the issue reporting form.

### `POST /reports`
Submits an anonymous or named report.

- Auth required.
- Required fields: `category_id`, `title`, `description`.
- Optional fields: `location`, `reported_at`, `reporter_email`, `reporter_name`.
- Must support `is_anonymous` so prefect moderators do not see reporter identity by default.

### `GET /reports`
Lists reports.

- Prefect/admin only.
- Filters: `status`, `priority`, `category_id`, `assigned_to`, `page`, `limit`.

### `GET /reports/{report_id}`
Returns one report.

- Prefect/admin only.
- Should include resolution fields and assignment state.

### `PATCH /reports/{report_id}`
Updates triage fields.

- Prefect/admin only.
- Allowed changes: status, priority, assigned_to, resolution_notes, resolved_at.
- Must enforce valid status transitions.
- This is the canonical mutation endpoint for report workflow changes.

### `POST /reports/{report_id}/assign`
Assigns a report to a handler.

- Prefect/admin only.
- Convenience wrapper over `PATCH /reports/{report_id}`.

### `POST /reports/{report_id}/resolve`
Marks a report resolved.

- Prefect/admin only.
- Requires `resolution_notes` or a resolution summary.
- Convenience wrapper over `PATCH /reports/{report_id}` that sets `status` to `resolved`.

---

## Future school-system integrations

- Timetable, conduct, and grade/report endpoints are intentionally excluded from the launch contract.
- Add them only after school approval, source-system access, and a separate API contract review.

---

## Search

### `GET /search`
Searches across supported content types.

- Auth required.
- Query params: `q`, `types`, `subject_id`, `year_group`, `page`, `limit`.
- Supported types in v1: `resources`, `events`, `articles`.
- Returns one flat list with a `type` field on every item.

Behavior:
- Empty `q` returns `422`.
- Results should be ranked by relevance.
- Hidden items must not leak through search.

Response:
```json
{
  "data": [
    {
      "type": "resource",
      "id": "uuid",
      "title": "Algebra revision pack",
      "excerpt": "Topic summary and practice questions",
      "url": "/resources/uuid"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

---

## Admin/system endpoints

### `GET /admin/queue`
Returns all pending moderation work.

- Prefect/admin only.
- Combines pending resources, feedback, reports, and submitted articles.

### `GET /admin/audit-log`
Returns admin actions.

- Admin only.
- Useful for moderation traceability.

### `GET /openapi.json`
Returns the API spec.

- Public.
- Used by frontend tooling and docs generation.

## Notes for frontend/backend split

- Frontend can build against these request/response shapes immediately using generated types and checked-in fixtures.
- Backend can implement endpoints in any order as long as the contract, enums, and example payloads stay stable.
- If a field is missing from a response, treat it as a backend bug, not a frontend guess.
- Any endpoint that is not implemented yet should return a clear `501` or `404`, not a silent partial response.
- New fields or status values require a contract update before either side starts using them.
