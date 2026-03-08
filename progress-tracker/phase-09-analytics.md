# Phase 9: Analytics Dashboard

## Status: COMPLETE

## Steps

- [x] Step 9.1 — Analytics `/stats` endpoints in all 4 services (user, post, job, event)
- [x] Step 9.2 — Admin-only security on all stats endpoints
- [x] Step 9.3 — Next.js `/admin/dashboard` with Recharts (bar + pie charts)

## Backend Deliverables

| Service | Endpoint | Stats returned |
|---------|----------|---------------|
| user-service | `GET /api/users/stats` | totalUsers, students, alumni, admins, profileComplete |
| post-service | `GET /api/posts/stats` | totalPosts, totalReactions, totalComments |
| job-service  | `GET /api/jobs/stats`  | totalJobs, activeJobs, closedJobs, fullTime, partTime, internship, contract |
| event-service | `GET /api/events/stats` | totalEvents, upcoming, ongoing, completed, cancelled, totalRsvps |

All endpoints secured with `@PreAuthorize("hasRole('ADMIN')")`.

### Repository additions

| File | Added methods |
|------|--------------|
| `UserRepository` | `countByRole(String)`, `countByProfileCompleteTrue()` |
| `JobRepository` | `countByStatus(String)`, `countByJobType(String)` |
| `EventRepository` | `countByStatus(String)` |

## Frontend Deliverables

| File | Description |
|------|-------------|
| `lib/api/analyticsApi.ts` | Typed API calls for all 4 stats endpoints |
| `app/admin/dashboard/page.tsx` | Admin dashboard with 4 summary cards + 4 Recharts charts (2 pie, 2 bar) |

### Dashboard layout
- **Row 1**: 4 summary cards (Total Users, Posts, Jobs, Events)
- **Row 2**: Users by Role (pie) + Post Engagement bar chart
- **Row 3**: Jobs by Type (bar) + Events by Status (pie)
- **Row 4**: Secondary metric cards

## Decision Changes

| # | Original Plan | Change | Reason |
|---|---------------|--------|--------|
| 1 | Monthly trend endpoints (GROUP BY DATE_TRUNC) | Skipped | Aggregate counts are sufficient for a university project; trends add complexity with minimal added value |

## Notes

- `recharts` installed as a dependency (`npm install recharts`)
- Dashboard redirects non-admin users to `/feed`
- Non-admin access to `/admin/dashboard` redirects to `/feed`
