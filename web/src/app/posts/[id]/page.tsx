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
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Link
            href="/feed"
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          >
            ← Back to Feed
          </Link>

          {loading && (
            <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 animate-pulse dark:border-gray-700 dark:bg-gray-800">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2 w-24 rounded bg-gray-100 dark:bg-gray-700/70" />
                </div>
              </div>
              <div className="h-3 rounded bg-gray-100 dark:bg-gray-700/70" />
              <div className="h-3 w-4/5 rounded bg-gray-100 dark:bg-gray-700/70" />
            </div>
          )}

          {error && (
            <div className="py-16 text-center">
              <p className="mb-3 text-4xl text-gray-700 dark:text-gray-200">Post unavailable</p>
              <p className="text-gray-500 dark:text-gray-400">{error}</p>
            </div>
          )}

          {post && (
            <div className="space-y-4">
              <PostCard post={post} onDeleted={handleDeleted} hideCommentSection hideViewPost />
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Comments</h2>
                </div>
                <CommentSection
                  postId={post.id}
                  onCommentAdded={() => setPost(p => p ? { ...p, commentCount: p.commentCount + 1 } : p)}
                  onCommentDeleted={(n) => setPost(p => p ? { ...p, commentCount: Math.max(0, p.commentCount - n) } : p)}
                />
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
