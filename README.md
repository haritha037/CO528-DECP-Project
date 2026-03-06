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

## Quick Start (Docker Compose)
```bash
docker-compose up --build
```

Services will be available at:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- RabbitMQ Management: http://localhost:15672 (guest/guest)

## Services
| Service | Port |
|---------|------|
| API Gateway | 8080 |
| User Service | 8081 |
| Post Service | 8082 |
| Job Service | 8083 |
| Event Service | 8084 |
| Notification Service | 8085 |
| Frontend (Next.js) | 3000 |
