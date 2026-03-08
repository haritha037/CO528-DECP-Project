'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import UserAvatar from '@/components/shared/UserAvatar';
import RoleBadge from '@/components/shared/RoleBadge';
import PostCard from '@/components/post/PostCard';
import { userApi, UserDTO } from '@/lib/api/userApi';
import { postApi, PostDTO } from '@/lib/api/postApi';
import { jobApi, JobDTO, JOB_TYPE_LABELS } from '@/lib/api/jobApi';
import { useAuth } from '@/contexts/AuthContext';

const typeBadgeColor: Record<string, string> = {
  FULL_TIME:  'bg-blue-100 text-blue-700',
  PART_TIME:  'bg-purple-100 text-purple-700',
  INTERNSHIP: 'bg-green-100 text-green-700',
  CONTRACT:   'bg-orange-100 text-orange-700',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const canPostJobs = user?.role === 'ALUMNI' || user?.role === 'ADMIN';

  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [jobs, setJobs] = useState<JobDTO[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'jobs'>('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [closingJobId, setClosingJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  useEffect(() => {
    userApi.getMyProfile()
      .then(async data => {
        if (!data.profileComplete) {
          router.replace('/profile/setup');
          return;
        }
        setProfile(data);
        const postsPage = await postApi.getPostsByUser(data.firebaseUid);
        setPosts(postsPage.content);

        if (data.role === 'ALUMNI' || data.role === 'ADMIN') {
          const jobsPage = await jobApi.getMyPosts();
          setJobs(jobsPage.content);
        }
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [router]);

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleCloseJob = async (jobId: string) => {
    if (!confirm('Mark this job as closed?')) return;
    setClosingJobId(jobId);
    try {
      const updated = await jobApi.closeJob(jobId);
      setJobs(prev => prev.map(j => j.id === jobId ? updated : j));
    } finally {
      setClosingJobId(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Delete this job posting? This cannot be undone.')) return;
    setDeletingJobId(jobId);
    try {
      await jobApi.deleteJob(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } finally {
      setDeletingJobId(null);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-4">
          {loading && <p className="text-center text-gray-400 mt-16">Loading profile…</p>}
          {error  && <p className="text-center text-red-500 mt-16">{error}</p>}

          {profile && (
            <>
              {/* Profile card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600" />
                <div className="px-6 pb-6">
                  <div className="flex items-end justify-between -mt-10 mb-4">
                    <UserAvatar
                      name={profile.name}
                      initials={profile.initials}
                      profilePictureUrl={profile.profilePictureUrl}
                      roleBadge={profile.roleBadge}
                      size="lg"
                    />
                    <Link
                      href="/profile/edit"
                      className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Edit Profile
                    </Link>
                  </div>

                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <RoleBadge role={profile.role as any} roleBadge={profile.roleBadge as any} />
                    {profile.department && (
                      <span className="text-sm text-gray-500">{profile.department}</span>
                    )}
                    {profile.graduationYear && (
                      <span className="text-sm text-gray-400">· Class of {profile.graduationYear}</span>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="mt-4 text-gray-700 text-sm leading-relaxed">{profile.bio}</p>
                  )}

                  <div className="mt-4 flex gap-4">
                    {profile.linkedinUrl && (
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline">LinkedIn</a>
                    )}
                    {profile.githubUrl && (
                      <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-gray-700 hover:underline">GitHub</a>
                    )}
                  </div>

                  <p className="mt-4 text-xs text-gray-400">{profile.email}</p>
                </div>
              </div>

              {/* Tabs — only for alumni/admin */}
              {canPostJobs ? (
                <>
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('posts')}
                      className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'posts'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Posts · {posts.length}
                    </button>
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'jobs'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Job Postings · {jobs.length}
                    </button>
                  </div>

                  {/* Posts tab */}
                  {activeTab === 'posts' && (
                    <div>
                      {posts.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
                          <p className="text-gray-400 text-sm">No posts yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {posts.map(post => (
                            <PostCard key={post.id} post={post} onDeleted={handlePostDeleted} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Jobs tab */}
                  {activeTab === 'jobs' && (
                    <div className="space-y-3">
                      <div className="flex justify-end">
                        <Link
                          href="/jobs/create"
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          + Post Opportunity
                        </Link>
                      </div>

                      {jobs.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
                          <p className="text-gray-400 text-sm">You haven't posted any jobs yet.</p>
                        </div>
                      ) : (
                        jobs.map(job => (
                          <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeColor[job.jobType] || 'bg-gray-100 text-gray-600'}`}>
                                    {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                                  </span>
                                  {job.status === 'CLOSED' && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">Closed</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
                                {job.location && (
                                  <p className="text-xs text-gray-400 mt-1">📍 {job.location}{job.remote ? ' · Remote' : ''}</p>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                              <Link
                                href={`/jobs/${job.id}`}
                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                View
                              </Link>
                              <Link
                                href={`/jobs/${job.id}/edit`}
                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                Edit
                              </Link>
                              {job.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleCloseJob(job.id)}
                                  disabled={closingJobId === job.id}
                                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                  {closingJobId === job.id ? 'Closing…' : 'Close'}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                disabled={deletingJobId === job.id}
                                className="px-3 py-1.5 text-xs border border-red-200 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors ml-auto"
                              >
                                {deletingJobId === job.id ? 'Deleting…' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Student — just posts, no tabs */
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Posts · {posts.length}
                  </h2>
                  {posts.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
                      <p className="text-gray-400 text-sm">No posts yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map(post => (
                        <PostCard key={post.id} post={post} onDeleted={handlePostDeleted} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
