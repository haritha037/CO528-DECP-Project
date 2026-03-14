# Phase 11: Cloud Deployment

## Status: COMPLETED

## Steps

- [x] Step 11.1 — Cloud provider setup (GCP / GKE Autopilot)
- [x] Step 11.2 — Push Docker images to Artifact Registry; create GKE-specific K8s manifests
- [x] Step 11.3 — Deploy to GKE and verify live demo URL

## What Was Done

### Infrastructure (Terraform)
- Terraform config created at `deployment/terraform/` to provision GCP resources
- Resources provisioned: Artifact Registry (`decp-repo`), GKE Autopilot cluster (`decp-cluster`), APIs enabled (`container.googleapis.com`, `artifactregistry.googleapis.com`)
- Region: `asia-south1` (Mumbai)

### Docker Images
- All 7 service images tagged and pushed to `asia-south1-docker.pkg.dev/decp-project/decp-repo/`
- Web image built with `NEXT_PUBLIC_API_URL=` (empty string) so API calls use relative URLs — works in any environment without rebuilding
- `apps.yml` updated with explicit `image:` fields to ensure consistent naming across docker compose builds

### Kubernetes Manifests (`deployment/k8s-gke/`)
- Copied from `deployment/k8s/` with GKE-specific changes:
  - `imagePullPolicy: Never` → `IfNotPresent` (images pulled from Artifact Registry)
  - All image names prefixed with full Artifact Registry path
  - `configmap.yaml`: `CORS_ALLOWED_ORIGINS` set to `https://decp.haritha.xyz`
  - `ingress.yaml`: hostname `decp.haritha.xyz` with TLS block and cert-manager annotation

### Domain & HTTPS
- Domain: `haritha.xyz` (purchased from GoDaddy, managed on Cloudflare)
- Subdomain: `decp.haritha.xyz` → Cloudflare A record pointing to GKE Load Balancer IP `35.200.243.225`
- HTTPS provided by Cloudflare proxy (Flexible SSL) — browser sees valid HTTPS without cert-manager
- cert-manager / Let's Encrypt: skipped — Cloudflare proxy provides sufficient HTTPS for this project

### Taskfile Tasks Added
- `gke:build-web` — builds web image with empty `NEXT_PUBLIC_API_URL`
- `gke:push` — tags and pushes all 7 images to Artifact Registry
- `gke:deploy` — applies all `deployment/k8s-gke/` manifests
- `gke:status` — shows pod and service status
- `gke:destroy` — tears down GKE cluster via Terraform

## Live URL
**https://decp.haritha.xyz**

## Issues & Resolutions

| # | Issue | Resolution |
|---|-------|------------|
| 1 | `NEXT_PUBLIC_API_URL` was baked as a host IP — broke when accessing from different devices/environments | Changed to empty string (`NEXT_PUBLIC_API_URL=`) + `??` operator in `apiClient.ts` so relative URLs are used |
| 2 | `task build` generated images named `co528-decp-project-*` instead of `decp-*` | Added `image:` field to all services in `apps.yml` to enforce consistent naming |
| 3 | `gke-gcloud-auth-plugin` not found after `kubectl get-credentials` | Installed via `gcloud components install gke-gcloud-auth-plugin` |
| 4 | Terraform `apply` failed with billing error | Linked billing account to GCP project via `gcloud billing projects link` |
| 5 | GKE Autopilot showed "No resources found" for nodes | Expected — Autopilot provisions nodes on-demand when pods are scheduled |
| 6 | cert-manager seemed necessary but site already showed HTTPS | Cloudflare proxy provides HTTPS automatically — cert-manager not needed |

## Decision Changes

| # | Original Plan | Change | Reason |
|---|---------------|--------|--------|
| 1 | Use GCR (Google Container Registry) | Switched to Artifact Registry | GCR is deprecated; Artifact Registry is the current standard |
| 2 | Terraform at project root | Moved to `deployment/terraform/` | Consistent with project convention of keeping deployment config under `deployment/` |
| 3 | Install cert-manager + Let's Encrypt for HTTPS | Skipped — using Cloudflare proxy instead | Cloudflare already provides valid HTTPS; cert-manager adds complexity without user-visible benefit |
| 4 | `NEXT_PUBLIC_API_URL` set per environment (hardcoded domain/IP) | Set to empty string — uses relative URLs | One image works in Kind, GKE, and any domain without rebuilding |
