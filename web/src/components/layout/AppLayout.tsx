'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, UserDTO } from '@/lib/api/userApi';
import NotificationBell from './NotificationBell';
import UserAvatar from '@/components/shared/UserAvatar';
import { messagingService } from '@/lib/messaging';

const navLinks = [
  { href: '/feed',     label: 'Feed'      },
  { href: '/jobs',     label: 'Jobs'      },
  { href: '/events',   label: 'Events'    },
  { href: '/messages', label: 'Messages'  },
  { href: '/users',    label: 'Directory' },
];

const adminLinks = [
  { href: '/admin/users',     label: 'Manage Users' },
  { href: '/admin/dashboard', label: 'Analytics'    },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid) return;
    userApi.getMyProfile().then(setProfile).catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = messagingService.subscribeToConversationList(user.uid, (convs) => {
      const total = convs.reduce((sum, c) => sum + c.unreadCount, 0);
      setUnreadMessages(total);
    });
    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Navbar ──────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-20">
        <div className="px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/feed" className="text-xl font-bold text-blue-600 cursor-pointer">
            DECP
          </Link>

          {/* Nav links + right controls */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive(link.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {link.label}
                {link.href === '/messages' && unreadMessages > 0 && (
                  <span className="bg-blue-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </Link>
            ))}

            <div className="w-px h-5 bg-gray-200 mx-2" />

            <NotificationBell />

            {/* Avatar + dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
              >
                {profile ? (
                  <UserAvatar
                    name={profile.name}
                    initials={profile.initials}
                    profilePictureUrl={profile.profilePictureUrl}
                    roleBadge={profile.roleBadge as any}
                    size="md"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Profile
                  </Link>

                  {user?.role === 'ADMIN' && (
                    <>
                      <div className="my-1 border-t border-gray-100" />
                      {adminLinks.map(link => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </>
                  )}

                  <div className="my-1 border-t border-gray-100" />
                  <button
                    onClick={() => { signOut(); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="pt-14 pb-16 md:pb-0">
        {children}
      </main>

      {/* ── Mobile Bottom Tab Bar ───────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around py-2">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors cursor-pointer ${
                isActive(link.href) ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {link.href === '/messages' && unreadMessages > 0 && (
                <span className="absolute -top-0.5 right-0 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
