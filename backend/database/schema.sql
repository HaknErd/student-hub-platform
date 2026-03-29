-- PostgreSQL Database Schema for Student Hub
-- Future-proof, modular, and role-based access control (RBAC) ready.
-- Roles are table-based (not enums) for flexibility.

-- Enable UUID extension for globally unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. IDENTITY & ACCESS MODULE
-- Manages users, roles, and permissions.
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE identity.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'admin', 'prefect', 'student', 'teacher'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE identity.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL, -- e.g., student-id@sgsc-students.com
    full_name VARCHAR(255) NOT NULL,
    year_group INT, -- Flexible integer (8, 9, 10, etc.)
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-Many for Roles (Future-proof for "Student + Prefect" dual roles)
CREATE TABLE identity.user_roles (
    user_id UUID REFERENCES identity.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES identity.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- ----------------------------------------------------------------------------
-- 2. ACADEMIC MODULE
-- Manages subjects, resources (past papers, guides), and verification.
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS academic;

CREATE TABLE academic.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20), -- e.g., 'MA-HL' for Math High Level
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE academic.resource_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- 'past_paper', 'study_guide', 'revision_notes'
    icon_url TEXT
);

CREATE TABLE academic.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES academic.subjects(id),
    type_id UUID REFERENCES academic.resource_types(id),
    file_url TEXT, -- Link to S3/Cloud storage
    metadata JSONB, -- Future-proof: store year, exam board, difficulty here
    author_id UUID REFERENCES identity.users(id),
    is_verified BOOLEAN DEFAULT FALSE, -- For prefect/teacher approval workflow
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete
);

-- ----------------------------------------------------------------------------
-- 3. CALENDAR & EVENTS MODULE
-- Manages school events and external calendar subscriptions.
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS calendar;

CREATE TABLE calendar.event_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- 'exam', 'club', 'holiday', 'sport'
    color_code VARCHAR(7) -- Hex color for UI representation
);

CREATE TABLE calendar.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES calendar.event_categories(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location TEXT,
    is_all_day BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES identity.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- For "Cal sync via URL sub" (as requested)
CREATE TABLE calendar.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES identity.users(id),
    name TEXT NOT NULL, -- 'My School Schedule'
    external_url TEXT NOT NULL, -- The external .ics URL
    last_synced_at TIMESTAMPTZ,
    refresh_interval_minutes INT DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. COMMUNITY & CONTENT MODULE
-- Articles, blogs, feedback, and student-run media.
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS community;

CREATE TABLE community.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES identity.users(id),
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES identity.users(id), -- Nullable for anonymous feedback
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'actioned'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. STUDENT LIFE MODULE
-- Personal timetables, conduct records, and progress tracking.
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS student_life;

CREATE TABLE student_life.timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES identity.users(id),
    data JSONB NOT NULL, -- Flexible structure for weekly periods/rooms/teachers
    effective_from DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_life.conduct_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES identity.users(id),
    type VARCHAR(20), -- 'housepoint', 'conduct'
    points INT DEFAULT 0,
    reason TEXT,
    issued_by UUID REFERENCES identity.users(id),
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Indices for performance
-- ----------------------------------------------------------------------------
CREATE INDEX idx_resources_subject ON academic.resources(subject_id);
CREATE INDEX idx_resources_type ON academic.resources(type_id);
CREATE INDEX idx_events_start_time ON calendar.events(start_time);
CREATE INDEX idx_articles_status_published ON community.articles(status, published_at);
CREATE INDEX idx_feedback_status ON community.feedback(status);
CREATE INDEX idx_user_roles_user ON identity.user_roles(user_id);
