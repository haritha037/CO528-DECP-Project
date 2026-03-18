'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { eventApi, CreateEventRequest } from '@/lib/api/eventApi';
import { useAuth } from '@/contexts/AuthContext';

const EVENT_TYPES = ['SEMINAR', 'WORKSHOP', 'SOCIAL', 'CAREER_FAIR', 'ANNOUNCEMENT', 'OTHER'];
const EVENT_TYPE_LABELS: Record<string, string> = {
  SEMINAR: 'Seminar', WORKSHOP: 'Workshop', SOCIAL: 'Social',
  CAREER_FAIR: 'Career Fair', ANNOUNCEMENT: 'Announcement', OTHER: 'Other',
};
const MAX_SIZE_MB = 5;

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();

  if (user?.role !== 'ADMIN') {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="text-center py-20">
            <p className="text-gray-500">Only admins can create events.</p>
            <Link href="/events" className="text-blue-600 text-sm mt-2 inline-block hover:underline">← Back to Events</Link>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return <CreateEventForm onCreated={id => router.push(`/events/${id}`)} />;
}

function CreateEventForm({ onCreated }: { onCreated: (id: string) => void }) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Omit<CreateEventRequest, 'imageUrl'> & { startTimeLocal: string; endTimeLocal: string }>({
    title: '',
    description: '',
    eventType: 'SEMINAR',
    location: '',
    online: false,
    onlineLink: '',
    startTime: '',
    endTime: '',
    startTimeLocal: '',
    endTimeLocal: '',
    maxAttendees: undefined,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Cover image must be under ${MAX_SIZE_MB}MB.`);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.startTimeLocal || !form.endTimeLocal) {
      setError('Start and end times are required.');
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const { storageService } = await import('@/lib/storage');
        imageUrl = await storageService.uploadFile(
          `events/${Date.now()}_${imageFile.name}`,
          imageFile,
        );
      }
      const payload: CreateEventRequest = {
        title:        form.title,
        description:  form.description,
        eventType:    form.eventType,
        location:     form.location || undefined,
        online:       form.online,
        onlineLink:   form.onlineLink || undefined,
        startTime:    new Date(form.startTimeLocal).toISOString(),
        endTime:      new Date(form.endTimeLocal).toISOString(),
        maxAttendees: form.maxAttendees || undefined,
        imageUrl,
      };
      const event = await eventApi.createEvent(payload);
      onCreated(event.id);
    } catch {
      setError('Failed to create event. Please check all required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-2xl mx-auto py-6 px-4">
          <Link href="/events" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors">
            ← Back to Events
          </Link>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-6">Create Event</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Cloud & DevOps Workshop"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                <select
                  value={form.eventType}
                  onChange={e => set('eventType', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                >
                  {EVENT_TYPES.map(t => (
                    <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              {/* Start + End time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={form.startTimeLocal}
                    onChange={e => set('startTimeLocal', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={form.endTimeLocal}
                    onChange={e => set('endTimeLocal', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  placeholder="e.g. Main Auditorium, Engineering Faculty"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Online toggle + link */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.online}
                    onChange={e => set('online', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">Online / Virtual event</span>
                </label>
                {form.online && (
                  <input
                    type="url"
                    value={form.onlineLink}
                    onChange={e => set('onlineLink', e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                )}
              </div>

              {/* Max attendees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Attendees</label>
                <input
                  type="number"
                  min={1}
                  value={form.maxAttendees ?? ''}
                  onChange={e => set('maxAttendees', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Leave blank for unlimited"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe the event, agenda, and what attendees can expect…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>

              {/* Cover image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      className="w-full object-cover rounded-lg max-h-48"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm leading-none transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-lg px-3 py-6 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex flex-col items-center gap-1"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    Click to upload cover image
                  </button>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3 pt-2">
                <Link
                  href="/events"
                  className="px-5 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? (imageFile ? 'Uploading…' : 'Creating…') : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
