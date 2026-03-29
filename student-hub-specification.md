# Student Hub Website Specification

## Overview
A prefect-run student hub website based on survey responses from 44 students across Year 8-13. The website aims to provide academic resources, school information, and community features for students.

## User Demographics
- **Total respondents**: 44 students
- **Year groups**: Year 8 (2), Year 9 (3), Year 10 (2), Year 11 (8), Year 12 (20), Year 13 (9)
- **Usage interest**: Yes (14), Occasionally (24), No (6)

## Core Features (Based on Survey Data)

### 1. Academic Resources
**Priority: HIGH** - Most frequently requested feature

#### 1.1 Subject-Specific Resources
- **Subjects requested**: Maths (27), Sciences (26), English (14), Geography (11), Foreign Languages (10), History (9), Business/Economics (8), Psychology (3), Computer Science (2), Art (1)
- **Resource types**: `study_guide`, `notes`, `past_paper`, `mark_scheme`, and `external_link`
- **Curriculum levels**: IGCSE/IB specific resources mentioned

#### 1.2 Past Papers
**Priority: HIGH** - Second most requested feature
- Access to past exam papers
- Organized by subject and year
- Solution banks/model answers are allowed only for school-created or explicitly licensed materials

#### 1.3 Study Tips & Guides
- General study techniques
- Subject-specific study strategies
- Tips from senior students (specifically requested)
- Links to external resources (YouTube channels, websites)

### 2. School Information & Communication

#### 2.1 School Event Announcements
**Priority: HIGH** - Third most requested feature
- Upcoming school events
- Club meetings and activities
- Sports events
- Academic deadlines

#### 2.2 School Calendar
**Priority: MEDIUM** - Explicitly mentioned in comments
- Term dates and holidays
- Academic calendar
- Event scheduling
- **Calendar sync via URL subscription**: Included in P3 with user-managed `.ics` subscriptions refreshed every 6 hours
- **iCal export/import**: Launch includes tokenized read-only `.ics` export only; arbitrary file import is out of scope

#### 2.3 Student Timetable
**Priority: MEDIUM** - Mentioned in comments
- Online timetable access
- Class schedules
- Room assignments
- Existing school-system timetable integration is out of launch scope

### 3. Student Community Features

#### 3.1 Student-Written Articles
- Media Club contributions
- Student blogs/opinion pieces
- Academic articles
- Creative writing

#### 3.2 Feedback & Concerns System
- Anonymous feedback mechanism
- Suggestion box
- Issue reporting
- Moderation uses a shared prefect queue with teacher/admin escalation for safeguarding issues

#### 3.3 Mental Health Resources
- Mental health topics and resources
- Support information
- Anonymous communication center (mentioned in comments)
- Launch uses curated static support links; counseling-system integrations stay out of scope

### 4. User Profiles & Personalization

#### 4.1 Student Profiles
- Year group based content filtering
- Subject preferences
- Saved resources
- Achievement tracking stays out of launch scope

#### 4.2 Academic Tracking
- Access to previous reports (mentioned)
- Conduct and housepoints visibility
- Progress tracking
- Grade/report integrations stay out of launch scope until school approval exists

### 5. Information Delivery Preferences
Based on survey responses about how students prefer information:
1. **A mix of everything** (32 mentions)
2. **Uploaded documents/past papers** (12 mentions)
3. **Short explanations + links** (11 mentions)
4. **Short links to useful resources** (5 mentions)
5. **Similar to Teams** (1 mention)

## Technical Architecture

### Frontend
- **Framework**: SvelteKit with TypeScript
- **Styling**: Tailwind CSS for utility-first styling
- **Build System**: Vite for fast development and production builds
- **Hosting**: Cloudflare Pages for static frontend hosting
- **Responsive design**: Mobile-first, desktop compatible
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Lighthouse score >90, optimized for school network speeds

### Backend
- **Language**: Go (Golang)
- **Framework**: Standard library with minimal dependencies (chi router, sqlx for DB)
- **API**: RESTful JSON API with OpenAPI/Swagger documentation
- **Authentication**: Custom email/password auth for `@sgsc-students.com` with JWT access tokens and rotating refresh-token cookies
- **Database**: PostgreSQL 15+ with the schema defined in `backend/database/schema.sql`
- **File storage**: Private S3-compatible object storage (Cloudflare R2 in production, MinIO locally)
- **Background jobs**: Postgres-backed worker pool for calendar sync, email notifications, and report processing

### Static Hosting Architecture
The application follows a **Jamstack** (JavaScript, APIs, Markup) approach:
1. **Frontend**: Statically generated SvelteKit app hosted on CDN
2. **Backend**: Go API server on Fly.io
3. **Database**: PostgreSQL with connection pooling
4. **File Storage**: Private S3-compatible object storage
5. **Calendar Sync**: Background worker fetching external .ics files

**Benefits of static hosting:**
- **Performance**: CDN delivery for global fast loading
- **Security**: Reduced attack surface (no server-side rendering vulnerabilities)
- **Scalability**: Handles traffic spikes automatically
- **Cost**: Lower hosting costs, especially for student projects
- **Reliability**: No server maintenance during school holidays

### Caching Strategy
Caching is an optimization, not a launch dependency.

- Static assets should use hashed filenames and long-lived CDN caching.
- Read-heavy API responses can use ETag or Last-Modified headers.
- Uploaded resources need a clear invalidation path when content changes.
- Calendar sync should compare hashes or headers before rewriting events.
- Offline caching should wait until the core app is stable.

### Calendar Integration
- iCal/ICS compatible event sync.
- Background worker polling external `.ics` URLs.
- Tokenized export to iCal feeds and external calendar apps in P3.
- CRUD operations with audit logging.

### Content Management
- Svelte admin dashboard for prefects.
- Moderation queue for reports, feedback, and resource verification.
- Search across resources, events, and student content.
- Real-time updates only if they solve a real workflow problem.

## Security & Privacy

### Data Protection
- Student data privacy compliance (GDPR for EU students)
- Anonymous feedback and reporting options
- Secure file uploads with virus scanning
- Data encryption at rest and in transit
- Regular security audits and penetration testing

### Access Control
- Role-based access control (RBAC) with table-based roles
- Year-group specific content restrictions
- Teacher/staff access with limited permissions
- Audit logging for all administrative actions
- Rate limiting and DDoS protection

## Implementation Roadmap

See `docs/implementation-roadmap.md` for the priority order.

1. Contract freeze: lock auth, access, moderation, resource taxonomy, and deployment defaults.
2. Platform foundation: auth, roles, app shell, shared reference data, and upload presign flow.
3. MVP delivery: resources, moderation, calendar CRUD, and community workflows in parallel slices.
4. Hardening: search expansion, personalization, accessibility, observability, and calendar sync.

## Development Setup & Tooling

### Backend (Go)
- **Go version**: 1.21+ (for generics support)
- **Package manager**: Go Modules
- **Testing**: Standard library testing + testify for assertions
- **Linting**: golangci-lint with strict rules
- **API Documentation**: OpenAPI 3.0 with Swagger UI
- **Database Migrations**: golang-migrate for schema versioning
- **Containerization**: Docker with multi-stage builds

### Frontend (Svelte)
- **Node.js**: 18+ LTS
- **Package manager**: pnpm (faster, disk-efficient)
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint + Prettier + Svelte plugin
- **Type checking**: TypeScript strict mode
- **Component library**: Custom components with Tailwind
- **State management**: Svelte stores (no external libraries needed)

### Infrastructure
- **Container Orchestration**: Docker Compose for development; no Kubernetes in the launch plan
- **CI/CD**: GitHub Actions with separate workflows for frontend/backend
- **Monitoring**: Sentry for frontend/backend errors, with metrics added in P3
- **Logging**: Structured JSON logging with correlation IDs
- **Caching**: CDN and HTTP caching first; browser caching and service worker support only after the core app is stable

## Deployment Strategy

### Development Environment
- Local Docker Compose with PostgreSQL and MinIO
- Hot reload for both Go and Svelte development
- Seed data for testing all features

### Staging Environment
- Mirrors production but with test data
- Automated testing on every PR
- Performance and security scanning

### Production Environment
- **Frontend**: Cloudflare Pages (static hosting)
- **Backend**: Fly.io (Go API server)
- **Database**: Neon PostgreSQL
- **File Storage**: Cloudflare R2
- **Domain**: Custom domain with HTTPS (Let's Encrypt)

## Launch Decision Log

### Auth, access, and identity
1. **Authentication provider**: Custom email/password auth with `@sgsc-students.com`; school SSO is out of launch scope.
2. **Session model**: 15-minute JWT access token plus a rotating 14-day refresh token in an `HttpOnly`, `Secure` cookie.
3. **Role assignment**: New accounts default to `student`; `prefect`, `teacher`, and `admin` roles are assigned by admin seed data or invite-only flows.
4. **Content visibility**: All student-hub content requires authentication except health checks and the API schema.
5. **Anonymous submissions**: Feedback and reports require login but can be anonymous to prefect moderators; only admins can reveal identity during safeguarding escalation.
6. **Parental consent**: No separate parental-consent UI ships in launch; access is gated by school-issued accounts and staff oversight.

### Content and moderation
1. **Resource licensing**: Uploads are limited to school-created, student-created, or explicitly licensed materials. Copyrighted past papers without redistribution rights must be linked externally, not re-hosted.
2. **Resource workflow**: `pending_review` -> `verified` or `rejected`; deletion is always a soft delete.
3. **Article workflow**: `draft` -> `submitted` -> `published` -> `archived`, with prefect/admin publication control.
4. **Report workflow**: `submitted` -> `triaged` -> `escalated` -> `resolved` -> `closed`, with teacher/admin escalation for safeguarding issues.
5. **Acceptable use**: Student-generated content must be attributable to a school account, stay within school conduct rules, and is fully auditable in moderator actions.
6. **Retention policy**: Audit logs keep 180 days, feedback keeps 365 days, reports keep 24 months, and deleted upload objects purge after 30 days unless a safeguarding hold exists.

### Calendar and async work
1. **Calendar scope**: Event CRUD is MVP; external subscriptions and `.ics` export land in P3.
2. **Sync frequency**: External `.ics` subscriptions refresh every 6 hours; manual sync is limited to once every 15 minutes.
3. **Feed access**: Generated `.ics` feeds use per-user unguessable tokens instead of browser sessions.
4. **Non-launch integrations**: Timetable, conduct, grade/report, and counseling-system integrations stay outside launch scope.

### Infrastructure and operations
1. **Hosting model**: Managed cloud deployment with Cloudflare Pages, Fly.io, Neon PostgreSQL, and Cloudflare R2.
2. **Email service**: Resend handles transactional mail and escalation notifications.
3. **Backup strategy**: Managed daily database backups with 30-day retention plus object-storage versioning.
4. **Support model**: Prefects operate a weekly moderation rota; teacher advisors are the escalation contacts for safeguarding and policy issues.
5. **Maintenance windows**: Planned maintenance happens during school holidays or announced low-traffic windows.

## Success Metrics & Analytics

### Quantitative Metrics
1. **User Adoption**: >70% of students active monthly
2. **Resource Utilization**: >1000 resource downloads/month
3. **Community Engagement**: >50 student articles published in first year
4. **Calendar Usage**: >200 calendar subscriptions
5. **Report Resolution**: <48 hour average response time for critical reports

### Qualitative Metrics
1. **User Satisfaction**: Quarterly surveys with NPS score target >30
2. **Academic Impact**: Teacher feedback on resource quality
3. **Community Health**: Reduction in reported issues after implementation
4. **Accessibility**: WCAG 2.1 AA compliance verified
5. **Performance**: Page load times <2 seconds on school network

### Technical Metrics
1. **Uptime**: 99.9% availability target
2. **API Response Time**: <100ms for 95th percentile
3. **Error Rate**: <0.1% of requests result in 5xx errors
4. **Security**: Zero critical vulnerabilities in dependency scans
5. **Cost Efficiency**: <$50/month hosting costs at scale

## Timeline & Resources

### Development Timeline (Total: 18-26 weeks)
- **Phase 1 (Foundation)**: 4-6 weeks
- **Phase 2 (Academic Core)**: 4-6 weeks  
- **Phase 3 (Community)**: 4-6 weeks
- **Phase 4 (Advanced)**: 4-8 weeks
- **Phase 5 (Polish)**: Ongoing after launch

### Team Structure
- **Technical Lead**: 1 experienced developer (Go/Svelte)
- **Frontend Team**: 2-3 prefects with web development interest
- **Backend Team**: 2-3 prefects with programming experience
- **Content Team**: 3-4 prefects for resource curation and moderation
- **Teacher Advisors**: 1-2 teachers for academic guidance and oversight

### Budget Estimate
- **Domain & SSL**: $15-30/year
- **Hosting (Basic)**: $20-50/month (managed services)
- **Hosting (Self-hosted)**: $10-30/month (VPS + storage)
- **File Storage**: $5-20/month (depending on usage)
- **Email Service**: $0-20/month (SendGrid, Postmark, or school SMTP)
- **Monitoring Tools**: $0-50/month (free tiers available)
- **Total Annual Cost**: $200-800 (scalable with usage)

### Resource Requirements
- **Development Laptops**: Team members' personal devices
- **GitHub Pro**: Free for educational organizations
- **Design Tools**: Figma (free education plan)
- **Communication**: Discord/Slack for team coordination
- **Documentation**: GitHub Wiki + Notion for project management

---

*This specification is based on survey responses from 44 SGSC students. Launch-blocking product and technical choices are now locked so frontend and backend can execute in parallel.*
