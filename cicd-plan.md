# CI/CD Pipeline — DECP Project

## Branch Strategy

```
feature/* ──► main ──► (merge when ready to deploy) ──► prod
                ↑                                          ↑
           CI runs here                              CD runs here
       (build + test on every push)         (build → push → deploy to GKE)
```

- **main**: integration branch — all development PRs merge here
- **prod**: production branch — deployment happens only when you merge `main → prod`
- You control when to deploy: `git merge main prod && git push`

---

## GitHub Actions Workflows

### CI (`.github/workflows/ci.yml`)
**Triggers:** every push to `main`, every PR to `main` or `prod`

**Jobs (run in parallel):**
| Job | What it does |
|-----|-------------|
| `test-services` (×5) | Compiles and runs unit tests for each Spring Boot service |
| `lint-web` | Runs `npm ci && npm run lint` on the Next.js app |

If any job fails, the PR is blocked.

### CD (`.github/workflows/cd.yml`)
**Triggers:** push to `prod` (i.e., when you merge main → prod)

**Jobs (sequential):**
1. **`build-and-push`** — builds Docker images for all 7 services, tags with short commit SHA, pushes to Artifact Registry
2. **`deploy`** — applies k8s manifests and rolls out new images to GKE with `kubectl set image`

---

## One-Time Setup: GitHub Secrets

### Step 1 — Create GCP Service Account

```bash
# Create the service account
gcloud iam service-accounts create github-actions \
  --display-name "GitHub Actions" --project decp-project

# Grant Artifact Registry write access
gcloud projects add-iam-policy-binding decp-project \
  --member="serviceAccount:github-actions@decp-project.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Grant GKE deploy access
gcloud projects add-iam-policy-binding decp-project \
  --member="serviceAccount:github-actions@decp-project.iam.gserviceaccount.com" \
  --role="roles/container.developer"

# Download the key
gcloud iam service-accounts keys create /tmp/github-actions-key.json \
  --iam-account=github-actions@decp-project.iam.gserviceaccount.com

# Print it (you'll paste this as a GitHub secret)
cat /tmp/github-actions-key.json
```

### Step 2 — Add GitHub Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|---|---|
| `GCP_SA_KEY` | Full contents of `/tmp/github-actions-key.json` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From `web/.env.local` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | From `web/.env.local` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | From `web/.env.local` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | From `web/.env.local` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | From `web/.env.local` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From `web/.env.local` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From `web/.env.local` |

> Note: Firebase config values are public (they ship in every browser JS bundle), but storing them as secrets keeps the repo clean.

---

## Typical Developer Workflow

```bash
# 1. Work on a feature
git checkout -b feature/my-feature
# ... make changes ...
git push origin feature/my-feature

# 2. Open PR to main → CI runs automatically

# 3. Merge to main after review
git checkout main && git merge feature/my-feature && git push
# CI runs on main

# 4. Deploy when ready
git checkout prod && git merge main && git push
# CD runs: builds images, pushes to GAR, deploys to GKE
```

---

## Unit Tests

Minimal Mockito unit tests (no database, no Spring context) in:

| Service | Test file | Tests |
|---------|-----------|-------|
| user-service | `UserServiceImplTest.java` | `getMyProfile` happy path + not found |
| post-service | `PostServiceImplTest.java` | `getStats` counts |
| job-service | `JobServiceImplTest.java` | `getJob` happy path + not found + `getStats` |
| event-service | `EventServiceImplTest.java` | `deleteEvent` happy path + not found |

Run locally:
```bash
# From project root (requires Java 17, JAVA_HOME set)
cd services/user-service  && ./mvnw test
cd services/post-service  && ./mvnw test
cd services/job-service   && ./mvnw test
cd services/event-service && ./mvnw test
```

---

## Image Tagging

Images are tagged with both the short commit SHA and `latest`:
- `asia-south1-docker.pkg.dev/decp-project/decp-repo/decp-web:a1b2c3d4`
- `asia-south1-docker.pkg.dev/decp-project/decp-repo/decp-web:latest`

GKE deployments are updated to the SHA tag for traceability.

---

## Cleanup (Stop Billing)

```bash
task gke:destroy   # runs terraform destroy — deletes cluster + stops billing
```

To redeploy from scratch after destroying:
```bash
cd deployment/terraform && terraform apply   # recreates cluster + registry
task gke:deploy                              # reapplies all k8s manifests
# Then merge main → prod to trigger a fresh CD build
```
