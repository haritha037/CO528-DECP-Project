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
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Link
            href="/jobs"
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          >
            ← Back to Jobs
          </Link>

          {loading && (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 animate-pulse dark:border-gray-700 dark:bg-gray-800">
              <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-700/70" />
              <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-700/70" />
              <div className="h-3 w-5/6 rounded bg-gray-100 dark:bg-gray-700/70" />
            </div>
          )}

          {error && <p className="py-16 text-center text-red-500">{error}</p>}

          {job && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {job.title}
                    </h1>
                    <p className="mt-1 font-medium text-gray-600 dark:text-gray-300">
                      {job.company}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${typeBadgeColor[job.jobType] || "bg-gray-100 text-gray-600"}`}
                    >
                      {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                    </span>
                    {job.status === "CLOSED" && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600">
                        Closed
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-4 border-y border-gray-100 py-4 dark:border-gray-700">
                  {job.location && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Location:</span> {job.location}
                    </div>
                  )}
                  {job.remote && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      <span className="font-medium">Remote</span>
                    </div>
                  )}
                  {job.salaryRange && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Salary:</span> {job.salaryRange}
                    </div>
                  )}
                  {deadlineDays !== null && (
                    <div
                      className={`text-sm ${
                        deadlineDays < 0
                          ? "text-red-500"
                          : deadlineDays <= 7
                            ? "text-orange-500"
                            : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {deadlineDays < 0
                        ? "Deadline passed"
                        : `Closes in ${deadlineDays} day${deadlineDays !== 1 ? "s" : ""}`}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <h2 className="mb-2 font-semibold text-gray-800 dark:text-gray-100">
                    About this role
                  </h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                    {job.description}
                  </p>
                </div>

                {job.requirements && (
                  <div className="mb-6">
                    <h2 className="mb-2 font-semibold text-gray-800 dark:text-gray-100">
                      Requirements
                    </h2>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                      {job.requirements}
                    </p>
                  </div>
                )}

                {job.status === "ACTIVE" && (
                  <a
                    href={job.applicationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full rounded-xl bg-blue-600 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Apply →
                  </a>
                )}
              </div>

              {canManage && (
                <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  {job.status === "ACTIVE" && (
                    <button
                      onClick={handleClose}
                      disabled={closing}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      {closing ? "Closing..." : "Mark as Closed"}
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/70 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    {deleting ? "Deleting..." : "Delete Posting"}
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
