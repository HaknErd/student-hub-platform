# Database Architecture & Advice

This database is designed for a **Student Hub** application using PostgreSQL. It prioritizes modularity, scalability, and future-proofing.

## Core Principles

### 1. Modulith Approach (Modular Monolith)
The database uses PostgreSQL **schemas** (`identity`, `academic`, `calendar`, `community`, `student_life`) to logically separate concerns. 
- **Advantage:** Keeps the database organized while keeping development simple.
- **Future-Proofing:** If one module (e.g., `academic`) becomes too large or needs its own scaling policy, it can be moved to a separate database with minimal effort.

### 2. Identity & Access Control
- **No Enums for Roles:** Roles are stored in a dedicated `identity.roles` table. This allows adding new roles (e.g., "Parent", "External Moderator") without schema migrations.
- **Many-to-Many Roles:** Users can have multiple roles (e.g., a "Student" who is also a "Prefect").
- **UUIDs everywhere:** All primary keys use `UUID v4`. This prevents ID enumeration attacks and simplifies data merging if multiple database instances are ever needed.

### 3. Flexibility via JSONB
- **Timetables:** Student timetables vary wildly. Instead of complex relational mapping for every possible period/teacher/room combination, we use `JSONB`.
- **Resource Metadata:** Different subjects (Math vs. Art) might need different metadata (Exam board, Topic, Year, Media type). `JSONB` allows this without adding infinite nullable columns.

### 4. Calendar Sync Implementation
The `calendar.subscriptions` table is designed to support:
- Background workers fetching external `.ics` files.
- Storing the external URL and sync state.
- Refresh intervals to prevent overloading external servers.

### 5. Academic Resources
- **Soft Deletes:** Critical academic resources use a `deleted_at` column. This allows "undeleting" content and maintains database integrity for historical reporting.
- **Verification Workflow:** The `is_verified` flag allows a moderation queue where prefects or teachers can approve student-uploaded resources before they go live.

## Scaling Advice
- **Indexes:** Standard B-tree indexes are provided for common search patterns (subject lookups, event timing, etc.).
- **Read Replicas:** As traffic grows, you can easily point read-only traffic (resource viewing) to replicas.
- **Partitioning:** If the `academic.resources` or `calendar.events` tables grow to millions of rows, consider **Declarative Partitioning** by year or subject.
