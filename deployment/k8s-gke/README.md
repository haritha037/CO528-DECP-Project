# GKE Deployment — DECP Project

Live URL: **https://decp.haritha.xyz**

## Prerequisites

- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated
- [kubectl](https://kubernetes.io/docs/tasks/tools/) installed
- [Terraform](https://developer.hashicorp.com/terraform/install) installed
- [kind](https://kind.sigs.k8s.io/) and [Docker](https://www.docker.com/) installed (for building images)
- [Task](https://taskfile.dev) installed (`task` command)
- GCP project `decp-project` with billing enabled

---

## First-Time Setup (Full Deploy from Scratch)

### 1. Authenticate with GCP

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project decp-project
gcloud auth configure-docker asia-south1-docker.pkg.dev
```

### 2. Provision GCP Infrastructure (Terraform)

```bash
cd deployment/terraform
terraform init
terraform apply
cd ../..
```

This creates:
- GKE Autopilot cluster (`decp-cluster`, region `asia-south1`)
- Artifact Registry repository (`decp-repo`)

### 3. Connect kubectl to the Cluster

```bash
gcloud container clusters get-credentials decp-cluster --region asia-south1 --project decp-project
```

> If you get `gke-gcloud-auth-plugin not found`, run:
> `gcloud components install gke-gcloud-auth-plugin`

### 4. Build Docker Images

```bash
task build          # builds all backend service images
task gke:build-web  # builds web image with empty NEXT_PUBLIC_API_URL (relative URLs)
```

### 5. Push Images to Artifact Registry

```bash
task gke:push
```

### 6. Apply Kubernetes Manifests

> Before running this, make sure `deployment/k8s-gke/secrets.yaml` exists with real credentials.
> See [Secrets](#secrets) section below.

```bash
task gke:deploy
```

### 7. Check Status

```bash
task gke:status
```

Wait until all pods show `1/1 Running` (Spring Boot services take ~2 minutes to start).

### 8. DNS

The Cloudflare A record for `decp.haritha.xyz` must point to the GKE Load Balancer IP.

GKE automatically provisions a GCP Load Balancer when the Ingress manifest is applied. To find its public IP:
```bash
kubectl get ingress -n decp
# Look at the ADDRESS column — that is the GCP Load Balancer's public IP
```

If the IP has changed (e.g. after cluster recreation), update the A record in the Cloudflare dashboard.

---

## Day-to-Day Operations

### View pod/service status
```bash
task gke:status
```

### Follow logs for a specific service
```bash
task logs -- api-gateway   # docker compose logs (local only)
kubectl logs -n decp deployment/api-gateway -f
```

### Redeploy after a code change
```bash
task build              # or task gke:build-web for frontend changes
task gke:push
kubectl rollout restart deployment/<service-name> -n decp
```

---

## Destroying the Cluster (Stop Billing)

```bash
task gke:destroy
```

This runs `terraform destroy` and deletes:
- The GKE Autopilot cluster (main cost)
- The Artifact Registry repository and all images

> The GCP project itself, billing account, and Cloudflare DNS record are **not** deleted.

---

## Recreating the Cluster After Destruction

Images are deleted from Artifact Registry when the repo is destroyed, so you need to push again.

```bash
# 1. Recreate infrastructure
cd deployment/terraform && terraform apply && cd ../..

# 2. Reconnect kubectl
gcloud container clusters get-credentials decp-cluster --region asia-south1 --project decp-project

# 3. Re-authenticate Docker
gcloud auth configure-docker asia-south1-docker.pkg.dev

# 4. Push images (build first if needed)
task build
task gke:build-web
task gke:push

# 5. Deploy
task gke:deploy

# 6. Check the new GCP Load Balancer IP and update Cloudflare if it changed
# (GKE provisions a new Load Balancer on each cluster creation — IP will be different)
kubectl get ingress -n decp  # ADDRESS column = Load Balancer public IP
```

> After recreation the Load Balancer IP will likely change — update the Cloudflare A record for `decp.haritha.xyz`.

---

## Should You Keep the Cluster Running for 3 Days?

**Recommendation: keep it running.**

GKE Autopilot costs approximately:
- ~$0.10/hr cluster management fee = **~$7 over 3 days**
- Pod resource charges on top (small for this workload)

Total estimated cost: **$10–15 for 3 days**

Destroying and recreating takes ~20–30 minutes and risks the Load Balancer IP changing (requiring a Cloudflare DNS update, which can take a few minutes to propagate). For a demo in 3 days, the cost of downtime and hassle outweighs the savings.

**If you do destroy**, allow at least 30 minutes before the demo for DNS propagation.

---

## Secrets

`deployment/k8s-gke/secrets.yaml` is **git-ignored** and must be created manually. It contains:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: decp
type: Opaque
stringData:
  SPRING_DATASOURCE_PASSWORD: "<your-neon-db-password>"
  RABBITMQ_DEFAULT_PASS: "<rabbitmq-password>"
  # ... other secrets
```

---

## Folder Structure

```
deployment/k8s-gke/
├── namespace.yaml
├── configmap.yaml          # non-sensitive config (URLs, CORS origin)
├── secrets.yaml            # sensitive config — NOT in git
├── ingress.yaml            # routes /api → api-gateway, / → web
├── rabbitmq/
├── api-gateway/
├── user-service/
├── post-service/
├── job-service/
├── event-service/
├── notification-service/
└── web/
```
