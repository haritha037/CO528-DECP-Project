'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PostCard from '@/components/post/PostCard';
import CreatePostCard from '@/components/post/CreatePostCard';
import UserAvatar from '@/components/shared/UserAvatar';
import RoleBadge from '@/components/shared/RoleBadge';
import { PostDTO, postApi } from '@/lib/api/postApi';
import { userApi, UserDTO } from '@/lib/api/userApi';
import { eventApi, EventDTO } from '@/lib/api/eventApi';
import { jobApi, JobDTO } from '@/lib/api/jobApi';

function formatEventDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function FeedPage() {
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [jobs, setJobs] = useState<JobDTO[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPosts = useCallback(async (pageNum: number, replace = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const data = await postApi.getFeed(pageNum, 20);
      setPosts((prev) => (replace ? data.content : [...prev, ...data.content]));
      setHasMore(!data.last);
      setPage(pageNum);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(0, true);
  }, [loadPosts]);

  useEffect(() => {
    let cancelled = false;

    async function loadSidebarData() {
      try {
        const [profileData, eventPage, jobPage] = await Promise.all([
          userApi.getMyProfile(),
          eventApi.listEvents({ status: 'UPCOMING', page: 0, size: 4 }),
          jobApi.searchJobs({ status: 'ACTIVE', page: 0, size: 4 }),
        ]);

        if (cancelled) return;

        setProfile(profileData);
        setEvents(eventPage.content);
        setJobs(jobPage.content);
      } finally {
        if (!cancelled) {
          setSidebarLoading(false);
        }
      }
    }

    loadSidebarData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadPosts(page + 1);
      }
    }, { threshold: 0.1 });

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, page, loadPosts]);

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostCreated = async () => {
    await loadPosts(0, true);
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-7xl mx-auto overflow-visible py-6 px-4 lg:px-6">
          <div className="grid items-start gap-6 overflow-visible lg:grid-cols-[260px_minmax(0,1fr)_280px] xl:grid-cols-[280px_minmax(0,720px)_300px]">
            <aside className="hidden self-start lg:block lg:sticky lg:top-20">
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors">
                  {profile ? (
                    <>
                      <Link href="/profile" className="flex items-center gap-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 -m-2 p-2 transition-colors">
                        <UserAvatar
                          name={profile.name}
                          initials={profile.initials}
                          profilePictureUrl={profile.profilePictureUrl}
                          roleBadge={profile.roleBadge}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{profile.name}</p>
                          <RoleBadge role={profile.role} roleBadge={profile.roleBadge} />
                        </div>
                      </Link>

                      <div className="mt-4 space-y-2 text-sm">
                        {profile.department && (
                          <p className="text-gray-600 dark:text-gray-400">{profile.department}</p>
                        )}
                        {profile.bio && (
                          <p className="text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-4">{profile.bio}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-2 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                        </div>
                      </div>
                      <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="h-3 w-4/5 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  )}
                </div>

                {profile && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 transition-colors">
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Create a post</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Share updates, ideas, and opportunities with your department.
                      </p>
                    </div>
                    <CreatePostCard
                      authorProfile={profile}
                      onPostCreated={handlePostCreated}
                      showAvatar={false}
                    />
                  </div>
                )}
              </div>
            </aside>

            <main className="min-w-0 space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 animate-pulse transition-colors">
                      <div className="flex gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-24" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">ðŸ“­</p>
                  <p className="text-gray-500 dark:text-gray-300 font-medium">No posts yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to share something!</p>
                </div>
              ) : (
                <>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} onDeleted={handlePostDeleted} />
                  ))}

                  <div ref={sentinelRef} className="h-4" />

                  {loadingMore && (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  )}

                  {!hasMore && posts.length > 0 && (
                    <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">You have seen all posts</p>
                  )}
                </>
              )}
            </main>

            <aside className="hidden self-start lg:block">
              <div className="space-y-4 lg:sticky lg:top-14">
                <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold tracking-wide text-gray-900 dark:text-gray-100 uppercase">Upcoming Events</h2>
                    <Link href="/events" className="text-xs text-blue-600 dark:text-blue-300 hover:underline">
                      See all
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {sidebarLoading ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse space-y-2">
                          <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
                        </div>
                      ))
                    ) : events.length > 0 ? (
                      events.map((event) => (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="block rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">{formatEventDate(event.startTime)}</p>
                          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{event.title}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {event.location || (event.online ? 'Online event' : 'Department event')}
                          </p>
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events right now.</p>
                    )}
                  </div>
                </section>

                <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold tracking-wide text-gray-900 dark:text-gray-100 uppercase">Recent Jobs</h2>
                    <Link href="/jobs" className="text-xs text-blue-600 dark:text-blue-300 hover:underline">
                      See all
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {sidebarLoading ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse space-y-2">
                          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
                        </div>
                      ))
                    ) : jobs.length > 0 ? (
                      jobs.map((job) => (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.id}`}
                          className="block rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{job.title}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{job.company}</p>
                          <p className="mt-1 text-xs text-green-600">{job.remote ? 'Remote' : (job.location || 'On-site')}</p>
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No active jobs right now.</p>
                    )}
                  </div>
                </section>
              </div>
            </aside>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
