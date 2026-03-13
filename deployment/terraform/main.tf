# Enable required GCP APIs
resource "google_project_service" "container_api" {
  service            = "container.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifact_api" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

# Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "decp_repo" {
  repository_id = "decp-repo"
  format        = "DOCKER"
  location      = var.region
  description   = "DECP microservices Docker images"
  depends_on    = [google_project_service.artifact_api]
}

# GKE Autopilot cluster
resource "google_container_cluster" "decp_cluster" {
  name     = "decp-cluster"
  location = var.region

  enable_autopilot = true

  depends_on = [google_project_service.container_api]
}
