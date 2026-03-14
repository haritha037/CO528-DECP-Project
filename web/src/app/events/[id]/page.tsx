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
  { value: 'GOING',     label: 'Going',     activeColor: 'bg-green-600 text-white hover:bg-green-700' },
  { value: 'MAYBE',     label: 'Maybe',     activeColor: 'bg-yellow-500 text-white hover:bg-yellow-600' },
  { value: 'NOT_GOING', label: 'Not Going', activeColor: 'bg-gray-500 text-white hover:bg-gray-600' },
];

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Enriched attendee: combines RSVP data with user profile
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
        <div className="max-w-3xl mx-auto py-6 px-4">
          <Link href="/events" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors">
            ← Back to Events
          </Link>

          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse space-y-4">
              <div className="h-5 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          )}

          {error && <p className="text-center text-red-500 py-16">{error}</p>}

          {event && (
            <div className="space-y-4">
              {/* Main card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${EVENT_TYPE_COLORS[event.eventType] || 'bg-gray-100 text-gray-600'}`}>
                    {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                  </span>
                  {event.status === 'CANCELLED' && (
                    <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-600">Cancelled</span>
                  )}
                  {event.online && (
                    <span className="text-sm text-blue-500 font-medium">🌐 Online</span>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h1>

                {/* Meta */}
                <div className="space-y-2 pb-4 border-b border-gray-100 mb-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-5 flex-shrink-0">📅</span>
                    <div>
                      <div>{formatDateTime(event.startTime)}</div>
                      <div className="text-gray-400 text-xs mt-0.5">to {formatDateTime(event.endTime)}</div>
                    </div>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>📍</span> {event.location}
                    </div>
                  )}
                  {event.online && event.onlineLink && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>🔗</span>
                      <a href={event.onlineLink} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate">
                        {event.onlineLink}
                      </a>
                    </div>
                  )}
                  {event.maxAttendees && (
                    <div className="text-sm text-gray-500">👥 Max {event.maxAttendees} attendees</div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">
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
                    <p className="text-sm font-medium text-gray-700 mb-2">Your RSVP</p>
                    <div className="flex gap-2 flex-wrap">
                      {RSVP_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => handleRsvp(opt.value)}
                          disabled={rsvping !== null}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 ${
                            event.myRsvpStatus === opt.value
                              ? opt.activeColor + ' ring-2 ring-offset-1 ring-blue-400'
                              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {rsvping === opt.value ? '…' : opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* RSVP stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-3 divide-x divide-gray-100 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{event.goingCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Going</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{event.maybeCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Maybe</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-400">{event.notGoingCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Not Going</p>
                </div>
              </div>

              {/* Attendee list — only GOING + MAYBE */}
              {(event.goingCount + event.maybeCount) > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">
                    Who&apos;s coming ({event.goingCount + event.maybeCount})
                  </h2>
                  <div className="space-y-3">
                    {enrichedAttendees.map(({ attendee, profile }) => (
                      <Link
                        key={attendee.userId}
                        href={`/users/${attendee.userId}`}
                        className="flex items-center justify-between gap-3 hover:bg-gray-50 rounded-lg p-1 -mx-1 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {profile ? (
                            <UserAvatar
                              name={profile.name}
                              initials={profile.initials}
                              profilePictureUrl={profile.profilePictureUrl}
                              roleBadge={profile.roleBadge}
                              size="sm"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                          )}
                          <span className="text-sm text-gray-800 font-medium truncate">
                            {profile?.name ?? attendee.userId}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
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
                      className="mt-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {loadingMoreAttendees ? 'Loading…' : 'Load more'}
                    </button>
                  )}
                </div>
              )}

              {/* Admin actions */}
              {isAdmin && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
                  <Link
                    href={`/events/${id}/edit`}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit Event
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 text-sm border border-red-200 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? 'Deleting…' : 'Delete Event'}
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
