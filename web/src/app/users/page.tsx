'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import UserAvatar from '@/components/shared/UserAvatar';
import RoleBadge from '@/components/shared/RoleBadge';
import { userApi, UserDTO, Page } from '@/lib/api/userApi';

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'ALUMNI', label: 'Alumni' },
];

export default function UsersDirectoryPage() {
  const [result, setResult] = useState<Page<UserDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userApi.searchUsers({
        q: q || undefined,
        role: role || undefined,
        department: department || undefined,
        page,
        size: 20,
      });
      setResult(data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [q, role, department, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Directory</h1>

          {/* Filters */}
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by name or email…"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Department"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>

          {loading && <p className="text-center text-gray-400 mt-8">Loading…</p>}
          {error && <p className="text-center text-red-500 mt-8">{error}</p>}

          {result && !loading && (
            <>
              <p className="text-sm text-gray-500 mb-4">{result.totalElements} member{result.totalElements !== 1 ? 's' : ''} found</p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.content.map(user => (
                  <Link
                    key={user.id}
                    href={`/users/${user.firebaseUid}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-start gap-3 hover:shadow-md transition-shadow"
                  >
                    <UserAvatar
                      name={user.name}
                      initials={user.initials}
                      profilePictureUrl={user.profilePictureUrl}
                      roleBadge={user.roleBadge}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <RoleBadge role={user.role as any} roleBadge={user.roleBadge as any} />
                      {user.department && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{user.department}</p>
                      )}
                      {user.batch && (
                        <p className="text-xs text-gray-400">Batch {user.batch}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {result.content.length === 0 && (
                <p className="text-center text-gray-400 mt-8">No users found.</p>
              )}

              {/* Pagination */}
              {result.totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {page + 1} of {result.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={result.last}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
