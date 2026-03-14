'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import UserAvatar from '@/components/shared/UserAvatar';
import RoleBadge from '@/components/shared/RoleBadge';
import PostCard from '@/components/post/PostCard';
import { userApi, UserDTO } from '@/lib/api/userApi';
import { postApi, PostDTO } from '@/lib/api/postApi';
import { useAuth } from '@/contexts/AuthContext';
import { messagingService } from '@/lib/messaging';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const firebaseUid = params.firebaseUid as string;
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingConv, setStartingConv] = useState(false);

  useEffect(() => {
    if (!firebaseUid) return;
    Promise.all([
      userApi.getUserByUid(firebaseUid),
      postApi.getPostsByUser(firebaseUid),
    ])
      .then(([u, page]) => {
        setProfile(u);
        setPosts(page.content);
      })
      .catch(() => setError('User not found.'))
      .finally(() => setLoading(false));
  }, [firebaseUid]);

  const handleMessageClick = async () => {
    if (!user?.uid) return;
    setStartingConv(true);
    try {
      await messagingService.ensureConversation(user.uid, firebaseUid);
      router.push(`/messages?with=${firebaseUid}`);
    } finally {
      setStartingConv(false);
    }
  };

  const isOwnProfile = user?.uid === firebaseUid;

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
                    {!isOwnProfile && (
                      <button
                        onClick={handleMessageClick}
                        disabled={startingConv}
                        className="mb-1 flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                      >
                        {startingConv ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        )}
                        Message
                      </button>
                    )}
                  </div>

                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <RoleBadge role={profile.role as any} roleBadge={profile.roleBadge as any} />
                    {profile.department && (
                      <span className="text-sm text-gray-500">{profile.department}</span>
                    )}
                    {profile.batch && (
                      <span className="text-sm text-gray-400">· Batch {profile.batch}</span>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="mt-4 text-gray-700 text-sm leading-relaxed">{profile.bio}</p>
                  )}

                  <div className="mt-4 flex gap-3">
                    {profile.linkedinUrl && (
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[#0077B5] hover:text-[#005885] transition-colors" title="LinkedIn">
                        <FaLinkedin className="w-5 h-5" />
                      </a>
                    )}
                    {profile.githubUrl && (
                      <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer"
                        className="text-gray-700 hover:text-gray-900 transition-colors" title="GitHub">
                        <FaGithub className="w-5 h-5" />
                      </a>
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
