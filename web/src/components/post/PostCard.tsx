'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import UserAvatar from '@/components/shared/UserAvatar';
import RoleBadge from '@/components/shared/RoleBadge';
import CommentSection from '@/components/post/CommentSection';
import { PostDTO, AuthorDTO, postApi } from '@/lib/api/postApi';
import { useAuth } from '@/contexts/AuthContext';

interface PostCardProps {
  post: PostDTO;
  onDeleted?: (postId: string) => void;
  hideCommentSection?: boolean;
  hideViewPost?: boolean;
}

export default function PostCard({ post, onDeleted, hideCommentSection = false, hideViewPost = false }: PostCardProps) {
  const { user } = useAuth();
  const [reacted, setReacted] = useState(post.reactedByCurrentUser);
  const [reactionCount, setReactionCount] = useState(post.reactionCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  useEffect(() => { setCommentCount(post.commentCount); }, [post.commentCount]);
  const [showComments, setShowComments] = useState(false);
  const [reacting, setReacting] = useState(false);

  const [showReactors, setShowReactors] = useState(false);
  const [reactors, setReactors] = useState<AuthorDTO[]>([]);
  const [loadingReactors, setLoadingReactors] = useState(false);

  const isOwner = user?.uid === post.author.firebaseUid;
  const isAdmin = user?.role === 'ADMIN';

  const handleReact = async () => {
    if (reacting) return;
    setReacting(true);
    const wasReacted = reacted;
    // Optimistic update — capture state before toggling
    setReacted(!wasReacted);
    setReactionCount(prev => wasReacted ? prev - 1 : prev + 1);
    try {
      const result = await postApi.toggleReaction(post.id);
      setReacted(result.reacted);
      // Only correct count if server disagrees with the optimistic update
      if (result.reacted !== !wasReacted) {
        setReactionCount(prev => result.reacted ? prev + 1 : prev - 1);
      }
    } catch {
      // Revert on failure
      setReacted(wasReacted);
      setReactionCount(prev => wasReacted ? prev + 1 : prev - 1);
    } finally {
      setReacting(false);
    }
  };

  const handleShowReactors = async () => {
    if (reactionCount === 0) return;
    setShowReactors(true);
    setLoadingReactors(true);
    try {
      const data = await postApi.getReactions(post.id);
      setReactors(data);
    } finally {
      setLoadingReactors(false);
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

      {/* Reaction summary — clickable like Facebook */}
      {reactionCount > 0 && (
        <div className="px-4 pt-2">
          <button
            onClick={handleShowReactors}
            className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
          >
            <svg className="inline w-3 h-3 mr-0.5 fill-red-400" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            {reactionCount} {reactionCount === 1 ? 'person' : 'people'} reacted
          </button>
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
          {reacted ? (
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          ) : (
            <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          )}
          <span>{reactionCount}</span>
        </button>

        {!hideCommentSection && (
          <button
            onClick={() => setShowComments(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>{commentCount}</span>
          </button>
        )}
        {hideCommentSection && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500">
            <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>{commentCount}</span>
          </span>
        )}

        {!hideViewPost && (
          <Link
            href={`/posts/${post.id}`}
            className="ml-auto text-xs text-gray-400 hover:text-blue-500 transition-colors"
          >
            View post
          </Link>
        )}
      </div>

      {/* Comments */}
      {!hideCommentSection && showComments && (
        <div className="border-t border-gray-100">
          <CommentSection postId={post.id} onCommentAdded={() => setCommentCount(c => c + 1)} onCommentDeleted={(n) => setCommentCount(c => Math.max(0, c - n))} />
        </div>
      )}

      {/* Reactors modal */}
      {showReactors && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowReactors(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-gray-800 text-sm">Reactions</span>
              <button
                onClick={() => setShowReactors(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {loadingReactors ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-gray-200" />
                      <div className="h-3 bg-gray-200 rounded w-32" />
                    </div>
                  ))}
                </div>
              ) : reactors.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">No reactions yet</p>
              ) : (
                reactors.map(r => (
                  <Link
                    key={r.firebaseUid}
                    href={`/users/${r.firebaseUid}`}
                    onClick={() => setShowReactors(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <UserAvatar
                      name={r.name}
                      initials={r.initials}
                      profilePictureUrl={r.profilePictureUrl}
                      roleBadge={r.roleBadge as 'blue' | 'gold' | 'red'}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.name}</p>
                      <RoleBadge role={r.role} roleBadge={r.roleBadge as 'blue' | 'gold' | 'red'} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
