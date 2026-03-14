output "registry_url" {
  description = "Artifact Registry URL prefix for tagging images"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/decp-repo"
}

output "cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.decp_cluster.name
}

output "cluster_location" {
  description = "GKE cluster location"
  value       = google_container_cluster.decp_cluster.location
}

output "kubectl_command" {
  description = "Command to configure kubectl for this cluster"
  value       = "gcloud container clusters get-credentials ${google_container_cluster.decp_cluster.name} --location=${google_container_cluster.decp_cluster.location} --project=${var.project_id}"
}
