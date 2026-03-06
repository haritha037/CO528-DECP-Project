'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api/apiClient';

export default function ProfileSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    department: '',
    graduationYear: new Date().getFullYear().toString(),
    linkedinUrl: '',
    githubUrl: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // 1. Update password in Firebase if provided
      if (formData.password) {
        const { authService } = await import('@/lib/auth');
        await authService.updatePassword(formData.password);
      }

      // 2. Update profile in our backend
      await apiClient.put('/api/users/profile', {
        name: formData.name,
        bio: formData.bio,
        department: formData.department,
        graduationYear: parseInt(formData.graduationYear),
        linkedinUrl: formData.linkedinUrl,
        githubUrl: formData.githubUrl
      });

      // 3. Mark profile as complete
      await apiClient.put('/api/users/profile/complete');

      // 4. Redirect to feed
      router.push('/feed');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'An error occurred during profile setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Complete Your Profile
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Welcome to DECP! Please complete your profile to continue.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="mt-6 space-y-6 flex flex-col">
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="mt-1">
                      <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                    <div className="mt-1">
                      <input type="text" name="department" id="department" required value={formData.department} onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700">Graduation Year</label>
                    <div className="mt-1">
                      <input type="number" name="graduationYear" id="graduationYear" value={formData.graduationYear} onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
                    <div className="mt-1">
                      <textarea id="bio" name="bio" rows={3} value={formData.bio} onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2" />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                    <div className="mt-1">
                      <input type="url" name="linkedinUrl" id="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700">GitHub URL</label>
                    <div className="mt-1">
                      <input type="url" name="githubUrl" id="githubUrl" value={formData.githubUrl} onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 pb-4">Change Password (Optional)</h4>
                  <p className="text-sm text-gray-500 pb-4">You can set a new password, or leave blank to keep your temporary password.</p>
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
                      <div className="mt-1">
                        <input type="password" name="password" id="password" value={formData.password} onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                      <div className="mt-1">
                        <input type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 flex justify-end">
                  <button type="submit" disabled={loading}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    {loading ? 'Saving...' : 'Save Profile & Continue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
