'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import UserAvatar from '@/components/shared/UserAvatar';
import RoleBadge from '@/components/shared/RoleBadge';
import { CommentDTO, postApi } from '@/lib/api/postApi';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, UserDTO } from '@/lib/api/userApi';

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
  onCommentDeleted?: (count: number) => void;
}

export default function CommentSection({ postId, onCommentAdded, onCommentDeleted }: CommentSectionProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    postApi.getComments(postId).then(page => {
      setComments(page.content);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    userApi.getMyProfile().then(setProfile).catch(() => {});
  }, []);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await postApi.addComment(postId, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
      onCommentAdded?.();
    } finally {
      setSubmitting(false);
    }
  };

  const canDelete = (authorUid: string) =>
    user?.uid === authorUid || user?.role === 'ADMIN';

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      const comment = comments.find(c => c.id === commentId);
      const deleteCount = 1 + (comment?.replies.length ?? 0);
      await postApi.deleteComment(postId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      onCommentDeleted?.(deleteCount);
    } catch {
      alert('Failed to delete comment.');
    }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!confirm('Delete this reply?')) return;
    try {
      await postApi.deleteComment(postId, replyId);
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, replies: c.replies.filter(r => r.id !== replyId) } : c
      ));
      onCommentDeleted?.(1);
    } catch {
      alert('Failed to delete reply.');
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const reply = await postApi.addReply(postId, commentId, replyText.trim());
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      ));
      setReplyText('');
      setReplyingTo(null);
      onCommentAdded?.();
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return <div className="p-4 text-sm text-gray-400">Loading comments…</div>;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Comment list */}
      {comments.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-2">No comments yet. Be the first!</p>
      )}

      {comments.map(comment => (
        <div key={comment.id} className="space-y-2">
          {/* Top-level comment */}
          <div className="flex gap-3">
            <Link href={`/users/${comment.author.firebaseUid}`} className="shrink-0">
              <UserAvatar
                name={comment.author.name}
                initials={comment.author.initials}
                profilePictureUrl={comment.author.profilePictureUrl}
                roleBadge={comment.author.roleBadge}
                size="sm"
              />
            </Link>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link href={`/users/${comment.author.firebaseUid}`} className="text-xs font-semibold text-gray-900 hover:text-blue-600 transition-colors">{comment.author.name}</Link>
                  <RoleBadge role={comment.author.role} roleBadge={comment.author.roleBadge} />
                </div>
                <p className="text-sm text-gray-800">{comment.content}</p>
              </div>
              <div className="flex items-center gap-3 mt-1 px-1">
                <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Reply
                </button>
                {canDelete(comment.author.firebaseUid) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>

              {/* Reply input */}
              {replyingTo === comment.id && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a reply…"
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400"
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddReply(comment.id)}
                  />
                  <button
                    onClick={() => handleAddReply(comment.id)}
                    disabled={submitting || !replyText.trim()}
                    className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    Reply
                  </button>
                </div>
              )}

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="mt-2 ml-4 space-y-2">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="flex gap-2">
                      <Link href={`/users/${reply.author.firebaseUid}`} className="shrink-0">
                        <UserAvatar
                          name={reply.author.name}
                          initials={reply.author.initials}
                          profilePictureUrl={reply.author.profilePictureUrl}
                          roleBadge={reply.author.roleBadge}
                          size="sm"
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Link href={`/users/${reply.author.firebaseUid}`} className="text-xs font-semibold text-gray-900 hover:text-blue-600 transition-colors">{reply.author.name}</Link>
                            <RoleBadge role={reply.author.role} roleBadge={reply.author.roleBadge} />
                          </div>
                          <p className="text-sm text-gray-800">{reply.content}</p>
                        </div>
                        <div className="flex items-center gap-3 px-1 mt-1">
                          <span className="text-xs text-gray-400">{timeAgo(reply.createdAt)}</span>
                          {canDelete(reply.author.firebaseUid) && (
                            <button
                              onClick={() => handleDeleteReply(comment.id, reply.id)}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* New comment input */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <UserAvatar
          name={profile?.name || user?.email || '?'}
          initials={profile?.initials || (user?.email?.[0] || '?').toUpperCase()}
          profilePictureUrl={profile?.profilePictureUrl}
          roleBadge={profile?.roleBadge}
          size="sm"
        />
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
          />
          <button
            onClick={handleAddComment}
            disabled={submitting || !newComment.trim()}
            className="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
