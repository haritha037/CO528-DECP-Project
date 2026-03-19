'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { eventApi, EventDTO, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/lib/api/eventApi';
import { useAuth } from '@/contexts/AuthContext';

const TYPE_OPTIONS = ['SEMINAR', 'WORKSHOP', 'SOCIAL', 'CAREER_FAIR', 'ANNOUNCEMENT', 'OTHER'];

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function daysUntil(dt: string) {
  return Math.ceil((new Date(dt).getTime() - Date.now()) / 86400000);
}

export default function EventsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [events, setEvents] = useState<EventDTO[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [type, setType] = useState('');
  const [showUpcoming, setShowUpcoming] = useState(true);

  const loadEvents = useCallback(async (pageNum: number, replace = false) => {
    if (pageNum === 0) setLoading(true); else setLoadingMore(true);
    try {
      const data = await eventApi.listEvents({
        status: showUpcoming ? 'UPCOMING' : undefined,
        type:   type || undefined,
        page:   pageNum,
        size:   12,
      });
      setEvents(prev => replace ? data.content : [...prev, ...data.content]);
      setHasMore(!data.last);
      setPage(pageNum);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [type, showUpcoming]);

  useEffect(() => {
    loadEvents(0, true);
  }, [loadEvents]);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-4xl mx-auto py-6 px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Events</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Department events, workshops, and networking sessions</p>
            </div>
            {isAdmin && (
              <Link
                href="/events/create"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Create Event
              </Link>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 flex flex-wrap gap-3 items-center transition-colors">
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setShowUpcoming(true)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  showUpcoming ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setShowUpcoming(false)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  !showUpcoming ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                All
              </button>
            </div>

            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors"
            >
              <option value="">All Types</option>
              {TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Event list */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 animate-pulse transition-colors">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-4" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-gray-500 dark:text-gray-300 font-medium">No events found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(event => {
                  const days = daysUntil(event.startTime);
                  return (
                    <Link key={event.id} href={`/events/${event.id}`}>
                      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-sm transition-all cursor-pointer h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${EVENT_TYPE_COLORS[event.eventType] || 'bg-gray-100 text-gray-600'}`}>
                            {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                          </span>
                          {event.status === 'CANCELLED' && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">Cancelled</span>
                          )}
                          {event.online && (
                            <span className="text-xs text-blue-500 font-medium">🌐 Online</span>
                          )}
                        </div>

                        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">{event.title}</h2>

                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">📅 {formatDate(event.startTime)}</div>
                        <div className="text-sm text-gray-400 dark:text-gray-500">🕐 {formatTime(event.startTime)} – {formatTime(event.endTime)}</div>

                        {event.location && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">📍 {event.location}</div>
                        )}

                        <div className="mt-auto pt-3 flex items-center justify-between">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {event.goingCount} going · {event.maybeCount} maybe
                          </span>
                          {days >= 0 ? (
                            <span className={`text-xs font-medium ${days <= 3 ? 'text-orange-500' : 'text-gray-400'}`}>
                              {days === 0 ? 'Today!' : `In ${days}d`}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-600">Past</span>
                          )}
                        </div>

                        {event.myRsvpStatus && (
                          <div className="mt-2 text-xs font-medium text-green-600">
                            ✓ You&apos;re {event.myRsvpStatus === 'GOING' ? 'going' : event.myRsvpStatus === 'MAYBE' ? 'maybe' : 'not going'}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {hasMore && (
                <button
                  onClick={() => loadEvents(page + 1)}
                  disabled={loadingMore}
                  className="w-full mt-4 py-3 text-sm text-blue-600 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:opacity-50 transition-colors"
                >
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              )}
              {!hasMore && events.length > 0 && (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-3 mt-2">All events loaded</p>
              )}
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
