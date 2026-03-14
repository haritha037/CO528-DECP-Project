'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import UserAvatar from '@/components/shared/UserAvatar';
import RoleBadge from '@/components/shared/RoleBadge';
import CommentSection from '@/components/post/CommentSection';
import { PostDTO, AuthorDTO, CommentDTO, postApi } from '@/lib/api/postApi';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, UserDTO } from '@/lib/api/userApi';

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
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [showFullOverlayText, setShowFullOverlayText] = useState(false);
  const [overlayComments, setOverlayComments] = useState<CommentDTO[]>([]);
  const [loadingOverlayComments, setLoadingOverlayComments] = useState(false);
  const [overlayCommentText, setOverlayCommentText] = useState('');
  const [submittingOverlayComment, setSubmittingOverlayComment] = useState(false);
  const [profile, setProfile] = useState<UserDTO | null>(null);

  const isOwner = user?.uid === post.author.firebaseUid;
  const isAdmin = user?.role === 'ADMIN';
  const authorHref = isOwner ? '/profile' : `/users/${post.author.firebaseUid}`;
  const imageItems = post.mediaItems.filter((media) => media.mediaType === 'IMAGE');

  const getMediaLayoutClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    return 'grid-cols-2';
  };

  const getMediaItemClass = (count: number, index: number) => {
    if (count === 1) return 'aspect-[4/3]';
    if (count === 2) return 'aspect-square';
    if (count === 3 && index === 0) return 'col-span-2 aspect-[16/9]';
    if (count >= 4) return index === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square';
    return 'aspect-square';
  };

  const handleReact = async () => {
    if (reacting) return;
    setReacting(true);
    const wasReacted = reacted;
    setReacted(!wasReacted);
    setReactionCount(prev => wasReacted ? prev - 1 : prev + 1);
    try {
      const result = await postApi.toggleReaction(post.id);
      setReacted(result.reacted);
      if (result.reacted !== !wasReacted) {
        setReactionCount(prev => result.reacted ? prev + 1 : prev - 1);
      }
    } catch {
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

  useEffect(() => {
    if (activeImageIndex === null) {
      setShowFullOverlayText(false);
    }
  }, [activeImageIndex]);

  useEffect(() => {
    userApi.getMyProfile().then(setProfile).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeImageIndex === null) {
      setOverlayComments([]);
      setOverlayCommentText('');
      return;
    }

    setLoadingOverlayComments(true);
    postApi.getComments(post.id, 0, 3)
      .then((page) => setOverlayComments(page.content))
      .catch(() => setOverlayComments([]))
      .finally(() => setLoadingOverlayComments(false));
  }, [activeImageIndex, post.id]);

  const handleAddOverlayComment = async () => {
    if (!overlayCommentText.trim() || submittingOverlayComment) return;
    setSubmittingOverlayComment(true);
    try {
      const comment = await postApi.addComment(post.id, overlayCommentText.trim());
      setOverlayComments((prev) => [...prev, comment]);
      setOverlayCommentText('');
      setCommentCount((count) => count + 1);
    } finally {
      setSubmittingOverlayComment(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between p-4">
        <Link href={authorHref} className="group flex items-center gap-3">
          <UserAvatar
            name={post.author.name}
            initials={post.author.initials}
            profilePictureUrl={post.author.profilePictureUrl}
            roleBadge={post.author.roleBadge}
            size="md"
          />
          <div>
            <p className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100">
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
            className="rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:text-red-500"
          >
            Delete
          </button>
        )}
      </div>

      {post.textContent && (
        <div className="px-4 pb-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">{post.textContent}</p>
        </div>
      )}

      {post.mediaItems.length > 0 && (
        <div className={`grid gap-1 bg-gray-100 dark:bg-gray-950 ${getMediaLayoutClass(post.mediaItems.length)}`}>
          {post.mediaItems.map((media, index) => (
            media.mediaType === 'IMAGE' ? (
              <button
                key={media.id}
                type="button"
                onClick={() => {
                  const imageIndex = imageItems.findIndex((item) => item.id === media.id);
                  setActiveImageIndex(imageIndex >= 0 ? imageIndex : 0);
                }}
                className={`relative overflow-hidden ${getMediaItemClass(post.mediaItems.length, index)}`}
              >
                <img
                  src={media.mediaUrl}
                  alt={media.fileName || 'Post image'}
                  className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                />
                {post.mediaItems.length > 4 && index === 3 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-2xl font-semibold text-white">
                    +{post.mediaItems.length - 4}
                  </div>
                )}
              </button>
            ) : (
              <video
                key={media.id}
                src={media.mediaUrl}
                controls
                className={`w-full bg-black object-cover ${getMediaItemClass(post.mediaItems.length, index)}`}
              />
            )
          )).slice(0, post.mediaItems.length > 4 ? 4 : post.mediaItems.length)}
        </div>
      )}

      {reactionCount > 0 && (
        <div className="px-4 pt-2">
          <button
            onClick={handleShowReactors}
            className="text-xs text-gray-400 transition-colors hover:text-blue-500"
          >
            <svg className="mr-0.5 inline h-3 w-3 fill-red-400" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            {reactionCount} {reactionCount === 1 ? 'person' : 'people'} reacted
          </button>
        </div>
      )}

      <div className="flex items-center gap-1 border-t border-gray-100 px-4 py-2 transition-colors dark:border-gray-800">
        <button
          onClick={handleReact}
          disabled={reacting}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            reacted
              ? 'bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          {reacted ? (
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          ) : (
            <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          )}
          <span>{reactionCount}</span>
        </button>

        {!hideCommentSection && (
          <button
            onClick={() => setShowComments(prev => !prev)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>{commentCount}</span>
          </button>
        )}
        {hideCommentSection && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-300">
            <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>{commentCount}</span>
          </span>
        )}

        {!hideViewPost && (
          <Link
            href={`/posts/${post.id}`}
            className="ml-auto text-xs text-gray-400 transition-colors hover:text-blue-500"
          >
            View post
          </Link>
        )}
      </div>

      {!hideCommentSection && showComments && (
        <div className="border-t border-gray-100 transition-colors dark:border-gray-800">
          <CommentSection postId={post.id} onCommentAdded={() => setCommentCount(c => c + 1)} onCommentDeleted={(n) => setCommentCount(c => Math.max(0, c - n))} />
        </div>
      )}

      {showReactors && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowReactors(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl transition-colors dark:border-gray-800 dark:bg-gray-900"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Reactions</span>
              <button
                onClick={() => setShowReactors(false)}
                className="text-xl leading-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                &times;
              </button>
            </div>
            <div className="max-h-80 divide-y divide-gray-50 overflow-y-auto dark:divide-gray-800">
              {loadingReactors ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex animate-pulse items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-200" />
                      <div className="h-3 w-32 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : reactors.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">No reactions yet</p>
              ) : (
                reactors.map(r => (
                  <Link
                    key={r.firebaseUid}
                    href={`/users/${r.firebaseUid}`}
                    onClick={() => setShowReactors(false)}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <UserAvatar
                      name={r.name}
                      initials={r.initials}
                      profilePictureUrl={r.profilePictureUrl}
                      roleBadge={r.roleBadge as 'blue' | 'gold' | 'red'}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{r.name}</p>
                      <RoleBadge role={r.role} roleBadge={r.roleBadge as 'blue' | 'gold' | 'red'} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeImageIndex !== null && imageItems[activeImageIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-4"
          onClick={() => setActiveImageIndex(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-neutral-950 shadow-2xl lg:h-[88vh] lg:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveImageIndex(null)}
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-3xl leading-none text-white/85 transition-colors hover:bg-black/60 hover:text-white"
              aria-label="Close image viewer"
            >
              &times;
            </button>

            <div className="relative flex min-h-[280px] flex-1 items-center justify-center bg-black px-4 py-16 sm:px-6 lg:px-10">
              {imageItems.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((current) => current === null ? 0 : (current - 1 + imageItems.length) % imageItems.length);
                  }}
                  className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-white transition-colors hover:bg-black/60"
                  aria-label="Previous image"
                >
                  ‹
                </button>
              )}

              <img
                src={imageItems[activeImageIndex].mediaUrl}
                alt={imageItems[activeImageIndex].fileName || 'Post image'}
                className="max-h-full w-auto max-w-full object-contain"
              />

              {imageItems.length > 1 && (
                <>
                  <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-sm text-white/80">
                    {activeImageIndex + 1} / {imageItems.length}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((current) => current === null ? 0 : (current + 1) % imageItems.length);
                    }}
                    className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-white transition-colors hover:bg-black/60"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <aside className="w-full border-t border-white/10 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 lg:w-[360px] lg:flex-shrink-0 lg:border-l lg:border-t-0 lg:border-white/10">
              <div className="flex h-full max-h-[40vh] flex-col lg:max-h-none">
                <div className="border-b border-gray-200 p-4 dark:border-gray-800">
                  <Link href={authorHref} className="group flex items-center gap-3">
                    <UserAvatar
                      name={post.author.name}
                      initials={post.author.initials}
                      profilePictureUrl={post.author.profilePictureUrl}
                      roleBadge={post.author.roleBadge}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100">
                        {post.author.name}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <RoleBadge role={post.author.role} roleBadge={post.author.roleBadge} />
                        <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {post.textContent ? (
                    <div className="border-b border-gray-100 pb-4 dark:border-gray-800">
                      <p
                        className={`whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200 ${
                          showFullOverlayText ? '' : 'overflow-hidden'
                        }`}
                        style={showFullOverlayText ? undefined : {
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 2,
                        }}
                      >
                        {post.textContent}
                      </p>
                      {!showFullOverlayText && post.textContent.length > 110 && (
                        <button
                          type="button"
                          onClick={() => setShowFullOverlayText(true)}
                          className="mt-1 text-sm font-medium text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        >
                          ...more
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">This post has no text content.</p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{reactionCount}</span>
                      <span>reactions</span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{commentCount}</span>
                      <span>comments</span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{imageItems.length}</span>
                      <span>images</span>
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-800" />
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={profile?.name || user?.email || '?'}
                        initials={profile?.initials || (user?.email?.[0] || '?').toUpperCase()}
                        profilePictureUrl={profile?.profilePictureUrl}
                        roleBadge={profile?.roleBadge}
                        size="sm"
                      />
                      <div className="flex flex-1 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950">
                        <input
                          type="text"
                          value={overlayCommentText}
                          onChange={(e) => setOverlayCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              void handleAddOverlayComment();
                            }
                          }}
                          placeholder="Add a comment..."
                          className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
                        />
                        <button
                          type="button"
                          onClick={() => void handleAddOverlayComment()}
                          disabled={submittingOverlayComment || !overlayCommentText.trim()}
                          className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        >
                          Post
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 border-t border-gray-100 pt-1 dark:border-gray-800">
                      {loadingOverlayComments ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500">Loading comments...</p>
                      ) : overlayComments.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500">No comments yet.</p>
                      ) : (
                        overlayComments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Link href={comment.author.firebaseUid === user?.uid ? '/profile' : `/users/${comment.author.firebaseUid}`} className="shrink-0">
                              <UserAvatar
                                name={comment.author.name}
                                initials={comment.author.initials}
                                profilePictureUrl={comment.author.profilePictureUrl}
                                roleBadge={comment.author.roleBadge}
                                size="sm"
                              />
                            </Link>
                            <div className="min-w-0 flex-1">
                              <div className="rounded-2xl bg-gray-100 px-3 py-2 dark:bg-gray-800">
                                <div className="mb-0.5 flex items-center gap-2">
                                  <Link
                                    href={comment.author.firebaseUid === user?.uid ? '/profile' : `/users/${comment.author.firebaseUid}`}
                                    className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100"
                                  >
                                    {comment.author.name}
                                  </Link>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(comment.createdAt)}</span>
                                </div>
                                <p className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{comment.content}</p>
                              </div>
                              <div className="mt-1 flex items-center gap-3 px-1 text-xs text-gray-500 dark:text-gray-400">
                                <span>Like</span>
                                <span>Reply</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                  <Link
                    href={`/posts/${post.id}`}
                    onClick={() => setActiveImageIndex(null)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Open full post
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
