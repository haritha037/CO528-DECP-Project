'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { userApi } from '@/lib/api/userApi';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    department: '',
    graduationYear: '',
    linkedinUrl: '',
    githubUrl: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      // 1. Change password if provided
      if (formData.password) {
        const { authService } = await import('@/lib/auth');
        await authService.updatePassword(formData.password);
      }

      // 2. Upload profile picture if selected
      let profilePictureUrl: string | undefined;
      if (profilePictureFile) {
        const { storageService } = await import('@/lib/storage');
        const path = `profiles/${Date.now()}_${profilePictureFile.name}`;
        profilePictureUrl = await storageService.uploadFile(path, profilePictureFile);
      }

      // 3. Update profile
      await userApi.updateProfile({
        name: formData.name,
        bio: formData.bio || undefined,
        department: formData.department || undefined,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
        profilePictureUrl,
        linkedinUrl: formData.linkedinUrl || undefined,
        githubUrl: formData.githubUrl || undefined,
      });

      // 4. Mark profile complete
      await userApi.completeProfile();

      router.push('/feed');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center px-4 py-12 md:px-8 transition-colors duration-200">
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-8 md:p-10 card-hover transition-colors duration-200">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Complete Your Profile</h1>
          <p className="text-base text-gray-500 dark:text-gray-400 mb-8">Welcome to DECP! Fill in your details to get started.</p>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-in fade-in slide-in-from-top-2">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile picture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Picture</label>
              <input type="file" accept="image/*"
                onChange={e => setProfilePictureFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/40 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/60 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="relative">
                <input
                  type="number" name="graduationYear" id="graduationYear" value={formData.graduationYear} onChange={handleChange} min="1990" max="2040"
                  className="peer w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 placeholder-transparent hover:border-gray-300 dark:hover:border-gray-500"
                  placeholder="Graduation Year"
                />
                <label htmlFor="graduationYear" className="absolute left-4 top-2 text-xs font-medium text-gray-500 dark:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all duration-200 cursor-text">
                  Graduation Year
                </label>
              </div>
            </div>

            <div className="relative">
              <textarea
                name="bio" id="bio" rows={3} value={formData.bio} onChange={handleChange}
                className="peer w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 placeholder-transparent"
                placeholder="Tell the department about yourself…"
              />
              <label htmlFor="bio" className="absolute left-4 top-2 text-xs font-medium text-gray-500 dark:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all duration-200 cursor-text">
                Bio
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <input
                  type="url" name="linkedinUrl" id="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange}
                  className="peer w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 placeholder-transparent hover:border-gray-300 dark:hover:border-gray-500"
                  placeholder="LinkedIn URL"
                />
                <label htmlFor="linkedinUrl" className="absolute left-4 top-2 text-xs font-medium text-gray-500 dark:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all duration-200 cursor-text">
                  LinkedIn URL
                </label>
              </div>
              <div className="relative">
                <input
                  type="url" name="githubUrl" id="githubUrl" value={formData.githubUrl} onChange={handleChange}
                  className="peer w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 placeholder-transparent hover:border-gray-300 dark:hover:border-gray-500"
                  placeholder="GitHub URL"
                />
                <label htmlFor="githubUrl" className="absolute left-4 top-2 text-xs font-medium text-gray-500 dark:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all duration-200 cursor-text">
                  GitHub URL
                </label>
              </div>
            </div>

            {/* Password change */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-8 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Change Password <span className="text-gray-400 dark:text-gray-500 font-normal text-sm ml-2">(optional)</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <input
                    type="password" name="password" id="password" value={formData.password} onChange={handleChange} minLength={6}
                    className="peer w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 placeholder-transparent hover:border-gray-300 dark:hover:border-gray-500"
                    placeholder="New Password"
                  />
                  <label htmlFor="password" className="absolute left-4 top-2 text-xs font-medium text-gray-500 dark:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all duration-200 cursor-text">
                    New Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    className="peer w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 placeholder-transparent hover:border-gray-300 dark:hover:border-gray-500"
                    placeholder="Confirm Password"
                  />
                  <label htmlFor="confirmPassword" className="absolute left-4 top-2 text-xs font-medium text-gray-500 dark:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all duration-200 cursor-text">
                    Confirm Password
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto py-4 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 focus:ring-4 focus:ring-blue-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 button-press"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save & Continue'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
