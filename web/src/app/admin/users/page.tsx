'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api/apiClient';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'STUDENT',
    department: ''
  });

  // Basic admin check (more robust check done on backend)
  if (user && user.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center text-red-600">
        You do not have permission to view this page.
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await apiClient.post('/api/users/register', formData);
      setSuccess(`User ${formData.email} registered successfully as ${formData.role}!`);
      
      // Reset form on success
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'STUDENT',
        department: ''
      });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Admin: Manage Users
            </h2>
          </div>
        </div>
        
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-8">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Create New User</h3>
              <p className="mt-1 text-sm text-gray-500">
                Register a new user in the platform. They will use the email and temporary password to log in.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-4 bg-red-50 p-4 rounded text-red-700 border border-red-200">{error}</div>
                )}
                {success && (
                  <div className="mb-4 bg-green-50 p-4 rounded text-green-700 border border-green-200">{success}</div>
                )}
                
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                    <input type="email" name="email" id="email" required value={formData.email} onChange={handleChange} 
                      className="mt-1 border focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2" />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Temporary Password</label>
                    <input type="password" name="password" id="password" required value={formData.password} onChange={handleChange} minLength={6}
                      className="mt-1 border focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2" />
                  </div>

                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange}
                      className="mt-1 border focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2" />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange}
                      className="mt-1 border block w-full py-2 px-3 border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                      <option value="STUDENT">Student</option>
                      <option value="ALUMNI">Alumni</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                    <input type="text" name="department" id="department" value={formData.department} onChange={handleChange}
                      className="mt-1 border focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2" />
                  </div>
                </div>

                <div className="pt-6">
                  <div className="flex justify-end">
                    <button type="submit" disabled={loading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      {loading ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* We would render a list of users here later, populated by GET /api/users */}
      </div>
    </ProtectedRoute>
  );
}
