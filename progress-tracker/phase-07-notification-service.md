# Phase 7: Notification Service — Real-Time In-App Notifications

## Status: COMPLETE

## Steps

- [x] Step 7.1 — Firebase Realtime Database structure for notifications defined (`notifications/{userId}/{notifId}`)
- [x] Step 7.2 — RabbitMQ consumer (NotificationConsumer with `#` wildcard binding on `decp.notifications`)
- [x] Step 7.3 — REST endpoints for notification management (list, unread-count, mark-read, mark-all-read)
- [x] Step 7.4 — OpenFeign: UserServiceClient (`GET /api/users/all?page=0&size=500`) for fan-out broadcasts
- [x] Step 7.5 — Next.js: NotificationListenerService (RTDB `onValue` listener) + NotificationBell in sidebar

## Backend Deliverables

| File | Description |
|------|-------------|
| `job-service/config/RabbitMQConfig.java` | AMQP config + `ROUTING_KEY_JOB_POSTED = "job.posted"` |
| `job-service/service/JobServiceImpl.java` | Publishes `JOB_POSTED` event to RabbitMQ on `createJob()` |
| `notification-service/config/FirebaseConfig.java` | Firebase Admin SDK init with RTDB URL |
| `notification-service/config/RabbitMQConfig.java` | `TopicExchange`, durable `Queue("notification-queue")`, `#` wildcard Binding |
| `notification-service/model/NotificationPayload.java` | Payload POJO: type, title, message, data, read, createdAt |
| `notification-service/realtime/RealtimeNotificationService.java` | Interface: `sendNotification(userId, payload)` |
| `notification-service/realtime/FirebaseRealtimeNotificationService.java` | Firebase RTDB writer using `push().setValueAsync()` |
| `notification-service/client/UserServiceClient.java` | Feign client: `GET /api/users/all` for broadcast fan-out |
| `notification-service/consumer/NotificationConsumer.java` | Routes all notification types; broadcasts NEW_EVENT / JOB_POSTED to all users |
| `notification-service/service/NotificationService.java` | Reads Firebase RTDB via Admin SDK; list, unread-count, mark-read, mark-all-read |
| `notification-service/controller/NotificationController.java` | 4 REST endpoints |

## Frontend Deliverables

| File | Action | Description |
|------|--------|-------------|
| `lib/notifications/NotificationListenerService.ts` | Rewrite | RTDB-based interface: `subscribeToNotifications`, `markAsRead` |
| `lib/notifications/FirebaseNotificationListenerService.ts` | Rewrite | `onValue(ref(db, "notifications/userId"))` listener |
| `lib/notifications/index.ts` | Create | Barrel + singleton `notificationListenerService` |
| `lib/api/notificationApi.ts` | Create | Axios calls: list, unread-count, mark-read, mark-all-read |
| `components/layout/NotificationBell.tsx` | Create | Bell icon + red badge + dropdown (10 recent, mark-all-read) |
| `components/layout/AppLayout.tsx` | Update | Added NotificationBell to desktop sidebar footer |

## Issues & Resolutions

| # | Issue | Resolution |
|---|-------|------------|
| 1 | `AuthUser.uid` is the Firebase UID — `NotificationBell` must use `user.uid`, not `user.firebaseUid` | Used `user?.uid` throughout |

## Decision Changes

| # | Original Plan | Change | Reason |
|---|---------------|--------|--------|
| 1 | `UserServiceClient` was planned for "triggered-by user details" | Changed to fan-out broadcast only (get all users for NEW_EVENT/JOB_POSTED) | Triggered-by name already included in the RabbitMQ message from post-service |

## Pending Actions for User

- Replace `services/notification-service/src/main/resources/firebase-service-account.json` with your real Firebase service account JSON from Firebase Console.
- Set `FIREBASE_DATABASE_URL` environment variable (or update `application.yml`) to your project's RTDB URL, e.g. `https://your-project-default-rtdb.firebaseio.com`.
- Make sure `NEXT_PUBLIC_FIREBASE_DATABASE_URL` is set in `web/.env.local` for the frontend RTDB listener to work.
