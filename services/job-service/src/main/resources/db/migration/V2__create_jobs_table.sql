-- V2: Create jobs table

CREATE TABLE jobs (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posted_by             VARCHAR(128) NOT NULL,
    title                 VARCHAR(255) NOT NULL,
    company               VARCHAR(255) NOT NULL,
    description           TEXT NOT NULL,
    job_type              VARCHAR(20) NOT NULL,
    location              VARCHAR(255),
    is_remote             BOOLEAN DEFAULT FALSE,
    salary_range          VARCHAR(100),
    requirements          TEXT,
    application_deadline  DATE,
    application_link      VARCHAR(1024) NOT NULL,
    status                VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
