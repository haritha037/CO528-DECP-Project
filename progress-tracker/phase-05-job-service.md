# Phase 5: Job Service — Opportunity Postings

## Status: COMPLETE

## Steps

- [x] Step 5.1 — Flyway migration: V2__create_jobs_table.sql
- [x] Step 5.2 — Implement API endpoints (CRUD jobs, filter/search, my-posts, close)
- [x] Step 5.3 — Role-based access (only ALUMNI + ADMIN can create/edit/delete/close)
- [x] Step 5.4 — Flyway seed migration: V999__seed_jobs.sql
- [x] Step 5.5 — Next.js job pages (/jobs, /jobs/{id}, /jobs/create)

## Backend Deliverables

| File | Description |
|------|-------------|
| `V2__create_jobs_table.sql` | Full jobs schema with indexes |
| `entity/Job.java` | JPA entity with all job fields |
| `repository/JobRepository.java` | JPQL search query with dynamic filters (status, type, remote, keyword) + findByPostedBy |
| `dto/JobDTO.java` | Response DTO |
| `dto/CreateJobRequest.java` | Create/update request with validation |
| `service/JobService.java` | Interface (7 methods) |
| `service/JobServiceImpl.java` | Full implementation with owner/admin authorization checks |
| `controller/JobController.java` | 7 REST endpoints including PATCH /close |
| `V999__seed_jobs.sql` | 4 sample job postings (2 alumni, 1 admin, various types) |

## Frontend Deliverables

| File | Description |
|------|-------------|
| `lib/api/jobApi.ts` | All job API calls + TypeScript types + JOB_TYPE_LABELS map |
| `app/jobs/page.tsx` | Job listing with keyword search, type filter, remote filter, Load More |
| `app/jobs/[id]/page.tsx` | Job detail with Apply Externally button, deadline countdown, owner/admin actions |
| `app/jobs/create/page.tsx` | Full job creation form (alumni/admin only) |

## Issues & Resolutions

| # | Issue | Resolution |
|---|-------|------------|
| 1 | V1__create_jobs_table.sql was a placeholder from Phase 1 scaffold | Used V2__create_jobs_table.sql to avoid Flyway checksum conflict |

## Decision Changes

| # | Original Plan | Change | Reason |
|---|---------------|--------|--------|
| 1 | Migration named V1 | Used V2 | V1 placeholder already checksummed by Flyway |

## Pending Actions

- Replace `REPLACE_WITH_ALUMNI_FIREBASE_UID` and `REPLACE_WITH_ADMIN_FIREBASE_UID` in `V999__seed_jobs.sql` with actual Firebase UIDs before running.
- Make sure `job_db` database exists in PostgreSQL before starting the service.
