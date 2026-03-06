-- Initialize separate databases for each DECP microservice
-- This script runs on first startup of the PostgreSQL container

-- Grant privileges on existing decp database (created by POSTGRES_DB env var)
GRANT ALL PRIVILEGES ON DATABASE decp TO decp;

-- Create separate databases for each service
CREATE DATABASE user_db;
CREATE DATABASE post_db;
CREATE DATABASE job_db;
CREATE DATABASE event_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE user_db TO decp;
GRANT ALL PRIVILEGES ON DATABASE post_db TO decp;
GRANT ALL PRIVILEGES ON DATABASE job_db TO decp;
GRANT ALL PRIVILEGES ON DATABASE event_db TO decp;
