# Department Engagement & Career Platform (DECP) — Full Implementation Prompt

## Project Overview

Build a department engagement platform for current and past students (alumni) of a university department. The platform allows students to connect, share posts, browse job/internship opportunities, collaborate on research, and participate in events. This is a university project for an Applied Software Architecture course, so the focus is on architectural design, modularity, integration, and cloud deployment.

The deliverable is a responsive web app (no separate mobile app for now, but the architecture MUST support adding a mobile client in the future via the same REST APIs). The frontend should be fully responsive using Tailwind CSS so it works well on both desktop and mobile browsers.

**IMPORTANT — Registration Model:** This platform is for a university department. Users cannot self-register. An admin creates user accounts (specifying their role: student, alumni, admin). Once created, the user logs in and sets up their profile details. Admins can also update user roles later (e.g., when a student graduates and becomes an alumni).

---

## Architectural Design Principles

The following principles MUST be applied throughout the entire codebase:

1. **Open-Closed Principle (OCP) & Dependency Inversion Principle (DIP):** All external service dependencies (Firebase Auth, Firebase Realtime Database, Firebase Cloud Storage) MUST be abstracted behind interfaces — in both the backend (Java interfaces) and frontend (TypeScript interfaces). No class in the codebase should directly import a Firebase package except the concrete implementation classes. This makes it possible to swap Firebase for another provider (e.g., Keycloak for auth, Supabase for storage, custom WebSocket server for messaging) by only writing a new implementation class and changing one line in the factory/barrel file.

2. **Spring Boot 3 / Spring Security 6 only:** Do NOT use any deprecated APIs. Specifically:
   - Do NOT use `WebSecurityConfigurerAdapter` (removed in Spring Security 6). Use `SecurityFilterChain` bean instead.
   - Do NOT use `@EnableGlobalMethodSecurity`. Use `@EnableMethodSecurity` instead.
   - Do NOT use `antMatchers()`. Use `requestMatchers()` instead.
   - Do NOT use `authorizeRequests()`. Use `authorizeHttpRequests()` instead.
   - Use the lambda DSL for all Spring Security configuration.

3. **Environment-first configuration:** All external connection details (database URLs, RabbitMQ hosts, Firebase config paths, service URLs) MUST be defined using environment variable overrides with sensible local defaults: `${ENV_VAR:default_value}`. The same code must work locally, in Docker Compose, and in Kubernetes without any code changes.

4. **Pagination everywhere:** All list endpoints MUST support pagination using Spring Data's `Pageable` (backend) and corresponding `page`/`size` query parameters. The frontend should implement "Load More" or infinite scroll for paginated lists.

Infinite scroll - works best for feeds — posts, notifications, messages. Users are casually browsing and don't have a specific target. They just want to keep seeing more content. Facebook, Instagram, LinkedIn, and Twitter all use infinite scroll for their main feeds. It keeps engagement high and feels natural.

Load More button - works best for structured/searchable lists — job listings, event listings, user directory. Users are scanning with intent, maybe applying filters. They want to feel in control of how much they load. Also, if they've scrolled down and want to reach the footer or navigation, infinite scroll makes that frustrating.

So the recommendation is to use both, depending on context:

| Page | Pattern | Why |
|------|---------|-----|
| Feed (`/feed`) | Infinite scroll | Casual browsing, engagement-driven |
| Comments & replies | Infinite scroll | Natural continuation of reading |
| Notifications dropdown | Infinite scroll | Quick scanning |
| Messages thread | Infinite scroll (upward) | Chat pattern, load older messages on scroll up |
| Job listings (`/jobs`) | Load More button | Filtered, intentional browsing |
| Event listings (`/events`) | Load More button | Filtered, intentional browsing |
| User directory (`/users`) | Load More button | Search-driven |
| Admin user list | Traditional pagination (page numbers) | Admin needs to jump to specific pages |
| Attendee lists | Load More button | Bounded list |

---

## Tech Stack

| Concern | Technology | Justification |
|---------|-----------|---------------|
| Backend services | Spring Boot 3 (Java 17+) | SOA requirement, microservices architecture |
| Authentication & Authorization | Firebase Authentication | Managed identity provider; handles user creation, login, JWT issuance, role management via custom claims (student, alumni, admin); no custom auth code needed |
| Real-time messaging | Firebase Realtime Database | Managed real-time infrastructure; no WebSocket/SSE complexity |
| Real-time notifications | Firebase Realtime Database | Notifications pushed to frontend instantly via Firebase listeners; backend writes to Firebase on each notification event |
| API Gateway | Spring Cloud Gateway | Single entry point for all frontend requests; routes to correct microservice; validates Firebase JWTs centrally |
| Databases | PostgreSQL (single instance locally with separate databases per service; separate managed instances in production) | Structured relational data for business logic |
| Database migrations | Flyway | Version-controlled schema migrations; seed data via migration scripts |
| Media/file storage | Firebase Cloud Storage (Google Cloud Storage under the hood) | Frontend uploads directly to Firebase Storage via SDK; backend only stores download URLs; no file handling in backend services |
| Inter-service async communication | RabbitMQ | Event-driven communication between microservices (e.g., Post Service publishes "post reacted" event, Notification Service consumes it) |
| Inter-service sync communication | OpenFeign | Declarative REST client for synchronous service-to-service calls (e.g., Post Service fetching user details from User Service) |
| Frontend (web) | Next.js (React) with TypeScript, Tailwind CSS, Axios | Responsive web app; Firebase SDK for auth, messaging, notifications, storage |
| Containerization | Docker | Each service and infrastructure component runs in its own container |
| Orchestration | Kubernetes (Kind for local, cloud K8s for deployment) | Demonstrates cloud-native deployment, scaling, self-healing |
| CI/CD | GitHub Actions | Automated build, test, push Docker images, deploy to K8s |

---

## Microservice Decomposition

There are **5 Spring Boot microservices** + **1 API Gateway** + **external managed services**:

| Service | Port | Database | Firebase Admin SDK? | Responsibilities |
|---------|------|----------|-------------------|-----------------|
| **API Gateway** | 8080 | None | Yes (token validation) | Routes requests to correct service; validates Firebase JWT tokens; forwards user info as headers (`X-User-Id`, `X-User-Email`, `X-User-Role`); CORS configuration |
| **User Service** | 8081 | `user_db` | Yes (setting custom claims for roles) | Admin creates user accounts in Firebase Auth and PostgreSQL; user profile CRUD; role management; admin can update roles |
| **Post Service** | 8082 | `post_db` | No | Create/read/update/delete feed posts; heart reaction (toggle); comments with nested replies (one level only); publishes events to RabbitMQ on reaction/comment |
| **Job Service** | 8083 | `job_db` | No | Create/read/update/delete job and internship postings (posting only — external application links, no in-app applications); filter/search jobs |
| **Event Service** | 8084 | `event_db` | No | Create/read/update/delete department events, workshops, announcements; RSVP system; publishes events to RabbitMQ on new event |
| **Notification Service** | 8085 | None (Firebase Realtime DB is data store) | Yes (writing to Firebase Realtime DB) | Listens to RabbitMQ for events from all services; writes notifications to Firebase Realtime Database; exposes REST API for notification history, unread count, mark-as-read |

**External managed services (not Spring Boot):**

| Service | Role |
|---------|------|
| Firebase Auth | Authentication, JWT issuance, role management via custom claims |
| Firebase Realtime Database | Real-time direct messaging AND real-time notifications |
| Firebase Cloud Storage | Media files: images, videos, profile pictures |
| PostgreSQL | Relational database for business data (User, Post, Job, Event services) |
| RabbitMQ | Message broker for async inter-service communication |

**Note:** No MinIO/S3 container is needed. Firebase Cloud Storage handles all file storage. The frontend uploads files directly to Firebase Storage and sends the download URL to the backend. The backend never handles file bytes.

---

## Interface Abstraction Layer (OCP/DIP)

### Backend (Java interfaces)

```
services/
  api-gateway/
    src/.../security/
      TokenVerificationService.java              ← interface
      FirebaseTokenVerificationService.java       ← implementation

  user-service/
    src/.../identity/
      IdentityProviderService.java                ← interface
      FirebaseIdentityProviderService.java         ← implementation (setCustomUserClaims, createUser)

  notification-service/
    src/.../realtime/
      RealtimeNotificationService.java            ← interface
      FirebaseRealtimeNotificationService.java     ← implementation (write to Firebase RTDB)
```

Each service injects the interface, never the concrete class. Spring autowires the `@Service`-annotated implementation. Example:

```java
// Interface
public interface TokenVerificationService {
    DecodedToken verifyToken(String token);
}

// Implementation
@Service
public class FirebaseTokenVerificationService implements TokenVerificationService {
    // Firebase-specific code here
}

// Usage — only knows the interface
@RequiredArgsConstructor
public class AuthFilter {
    private final TokenVerificationService tokenVerificationService;
}
```

### Frontend (TypeScript interfaces)

```
web/src/lib/
  storage/
    StorageService.ts                ← interface
    FirebaseStorageService.ts        ← implementation
    index.ts                         ← exports: export const storageService: StorageService = new FirebaseStorageService();
  auth/
    AuthService.ts                   ← interface
    FirebaseAuthService.ts           ← implementation
    index.ts
  messaging/
    MessagingService.ts              ← interface
    FirebaseMessagingService.ts      ← implementation
    index.ts
  notifications/
    NotificationListenerService.ts   ← interface
    FirebaseNotificationListenerService.ts ← implementation
    index.ts
  api/
    apiClient.ts                     ← Axios instance with interceptor for auth token
```

All components import from the barrel file (`index.ts`), never from the Firebase implementation directly. Example:

```typescript
// Interface
export interface StorageService {
  uploadFile(file: File, path: string): Promise<string>;  // returns download URL
  deleteFile(path: string): Promise<void>;
  getDownloadUrl(path: string): Promise<string>;
}

// Usage — any component
import { storageService } from "@/lib/storage";
const url = await storageService.uploadFile(file, `posts/${postId}/${file.name}`);
```

Swapping to S3 tomorrow: write `S3StorageService.ts`, change one line in `index.ts`. Zero component changes.

---

## Project Structure

```
decp/
├── docker-compose.yml                 # Local development: all services + infra
├── k8s/                               # Kubernetes manifests
│   ├── namespace.yaml
│   ├── secrets.yaml
│   ├── configmap.yaml
│   ├── api-gateway/
│   ├── user-service/
│   ├── post-service/
│   ├── job-service/
│   ├── event-service/
│   ├── notification-service/
│   ├── postgres/
│   ├── rabbitmq/
│   └── ingress.yaml
├── services/
│   ├── api-gateway/                   # Spring Cloud Gateway
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── user-service/
│   │   ├── src/
│   │   │   └── main/resources/
│   │   │       └── db/migration/      # Flyway migrations
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── post-service/
│   │   ├── src/
│   │   │   └── main/resources/
│   │   │       └── db/migration/
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── job-service/
│   │   ├── src/
│   │   │   └── main/resources/
│   │   │       └── db/migration/
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── event-service/
│   │   ├── src/
│   │   │   └── main/resources/
│   │   │       └── db/migration/
│   │   ├── Dockerfile
│   │   └── pom.xml
│   └── notification-service/
│       ├── src/
│       ├── Dockerfile
│       └── pom.xml
├── web/                               # Next.js project
│   ├── src/
│   │   ├── app/                       # Next.js App Router pages
│   │   ├── components/                # Reusable React components
│   │   │   ├── ui/                    # Generic UI components (Button, Card, Badge, etc.)
│   │   │   ├── layout/               # Navigation, sidebar, notification bell
│   │   │   └── shared/               # RoleBadge, UserAvatar, etc.
│   │   ├── lib/                       # Service abstractions
│   │   │   ├── auth/
│   │   │   ├── storage/
│   │   │   ├── messaging/
│   │   │   ├── notifications/
│   │   │   ├── api/                   # Axios client
│   │   │   └── firebase.ts            # Firebase app initialization (only file that imports firebase directly besides implementations)
│   │   └── contexts/                  # React contexts (AuthContext, etc.)
│   ├── public/
│   ├── next.config.js                 # output: 'standalone'
│   ├── package.json
│   ├── tailwind.config.ts
│   └── Dockerfile
├── docs/
│   ├── architecture/
│   │   ├── soa-diagram.md
│   │   ├── enterprise-architecture.md
│   │   ├── product-modularity.md
│   │   └── deployment-diagram.md
│   ├── api-specs/
│   └── research/
└── README.md
```

---

## Phase-by-Phase Implementation

## Progress Tracking

At the very beginning of Phase 1 (before any code), create a `progress-tracker/` directory at the project root. For each phase, create a markdown file named after the phase:
```
progress-tracker/
├── phase-01-scaffolding.md
├── phase-02-firebase-auth.md
├── phase-03-user-service.md
├── phase-04-post-service.md
├── phase-05-job-service.md
├── phase-06-event-service.md
├── phase-07-notification-service.md
├── phase-08-messaging.md
├── phase-09-analytics.md
├── phase-10-kubernetes.md
├── phase-11-cloud-deployment.md
└── phase-12-documentation.md
```

Each file MUST follow this structure:
```markdown
# Phase X: <Phase Name>

## Status: NOT STARTED | IN PROGRESS | COMPLETED

## Steps

- [ ] Step X.1 — <description>
- [ ] Step X.2 — <description>
- [ ] Step X.3 — <description>
...

## Issues & Resolutions


## Decision Changes

```

**Rules for maintaining these files:**
- Check off each step (`- [x]`) immediately after completing it.
- Update the Status field as work progresses.
- Log EVERY problem encountered in the Issues & Resolutions table — even small ones. This is valuable for the project documentation and demo.
- Log any deviation from the original plan in the Decision Changes table with a clear explanation of why.
- These files serve as a living record of the implementation journey and will be useful for the project presentation and documentation deliverables.

---

### PHASE 1: Project Scaffolding & Infrastructure Setup

**Goal:** Set up the entire project structure, all Spring Boot service skeletons, the Next.js frontend skeleton, Docker Compose for local development, and verify everything starts and connects. At the end of this phase, you should be able to run `docker-compose up` and see all services running.

**Step 1.1 — Create the root project structure**

Create the directory structure exactly as specified in the "Project Structure" section above. Initialize a Git repository at the root. Create a `.gitignore` that excludes `node_modules/`, `target/`, `.env`, `*.jar`, `firebase-service-account.json`, and IDE files.

**Step 1.2 — Scaffold each Spring Boot microservice**

For each of the 6 services, create a Spring Boot 3 project using Maven.

**Common dependencies for ALL services** (in `pom.xml`):
- `spring-boot-starter-actuator` (health checks for Kubernetes)
- `spring-boot-starter-validation`
- `lombok`
- `spring-boot-devtools`

**Per-service dependencies:**

| Service | Dependencies |
|---------|-------------|
| **api-gateway** | `spring-boot-starter-webflux`, `spring-cloud-starter-gateway`, `firebase-admin` |
| **user-service** | `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `postgresql`, `flyway-core`, `firebase-admin`, `spring-cloud-starter-openfeign` |
| **post-service** | `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `postgresql`, `flyway-core`, `spring-boot-starter-amqp`, `spring-cloud-starter-openfeign` |
| **job-service** | `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `postgresql`, `flyway-core` |
| **event-service** | `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `postgresql`, `flyway-core`, `spring-boot-starter-amqp` |
| **notification-service** | `spring-boot-starter-web`, `spring-boot-starter-amqp`, `firebase-admin`, `spring-cloud-starter-openfeign` |

**IMPORTANT:** The API Gateway uses `spring-boot-starter-webflux` (NOT `spring-boot-starter-web`) because Spring Cloud Gateway is built on Project Reactor/Netty. These two starters conflict — you cannot have both.

**IMPORTANT:** The Notification Service does NOT use JPA, PostgreSQL, or Flyway. It uses Firebase Realtime Database as its sole data store.

Each service should have a main application class annotated with `@SpringBootApplication`. Services using OpenFeign should also have `@EnableFeignClients`.

**Step 1.3 — Configure application.yml for each service**

Every service MUST use environment variable overrides with defaults. Example for `user-service`:

```yaml
server:
  port: ${SERVER_PORT:8081}

spring:
  application:
    name: user-service
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/user_db}
    username: ${SPRING_DATASOURCE_USERNAME:decp}
    password: ${SPRING_DATASOURCE_PASSWORD:decp_password}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: ${SHOW_SQL:true}
  flyway:
    enabled: true
    locations: classpath:db/migration

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always
```

For services with RabbitMQ (post-service, event-service, notification-service):
```yaml
spring:
  rabbitmq:
    host: ${SPRING_RABBITMQ_HOST:localhost}
    port: ${SPRING_RABBITMQ_PORT:5672}
    username: ${SPRING_RABBITMQ_USERNAME:guest}
    password: ${SPRING_RABBITMQ_PASSWORD:guest}
```

For notification-service (no datasource, no JPA):
```yaml
server:
  port: ${SERVER_PORT:8085}

spring:
  application:
    name: notification-service
  rabbitmq:
    host: ${SPRING_RABBITMQ_HOST:localhost}
    port: ${SPRING_RABBITMQ_PORT:5672}

firebase:
  service-account-path: ${FIREBASE_SERVICE_ACCOUNT_PATH:classpath:firebase-service-account.json}
  database-url: ${FIREBASE_DATABASE_URL:https://your-project.firebaseio.com}
```

For services using OpenFeign, add service URLs:
```yaml
services:
  user-service:
    url: ${USER_SERVICE_URL:http://localhost:8081}
```

**Step 1.4 — Create Dockerfiles for each Spring Boot service**

Each Spring Boot service needs a multi-stage Dockerfile:
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE <port>
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Step 1.5 — Initialize the Next.js frontend**

In the `web/` directory:
- Initialize a Next.js project with App Router, TypeScript, and Tailwind CSS.
- Install dependencies: `npm install axios firebase`
- Add `output: 'standalone'` to `next.config.js`.
- Create the service abstraction directories (`src/lib/auth/`, `src/lib/storage/`, `src/lib/messaging/`, `src/lib/notifications/`, `src/lib/api/`). For now, just create the interface files with empty implementations — they will be filled in later phases.
- Create a basic responsive layout with a navigation bar:
  - Desktop: sidebar navigation with links for Feed, Jobs, Events, Messages, Profile, and a notification bell.
  - Mobile: bottom tab bar navigation.
- Create placeholder pages: `/`, `/feed`, `/jobs`, `/events`, `/messages`, `/profile`, `/login`.
- Each page should just render a heading like "Feed Page" for now.
- Create the Axios API client at `src/lib/api/apiClient.ts`:
  ```typescript
  import axios from 'axios';

  const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  });

  // Auth interceptor will be added in Phase 2
  export default apiClient;
  ```

- Create the Next.js Dockerfile using standalone mode:
  ```dockerfile
  FROM node:20-alpine AS build
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build

  FROM node:20-alpine
  WORKDIR /app
  COPY --from=build /app/.next/standalone ./
  COPY --from=build /app/.next/static ./.next/static
  COPY --from=build /app/public ./public
  EXPOSE 3000
  CMD ["node", "server.js"]
  ```

**Step 1.6 — Create docker-compose.yml**

Create a `docker-compose.yml` at the project root. Note: single PostgreSQL instance with multiple databases created via init script. No MinIO container needed.

```yaml
version: '3.8'
services:
  # Infrastructure
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: decp
      POSTGRES_PASSWORD: decp_password
      POSTGRES_DB: decp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASSWORD: guest

  # Backend Services
  api-gateway:
    build: ./services/api-gateway
    ports:
      - "8080:8080"
    depends_on:
      - user-service
      - post-service
      - job-service
      - event-service
      - notification-service
    environment:
      USER_SERVICE_URL: http://user-service:8081
      POST_SERVICE_URL: http://post-service:8082
      JOB_SERVICE_URL: http://job-service:8083
      EVENT_SERVICE_URL: http://event-service:8084
      NOTIFICATION_SERVICE_URL: http://notification-service:8085

  user-service:
    build: ./services/user-service
    ports:
      - "8081:8081"
    depends_on:
      - postgres
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/user_db
      SPRING_DATASOURCE_USERNAME: decp
      SPRING_DATASOURCE_PASSWORD: decp_password

  post-service:
    build: ./services/post-service
    ports:
      - "8082:8082"
    depends_on:
      - postgres
      - rabbitmq
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/post_db
      SPRING_DATASOURCE_USERNAME: decp
      SPRING_DATASOURCE_PASSWORD: decp_password
      SPRING_RABBITMQ_HOST: rabbitmq
      USER_SERVICE_URL: http://user-service:8081

  job-service:
    build: ./services/job-service
    ports:
      - "8083:8083"
    depends_on:
      - postgres
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/job_db
      SPRING_DATASOURCE_USERNAME: decp
      SPRING_DATASOURCE_PASSWORD: decp_password

  event-service:
    build: ./services/event-service
    ports:
      - "8084:8084"
    depends_on:
      - postgres
      - rabbitmq
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/event_db
      SPRING_DATASOURCE_USERNAME: decp
      SPRING_DATASOURCE_PASSWORD: decp_password
      SPRING_RABBITMQ_HOST: rabbitmq

  notification-service:
    build: ./services/notification-service
    ports:
      - "8085:8085"
    depends_on:
      - rabbitmq
    environment:
      SPRING_RABBITMQ_HOST: rabbitmq
      USER_SERVICE_URL: http://user-service:8081

  # Frontend
  web:
    build: ./web
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080
    depends_on:
      - api-gateway

volumes:
  postgres_data:
```

Create `init-db.sql` to create separate databases within the single PostgreSQL instance:
```sql
CREATE DATABASE user_db;
CREATE DATABASE post_db;
CREATE DATABASE job_db;
CREATE DATABASE event_db;
```

**NOTE on database strategy:** Locally we use a single PostgreSQL instance with separate databases for resource efficiency. Each service has its own database and cannot access another service's data. In production, each service should use a separate managed database instance (e.g., separate Cloud SQL instances on GCP) for true fault isolation. The architecture supports this because each service's connection string is externalized via environment variables — switching to separate instances is a config-only change.

**Step 1.7 — Verify everything starts**

Run `docker-compose up --build` and verify:
- PostgreSQL is running on port 5432 with all 4 databases created.
- RabbitMQ management UI is accessible at http://localhost:15672 (guest/guest).
- Each Spring Boot service responds to its `/actuator/health` endpoint.
- API Gateway is running on port 8080.
- Next.js app is running on port 3000 with placeholder pages visible.

---

### PHASE 2: Firebase Setup & Authentication

**Goal:** Set up Firebase project, configure the API Gateway to validate Firebase JWT tokens, implement the admin-managed user registration flow, and create login/profile-setup flow in Next.js.

**Step 2.1 — Firebase project setup (manual)**

1. Go to https://console.firebase.google.com and create a new project called "DECP".
2. Enable Authentication with Email/Password provider.
3. Enable Realtime Database.
4. Enable Cloud Storage.
5. Go to Project Settings → Service Accounts → Generate new private key. Download the JSON file.
6. Place it at `services/shared/firebase-service-account.json`. Add this path to `.gitignore`.
7. Copy the Firebase web app config object (apiKey, authDomain, projectId, etc.) — you'll need this for the Next.js app.

**Step 2.2 — API Gateway: Firebase token validation**

Implement the `TokenVerificationService` interface and `FirebaseTokenVerificationService` in the API Gateway.

Create a `FirebaseAuthGatewayFilter` (a Spring Cloud Gateway `GlobalFilter`) that:
1. Skips validation for paths like `/actuator/health` and any path configured as public.
2. Extracts the `Authorization: Bearer <token>` header.
3. Calls `tokenVerificationService.verifyToken(token)` to validate the token.
4. Extracts the user's UID, email, and custom claims (role) from the decoded token.
5. Adds custom headers to the downstream request: `X-User-Id`, `X-User-Email`, `X-User-Role`.
6. If invalid or missing, returns 401 Unauthorized.

Configure Spring Security for the gateway using the modern `SecurityFilterChain` pattern:

```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {
    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers("/actuator/health").permitAll()
                .anyExchange().permitAll()  // Auth is handled by the custom GlobalFilter, not Spring Security
            )
            .build();
    }
}
```

Note: Since the gateway uses WebFlux, it uses `SecurityWebFilterChain` and `@EnableWebFluxSecurity`, not the servlet-based equivalents.

Configure gateway routes in `application.yml`:

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: ${USER_SERVICE_URL:http://localhost:8081}
          predicates:
            - Path=/api/users/**
        - id: post-service
          uri: ${POST_SERVICE_URL:http://localhost:8082}
          predicates:
            - Path=/api/posts/**
        - id: job-service
          uri: ${JOB_SERVICE_URL:http://localhost:8083}
          predicates:
            - Path=/api/jobs/**
        - id: event-service
          uri: ${EVENT_SERVICE_URL:http://localhost:8084}
          predicates:
            - Path=/api/events/**
        - id: notification-service
          uri: ${NOTIFICATION_SERVICE_URL:http://localhost:8085}
          predicates:
            - Path=/api/notifications/**
      default-filters:
        - DedupeResponseHeader=Access-Control-Allow-Credentials Access-Control-Allow-Origin
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000}
            allowedMethods: "*"
            allowedHeaders: "*"
            allowCredentials: true
```

**Step 2.3 — Downstream service security configuration**

For each downstream service (User, Post, Job, Event, Notification), create a security config that trusts the gateway-forwarded headers. Since these services are only reachable through the gateway, they don't validate tokens themselves.

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(new GatewayHeaderAuthFilter(),
                UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

The `GatewayHeaderAuthFilter` reads `X-User-Id`, `X-User-Email`, and `X-User-Role` headers and creates a Spring Security `Authentication` object with appropriate granted authorities (e.g., `ROLE_STUDENT`, `ROLE_ALUMNI`, `ROLE_ADMIN`).

Create a utility `@CurrentUser` annotation or helper to extract the current user from the SecurityContext in controllers:

```java
// Usage in any controller:
@GetMapping("/profile")
public UserDTO getProfile(@RequestHeader("X-User-Id") String userId) {
    return userService.getProfile(userId);
}
```

**Step 2.4 — Next.js: Firebase Auth integration with interface abstraction**

1. Create `src/lib/firebase.ts` — initialize the Firebase app with the config from Step 2.1. This is the ONLY file (besides implementation classes) that imports from `firebase/*`.

2. Implement the `AuthService` interface and `FirebaseAuthService`:

```typescript
// src/lib/auth/AuthService.ts
export interface AuthService {
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
  getIdToken(): Promise<string | null>;
  updatePassword(newPassword: string): Promise<void>;
}

export interface AuthUser {
  uid: string;
  email: string;
  role: string;
}
```

3. Create `AuthContext` (`src/contexts/AuthContext.tsx`) that uses the `AuthService` interface (imported from the barrel file, not Firebase directly). Provides current user state, sign-in, sign-out, and token getter.

4. Add the auth interceptor to the Axios client:
```typescript
// src/lib/api/apiClient.ts
import axios from 'axios';
import { authService } from '@/lib/auth';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
});

apiClient.interceptors.request.use(async (config) => {
  const token = await authService.getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

5. Create the login page at `/login`:
   - Email and password form (no registration form — admins create accounts).
   - On success, redirect to `/feed`.
   - If the user logs in for the first time and has no profile in the User Service yet, redirect to `/profile/setup` instead.

6. Create a `ProtectedRoute` middleware that redirects unauthenticated users to `/login`.

**Step 2.5 — User registration flow (admin-only)**

This is fundamentally different from self-registration. The flow is:

1. Admin goes to `/admin/users` → clicks "Create User".
2. Admin fills in: email, temporary password, name, role (Student/Alumni/Admin), department.
3. Frontend calls `POST /api/users/register` (admin-only endpoint).
4. User Service receives the request and:
   a. Calls Firebase Admin SDK to create the user in Firebase Auth: `FirebaseAuth.getInstance().createUser(new CreateRequest().setEmail(email).setPassword(password))`.
   b. Sets custom claims on the Firebase user: `FirebaseAuth.getInstance().setCustomUserClaims(uid, Map.of("role", role))`.
   c. Saves the user profile to PostgreSQL with the provided details.
5. The new user can now log in with the email/temporary password.
6. On first login, the user is redirected to `/profile/setup` where they can update their name, bio, profile picture, and change their password.

**Handling the sync problem:** Since the admin creates both the Firebase user and the PostgreSQL record in a single backend transaction, there's no frontend-backend sync issue. If any step fails, the backend rolls back (deletes the Firebase user if PostgreSQL insert fails, or vice versa). This is much safer than having the frontend create the Firebase user and then separately calling the backend.

**Step 2.6 — Verify the auth flow**

Test the complete flow:
1. Seed one admin user manually in Firebase Console, and add a corresponding record in the User Service database via Flyway migration.
2. Login as admin → JWT token received → API calls through gateway succeed.
3. Admin creates a new user → user appears in Firebase Console and PostgreSQL.
4. New user logs in → redirected to profile setup → fills in details → redirected to feed.
5. Access a protected endpoint without a token → 401 returned.
6. Access an admin-only endpoint as a student → 403 returned.

---

### PHASE 3: User Service — Profiles, Roles & User Management

**Goal:** Build the complete User Service with admin user management, profile management, search, and role-based access.

**Step 3.1 — Flyway migration: V1__create_users_table.sql**

```sql
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid        VARCHAR(128) UNIQUE NOT NULL,
    email               VARCHAR(255) UNIQUE NOT NULL,
    name                VARCHAR(255) NOT NULL,
    bio                 TEXT,
    department          VARCHAR(255),
    graduation_year     INTEGER,
    profile_picture_url VARCHAR(512),
    role                VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    linkedin_url        VARCHAR(512),
    github_url          VARCHAR(512),
    is_profile_complete BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
```

**Step 3.2 — Flyway seed migration: V999__seed_data.sql**

```sql
-- Seed admin user (firebase_uid must match the manually created Firebase user)
INSERT INTO users (firebase_uid, email, name, role, department, is_profile_complete)
VALUES ('REPLACE_WITH_ACTUAL_FIREBASE_UID', 'admin@decp.com', 'System Admin', 'ADMIN', 'Computer Engineering', true);

-- Seed sample users (these must also be created in Firebase Auth via the admin endpoint or manually)
-- Add more seed data as needed for demo purposes
```

**Step 3.3 — API endpoints**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/register` | Admin only | Create a new user (creates in Firebase Auth + PostgreSQL) |
| GET | `/api/users/profile` | Authenticated | Get current user's profile |
| PUT | `/api/users/profile` | Authenticated | Update current user's profile (name, bio, links, etc.) |
| PUT | `/api/users/profile/complete` | Authenticated | Mark profile as complete (after first-time setup) |
| GET | `/api/users/{firebaseUid}` | Authenticated | Get another user's public profile |
| GET | `/api/users/search?q=name&role=ALUMNI&department=CSE&page=0&size=20` | Authenticated | Search users (paginated) |
| GET | `/api/users` | Admin only | List all users (paginated, for admin dashboard) |
| PUT | `/api/users/{firebaseUid}/role` | Admin only | Change a user's role (also updates Firebase custom claims) |

**Step 3.4 — Implementation details**

- Use standard Spring Boot layered architecture: Controller → Service → Repository.
- Use JPA entities with `@Entity`, `@Table`, etc.
- Use DTOs for all request/response bodies (never expose entities directly).
- Use `@Valid` with Jakarta validation annotations on request DTOs.
- The `IdentityProviderService` interface is used for Firebase Admin SDK operations (create user, set claims). Only the User Service uses this.
- Profile picture URL: stored in PostgreSQL. The actual upload goes to Firebase Cloud Storage via the frontend. The frontend sends the download URL to the backend after upload.
- Use Spring Data JPA `Specification` or `@Query` with dynamic filtering for the search endpoint.

**Step 3.5 — User response DTO design**

Every API response that includes user information should include a `roleBadge` field for the verified-tick-style role indicator:

```java
public class UserDTO {
    private String id;
    private String firebaseUid;
    private String email;
    private String name;
    private String bio;
    private String department;
    private Integer graduationYear;
    private String profilePictureUrl;
    private String role;          // "STUDENT", "ALUMNI", "ADMIN"
    private String roleBadge;     // color indicator: "blue" for student, "gold" for alumni, "red" for admin
    private String linkedinUrl;
    private String githubUrl;
    private String initials;      // "HB" for "Haritha Bandara" — for avatar fallback
    private boolean profileComplete;
}
```

The `initials` field is computed from the name (first letter of first name + first letter of last name, uppercase). The `roleBadge` maps role to a color. Both are computed in the service layer, not stored in the database.

**Step 3.6 — Next.js user pages**

- `/profile` — Shows the current user's profile. If `isProfileComplete` is false, redirect to `/profile/setup`.
- `/profile/setup` — First-time profile setup form (name, bio, department, graduation year, LinkedIn, GitHub, profile picture upload, password change). After saving, mark profile as complete.
- `/profile/edit` — Edit existing profile.
- `/users/{firebaseUid}` — Public profile view of another user. Shows a "Message" button (links to messaging, implemented in a later phase).
- `/users` — User directory with search and filter by role/department (paginated).
- `/admin/users` — Admin panel:
  - "Create User" button → form with email, password, name, role, department.
  - List of all users (paginated) with role displayed.
  - Ability to change a user's role via dropdown → calls `PUT /api/users/{id}/role`.

**UserAvatar component:** Create a reusable `UserAvatar` component that:
- If `profilePictureUrl` exists: shows the image in a round container.
- If no profile picture: shows the user's initials (e.g., "HB") in a colored circle (Tailwind: `rounded-full bg-blue-500 text-white flex items-center justify-center`).

**RoleBadge component:** Create a reusable `RoleBadge` component that shows a small colored dot/icon next to the user's name:
- Student: blue badge
- Alumni: gold/amber badge
- Admin: red badge
This appears next to the user's name everywhere: posts, comments, user directory, profile pages — like LinkedIn's verified badge but color-coded by role.

---

### PHASE 4: Post Service — Feed, Reactions, Comments & Replies

**Goal:** Build the social feed with text posts, media uploads to Firebase Cloud Storage, heart reaction, and comments with nested replies.

**Step 4.1 — Flyway migration: V1__create_post_tables.sql**

```sql
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         VARCHAR(128) NOT NULL,
    text_content    TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_media (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_url       VARCHAR(1024) NOT NULL,
    media_type      VARCHAR(10) NOT NULL,
    file_name       VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_reactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id         VARCHAR(128) NOT NULL,
    reaction_type   VARCHAR(20) NOT NULL DEFAULT 'HEART',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

CREATE TABLE post_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id         VARCHAR(128) NOT NULL,
    parent_id       UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_parent_id ON post_comments(parent_id);
CREATE INDEX idx_post_reactions_post_id ON post_reactions(post_id);
```

**Comment hierarchy rules:**
- A comment with `parent_id = NULL` is a top-level comment on a post.
- A comment with `parent_id` pointing to another comment is a reply.
- Replies CANNOT have nested replies (only one level of nesting). Enforce this in the service layer: if `parent_id` points to a comment that itself has a `parent_id`, reject the request with 400 Bad Request.

**Step 4.2 — Media uploads (Firebase Cloud Storage — frontend-driven)**

Media upload is handled entirely by the frontend using Firebase Cloud Storage SDK. The backend never touches file bytes.

Frontend upload flow:
1. User selects an image/video when creating a post.
2. Frontend uploads the file to Firebase Storage at path `posts/{postId}/{uuid}_{filename}` using the `StorageService` interface.
3. Firebase returns a download URL.
4. Frontend sends the post data to the backend: `POST /api/posts` with `{ textContent: "...", mediaUrls: [{ url: "https://...", mediaType: "IMAGE", fileName: "photo.jpg" }] }`.
5. Backend saves the post and media URLs to PostgreSQL.

Firebase Storage security rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /profiles/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Step 4.3 — API endpoints**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/posts` | Authenticated | Create a new post (JSON body with text + media URLs) |
| GET | `/api/posts?page=0&size=20` | Authenticated | Get feed (paginated, newest first) |
| GET | `/api/posts/{id}` | Authenticated | Get a single post |
| PUT | `/api/posts/{id}` | Owner only | Update post text |
| DELETE | `/api/posts/{id}` | Owner or Admin | Delete a post |
| POST | `/api/posts/{id}/react` | Authenticated | Toggle heart reaction |
| GET | `/api/posts/{id}/reactions` | Authenticated | Get reaction count and whether current user reacted |
| POST | `/api/posts/{id}/comments` | Authenticated | Add a top-level comment (body: { content }) |
| POST | `/api/posts/{id}/comments/{commentId}/replies` | Authenticated | Reply to a comment (one level only) |
| GET | `/api/posts/{id}/comments?page=0&size=20` | Authenticated | Get top-level comments with their replies (paginated) |
| DELETE | `/api/posts/{id}/comments/{commentId}` | Owner or Admin | Delete a comment/reply |

**Step 4.4 — OpenFeign: User details for posts**

The Post Service needs to display author names, profile pictures, initials, and role badges alongside posts and comments. Use OpenFeign to call the User Service:

```java
@FeignClient(name = "user-service", url = "${services.user-service.url}")
public interface UserServiceClient {
    @GetMapping("/api/users/{firebaseUid}")
    UserDTO getUserByFirebaseUid(@PathVariable String firebaseUid);
}
```

When returning posts to the frontend, the Post Service calls the User Service to get author details. The frontend can also cache user data locally to reduce calls.

**Step 4.5 — RabbitMQ event publishing**

When a post is reacted to or commented on, the Post Service publishes an event to RabbitMQ:

```java
// Event types and their notification targets:
// POST_REACTED → notify post owner
// POST_COMMENTED → notify post owner
// COMMENT_REPLIED → notify the comment author AND the post owner (if different)

public class NotificationEvent {
    private String type;           // "POST_REACTED", "POST_COMMENTED", "COMMENT_REPLIED"
    private String recipientId;    // who should receive the notification (firebase_uid)
    private String triggeredById;  // who performed the action (firebase_uid)
    private String triggeredByName;
    private String postId;
    private String commentId;      // null for reactions
    private LocalDateTime timestamp;
}
```

**IMPORTANT for COMMENT_REPLIED:** When User A replies to User B's comment on User C's post:
- Notify User B (comment author): "User A replied to your comment"
- Notify User C (post owner, if C ≠ B and C ≠ A): "User A commented on your post"
- Do NOT notify yourself (if A == B or A == C, skip that notification)

Configure RabbitMQ exchange:
- Exchange: `decp.notifications` (topic type)
- Post Service publishes with routing keys: `post.reacted`, `post.commented`, `comment.replied`

**Step 4.6 — Flyway seed migration: V999__seed_posts.sql**

Seed sample posts with varied content for the demo. Include posts from different users (student, alumni, admin) with some media URLs (can be placeholder image URLs for seeding), some reactions, and some comments with replies.

**Step 4.7 — Next.js feed pages**

- `/feed` — The main feed page:
  - "Create Post" card at the top with text input and media upload button (using the `StorageService` interface).
  - Paginated list of posts (infinite scroll or "Load More").
  - Each post card shows:
    - `UserAvatar` component (profile picture or initials).
    - Author name with `RoleBadge` component (colored dot for role).
    - Post text content.
    - Media (images displayed inline, videos with HTML5 player).
    - Heart reaction button (filled red if current user reacted, outline if not) with count.
    - Comment icon with count. Clicking expands comments inline.
  - Comment section:
    - Each top-level comment shows: `UserAvatar`, name with `RoleBadge`, comment text, "Reply" button, timestamp.
    - Replies are indented under the parent comment (one level only).
    - Reply input appears when "Reply" is clicked.
  
- `/posts/{id}` — Single post view with all comments and replies.

---

### PHASE 5: Job Service — Opportunity Postings

**Goal:** Build the job/internship board where alumni and admins can post opportunities with external application links. No in-app application system — most opportunities have their own external application mechanisms.

**Step 5.1 — Flyway migration: V1__create_jobs_table.sql**

```sql
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
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
```

**Step 5.2 — API endpoints**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/jobs` | Alumni or Admin | Create a job posting |
| GET | `/api/jobs?type=INTERNSHIP&remote=true&search=developer&status=ACTIVE&page=0&size=20` | Authenticated | List jobs (paginated, filtered) |
| GET | `/api/jobs/{id}` | Authenticated | Get job details |
| PUT | `/api/jobs/{id}` | Owner or Admin | Update job posting |
| DELETE | `/api/jobs/{id}` | Owner or Admin | Delete job posting |
| GET | `/api/jobs/my-posts` | Alumni or Admin | List current user's job postings |

**Step 5.3 — Implementation notes**

- `application_link` is the URL to the external application form/website. This is a required field.
- `job_type` enum: `FULL_TIME`, `PART_TIME`, `INTERNSHIP`, `CONTRACT`.
- `status` enum: `ACTIVE`, `CLOSED`.
- Role-based access: Only ALUMNI and ADMIN can create/edit/delete job postings. All authenticated users can view.
- When a new job is posted, publish to RabbitMQ: `{ type: "NEW_JOB", ...jobDetails }` so the Notification Service can notify all users (or a subset).

**Step 5.4 — Flyway seed migration: V999__seed_jobs.sql**

Seed sample job postings with various types (internship, full-time, contract), companies, and locations.

**Step 5.5 — Next.js job pages**

- `/jobs` — Job listing page:
  - Filter bar: job type dropdown, remote toggle, keyword search.
  - Paginated list of job cards showing: title, company, location, type badge, posted date, deadline.
  - "Post Opportunity" button visible only to alumni/admin users.
- `/jobs/{id}` — Job detail page:
  - Full description, requirements, salary range, deadline.
  - "Apply Externally" button that opens `application_link` in a new tab.
  - Author info with `UserAvatar` and `RoleBadge`.
  - Edit/Delete buttons visible to the job poster and admins.
- `/jobs/create` — Form to create a new job posting (alumni/admin only). `application_link` is a required field.

---

### PHASE 6: Event Service — Events & RSVP

**Goal:** Build the department events system with RSVP functionality.

**Step 6.1 — Flyway migration: V1__create_event_tables.sql**

```sql
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by      VARCHAR(128) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT NOT NULL,
    event_type      VARCHAR(20) NOT NULL,
    location        VARCHAR(255),
    is_online       BOOLEAN DEFAULT FALSE,
    online_link     VARCHAR(1024),
    start_time      TIMESTAMP NOT NULL,
    end_time        TIMESTAMP NOT NULL,
    max_attendees   INTEGER,
    image_url       VARCHAR(1024),
    status          VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_rsvps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id         VARCHAR(128) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'GOING',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_event_rsvps_event_id ON event_rsvps(event_id);
```

**Step 6.2 — API endpoints**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events` | Admin only | Create an event |
| GET | `/api/events?type=WORKSHOP&status=UPCOMING&page=0&size=20` | Authenticated | List events (paginated, filtered) |
| GET | `/api/events/{id}` | Authenticated | Get event details with RSVP stats |
| PUT | `/api/events/{id}` | Admin only | Update event |
| DELETE | `/api/events/{id}` | Admin only | Cancel/delete event |
| POST | `/api/events/{id}/rsvp` | Authenticated | RSVP (body: { status: "GOING" / "MAYBE" / "NOT_GOING" }) |
| GET | `/api/events/{id}/attendees?page=0&size=20` | Authenticated | List attendees (paginated) |

**Step 6.3 — RabbitMQ event publishing**

When a new event is created, the Event Service publishes to RabbitMQ:
```java
// routing key: event.created
{
  "type": "NEW_EVENT",
  "eventId": "...",
  "title": "...",
  "startTime": "...",
  "createdByName": "..."
}
```

**Step 6.4 — Flyway seed migration: V999__seed_events.sql**

Seed sample events of different types with some RSVPs.

**Step 6.5 — Next.js event pages**

- `/events` — Event listing page:
  - Filter: event type, upcoming/past toggle.
  - Paginated list of event cards showing: title, date/time, location, type, attendee count.
  - "Create Event" button visible only to admins.
- `/events/{id}` — Event detail page:
  - Full description, location, online link if virtual.
  - RSVP buttons (Going / Maybe / Not Going). Highlight current user's status.
  - Attendee count and list.
  - Edit/Delete buttons for admins.
- `/events/create` — Form to create an event (admin only). Image upload via Firebase Storage.

---

### PHASE 7: Notification Service — Real-Time In-App Notifications

**Goal:** Build the Notification Service that consumes RabbitMQ events from all other services, writes notifications to Firebase Realtime Database for real-time delivery, and exposes REST endpoints for notification management. The frontend listens to Firebase for instant updates.

**Step 7.1 — Firebase Realtime Database structure for notifications**

```json
{
  "notifications": {
    "<userId>": {
      "<notificationId>": {
        "type": "POST_REACTED",
        "title": "New reaction on your post",
        "message": "John Doe reacted to your post",
        "data": {
          "postId": "...",
          "triggeredById": "...",
          "triggeredByName": "John Doe"
        },
        "read": false,
        "createdAt": 1234567890
      }
    }
  }
}
```

Firebase Realtime Database security rules for notifications:
```json
{
  "rules": {
    "notifications": {
      "$userId": {
        ".read": "auth.uid === $userId",
        ".write": "auth.uid === $userId || auth.token.role === 'ADMIN'"
      }
    }
  }
}
```

Note: The backend writes to Firebase using the Admin SDK, which bypasses security rules. The security rules above are for direct frontend access.

**Step 7.2 — RabbitMQ consumer**

The Notification Service listens to the `decp.notifications` exchange:

```java
@Configuration
public class RabbitMQConfig {
    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange("decp.notifications");
    }

    @Bean
    public Queue notificationQueue() {
        return new Queue("notification-queue", true);
    }

    @Bean
    public Binding binding(Queue notificationQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(notificationQueue)
            .to(notificationExchange)
            .with("#");  // Listen to all routing keys
    }
}

@Service
@RequiredArgsConstructor
public class NotificationConsumer {
    private final RealtimeNotificationService realtimeNotificationService;

    @RabbitListener(queues = "notification-queue")
    public void handleNotification(NotificationEvent event) {
        // Format the notification based on event type
        // Write to Firebase Realtime Database via the interface
        realtimeNotificationService.sendNotification(
            event.getRecipientId(),
            notification
        );
    }
}
```

The `RealtimeNotificationService` interface → `FirebaseRealtimeNotificationService` implementation writes to Firebase using:
```java
FirebaseDatabase.getInstance()
    .getReference("notifications/" + userId)
    .child(notificationId)
    .setValueAsync(notificationData);
```

**Step 7.3 — REST endpoints for notification management**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications?page=0&size=20` | Authenticated | Get notifications (reads from Firebase RTDB, paginated) |
| GET | `/api/notifications/unread-count` | Authenticated | Get unread count |
| PUT | `/api/notifications/{id}/read` | Authenticated | Mark one notification as read |
| PUT | `/api/notifications/read-all` | Authenticated | Mark all as read |

These endpoints read/write to Firebase Realtime Database, not PostgreSQL. Use the Firebase Admin SDK.

**Step 7.4 — OpenFeign: User details for notifications**

The Notification Service uses OpenFeign to call the User Service when formatting notifications (to get the name of the user who triggered the action, if not already provided in the RabbitMQ event).

**Step 7.5 — Next.js: Real-time notification listener**

Implement the `NotificationListenerService` interface → `FirebaseNotificationListenerService`:

```typescript
// src/lib/notifications/NotificationListenerService.ts
export interface NotificationListenerService {
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void): () => void;
  getUnreadCount(userId: string): Promise<number>;
}
```

The Firebase implementation listens to `/notifications/{userId}` using `onChildAdded` and `onChildChanged`.

In the navigation bar, create a **NotificationBell** component:
- Shows a red badge with the unread count (updates in real-time via the listener).
- Clicking opens a dropdown listing recent notifications.
- Each notification shows: icon based on type, message text, timestamp, read/unread styling.
- Each notification is clickable and navigates to the relevant content (post, event, job).
- "Mark all as read" button at the top.

---

### PHASE 8: Firebase Realtime Messaging

**Goal:** Implement direct messaging between users using Firebase Realtime Database. This is entirely frontend + Firebase — no Spring Boot service needed for messaging.

**Step 8.1 — Firebase Realtime Database structure for messaging**

```json
{
  "conversations": {
    "<conversationId>": {
      "participants": {
        "<userId1>": true,
        "<userId2>": true
      },
      "lastMessage": {
        "text": "Hey, how are you?",
        "senderId": "<userId1>",
        "timestamp": 1234567890
      }
    }
  },
  "messages": {
    "<conversationId>": {
      "<messageId>": {
        "senderId": "<userId1>",
        "text": "Hey, how are you?",
        "timestamp": 1234567890,
        "read": false
      }
    }
  },
  "userConversations": {
    "<userId1>": {
      "<conversationId>": true
    }
  }
}
```

**Step 8.2 — Firebase security rules for messaging**

```json
{
  "rules": {
    "conversations": {
      "$conversationId": {
        ".read": "root.child('conversations').child($conversationId).child('participants').child(auth.uid).exists()",
        ".write": "root.child('conversations').child($conversationId).child('participants').child(auth.uid).exists()"
      }
    },
    "messages": {
      "$conversationId": {
        ".read": "root.child('conversations').child($conversationId).child('participants').child(auth.uid).exists()",
        ".write": "root.child('conversations').child($conversationId).child('participants').child(auth.uid).exists()"
      }
    },
    "userConversations": {
      "$userId": {
        ".read": "auth.uid === $userId",
        ".write": "auth.uid === $userId"
      }
    }
  }
}
```

**Step 8.3 — MessagingService interface and implementation**

Implement the `MessagingService` interface → `FirebaseMessagingService`:

```typescript
export interface MessagingService {
  startConversation(currentUserId: string, otherUserId: string): Promise<string>;  // returns conversationId
  sendMessage(conversationId: string, senderId: string, text: string): Promise<void>;
  subscribeToMessages(conversationId: string, callback: (message: Message) => void): () => void;
  getConversations(userId: string): Promise<Conversation[]>;
  markAsRead(conversationId: string, messageId: string): Promise<void>;
}
```

**Step 8.4 — Next.js messaging UI**

- `/messages` — Two-panel responsive layout:
  - Left panel: conversation list. Each entry shows `UserAvatar`, name with `RoleBadge`, last message preview, timestamp. Unread conversations highlighted.
  - Right panel: message thread for selected conversation. Messages aligned left (other person) and right (current user) with timestamps.
  - On mobile: conversation list view → click opens thread full-screen with back button.
  - Message input at the bottom with send button.
  - "New Message" button → user search popup → start new conversation.
  - Real-time: new messages appear instantly via Firebase listeners.

- Add a "Message" button on user profile pages (`/users/{firebaseUid}`) that starts or opens a conversation.

---

### PHASE 9: Analytics Dashboard

**Goal:** Build a simple analytics dashboard for admins showing platform usage statistics.

**Step 9.1 — Analytics endpoints in each service**

Each service exposes a stats endpoint (admin only):

- **User Service**: `GET /api/users/stats` → `{ totalUsers, studentCount, alumniCount, adminCount, newUsersThisMonth }`
- **Post Service**: `GET /api/posts/stats` → `{ totalPosts, postsThisMonth, totalReactions, totalComments }`
- **Job Service**: `GET /api/jobs/stats` → `{ totalJobs, activeJobs, closedJobs, jobsThisMonth }`
- **Event Service**: `GET /api/events/stats` → `{ totalEvents, upcomingEvents, totalRsvps, eventsThisMonth }`

For monthly trend data:
- `GET /api/<resource>/stats/monthly?months=6` → returns array of `{ month: "2026-01", count: 15 }` using SQL `GROUP BY DATE_TRUNC('month', created_at)`.

**Step 9.2 — Next.js analytics dashboard**

- `/admin/dashboard` — Admin-only page:
  - Summary card grid: total users, total posts, active jobs, upcoming events.
  - Charts (use Recharts):
    - Line chart: new users per month.
    - Bar chart: posts per month.
    - Pie chart: user role distribution.
    - Bar chart: jobs posted per month.
  - Recent activity: latest posts, newest users, recent job postings.
  - The page calls all 4 stats endpoints in parallel using `Promise.all`.

---

### PHASE 10: Dockerization & Local Kubernetes Deployment (Kind)

**Goal:** Ensure all Dockerfiles work correctly, set up a local Kubernetes cluster with Kind (already installed), and deploy everything.

**Step 10.1 — Verify all Docker builds**

Build and test each service image individually:
```bash
docker build -t decp-api-gateway:latest ./services/api-gateway
docker build -t decp-user-service:latest ./services/user-service
docker build -t decp-post-service:latest ./services/post-service
docker build -t decp-job-service:latest ./services/job-service
docker build -t decp-event-service:latest ./services/event-service
docker build -t decp-notification-service:latest ./services/notification-service
docker build -t decp-web:latest ./web
```

**Step 10.2 — Create a Kind cluster**
Check if kind is installed
```bash
kind version
```
If not installed, install it:
```bash
# Install Kind
[ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.31.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```
Create the cluster:

```bash
cat <<EOF | kind create cluster --name decp --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
EOF

# Install NGINX Ingress Controller for Kind
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress controller
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

**Step 10.3 — Load Docker images into Kind**

```bash
kind load docker-image decp-api-gateway:latest --name decp
kind load docker-image decp-user-service:latest --name decp
kind load docker-image decp-post-service:latest --name decp
kind load docker-image decp-job-service:latest --name decp
kind load docker-image decp-event-service:latest --name decp
kind load docker-image decp-notification-service:latest --name decp
kind load docker-image decp-web:latest --name decp
```

**Step 10.4 — Create Kubernetes manifests**

Create manifests in `k8s/` for:

1. `namespace.yaml` — `decp` namespace
2. `secrets.yaml` — Database credentials, Firebase service account key (base64 encoded)
3. `configmap.yaml` — Shared configuration
4. For PostgreSQL: Deployment (or StatefulSet) with PersistentVolumeClaim, Service, and init-db ConfigMap
5. For RabbitMQ: Deployment and Service
6. For each Spring Boot service: Deployment and Service with:
   - Environment variables from secrets/configmaps
   - `imagePullPolicy: Never` (local images)
   - Readiness/liveness probes using `/actuator/health`
   - Resource requests/limits
7. For the Next.js web app: Deployment and Service
8. `ingress.yaml` — Routes:
   - `/api/*` → api-gateway service
   - `/` → web frontend service

**Step 10.5 — Deploy and verify**

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/rabbitmq/

kubectl wait --for=condition=ready pod -l app=postgres -n decp --timeout=120s
kubectl wait --for=condition=ready pod -l app=rabbitmq -n decp --timeout=120s

kubectl apply -f k8s/api-gateway/
kubectl apply -f k8s/user-service/
kubectl apply -f k8s/post-service/
kubectl apply -f k8s/job-service/
kubectl apply -f k8s/event-service/
kubectl apply -f k8s/notification-service/
kubectl apply -f k8s/web/
kubectl apply -f k8s/ingress.yaml

# Verify
kubectl get pods -n decp
kubectl get svc -n decp
kubectl get ingress -n decp
```

Access the app at `http://localhost`. Test all features.

---

### PHASE 11: Cloud Deployment

**Goal:** Deploy to a cloud Kubernetes service for the live demo.

**Step 11.1 — Cloud provider setup**

Recommended: **Google Cloud Platform (GCP)** with GKE.
- GCP offers $300 free credit.
- Use GKE Autopilot for managed cluster.

**Step 11.2 — Cloud-specific changes**

1. Push Docker images to Google Container Registry (GCR).
2. Use managed PostgreSQL (Cloud SQL) instead of in-cluster PostgreSQL. Update connection strings.
3. Update Kubernetes manifests: change `imagePullPolicy` to `Always`, use full GCR image paths.
4. Add Horizontal Pod Autoscaler (HPA) for each Spring Boot service.
5. Configure Ingress with a cloud load balancer.

**Step 11.3 — Deploy and verify**

Deploy to GKE and test. Note the public URL for the demo.

---

### PHASE 12: Research, Documentation & Architecture Diagram Descriptions

**Goal:** Complete all documentation required for the project submission.

**Step 12.1 — Research on existing platforms**

Write `docs/research/platform-analysis.md` covering:

1. **Facebook Architecture:** Microservices with thousands of services, TAO data model for social graph, news feed ranking with ML, Haystack for photo storage, MQTT for Messenger.
2. **LinkedIn Architecture:** Service-oriented with Rest.li framework, Kafka for event-driven systems, Galene for custom search.
3. **Missing features in DECP vs real platforms:** No ML feed ranking (DECP uses chronological), no recommendation engine, no Elasticsearch for search, no video transcoding, no content moderation, no read receipts/typing indicators, no file sharing in messages.
4. **Proposed improvements:** Elasticsearch for full-text search, recommendation service for jobs, Redis caching layer, CDN for media, video transcoding with FFmpeg.

**Step 12.2 — Architecture diagram descriptions**

**SOA Diagram** should show:
- All 5 Spring Boot microservices + API Gateway as separate boxes.
- Web Client connecting through API Gateway.
- Each service connected to PostgreSQL (except Notification Service).
- RabbitMQ with publish/subscribe arrows: Post Service publishes `post.reacted`, `post.commented`, `comment.replied`; Event Service publishes `event.created`; Job Service publishes `job.posted`; Notification Service consumes ALL events.
- External services: Firebase Auth (connected to Gateway + Web Client), Firebase Realtime DB (connected to Notification Service for writes + Web Client for real-time reads for both messaging and notifications), Firebase Cloud Storage (connected to Web Client for uploads/downloads).
- API endpoints labeled, communication protocols labeled (REST sync, AMQP async, Firebase SDK real-time).
- OpenFeign connections shown as dashed arrows between services (Post Service → User Service, Notification Service → User Service).

**Enterprise Architecture Diagram** should show:
- Three user roles at top: Student (blue badge), Alumni (gold badge), Admin (red badge) with permitted actions.
  - Student: view feed, create posts, react, comment, browse jobs, RSVP to events, message users.
  - Alumni: all student actions + post job opportunities.
  - Admin: all actions + create events, manage users (create accounts, change roles), view analytics.
- Platform layers: Presentation (responsive web, future mobile), API (Gateway), Business Logic (User, Post, Job, Event, Notification modules), Data (PostgreSQL, Firebase RTDB, Firebase Storage).
- External Firebase services and cloud infrastructure.

**Product Modularity Diagram** should show:
- Core modules: User Management, Social Feed, Job Board, Event Management.
- Enhancement modules: Real-time Messaging, Real-time Notifications, Analytics Dashboard, Research Collaboration (future).
- Reusable components: Firebase Auth abstraction, Firebase Storage abstraction, Axios API client, RoleBadge/UserAvatar components, Pagination utilities, RabbitMQ event publisher, OpenFeign clients.
- Maintainability plan: independent services, interface abstractions for all external dependencies (OCP/DIP), database per service, environment-variable-driven config.

**Deployment Diagram** should show:
- Kubernetes cluster with pods for each service, PostgreSQL, RabbitMQ, NGINX Ingress.
- No MinIO/S3 pod — Firebase Cloud Storage is external.
- Notification Service pod has NO database connection — uses Firebase RTDB.
- External: Firebase services, users connecting via browser.
- HPA on Spring Boot services for scalability.
- Cloud version: managed PostgreSQL replaces in-cluster pod.

**Step 12.3 — Design decision justifications**

Document in `docs/architecture/design-decisions.md`:

1. Why microservices over monolith.
2. Why Firebase Auth over Keycloak or custom auth.
3. Why Firebase Realtime DB for messaging and notifications over custom WebSocket/SSE.
4. Why Firebase Cloud Storage over MinIO (MinIO entered maintenance mode in Dec 2025, no longer viable for new projects).
5. Why single PostgreSQL instance locally with separate databases (resource efficiency) vs separate instances in production (fault isolation).
6. Why Flyway for migrations over Hibernate auto-DDL.
7. Why RabbitMQ for inter-service communication.
8. Why OpenFeign for synchronous inter-service calls.
9. Why interface abstractions for all external dependencies (OCP/DIP) — enables provider swapping.
10. Why admin-only registration (department security, controlled access).
11. Why external application links for jobs instead of in-app applications (practical — real opportunities have their own processes).
12. Quality attributes: scalability (K8s HPA, stateless services), availability (K8s self-healing), security (centralized auth, role-based access), maintainability (interfaces, independent services), interoperability (REST APIs for web + future mobile), performance (direct media from Firebase Storage, pagination everywhere).

---

## Summary of External Accounts Needed

Before starting implementation:
1. **Firebase** (Google account) — Free tier sufficient.
2. **GitHub** — Code repository.
3. **Cloud provider** (GCP recommended) — For production deployment ($300 free credit).

---

## MVP Priority Order

If time is short, implement in this priority:
1. Phase 1 (scaffolding) — foundation for everything
2. Phase 2 (auth) — nothing works without auth
3. Phase 3 (users) — profiles needed for all features
4. Phase 4 (posts) — core social feature, most impressive for demo
5. Phase 5 (jobs) — key differentiator
6. Phase 6 (events) — demonstrates event-driven architecture
7. Phase 7 (notifications) — shows real-time + RabbitMQ + event-driven patterns
8. Phase 10 (Docker + Kind) — demonstrates containerization and K8s
9. Phase 9 (analytics) — quick win, looks great in demo
10. Phase 8 (messaging) — nice to have, Firebase makes it doable
11. Phase 11 (cloud deployment) — for the live demo URL
12. Phase 12 (documentation) — write throughout, finalize at end