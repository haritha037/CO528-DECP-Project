'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PostCard from '@/components/post/PostCard';
import CommentSection from '@/components/post/CommentSection';
import { PostDTO, postApi } from '@/lib/api/postApi';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    postApi.getPost(id).then(setPost).catch(() => setError('Post not found.')).finally(() => setLoading(false));
  }, [id]);

  const handleDeleted = () => router.push('/feed');

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-2xl mx-auto py-6 px-4">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors"
          >
            ← Back to Feed
          </Link>

          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-2 bg-gray-100 rounded w-24" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded" />
              <div className="h-3 bg-gray-100 rounded w-4/5" />
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">😕</p>
              <p className="text-gray-500">{error}</p>
            </div>
          )}

          {post && (
            <div className="space-y-4">
              <PostCard post={post} onDeleted={handleDeleted} />
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800 text-sm">Comments</h2>
                </div>
                <CommentSection
                  postId={post.id}
                  onCommentAdded={() => setPost(p => p ? { ...p, commentCount: p.commentCount + 1 } : p)}
                />
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
