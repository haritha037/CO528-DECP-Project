# Phase 10: Dockerization & Local Kubernetes Deployment (Kind)

## Status: COMPLETED

## Steps

- [x] Step 10.1 — Verify all Docker builds individually
- [x] Step 10.2 — Create Kind cluster (decp) with NGINX Ingress Controller
- [x] Step 10.3 — Load Docker images into Kind cluster
- [x] Step 10.4 — Create Kubernetes manifests (namespace, secrets, configmap, postgres, rabbitmq, all services, ingress)
- [x] Step 10.5 — Deploy to Kind and verify (kubectl get pods, services, ingress)

## Issues & Resolutions

| # | Issue | Resolution |
|---|-------|------------|
| 1 | Kind cluster created without port 80/443 mappings — ingress unreachable | Deleted and recreated cluster using `kind-config.yaml` with `extraPortMappings` |
| 2 | `task k8s:build-web` used docker compose which tagged image differently from `decp-web:latest` | Added `image: decp-web:latest` (and all services) to `apps.yml` so compose uses consistent image names |
| 3 | `NEXT_PUBLIC_API_URL=http://localhost` baked in but app accessed from another device — API calls went to `localhost` on that device | Created `web/.env.k8s` with `NEXT_PUBLIC_API_URL=http://10.30.13.229`; `task k8s:build-web` loads both `.env.local` and `.env.k8s` |
| 4 | CORS blocked when accessing from host machine after setting IP — origin `http://localhost` not in `CORS_ALLOWED_ORIGINS` | Added `http://localhost` back alongside IP in ConfigMap |
| 5 | Firebase credentials baked into Docker images (in `src/main/resources/`) | Accepted for local dev — services fall back to `classpath:firebase-service-account.json` when env var not set |
| 6 | RabbitMQ credentials were in ConfigMap (plaintext) | Moved to Secrets |

## Decision Changes

| # | Original Plan | Change | Reason |
|---|---------------|--------|--------|
| 1 | `kind-config.yaml` at project root | Moved to `deployment/k8s/` | Better organization |
| 2 | Single `task build` for all environments | Separate `task k8s:build-web` task | `NEXT_PUBLIC_API_URL` must be baked in differently per environment |
