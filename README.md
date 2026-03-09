# DECP — Department Engagement & Career Platform

A university department engagement platform built with Spring Boot microservices, Next.js, Firebase, and Kubernetes.

## Tech Stack

- **Backend**: Spring Boot 3 (Java 17), Spring Cloud Gateway, OpenFeign, RabbitMQ
- **Auth**: Firebase Authentication
- **Real-time**: Firebase Realtime Database (messaging + notifications)
- **Storage**: Firebase Cloud Storage
- **Database**: PostgreSQL (per-service databases) + Flyway migrations
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Container**: Docker, Kubernetes (Kind for local)

## Project Structure

See `plan-doc.md` for the complete architecture and implementation plan.

## Services

| Service              | Port |
| -------------------- | ---- |
| API Gateway          | 8080 |
| User Service         | 8081 |
| Post Service         | 8082 |
| Job Service          | 8083 |
| Event Service        | 8084 |
| Notification Service | 8085 |
| Frontend (Next.js)   | 3000 |

---

## Running the Application

### Prerequisites — Frontend env file

Required for all options. Do this once:

```bash
cp web/.env.example web/.env.local
# Fill in your Firebase project credentials in web/.env.local
```

### Option 1 — Local (no Docker)

Requires local PostgreSQL and RabbitMQ running with the default credentials (`decp` / `decp_password`).
Each service reads its own env vars from `application.yml` defaults — no env file needed.

```bash
task run:all          # start all 6 backend services in parallel
cd web && npm run dev # start the frontend separately
```

```bash
task stop:local       # stop all backend services
```

### Option 2 — Docker Compose (local Postgres)

Spins up Postgres, RabbitMQ, all backend services, and the frontend in containers.

**First build** — Firebase credentials must be baked into the Next.js bundle at build time:

```bash
task build
```

**Run:**

```bash
task up
```

Services available at:

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- RabbitMQ Management: http://localhost:15672 (guest/guest)

### Option 3 — Docker Compose + Neon (cloud databases)

Uses [Neon](https://neon.tech) hosted Postgres. DB credentials are runtime env vars passed via `.env.prod`.

**First-time setup:**

```bash
cp .env.prod.example .env.prod
# Fill in your Neon JDBC URLs and passwords
```

**Build** (same as Option 2 — only needed once or when frontend code changes):

```bash
task build
```

**Run with Neon DBs:**

```bash
task up:prod
```

The local `postgres` container still starts but is unused — backend services connect to Neon instead.

**Option 3b — Local Spring Boot + Neon (no Docker):**

```bash
task run:all   # .env.prod is loaded automatically via Taskfile dotenv
```

---

## Environment Variables

All `application.yml` files use service-specific env var names so a single `.env.prod`
can be sourced without variable name collisions across services.

| Variable                                  | Service                     | Default (local)                             |
| ----------------------------------------- | --------------------------- | ------------------------------------------- |
| `USER_DB_URL`                             | user-service                | `jdbc:postgresql://localhost:5432/user_db`  |
| `USER_DB_USERNAME` / `USER_DB_PASSWORD`   | user-service                | `decp` / `decp_password`                    |
| `POST_DB_URL`                             | post-service                | `jdbc:postgresql://localhost:5432/post_db`  |
| `POST_DB_USERNAME` / `POST_DB_PASSWORD`   | post-service                | `decp` / `decp_password`                    |
| `JOB_DB_URL`                              | job-service                 | `jdbc:postgresql://localhost:5432/job_db`   |
| `JOB_DB_USERNAME` / `JOB_DB_PASSWORD`     | job-service                 | `decp` / `decp_password`                    |
| `EVENT_DB_URL`                            | event-service               | `jdbc:postgresql://localhost:5432/event_db` |
| `EVENT_DB_USERNAME` / `EVENT_DB_PASSWORD` | event-service               | `decp` / `decp_password`                    |
| `SPRING_RABBITMQ_HOST`                    | post, event, notification   | `localhost`                                 |
| `FIREBASE_SERVICE_ACCOUNT_PATH`           | gateway, user, notification | `classpath:firebase-service-account.json`   |
| `CORS_ALLOWED_ORIGINS`                    | api-gateway                 | `http://localhost:3000`                     |

> `.env.prod` is gitignored. See `.env.prod.example` for the full template.

### Frontend Environment Variables

The Next.js app reads from `web/.env.local`. Copy the example and fill in your Firebase project credentials:

```bash
cp web/.env.example web/.env.local
```

| Variable                                   | Description                                                       |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase Web API key                                              |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | `<project-id>.firebaseapp.com`                                    |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase project ID                                               |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | `<project-id>.appspot.com`                                        |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID                                      |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase app ID                                                   |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL`        | Firebase Realtime Database URL (used for messaging/notifications) |
| `NEXT_PUBLIC_API_GATEWAY_URL`              | Backend gateway URL (default: `http://localhost:8080`)            |

> `web/.env.local` is gitignored. Never commit real Firebase credentials.
