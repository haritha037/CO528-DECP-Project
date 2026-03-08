'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { jobApi, CreateJobRequest } from '@/lib/api/jobApi';
import { useAuth } from '@/contexts/AuthContext';

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState<CreateJobRequest>({
    title: '',
    company: '',
    description: '',
    jobType: 'FULL_TIME',
    location: '',
    remote: false,
    salaryRange: '',
    requirements: '',
    applicationDeadline: '',
    applicationLink: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    jobApi.getJob(id)
      .then(job => {
        // Only owner or admin can edit
        if (job.postedBy !== user?.uid && user?.role !== 'ADMIN') {
          router.replace('/jobs');
          return;
        }
        setForm({
          title: job.title,
          company: job.company,
          description: job.description,
          jobType: job.jobType,
          location: job.location ?? '',
          remote: job.remote,
          salaryRange: job.salaryRange ?? '',
          requirements: job.requirements ?? '',
          applicationDeadline: job.applicationDeadline
            ? job.applicationDeadline.split('T')[0]
            : '',
          applicationLink: job.applicationLink,
        });
      })
      .catch(() => setError('Job not found.'))
      .finally(() => setLoading(false));
  }, [id, user, router]);

  const set = (field: keyof CreateJobRequest, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await jobApi.updateJob(id, {
        ...form,
        applicationDeadline: form.applicationDeadline || undefined,
      });
      router.push('/profile');
    } catch {
      setError('Failed to update job posting. Please check all required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-2xl mx-auto py-6 px-4">
          <Link href="/profile" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors">
            ← Back to Profile
          </Link>

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse space-y-4">
              <div className="h-5 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-16">{error}</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Job Posting</h1>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                  <input
                    required
                    value={form.company}
                    onChange={e => set('company', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* Type + Location row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Type *</label>
                    <select
                      value={form.jobType}
                      onChange={e => set('jobType', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                    >
                      <option value="FULL_TIME">Full-Time</option>
                      <option value="PART_TIME">Part-Time</option>
                      <option value="INTERNSHIP">Internship</option>
                      <option value="CONTRACT">Contract</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      value={form.location}
                      onChange={e => set('location', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                {/* Remote toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.remote}
                    onChange={e => set('remote', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">Remote / Work from home</span>
                </label>

                {/* Salary + Deadline row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                    <input
                      value={form.salaryRange}
                      onChange={e => set('salaryRange', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                    <input
                      type="date"
                      value={form.applicationDeadline}
                      onChange={e => set('applicationDeadline', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    required
                    rows={5}
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                  />
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                  <textarea
                    rows={3}
                    value={form.requirements}
                    onChange={e => set('requirements', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                  />
                </div>

                {/* Application link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Link *</label>
                  <input
                    required
                    type="url"
                    value={form.applicationLink}
                    onChange={e => set('applicationLink', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <Link
                    href="/profile"
                    className="px-5 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
