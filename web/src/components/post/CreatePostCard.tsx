'use client';

import { useState, useRef } from 'react';
import UserAvatar from '@/components/shared/UserAvatar';
import { postApi, MediaItemDTO } from '@/lib/api/postApi';
import { useAuth } from '@/contexts/AuthContext';

interface CreatePostCardProps {
  onPostCreated: () => void;
}

export default function CreatePostCard({ onPostCreated }: CreatePostCardProps) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await postApi.createPost({ textContent: text.trim(), mediaUrls: [] });
      setText('');
      setExpanded(false);
      onPostCreated();
    } catch {
      setError('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex gap-3">
        <UserAvatar
          name={user?.email || '?'}
          initials={(user?.email?.[0] || '?').toUpperCase()}
          size="md"
        />
        <div className="flex-1">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-left px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-400 text-sm transition-colors"
            >
              Share something with your department…
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-400 resize-none"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{text.length}/5000</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setExpanded(false); setText(''); }}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !text.trim()}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Posting…' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
