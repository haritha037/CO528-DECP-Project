'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import UserAvatar from '@/components/shared/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { messagingService, ConversationMetadata, Message } from '@/lib/messaging';
import { userApi, UserDTO } from '@/lib/api/userApi';

function timeAgo(ms: number): string {
  if (!ms) return '';
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(ms).toLocaleDateString();
}

export default function MessagesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const withUid = searchParams.get('with');

  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [profileCache, setProfileCache] = useState<Record<string, UserDTO>>({});
  const [loadingConvs, setLoadingConvs] = useState(true);

  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedOtherUid, setSelectedOtherUid] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserDTO[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to conversation list
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = messagingService.subscribeToConversationList(user.uid, (convs) => {
      setConversations(convs);
      setLoadingConvs(false);
      convs.forEach((c) => {
        if (!profileCache[c.otherUid]) {
          userApi.getUserByUid(c.otherUid).then((profile) => {
            setProfileCache((prev) => ({ ...prev, [c.otherUid]: profile }));
          }).catch(() => {});
        }
      });
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Auto-open conversation from ?with= query param
  useEffect(() => {
    if (!user?.uid || !withUid) return;
    messagingService.ensureConversation(user.uid, withUid).then((convId) => {
      selectConversation(convId, withUid);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, withUid]);

  // Subscribe to messages when conversation changes
  useEffect(() => {
    if (!selectedConvId) return;
    const unsub = messagingService.subscribeToMessages(selectedConvId, setMessages);
    return unsub;
  }, [selectedConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debounced user search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(() => {
      userApi.searchUsers({ q: searchQuery.trim(), size: 8 })
        .then((page) => setSearchResults(page.content.filter(u => u.firebaseUid !== user?.uid)))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
  }, [searchQuery, user?.uid]);

  function selectConversation(convId: string, otherUid: string) {
    // Don't clear messages if re-selecting the same conversation
    if (convId !== selectedConvId) {
      setMessages([]);
    }
    setSelectedConvId(convId);
    setSelectedOtherUid(otherUid);
    setShowThread(true);
    setSearchQuery('');
    setSearchResults([]);
    if (user?.uid) {
      messagingService.markConversationRead(user.uid, convId);
    }
    if (!profileCache[otherUid]) {
      userApi.getUserByUid(otherUid).then((profile) => {
        setProfileCache((prev) => ({ ...prev, [otherUid]: profile }));
      }).catch(() => {});
    }
  }

  async function handleStartConversation(otherUser: UserDTO) {
    if (!user?.uid) return;
    const convId = await messagingService.ensureConversation(user.uid, otherUser.firebaseUid);
    setProfileCache((prev) => ({ ...prev, [otherUser.firebaseUid]: otherUser }));
    selectConversation(convId, otherUser.firebaseUid);
  }

  async function handleSend() {
    if (!inputText.trim() || !selectedConvId || !selectedOtherUid || !user?.uid) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      await messagingService.sendMessage(selectedConvId, user.uid, selectedOtherUid, text);
    } finally {
      setSending(false);
    }
  }

  const otherProfile = selectedOtherUid ? profileCache[selectedOtherUid] : null;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="flex h-[calc(100vh-0px)] md:h-screen overflow-hidden">

          {/* ── Left panel: conversation list ── */}
          <div className={`${showThread ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors`}>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Messages</h1>
              {/* Search input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people…"
                className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Search results */}
              {isSearching ? (
                <>
                  {searching && <p className="text-sm text-gray-400 text-center py-4">Searching…</p>}
                  {!searching && searchResults.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No users found.</p>
                  )}
                  {searchResults.map((u) => (
                    <button
                      key={u.firebaseUid}
                      onClick={() => handleStartConversation(u)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800"
                    >
                      <UserAvatar
                        name={u.name}
                        initials={u.initials}
                        profilePictureUrl={u.profilePictureUrl}
                        roleBadge={u.roleBadge}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.department || u.role}</p>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {loadingConvs && <p className="text-sm text-gray-400 text-center py-8">Loading…</p>}
                  {!loadingConvs && conversations.length === 0 && (
                    <div className="px-4 py-10 text-center">
                      <p className="text-gray-400 text-sm">No conversations yet.</p>
                      <p className="text-gray-400 text-xs mt-1">Search for someone above to start messaging.</p>
                    </div>
                  )}
                  {conversations.map((conv) => {
                    const profile = profileCache[conv.otherUid];
                    const isSelected = conv.conversationId === selectedConvId;
                    return (
                      <button
                        key={conv.conversationId}
                        onClick={() => selectConversation(conv.conversationId, conv.otherUid)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 ${isSelected ? 'bg-blue-50 dark:bg-blue-500/15' : ''}`}
                      >
                        <div className="shrink-0">
                          <UserAvatar
                            name={profile?.name || conv.otherUid}
                            initials={profile?.initials || '?'}
                            profilePictureUrl={profile?.profilePictureUrl}
                            roleBadge={profile?.roleBadge}
                            size="md"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {profile?.name || '…'}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-2">{timeAgo(conv.lastMessageAt)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{conv.lastMessage || 'Say hello!'}</span>
                            {conv.unreadCount > 0 && (
                              <span className="ml-2 shrink-0 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* ── Right panel: message thread ── */}
          <div className={`${showThread ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white dark:bg-gray-950 transition-colors`}>
            {!selectedConvId ? (
              <div className="flex-1 flex items-center justify-center text-center px-4">
                <div>
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Select a conversation or</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">search for someone to start messaging.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => setShowThread(false)}
                    className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mr-1"
                    aria-label="Back"
                  >
                    ←
                  </button>
                  {otherProfile ? (
                    <Link href={`/users/${otherProfile.firebaseUid}`} className="flex items-center gap-3 hover:opacity-80">
                      <UserAvatar
                        name={otherProfile.name}
                        initials={otherProfile.initials}
                        profilePictureUrl={otherProfile.profilePictureUrl}
                        roleBadge={otherProfile.roleBadge}
                        size="sm"
                      />
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{otherProfile.name}</span>
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-400">Loading…</span>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-8">No messages yet. Say hello!</p>
                  )}
                  {messages.map((msg) => {
                    const isMine = msg.senderId === user?.uid;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[70%]">
                          <div className={`px-4 py-2 rounded-2xl text-sm ${
                            isMine
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                          }`}>
                            {msg.text}
                          </div>
                          <p className={`text-xs text-gray-400 mt-0.5 ${isMine ? 'text-right' : 'text-left'}`}>
                            {timeAgo(msg.sentAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message…"
                    className="flex-1 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-400 transition-colors"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !inputText.trim()}
                    className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
