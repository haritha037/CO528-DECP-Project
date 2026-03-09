'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { userApi, UpdateProfileRequest } from '@/lib/api/userApi';

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    department: '',
    batch: '',
    linkedinUrl: '',
    githubUrl: '',
    profilePictureUrl: '',
  });

  useEffect(() => {
    userApi.getMyProfile()
      .then(data => {
        setFormData({
          name: data.name ?? '',
          bio: data.bio ?? '',
          department: data.department ?? '',
          batch: data.batch ?? '',
          linkedinUrl: data.linkedinUrl ?? '',
          githubUrl: data.githubUrl ?? '',
          profilePictureUrl: data.profilePictureUrl ?? '',
        });
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      let profilePictureUrl = formData.profilePictureUrl || undefined;

      if (profilePictureFile) {
        const { storageService } = await import('@/lib/storage');
        const path = `profiles/${Date.now()}_${profilePictureFile.name}`;
        profilePictureUrl = await storageService.uploadFile(path, profilePictureFile);
      }

      const payload: UpdateProfileRequest = {
        name: formData.name,
        bio: formData.bio || undefined,
        department: formData.department || undefined,
        batch: formData.batch || undefined,
        profilePictureUrl,
        linkedinUrl: formData.linkedinUrl || undefined,
        githubUrl: formData.githubUrl || undefined,
      };

      await userApi.updateProfile(payload);
      router.push('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500';

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                <p className="text-sm text-gray-500 mt-1">Update your profile information.</p>
              </div>
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>

            {loading && <p className="text-center text-gray-400 py-8">Loading…</p>}

            {!loading && (
              <>
                {error && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                    {formData.profilePictureUrl && (
                      <img
                        src={formData.profilePictureUrl}
                        alt="Current profile"
                        className="mt-2 w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setProfilePictureFile(e.target.files?.[0] ?? null)}
                      className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name *</label>
                    <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className={inputClass} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                      <input type="text" name="department" id="department" value={formData.department} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="batch" className="block text-sm font-medium text-gray-700">Batch (e.g. E20)</label>
                      <input type="text" name="batch" id="batch" value={formData.batch} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea name="bio" id="bio" rows={3} value={formData.bio} onChange={handleChange}
                      placeholder="Tell the department about yourself…"
                      className={inputClass} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                      <input type="url" name="linkedinUrl" id="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700">GitHub URL</label>
                      <input type="url" name="githubUrl" id="githubUrl" value={formData.githubUrl} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
