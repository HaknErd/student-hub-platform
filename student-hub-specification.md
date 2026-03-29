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
- **Resource types**: TBD (e.g., study guides, topic summaries, revision materials)
- **Curriculum levels**: IGCSE/IB specific resources mentioned

#### 1.2 Past Papers
**Priority: HIGH** - Second most requested feature
- Access to past exam papers
- Organized by subject and year
- TBD: Solution banks/model answers (mentioned in comments)

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
- **Calendar sync via URL subscription**: TBD (implementation details needed)
- **iCal export/import**: TBD

#### 2.3 Student Timetable
**Priority: MEDIUM** - Mentioned in comments
- Online timetable access
- Class schedules
- Room assignments
- TBD: Integration with existing school systems

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
- TBD: Moderation system

#### 3.3 Mental Health Resources
- Mental health topics and resources
- Support information
- Anonymous communication center (mentioned in comments)
- TBD: Counseling resources integration

### 4. User Profiles & Personalization

#### 4.1 Student Profiles
- Year group based content filtering
- Subject preferences
- Saved resources
- TBD: Achievement tracking

#### 4.2 Academic Tracking
- Access to previous reports (mentioned)
- Conduct and housepoints visibility
- Progress tracking
- TBD: Integration with school grading systems

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
- **Hosting**: Static hosting (Vercel, Netlify, or Cloudflare Pages)
- **Responsive design**: Mobile-first, desktop compatible
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Lighthouse score >90, optimized for school network speeds

### Backend
- **Language**: Go (Golang)
- **Framework**: Standard library with minimal dependencies (chi router, sqlx for DB)
- **API**: RESTful JSON API with OpenAPI/Swagger documentation
- **Authentication**: JWT-based with school email validation (@sgsc-students.com)
- **Database**: PostgreSQL 15+ with the schema defined in `backend/database/schema.sql`
- **File storage**: S3-compatible storage (MinIO for self-hosted, AWS S3 for cloud)
- **Background jobs**: Worker pool for calendar sync, email notifications, report processing

### Static Hosting Architecture
The application follows a **Jamstack** (JavaScript, APIs, Markup) approach:
1. **Frontend**: Statically generated SvelteKit app hosted on CDN
2. **Backend**: Go API server (can be serverless functions or traditional server)
3. **Database**: PostgreSQL with connection pooling
4. **File Storage**: S3-compatible object storage
5. **Calendar Sync**: Background worker fetching external .ics files

**Benefits of static hosting:**
- **Performance**: CDN delivery for global fast loading
- **Security**: Reduced attack surface (no server-side rendering vulnerabilities)
- **Scalability**: Handles traffic spikes automatically
- **Cost**: Lower hosting costs, especially for student projects
- **Reliability**: No server maintenance during school holidays

### Calendar Integration
- **Calendar system**: iCal/ICS standard compatible
- **Sync features**: Background worker polling external .ics URLs (see `calendar.subscriptions` table)
- **Export options**: iCal feed generation, Google Calendar/Outlook integration
- **Event management**: CRUD operations with audit logging
- **Implementation**: Go library `github.com/arran4/golang-ical` for iCal parsing/generation

### Content Management
- **Admin panel**: Svelte-based dashboard for prefects
- **Moderation system**: Queue for reports, feedback, and resource verification
- **Version control**: Git-like tracking for academic resource updates
- **Search functionality**: PostgreSQL full-text search with ranking
- **Real-time updates**: WebSocket connections for admin notifications

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

## Implementation Phases

### Phase 1: Foundation & MVP (4-6 weeks)
1. **Go Backend Setup**: Project structure, database migrations, basic API
2. **Svelte Frontend**: Basic layout, authentication UI, Tailwind setup
3. **Authentication**: School email validation, JWT tokens, role management
4. **Subject Resources**: Basic CRUD for Maths, Sciences, English resources
5. **Static Deployment**: CDN setup, CI/CD pipeline

### Phase 2: Core Academic Features (4-6 weeks)
1. **Past Papers Repository**: File upload/download, organization by subject/year
2. **School Calendar**: Event management, iCal feed generation
3. **User Profiles**: Year-group filtering, saved resources
4. **Search Functionality**: Full-text search across resources
5. **Admin Dashboard**: Basic content moderation interface

### Phase 3: Community & Communication (4-6 weeks)
1. **Student Articles**: Blog platform with Markdown support
2. **Feedback System**: Anonymous feedback collection and management
3. **Calendar Sync**: Background worker for external .ics URL subscriptions
4. **Study Tips Section**: Curated content from teachers/senior students
5. **Report System**: Anonymous issue reporting with categorization

### Phase 4: Advanced Features (4-8 weeks)
1. **Mental Health Resources**: Curated content, anonymous support channels
2. **Academic Tracking**: Progress monitoring, conduct records visibility
3. **Real-time Features**: WebSocket notifications, live updates
4. **Mobile Optimization**: PWA capabilities, offline functionality
5. **School Integration**: Timetable sync, gradebook connections (if APIs available)

### Phase 5: Scale & Polish (Ongoing)
1. **Performance Optimization**: Caching strategies, CDN optimization
2. **Accessibility Audit**: WCAG 2.1 AA compliance verification
3. **Monitoring & Analytics**: Usage tracking, performance monitoring
4. **Community Features**: Peer tutoring, study groups, forums
5. **Internationalization**: Multi-language support if needed

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
- **Container Orchestration**: Docker Compose for development, Kubernetes optional
- **CI/CD**: GitHub Actions with separate workflows for frontend/backend
- **Monitoring**: Prometheus + Grafana for backend, Sentry for error tracking
- **Logging**: Structured JSON logging with correlation IDs
- **Caching**: Redis for session storage and API response caching

## Deployment Strategy

### Development Environment
- Local Docker Compose with PostgreSQL, MinIO, Redis
- Hot reload for both Go and Svelte development
- Seed data for testing all features

### Staging Environment
- Mirrors production but with test data
- Automated testing on every PR
- Performance and security scanning

### Production Environment
- **Frontend**: Vercel/Netlify/Cloudflare Pages (static hosting)
- **Backend**: Fly.io/Railway/Heroku (Go API server)
- **Database**: Managed PostgreSQL (Supabase, Neon, AWS RDS)
- **File Storage**: S3-compatible (AWS S3, Cloudflare R2, MinIO)
- **Domain**: Custom domain with HTTPS (Let's Encrypt)

## Unknown Areas & TBD Items

### Technical Decisions Needed
1. **Authentication Provider**: School SSO integration vs custom email validation
2. **File Storage Location**: Cloud vs self-hosted (cost vs control trade-off)
3. **Calendar Sync Frequency**: How often to poll external .ics URLs
4. **Email Service**: For notifications and password resets
5. **Backup Strategy**: Automated backups and disaster recovery plan

### Content & Policy Decisions
1. **Resource Licensing**: Clear guidelines for past papers and copyrighted materials
2. **Moderation Workflow**: Escalation path for serious reports (bullying, safety)
3. **Data Retention**: How long to keep user data, logs, and uploaded files
4. **Acceptable Use Policy**: Rules for student-generated content
5. **Parental Consent**: Requirements for younger students (Year 8-9)

### Administrative Decisions
1. **Prefect Training Program**: Documentation and hands-on workshops
2. **Support Rotation**: Which prefects handle reports/moderation each week
3. **Escalation Contacts**: Teachers/administrators for serious issues
4. **Maintenance Windows**: Scheduled downtime during school holidays
5. **Budget Allocation**: Hosting costs, domain, third-party services

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

*This specification is based on survey responses from 44 SGSC students. All TBD items should be clarified with stakeholders before implementation.*