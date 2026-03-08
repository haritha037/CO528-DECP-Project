'use client';

import { useState } from 'react';
import Link from 'next/link';
import UserAvatar from '@/components/shared/UserAvatar';
import RoleBadge from '@/components/shared/RoleBadge';
import CommentSection from '@/components/post/CommentSection';
import { PostDTO, postApi } from '@/lib/api/postApi';
import { useAuth } from '@/contexts/AuthContext';

interface PostCardProps {
  post: PostDTO;
  onDeleted?: (postId: string) => void;
}

export default function PostCard({ post, onDeleted }: PostCardProps) {
  const { user } = useAuth();
  const [reacted, setReacted] = useState(post.reactedByCurrentUser);
  const [reactionCount, setReactionCount] = useState(post.reactionCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [showComments, setShowComments] = useState(false);
  const [reacting, setReacting] = useState(false);

  const isOwner = user?.uid === post.author.firebaseUid;
  const isAdmin = user?.role === 'ADMIN';

  const handleReact = async () => {
    if (reacting) return;
    setReacting(true);
    // Optimistic update
    setReacted(prev => !prev);
    setReactionCount(prev => reacted ? prev - 1 : prev + 1);
    try {
      const result = await postApi.toggleReaction(post.id);
      setReacted(result.reacted);
      setReactionCount(prev => result.reacted
        ? (reacted ? prev : prev + 1)
        : (reacted ? prev - 1 : prev));
    } catch {
      // Revert on failure
      setReacted(prev => !prev);
      setReactionCount(prev => reacted ? prev + 1 : prev - 1);
    } finally {
      setReacting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      await postApi.deletePost(post.id);
      onDeleted?.(post.id);
    } catch {
      alert('Failed to delete post.');
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <Link href={`/users/${post.author.firebaseUid}`} className="flex items-center gap-3 group">
          <UserAvatar
            name={post.author.name}
            initials={post.author.initials}
            profilePictureUrl={post.author.profilePictureUrl}
            roleBadge={post.author.roleBadge}
            size="md"
          />
          <div>
            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
              {post.author.name}
            </p>
            <div className="flex items-center gap-2">
              <RoleBadge role={post.author.role} roleBadge={post.author.roleBadge} />
              <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </Link>
        {(isOwner || isAdmin) && (
          <button
            onClick={handleDelete}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded"
          >
            Delete
          </button>
        )}
      </div>

      {/* Content */}
      {post.textContent && (
        <div className="px-4 pb-3">
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{post.textContent}</p>
        </div>
      )}

      {/* Media */}
      {post.mediaItems.length > 0 && (
        <div className={`grid gap-1 ${post.mediaItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.mediaItems.map(media => (
            media.mediaType === 'IMAGE' ? (
              <img
                key={media.id}
                src={media.mediaUrl}
                alt={media.fileName || 'Post image'}
                className="w-full object-cover max-h-80"
              />
            ) : (
              <video
                key={media.id}
                src={media.mediaUrl}
                controls
                className="w-full max-h-80"
              />
            )
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-100">
        <button
          onClick={handleReact}
          disabled={reacting}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            reacted
              ? 'text-red-500 bg-red-50 hover:bg-red-100'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <span>{reacted ? '❤️' : '🤍'}</span>
          <span>{reactionCount}</span>
        </button>

        <button
          onClick={() => setShowComments(prev => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <span>💬</span>
          <span>{commentCount}</span>
        </button>

        <Link
          href={`/posts/${post.id}`}
          className="ml-auto text-xs text-gray-400 hover:text-blue-500 transition-colors"
        >
          View post
        </Link>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-100">
          <CommentSection postId={post.id} onCommentAdded={() => setCommentCount(c => c + 1)} />
        </div>
      )}
    </div>
  );
}
