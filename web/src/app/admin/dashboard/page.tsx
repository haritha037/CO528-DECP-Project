'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsApi, UserStats, PostStats, JobStats, EventStats } from '@/lib/api/analyticsApi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<PostStats | null>(null);
  const [jobs, setJobs] = useState<JobStats | null>(null);
  const [events, setEvents] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role !== 'ADMIN') { router.push('/feed'); return; }
  }, [user, router]);

  useEffect(() => {
    Promise.all([
      analyticsApi.getUserStats(),
      analyticsApi.getPostStats(),
      analyticsApi.getJobStats(),
      analyticsApi.getEventStats(),
    ])
      .then(([u, p, j, e]) => {
        setUsers(u);
        setPosts(p);
        setJobs(j);
        setEvents(e);
      })
      .catch(() => setError('Failed to load analytics. Make sure all services are running.'))
      .finally(() => setLoading(false));
  }, []);

  const userRoleData = users ? [
    { name: 'Students', value: users.students },
    { name: 'Alumni',   value: users.alumni },
    { name: 'Admins',   value: users.admins },
  ] : [];

  const jobTypeData = jobs ? [
    { name: 'Full Time',   value: jobs.fullTime },
    { name: 'Part Time',   value: jobs.partTime },
    { name: 'Internship',  value: jobs.internship },
    { name: 'Contract',    value: jobs.contract },
  ] : [];

  const eventStatusData = events ? [
    { name: 'Upcoming',  value: events.upcoming },
    { name: 'Ongoing',   value: events.ongoing },
    { name: 'Completed', value: events.completed },
    { name: 'Cancelled', value: events.cancelled },
  ] : [];

  const engagementData = posts ? [
    { name: 'Posts',     value: posts.totalPosts },
    { name: 'Reactions', value: posts.totalReactions },
    { name: 'Comments',  value: posts.totalComments },
  ] : [];

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Platform-wide statistics</p>
          </div>

          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-24" />
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
          )}

          {!loading && !error && (
            <>
              {/* ── Top summary cards ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Users"  value={users?.totalUsers ?? 0}  sub={`${users?.profileComplete ?? 0} profiles complete`} />
                <StatCard label="Total Posts"  value={posts?.totalPosts ?? 0}  sub={`${posts?.totalReactions ?? 0} reactions`} />
                <StatCard label="Total Jobs"   value={jobs?.totalJobs ?? 0}    sub={`${jobs?.activeJobs ?? 0} active`} />
                <StatCard label="Total Events" value={events?.totalEvents ?? 0} sub={`${events?.totalRsvps ?? 0} RSVPs`} />
              </div>

              {/* ── Charts row 1 ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Users by role — pie */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Users by Role</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={userRoleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                        {userRoleData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Engagement bar chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Post Engagement</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={engagementData} barCategoryGap="30%">
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {engagementData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Charts row 2 ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Jobs by type — bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Jobs by Type</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={jobTypeData} barCategoryGap="30%">
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Events by status — pie */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Events by Status</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={eventStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {eventStatusData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Job status cards ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Active Jobs"   value={jobs?.activeJobs ?? 0} />
                <StatCard label="Closed Jobs"   value={jobs?.closedJobs ?? 0} />
                <StatCard label="Upcoming Events" value={events?.upcoming ?? 0} />
                <StatCard label="Total Comments" value={posts?.totalComments ?? 0} />
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
