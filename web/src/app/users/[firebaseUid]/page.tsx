'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import UserAvatar from '@/components/shared/UserAvatar';
import RoleBadge from '@/components/shared/RoleBadge';
import PostCard from '@/components/post/PostCard';
import { userApi, UserDTO } from '@/lib/api/userApi';
import { postApi, PostDTO } from '@/lib/api/postApi';

export default function UserProfilePage() {
  const params = useParams();
  const firebaseUid = params.firebaseUid as string;

  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firebaseUid) return;
    Promise.all([
      userApi.getUserByUid(firebaseUid),
      postApi.getPostsByUser(firebaseUid),
    ])
      .then(([user, page]) => {
        setProfile(user);
        setPosts(page.content);
      })
      .catch(() => setError('User not found.'))
      .finally(() => setLoading(false));
  }, [firebaseUid]);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-4">
          {loading && <p className="text-center text-gray-400 mt-16">Loading…</p>}
          {error && <p className="text-center text-red-500 mt-16">{error}</p>}

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

              {/* Posts section */}
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
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
