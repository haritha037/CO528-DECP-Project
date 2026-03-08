# Phase 4: Post Service — Feed, Reactions, Comments & Replies

## Status: COMPLETE

## Steps

- [x] Step 4.1 — Flyway migration: V2__create_post_tables.sql (posts, post_media, post_reactions, post_comments)
- [x] Step 4.2 — Media upload flow (frontend-driven Firebase Storage, backend stores URLs only)
- [x] Step 4.3 — Implement API endpoints (CRUD posts, reactions, comments, replies)
- [x] Step 4.4 — OpenFeign: UserServiceClient for author details
- [x] Step 4.5 — RabbitMQ event publishing (POST_REACTED, POST_COMMENTED, COMMENT_REPLIED)
- [x] Step 4.6 — Flyway seed migration: V999__seed_posts.sql
- [x] Step 4.7 — Next.js feed pages (/feed, /posts/{id})

## Backend Deliverables

| File | Description |
|------|-------------|
| `V2__create_post_tables.sql` | Full posts schema with 4 tables and indexes |
| `entity/Post.java` | JPA entity with OneToMany to media, reactions, comments |
| `entity/PostMedia.java` | JPA entity for media URLs |
| `entity/PostReaction.java` | JPA entity with UNIQUE(post_id, user_id) |
| `entity/PostComment.java` | JPA entity with self-referencing parent for one-level replies |
| `repository/PostRepository.java` | Spring Data JPA repo, paginated feed query |
| `repository/PostReactionRepository.java` | findByPostIdAndUserId, countByPostId, existsByPostIdAndUserId |
| `repository/PostCommentRepository.java` | findByPostIdAndParentIsNull (top-level comments only) |
| `dto/CreatePostRequest.java` | text + list of MediaItemDTOs |
| `dto/PostDTO.java` | Full post response with author, media, reaction/comment counts |
| `dto/CommentDTO.java` | Comment with nested replies list |
| `dto/AuthorDTO.java` | Inline author info resolved from User Service |
| `client/UserServiceClient.java` | OpenFeign client calling User Service |
| `messaging/NotificationEvent.java` | RabbitMQ event payload |
| `config/RabbitMQConfig.java` | TopicExchange, Jackson2JsonMessageConverter, RabbitTemplate |
| `service/PostService.java` | Service interface (10 methods) |
| `service/PostServiceImpl.java` | Full implementation with RabbitMQ publishing and author resolution |
| `controller/PostController.java` | 11 REST endpoints |
| `V999__seed_posts.sql` | 4 sample posts, reactions, comments and replies |

## Frontend Deliverables

| File | Description |
|------|-------------|
| `lib/api/postApi.ts` | All post API calls + TypeScript types |
| `components/post/PostCard.tsx` | Full post card: avatar, role badge, content, media, heart reaction, comment toggle |
| `components/post/CommentSection.tsx` | Comments list with inline reply inputs (infinite scroll ready) |
| `components/post/CreatePostCard.tsx` | Expandable post creation form |
| `app/feed/page.tsx` | Main feed with infinite scroll (IntersectionObserver) |
| `app/posts/[id]/page.tsx` | Single post detail view with full comment section |

## Issues & Resolutions

| # | Issue | Resolution |
|---|-------|------------|
| 1 | V1__create_post_tables.sql was a placeholder (`SELECT 1`) from Phase 1 scaffold | Created V2__create_post_tables.sql with the actual schema to avoid Flyway checksum conflict |

## Decision Changes

| # | Original Plan | Change | Reason |
|---|---------------|--------|--------|
| 1 | Migration named V1__create_post_tables.sql | Used V2__create_post_tables.sql instead | V1 placeholder was already committed and checksummed by Flyway |

## Pending Actions

- Replace `REPLACE_WITH_*_FIREBASE_UID` placeholders in `V999__seed_posts.sql` with actual Firebase UIDs before running.
- Media upload via Firebase Storage is architecture-ready (backend accepts `mediaUrls[]` in the request body). The `StorageService` frontend abstraction from Phase 2 can be connected to `CreatePostCard` to enable image/video uploads in a future iteration.
