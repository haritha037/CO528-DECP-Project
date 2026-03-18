'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import UserAvatar from '@/components/shared/UserAvatar';
import RoleBadge from '@/components/shared/RoleBadge';
import { userApi, UserDTO, Page } from '@/lib/api/userApi';

type Tab = 'list' | 'create';

export default function AdminUsersPage() {
  const [tab, setTab] = useState<Tab>('list');

  // ── User list ──────────────────────────────────────────────────────────────
  const [result, setResult] = useState<Page<UserDTO> | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [page, setPage] = useState(0);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const data = await userApi.getAllUsers(page, 20);
      setResult(data);
    } catch {
      setListError('Failed to load users.');
    } finally {
      setListLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (uid: string, newRole: string) => {
    setChangingRole(uid);
    try {
      await userApi.changeUserRole(uid, newRole);
      await fetchUsers();
    } catch {
      alert('Failed to change role.');
    } finally {
      setChangingRole(null);
    }
  };

  // ── Create user form ───────────────────────────────────────────────────────
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'STUDENT',
    department: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreateLoading(true);
    try {
      await userApi.registerUser(formData);
      setCreateSuccess(`User ${formData.email} registered as ${formData.role}.`);
      setFormData({ email: '', password: '', name: '', role: 'STUDENT', department: '' });
      // Refresh list
      setPage(0);
      setTab('list');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setCreateError(err.response?.data?.message || err.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Users</h1>
            <button
              onClick={() => setTab(tab === 'create' ? 'list' : 'create')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {tab === 'create' ? 'View All Users' : '+ Add User'}
            </button>
          </div>

          {/* ── Create User Form ── */}
          {tab === 'create' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-8 mb-6 card-hover animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors duration-200">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create New User</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Register a new user in Firebase and the database. They will use this email and temporary password to sign in.
              </p>

              {createError && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-red-700 font-medium">{createError}</p>
                </div>
              )}
              {createSuccess && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-green-700 font-medium">{createSuccess}</p>
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <input
                      type="email" name="email" id="email" required value={formData.email} onChange={handleChange}
                      className="peer w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 placeholder-transparent hover:border-gray-300 dark:hover:border-gray-500"
                      placeholder="Email *"
                    />
                    <label htmlFor="email" className="absolute left-4 top-2 text-xs font-medium text-gray-500 dark:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all duration-200 cursor-text">
                      Email *
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="password" name="password" id="password" required minLength={6} value={formData.password} onChange={handleChange}
                      className="peer w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 placeholder-transparent hover:border-gray-300 dark:hover:border-gray-500"
                      placeholder="Temporary Password *"
                    />
                    <label htmlFor="password" className="absolute left-4 top-2 text-xs font-medium text-gray-500 dark:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all duration-200 cursor-text">
                      Temporary Password *
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <input
                      type="text" name="name" id="name" required value={formData.name} onChange={handleChange}
                      className="peer w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 placeholder-transparent hover:border-gray-300 dark:hover:border-gray-500"
                      placeholder="Full Name *"
                    />
                    <label htmlFor="name" className="absolute left-4 top-2 text-xs font-medium text-gray-500 dark:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all duration-200 cursor-text">
                      Full Name *
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text" name="department" id="department" value={formData.department} onChange={handleChange}
                      className="peer w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 placeholder-transparent hover:border-gray-300 dark:hover:border-gray-500"
                      placeholder="Department"
                    />
                    <label htmlFor="department" className="absolute left-4 top-2 text-xs font-medium text-gray-500 dark:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all duration-200 cursor-text">
                      Department
                    </label>
                  </div>
                </div>
                <div className="max-w-xs relative">
                  <select name="role" id="role" value={formData.role} onChange={handleChange}
                    className="peer w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none">
                    <option value="STUDENT">Student</option>
                    <option value="ALUMNI">Alumni</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <label htmlFor="role" className="absolute left-4 top-2 text-xs font-medium text-gray-500 dark:text-gray-400 peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all duration-200">
                    Role
                  </label>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={createLoading}
                    className="w-full md:w-auto py-3 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 focus:ring-4 focus:ring-blue-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 button-press">
                    {createLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── User List ── */}
          {tab === 'list' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
              {listLoading && <p className="text-center text-gray-400 py-12">Loading…</p>}
              {listError && <p className="text-center text-red-500 py-12">{listError}</p>}

              {result && !listLoading && (
                <>
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{result.totalElements} user{result.totalElements !== 1 ? 's' : ''} total</p>
                  </div>

                  <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Change Role</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                      {result.content.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                name={user.name}
                                initials={user.initials}
                                profilePictureUrl={user.profilePictureUrl}
                                roleBadge={user.roleBadge}
                                size="sm"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                                <p className="text-xs text-gray-400">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{user.department ?? '—'}</td>
                          <td className="px-6 py-4">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <RoleBadge role={user.role as any} roleBadge={user.roleBadge as any} />
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={user.role}
                              disabled={changingRole === user.firebaseUid}
                              onChange={e => handleRoleChange(user.firebaseUid, e.target.value)}
                              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            >
                              <option value="STUDENT">Student</option>
                              <option value="ALUMNI">Alumni</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {result.content.length === 0 && (
                    <p className="text-center text-gray-400 py-12">No users found.</p>
                  )}

                  {result.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                      <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Page {page + 1} of {result.totalPages}</span>
                      <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={result.last}
                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
