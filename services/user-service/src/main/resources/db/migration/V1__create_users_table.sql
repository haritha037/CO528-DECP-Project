CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid        VARCHAR(128) UNIQUE NOT NULL,
    email               VARCHAR(255) UNIQUE NOT NULL,
    name                VARCHAR(255) NOT NULL,
    bio                 TEXT,
    department          VARCHAR(255),
    graduation_year     INTEGER,
    profile_picture_url VARCHAR(512),
    role                VARCHAR(20)  NOT NULL DEFAULT 'STUDENT',
    linkedin_url        VARCHAR(512),
    github_url          VARCHAR(512),
    is_profile_complete BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_role         ON users(role);
CREATE INDEX idx_users_department   ON users(department);
