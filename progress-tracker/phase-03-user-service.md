# Phase 3: User Service — Profiles, Roles & User Management

## Status: COMPLETE

## Steps

- [x] Step 3.1 — Flyway migration: V1__create_users_table.sql
- [x] Step 3.2 — Flyway seed migration: V999__seed_data.sql
- [x] Step 3.3 — Implement API endpoints (register, profile CRUD, search, role management)
- [x] Step 3.4 — Controller → Service → Repository layered architecture with DTOs
- [x] Step 3.5 — UserDTO design (initials, roleBadge computed in service layer)
- [x] Step 3.6 — Next.js user pages (/profile, /profile/setup, /profile/edit, /users, /users/[uid], /admin/users)

## Backend Deliverables

| File | Description |
|------|-------------|
| `V1__create_users_table.sql` | Full users schema with indexes |
| `V999__seed_data.sql` | Seed admin user (replace Firebase UID before first run) |
| `entity/User.java` | JPA entity mapped to `users` table |
| `repository/UserRepository.java` | Spring Data JPA repo with JPQL search |
| `dto/UserDTO.java` | Response DTO with computed `initials` and `roleBadge` |
| `dto/UpdateProfileRequest.java` | Profile update payload |
| `dto/RegisterUserRequest.java` | Admin create-user payload |
| `dto/ChangeRoleRequest.java` | Role change payload with validation |
| `service/UserService.java` | Service interface (8 methods) |
| `service/UserServiceImpl.java` | Implementation with Firebase rollback on registration failure |
| `controller/UserController.java` | 8 REST endpoints |
| `identity/IdentityProviderService.java` | Interface (createUser, setCustomClaims, deleteUser) |
| `identity/FirebaseIdentityProviderService.java` | Firebase Admin SDK implementation |

## Frontend Deliverables

| File | Description |
|------|-------------|
| `lib/api/userApi.ts` | All user API calls + TypeScript types |
| `components/shared/UserAvatar.tsx` | Avatar with initials fallback and role badge color |
| `components/shared/RoleBadge.tsx` | Colored dot + role label |
| `components/layout/AppLayout.tsx` | Sidebar (desktop) + bottom tab bar (mobile) |
| `app/profile/page.tsx` | Own profile view; redirects to /profile/setup if incomplete |
| `app/profile/setup/page.tsx` | First-time profile setup + optional password change |
| `app/profile/edit/page.tsx` | Edit own profile (pre-filled form) |
| `app/users/page.tsx` | User directory with search/filter/pagination |
| `app/users/[firebaseUid]/page.tsx` | Public profile view by Firebase UID |
| `app/admin/users/page.tsx` | Admin: list all users (table), inline role change, create user |

## Issues & Resolutions

| # | Issue | Resolution |
|---|-------|------------|
| 1 | Package split between `com.decp.userservice` and `com.decp.user` | Moved all files to `com.decp.user.*`, fixed package declarations |
| 2 | Firebase rollback needed if PostgreSQL save fails during registration | Wrapped in try/catch; `deleteUser()` called on UID if DB insert throws |

## Decision Changes

| # | Original Plan | Change | Reason |
|---|---------------|--------|--------|
| 1 | Backend login endpoint to proxy Firebase Auth | Keep direct Firebase SDK login in frontend | Firebase Admin SDK cannot issue tokens; custom claims require direct SDK login |

## Pending Action

- Replace `REPLACE_WITH_ACTUAL_FIREBASE_UID` in `V999__seed_data.sql` with the real Firebase UID of the admin account before first deployment.
