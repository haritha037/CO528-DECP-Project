"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { jobApi, JobDTO, JOB_TYPE_LABELS } from "@/lib/api/jobApi";
import { useAuth } from "@/contexts/AuthContext";

const typeBadgeColor: Record<string, string> = {
  FULL_TIME: "bg-blue-100 text-blue-700",
  PART_TIME: "bg-purple-100 text-purple-700",
  INTERNSHIP: "bg-green-100 text-green-700",
  CONTRACT: "bg-orange-100 text-orange-700",
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [job, setJob] = useState<JobDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    jobApi
      .getJob(id)
      .then(setJob)
      .catch(() => setError("Job not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = job?.postedBy === user?.uid;
  const isAdmin = user?.role === "ADMIN";
  const canManage = isOwner || isAdmin;

  const handleClose = async () => {
    if (!confirm("Mark this job as closed?")) return;
    setClosing(true);
    try {
      const updated = await jobApi.closeJob(id);
      setJob(updated);
    } finally {
      setClosing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this job posting? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await jobApi.deleteJob(id);
      router.push("/jobs");
    } finally {
      setDeleting(false);
    }
  };

  const deadlineDays = job?.applicationDeadline
    ? Math.ceil(
        (new Date(job.applicationDeadline).getTime() - Date.now()) / 86400000,
      )
    : null;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-3xl mx-auto py-6 px-4">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors"
          >
            ← Back to Jobs
          </Link>

          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse space-y-4">
              <div className="h-5 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
            </div>
          )}

          {error && <p className="text-center text-red-500 py-16">{error}</p>}

          {job && (
            <div className="space-y-4">
              {/* Main card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {job.title}
                    </h1>
                    <p className="text-gray-600 mt-1 font-medium">
                      {job.company}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded-full ${typeBadgeColor[job.jobType] || "bg-gray-100 text-gray-600"}`}
                    >
                      {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                    </span>
                    {job.status === "CLOSED" && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-600">
                        Closed
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-4 py-4 border-y border-gray-100 mb-4">
                  {job.location && (
                    <div className="text-sm text-gray-600">
                      📍 <span className="font-medium">{job.location}</span>
                    </div>
                  )}
                  {job.remote && (
                    <div className="text-sm text-green-600">
                      🌐 <span className="font-medium">Remote</span>
                    </div>
                  )}
                  {job.salaryRange && (
                    <div className="text-sm text-gray-600">
                      💰 <span className="font-medium">{job.salaryRange}</span>
                    </div>
                  )}
                  {deadlineDays !== null && (
                    <div
                      className={`text-sm ${deadlineDays < 0 ? "text-red-500" : deadlineDays <= 7 ? "text-orange-500" : "text-gray-600"}`}
                    >
                      🗓{" "}
                      {deadlineDays < 0
                        ? "Deadline passed"
                        : `Closes in ${deadlineDays} day${deadlineDays !== 1 ? "s" : ""}`}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-4">
                  <h2 className="font-semibold text-gray-800 mb-2">
                    About this role
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>

                {/* Requirements */}
                {job.requirements && (
                  <div className="mb-6">
                    <h2 className="font-semibold text-gray-800 mb-2">
                      Requirements
                    </h2>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {job.requirements}
                    </p>
                  </div>
                )}

                {/* Apply button */}
                {job.status === "ACTIVE" && (
                  <a
                    href={job.applicationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full text-center py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Apply →
                  </a>
                )}
              </div>

              {/* Owner/Admin actions */}
              {canManage && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
                  {job.status === "ACTIVE" && (
                    <button
                      onClick={handleClose}
                      disabled={closing}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      {closing ? "Closing…" : "Mark as Closed"}
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 text-sm border border-red-200 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? "Deleting…" : "Delete Posting"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
