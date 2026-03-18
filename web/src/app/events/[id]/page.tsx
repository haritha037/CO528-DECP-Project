'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserAvatar from '@/components/shared/UserAvatar';
import { eventApi, EventDTO, AttendeeDTO, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/lib/api/eventApi';
import { userApi, UserDTO } from '@/lib/api/userApi';
import { useAuth } from '@/contexts/AuthContext';

const RSVP_OPTIONS = [
  { value: 'GOING', label: 'Going', activeColor: 'bg-green-600 text-white hover:bg-green-700' },
  { value: 'MAYBE', label: 'Maybe', activeColor: 'bg-yellow-500 text-white hover:bg-yellow-600' },
  { value: 'NOT_GOING', label: 'Not Going', activeColor: 'bg-gray-500 text-white hover:bg-gray-600' },
];

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface EnrichedAttendee {
  attendee: AttendeeDTO;
  profile: UserDTO | null;
}

async function enrichAttendees(attendees: AttendeeDTO[]): Promise<EnrichedAttendee[]> {
  return Promise.all(
    attendees.map(async a => {
      try {
        const profile = await userApi.getUserByUid(a.userId);
        return { attendee: a, profile };
      } catch {
        return { attendee: a, profile: null };
      }
    })
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [event, setEvent] = useState<EventDTO | null>(null);
  const [enrichedAttendees, setEnrichedAttendees] = useState<EnrichedAttendee[]>([]);
  const [attendeesPage, setAttendeesPage] = useState(0);
  const [hasMoreAttendees, setHasMoreAttendees] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMoreAttendees, setLoadingMoreAttendees] = useState(false);
  const [error, setError] = useState('');
  const [rsvping, setRsvping] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      eventApi.getEvent(id),
      eventApi.getAttendees(id, 0, 10),
    ])
      .then(async ([ev, att]) => {
        setEvent(ev);
        setAttendeesPage(0);
        setHasMoreAttendees(!att.last);
        const enriched = await enrichAttendees(att.content);
        setEnrichedAttendees(enriched);
      })
      .catch(() => setError('Event not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const refreshAttendees = async () => {
    const att = await eventApi.getAttendees(id, 0, 10);
    const enriched = await enrichAttendees(att.content);
    setEnrichedAttendees(enriched);
    setAttendeesPage(0);
    setHasMoreAttendees(!att.last);
  };

  const handleRsvp = async (status: string) => {
    if (!event || event.myRsvpStatus === status) return;
    setRsvping(status);
    try {
      const updated = await eventApi.rsvp(id, status);
      setEvent(updated);
      await refreshAttendees();
    } finally {
      setRsvping(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await eventApi.deleteEvent(id);
      router.push('/events');
    } finally {
      setDeleting(false);
    }
  };

  const loadMoreAttendees = async () => {
    setLoadingMoreAttendees(true);
    try {
      const next = attendeesPage + 1;
      const data = await eventApi.getAttendees(id, next, 10);
      const enriched = await enrichAttendees(data.content);
      setEnrichedAttendees(prev => [...prev, ...enriched]);
      setAttendeesPage(next);
      setHasMoreAttendees(!data.last);
    } finally {
      setLoadingMoreAttendees(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Link
            href="/events"
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          >
            ← Back to Events
          </Link>

          {loading && (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 animate-pulse dark:border-gray-700 dark:bg-gray-800">
              <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-700/70" />
              <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-700/70" />
            </div>
          )}

          {error && <p className="py-16 text-center text-red-500">{error}</p>}

          {event && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${EVENT_TYPE_COLORS[event.eventType] || 'bg-gray-100 text-gray-600'}`}>
                    {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                  </span>
                  {event.status === 'CANCELLED' && (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-sm font-medium text-red-600">Cancelled</span>
                  )}
                  {event.online && (
                    <span className="text-sm font-medium text-blue-500 dark:text-blue-400">Online</span>
                  )}
                </div>

                <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">{event.title}</h1>

                <div className="mb-4 space-y-2 border-b border-gray-100 pb-4 dark:border-gray-700">
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-12 flex-shrink-0 text-gray-500 dark:text-gray-400">Date</span>
                    <div>
                      <div>{formatDateTime(event.startTime)}</div>
                      <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">to {formatDateTime(event.endTime)}</div>
                    </div>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="w-12 flex-shrink-0 text-gray-500 dark:text-gray-400">Place</span>
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.online && event.onlineLink && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-12 flex-shrink-0 text-gray-500 dark:text-gray-400">Link</span>
                      <a
                        href={event.onlineLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {event.onlineLink}
                      </a>
                    </div>
                  )}
                  {event.maxAttendees && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Max {event.maxAttendees} attendees</div>
                  )}
                </div>

                <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                  {event.description}
                </p>

                {/* Cover image */}
                {event.imageUrl && (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full rounded-lg mb-6"
                  />
                )}

                {/* RSVP buttons */}
                {event.status !== 'CANCELLED' && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">Your RSVP</p>
                    <div className="flex flex-wrap gap-2">
                      {RSVP_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => handleRsvp(opt.value)}
                          disabled={rsvping !== null}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                            event.myRsvpStatus === opt.value
                              ? `${opt.activeColor} ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-gray-800`
                              : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                        >
                          {rsvping === opt.value ? '...' : opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-xl border border-gray-200 bg-white p-4 text-center dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
                <div>
                  <p className="text-2xl font-bold text-green-600">{event.goingCount}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Going</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{event.maybeCount}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Maybe</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-400">{event.notGoingCount}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Not Going</p>
                </div>
              </div>

              {(event.goingCount + event.maybeCount) > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Who&apos;s coming ({event.goingCount + event.maybeCount})
                  </h2>
                  <div className="space-y-3">
                    {enrichedAttendees.map(({ attendee, profile }) => (
                      <Link
                        key={attendee.userId}
                        href={`/users/${attendee.userId}`}
                        className="mx-[-0.25rem] flex items-center justify-between gap-3 rounded-lg p-1 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/60"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {profile ? (
                            <UserAvatar
                              name={profile.name}
                              initials={profile.initials}
                              profilePictureUrl={profile.profilePictureUrl}
                              roleBadge={profile.roleBadge}
                              size="sm"
                            />
                          ) : (
                            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />
                          )}
                          <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                            {profile?.name ?? attendee.userId}
                          </span>
                        </div>
                        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs ${
                          attendee.rsvpStatus === 'GOING'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {attendee.rsvpStatus === 'GOING' ? 'Going' : 'Maybe'}
                        </span>
                      </Link>
                    ))}
                  </div>

                  {hasMoreAttendees && (
                    <button
                      onClick={loadMoreAttendees}
                      disabled={loadingMoreAttendees}
                      className="mt-3 text-sm text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
                    >
                      {loadingMoreAttendees ? 'Loading...' : 'Load more'}
                    </button>
                  )}
                </div>
              )}

              {isAdmin && (
                <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <Link
                    href={`/events/${id}/edit`}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Edit Event
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/70 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    {deleting ? 'Deleting...' : 'Delete Event'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
