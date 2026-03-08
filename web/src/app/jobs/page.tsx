'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { jobApi, JobDTO, JOB_TYPE_LABELS } from '@/lib/api/jobApi';
import { useAuth } from '@/contexts/AuthContext';

const TYPE_OPTIONS = ['', 'FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'];

const typeBadgeColor: Record<string, string> = {
  FULL_TIME:  'bg-blue-100 text-blue-700',
  PART_TIME:  'bg-purple-100 text-purple-700',
  INTERNSHIP: 'bg-green-100 text-green-700',
  CONTRACT:   'bg-orange-100 text-orange-700',
};

export default function JobsPage() {
  const { user } = useAuth();
  const canPost = user?.role === 'ALUMNI' || user?.role === 'ADMIN';

  const [jobs, setJobs] = useState<JobDTO[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [remote, setRemote] = useState<boolean | undefined>(undefined);

  const loadJobs = useCallback(async (pageNum: number, replace = false) => {
    if (pageNum === 0) setLoading(true); else setLoadingMore(true);
    try {
      const data = await jobApi.searchJobs({
        status: 'ACTIVE',
        type: type || undefined,
        remote: remote,
        search: search || undefined,
        page: pageNum,
        size: 10,
      });
      setJobs(prev => replace ? data.content : [...prev, ...data.content]);
      setHasMore(!data.last);
      setPage(pageNum);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, type, remote]);

  // Reload from page 0 whenever filters change
  useEffect(() => {
    loadJobs(0, true);
  }, [loadJobs]);

  const timeAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const deadlineLabel = (dateStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (diff < 0) return <span className="text-red-500 text-xs">Deadline passed</span>;
    if (diff <= 7) return <span className="text-orange-500 text-xs">Closes in {diff}d</span>;
    return <span className="text-gray-400 text-xs">Deadline: {d.toLocaleDateString()}</span>;
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-3xl mx-auto py-6 px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
              <p className="text-sm text-gray-500 mt-0.5">Opportunities posted by alumni and the department</p>
            </div>
            {canPost && (
              <Link
                href="/jobs/create"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Post Opportunity
              </Link>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by title or company…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-48 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
            />
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">All Types</option>
              {TYPE_OPTIONS.filter(Boolean).map(t => (
                <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <select
              value={remote === undefined ? '' : String(remote)}
              onChange={e => setRemote(e.target.value === '' ? undefined : e.target.value === 'true')}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">Remote & On-site</option>
              <option value="true">Remote Only</option>
              <option value="false">On-site Only</option>
            </select>
          </div>

          {/* Job list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">💼</p>
              <p className="text-gray-500 font-medium">No job postings found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-gray-900 truncate">{job.title}</h2>
                        <p className="text-sm text-gray-600 mt-0.5">{job.company}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${typeBadgeColor[job.jobType] || 'bg-gray-100 text-gray-600'}`}>
                        {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {job.location && (
                        <span className="text-xs text-gray-500">📍 {job.location}</span>
                      )}
                      {job.remote && (
                        <span className="text-xs text-green-600 font-medium">🌐 Remote</span>
                      )}
                      {job.salaryRange && (
                        <span className="text-xs text-gray-500">💰 {job.salaryRange}</span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">{timeAgo(job.createdAt)}</span>
                    </div>

                    {job.applicationDeadline && (
                      <div className="mt-2">{deadlineLabel(job.applicationDeadline)}</div>
                    )}
                  </div>
                </Link>
              ))}

              {/* Load More */}
              {hasMore && (
                <button
                  onClick={() => loadJobs(page + 1)}
                  disabled={loadingMore}
                  className="w-full py-3 text-sm text-blue-600 font-medium border border-blue-200 rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-colors"
                >
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              )}
              {!hasMore && jobs.length > 0 && (
                <p className="text-center text-sm text-gray-400 py-2">All postings loaded</p>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
