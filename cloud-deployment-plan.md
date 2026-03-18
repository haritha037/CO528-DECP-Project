# Cloud Deployment Plan — GCP/GKE
> Role: Senior DevOps Engineer guiding a learner through production cloud deployment.

---

## What We're Doing and Why

Your app currently runs on a local Kind cluster — a Kubernetes cluster inside a Docker container on your laptop. That's great for learning, but it's not accessible to anyone else unless they're on your network.

The goal is to deploy the same app to **Google Kubernetes Engine (GKE)** — a managed Kubernetes service on Google Cloud. "Managed" means Google handles the underlying VMs, the Kubernetes control plane, OS updates, and cluster health. You just deploy your workloads.

The k8s manifests you already wrote for Kind will work almost unchanged. The main differences are:

| Aspect | Kind (local) | GKE (cloud) |
|---|---|---|
| Images | Loaded directly from Docker | Pulled from a container registry |
| External access | Port mapped from Docker | Load balancer with a real public IP |
| imagePullPolicy | `Never` | `IfNotPresent` |
| NEXT_PUBLIC_API_URL | Hardcoded IP | Relative URL (works everywhere) |
| CORS_ALLOWED_ORIGINS | Hardcoded IP | Your domain |
| Domain | None | Free domain + DNS |
| SSL/TLS | None | Free via Let's Encrypt + cert-manager |
| Infrastructure setup | Manual kind commands | Terraform (Infrastructure as Code) |

---

## Architecture Overview

```
BROWSER
    │
    │  https://decp.haritha.xyz
    ▼
┌──────────────────────────────────────────┐
│  Cloudflare (DNS + CDN + DDoS)           │
│  Resolves decp.haritha.xyz → GKE IP      │
└──────────────────────┬───────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  GKE CLUSTER  (provisioned by Terraform)                 │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  NGINX Ingress (GCP LoadBalancer → public IP)      │  │
│  │  TLS terminated here (cert from Let's Encrypt)     │  │
│  │                                                    │  │
│  │  /api/*  ─────────────► api-gateway:8080           │  │
│  │  /*      ─────────────► web:3000                   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  web → api-gateway → user/post/job/event/notification    │
│                              ↕                           │
│                          rabbitmq                        │
│                                                          │
│  Images pulled from ──► Google Artifact Registry (GAR)  │
│  Databases ───────────► Neon PostgreSQL (already cloud)  │
│  Auth/Notifications ──► Firebase (already cloud)        │
└──────────────────────────────────────────────────────────┘
```

---

## Domain

You already own `haritha.xyz` (registered on GoDaddy, DNS managed by Cloudflare). We'll use a subdomain of it for this project — e.g. `decp.haritha.xyz`. This is the cleanest setup: you own the domain, Cloudflare handles DNS, CDN, and DDoS protection, and cert-manager handles SSL automatically.

When you're ready to move to a dedicated domain later, you just update one DNS record in Cloudflare and the CORS config in the ConfigMap — nothing else changes.

---

## What is Terraform and Why Use It?

Right now, to set up GCP infrastructure you'd manually run `gcloud` commands. If you wanted to recreate everything (new project, new region, teammate's machine), you'd have to remember and re-run all those commands.

**Terraform** solves this with **Infrastructure as Code (IaC)** — you write `.tf` files describing the desired infrastructure, and Terraform creates it. Think of it like `kubectl apply` but for cloud resources (VMs, clusters, registries, networks).

```
You write:  terraform/main.tf  ← describes the GKE cluster and Artifact Registry
You run:    terraform apply     ← Terraform creates everything on GCP
To cleanup: terraform destroy   ← Terraform deletes everything (stop burning credits!)
```

Key commands:
- `terraform init` — download providers (like `npm install`)
- `terraform plan` — preview what will be created/changed (dry run)
- `terraform apply` — actually create the resources
- `terraform destroy` — delete all resources Terraform manages

This is **industry standard** — companies use Terraform to manage their entire cloud infrastructure in Git. What you learn here directly applies to real jobs.

---

## Step-by-Step Plan

---

### Step 1 — Install gcloud and Authenticate

**Actions:**
1. Finish installing gcloud (already in progress)
2. Log in:
   ```bash
   gcloud auth login
   gcloud auth application-default login   # ← Terraform needs this too
   ```
3. Create GCP project:
   ```bash
   gcloud projects create decp-project --name="DECP Project"
   gcloud config set project decp-project
   ```
4. Link billing in the GCP Console (Billing → Link project)

---

### Step 2 — Install Terraform

```bash
# On Ubuntu/Debian
sudo apt install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | \
  sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
  https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
  sudo tee /etc/apt/sources.list.d/hashicorp.list

sudo apt update && sudo apt install terraform

terraform --version
```

---

### Step 3 — Write Terraform Configuration

Create a `terraform/` folder at the project root with these files:

**`terraform/versions.tf`** — declares providers
```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
```

**`terraform/variables.tf`** — input parameters
```hcl
variable "project_id" { default = "decp-project" }
variable "region"     { default = "asia-south1" }  # Mumbai
```

**`terraform/main.tf`** — the actual resources:
```hcl
# Enable required APIs
resource "google_project_service" "container_api" {
  service = "container.googleapis.com"
}
resource "google_project_service" "artifact_api" {
  service = "artifactregistry.googleapis.com"
}

# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "decp_repo" {
  repository_id = "decp-repo"
  format        = "DOCKER"
  location      = var.region
  depends_on    = [google_project_service.artifact_api]
}

# GKE Autopilot cluster
resource "google_container_cluster" "decp_cluster" {
  name     = "decp-cluster"
  location = var.region
  enable_autopilot = true
  depends_on = [google_project_service.container_api]
}
```

**`terraform/outputs.tf`** — values to print after apply:
```hcl
output "registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/decp-repo"
}
output "cluster_name" {
  value = google_container_cluster.decp_cluster.name
}
```

**Run it:**
```bash
cd terraform
terraform init      # download google provider
terraform plan      # preview what will be created
terraform apply     # create GKE cluster + Artifact Registry (~5 min)
```

**What you get:**
- A GKE Autopilot cluster named `decp-cluster` in Mumbai
- An Artifact Registry repository at `asia-south1-docker.pkg.dev/decp-project/decp-repo`

---

### Step 4 — Configure kubectl for GKE

```bash
gcloud container clusters get-credentials decp-cluster \
  --location=asia-south1 \
  --project=decp-project

kubectl get nodes   # verify connection to GKE
```

This updates `~/.kube/config` so `kubectl` now talks to GKE. You can switch back to Kind anytime:
```bash
kubectl config use-context kind-decp     # switch to local Kind
kubectl config use-context gke_decp-project_asia-south1_decp-cluster  # switch to GKE
```

---

### Step 5 — Point Your Domain to GKE (Cloudflare)

You already have `haritha.xyz` managed in Cloudflare. Once you have the GKE external IP (from Step 9), add a DNS record in Cloudflare:

```
Type:  A
Name:  decp          ← gives you decp.haritha.xyz
Value: <GKE external IP>
Proxy: ON (orange cloud) ← enables CDN + DDoS protection
```

That's it. No registration, no waiting. `https://decp.haritha.xyz` will route to your cluster.

For cert-manager (Step 10) to issue SSL certificates, it needs to create a temporary DNS record to prove you own the domain. You'll create a **Cloudflare API token** with "Zone:DNS:Edit" permission and store it as a k8s Secret.

---

### Step 6 — Configure Docker to Push to Artifact Registry

```bash
gcloud auth configure-docker asia-south1-docker.pkg.dev
```

Your image names for GKE will be:
```
asia-south1-docker.pkg.dev/decp-project/decp-repo/decp-api-gateway:latest
asia-south1-docker.pkg.dev/decp-project/decp-repo/decp-web:latest
... etc
```

Add a `gke:push` task to the Taskfile that tags and pushes all 7 images.

---

### Step 7 — Fix NEXT_PUBLIC_API_URL (Build Once, Run Anywhere)

**The problem:**
`NEXT_PUBLIC_API_URL` is baked into the JS bundle. Every environment (Kind, GKE, DuckDNS, eu.org) has a different URL. You'd have to rebuild the image each time.

**The solution — relative URL:**
Set `NEXT_PUBLIC_API_URL` to empty string. API calls become relative: `/api/users` instead of `http://something/api/users`. The browser resolves them against the current page's origin — whatever domain the user typed in the address bar. Works everywhere.

**Fix needed in apiClient:**
```ts
// Current — empty string falls back to localhost (|| treats "" as falsy)
baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Fixed — ?? only falls back for null/undefined, not ""
baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
```

Update `web/.env.k8s`: `NEXT_PUBLIC_API_URL=` (empty)

Rebuild web once — same image works for DuckDNS, eu.org, any future domain.

---

### Step 8 — Create GKE-Specific K8s Manifests

Create `deployment/k8s-gke/` — mirrors `deployment/k8s/` with these changes:

1. **Image names** → full Artifact Registry path
2. **imagePullPolicy** → `IfNotPresent` (pull from registry, not local Docker)
3. **configmap.yaml** → `CORS_ALLOWED_ORIGINS: "https://decp.haritha.xyz"`
4. **ingress.yaml** → hostname `decp.haritha.xyz` + TLS block

The folder structure mirrors `deployment/k8s/` exactly — same service subfolders, same filenames.

---

### Step 9 — Install NGINX Ingress on GKE

```bash
# Use cloud provider (not kind provider)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Wait for a real public IP to be assigned
kubectl get svc -n ingress-nginx -w
# EXTERNAL-IP will change from <pending> to an actual IP like 34.93.x.x
```

This creates a **GCP Load Balancer** — a Google-managed reverse proxy that receives traffic on a public IP and forwards it to the NGINX ingress inside your cluster.

Once you have the IP:
- Point DuckDNS to it (via their web dashboard or API)
- Add Cloudflare A record once eu.org is approved

---

### Step 10 — Set Up Free SSL with cert-manager + Let's Encrypt

**cert-manager** is a Kubernetes add-on that automates SSL certificate management. It talks to Let's Encrypt (free CA trusted by all browsers), requests a certificate, stores it as a k8s Secret, and auto-renews before expiry.

**Install cert-manager:**
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
```

Since your domain is on Cloudflare, cert-manager will use the **DNS-01 challenge via Cloudflare API**:
1. cert-manager creates a temporary `_acme-challenge.decp.haritha.xyz` TXT record via the Cloudflare API
2. Let's Encrypt reads that record to verify you own the domain
3. Certificate is issued and stored as a k8s Secret
4. cert-manager auto-renews it before expiry

You need a Cloudflare API token with `Zone:DNS:Edit` permission, stored as a k8s Secret.

---

### Step 11 — Deploy and Verify

```bash
task gke:build-web    # build web with NEXT_PUBLIC_API_URL=""
task gke:push         # push all 7 images to Artifact Registry
task gke:deploy       # apply all k8s-gke manifests
task gke:status       # verify all pods Running
```

Access at `https://decp.haritha.xyz`.

---

### Step 12 — Add Taskfile Tasks for GKE

| Task | Action |
|---|---|
| `task gke:push` | Tag all images with GAR path and push |
| `task gke:deploy` | Apply all `k8s-gke/` manifests in order |
| `task gke:status` | Show pods and services |
| `task gke:destroy` | Run `terraform destroy` — deletes cluster (saves credits) |

---

## Files to Create/Modify

| File | Action |
|---|---|
| `terraform/versions.tf` | Provider config |
| `terraform/variables.tf` | project_id, region |
| `terraform/main.tf` | GKE cluster + Artifact Registry resources |
| `terraform/outputs.tf` | Registry URL, cluster name |
| `web/src/lib/api/apiClient.ts` | Fix `??` instead of `\|\|` |
| `web/.env.k8s` | Set `NEXT_PUBLIC_API_URL=` (empty) |
| `deployment/k8s-gke/` | New folder — GKE-specific manifests |
| `deployment/k8s-gke/configmap.yaml` | Real domain for CORS |
| `deployment/k8s-gke/*/deployment.yaml` | GAR image names + `IfNotPresent` |
| `deployment/k8s-gke/ingress.yaml` | Hostname + TLS |
| `deployment/k8s-gke/cluster-issuer.yaml` | cert-manager Let's Encrypt config |
| `Taskfile.yml` | Add `gke:*` tasks |

---

## Things You Will Learn Along the Way

- **Terraform / IaC**: Declare infrastructure in code, version it in Git, reproduce it anytime
- **Artifact Registry**: Why cloud clusters can't pull local Docker images
- **GKE Autopilot**: How managed Kubernetes works, pay-per-pod model
- **Load Balancer**: How GKE gets a public IP via GCP networking
- **Relative URLs in SPAs**: Why `??` vs `||` matters for empty strings
- **DNS**: How a domain name resolves to an IP, A records, subdomains
- **Cloudflare Proxy mode**: What the orange cloud does (CDN, DDoS, hides real IP)
- **cert-manager + Let's Encrypt**: Automated SSL certificate lifecycle in Kubernetes
- **DNS-01 challenge**: How Let's Encrypt proves domain ownership via a temporary DNS record

---

## Cost Estimate

| Resource | Cost |
|---|---|
| GKE Autopilot (~8 pods) | ~$1–2/day |
| GCP Load Balancer | ~$0.60/day |
| Artifact Registry (~2GB) | ~$0.20/month |
| Domain (haritha.xyz — already owned) | $0 additional |
| Cloudflare DNS | Free |
| SSL (Let's Encrypt) | Free |
| **Total** | **~$2–3/day** |

With $300 free credit → ~3–4 months of runway.
**Run `task gke:destroy` when not using the cluster.** Recreating with Terraform takes ~5 min.
