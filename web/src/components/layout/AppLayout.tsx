'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, UserDTO } from '@/lib/api/userApi';
import NotificationBell from './NotificationBell';
import UserAvatar from '@/components/shared/UserAvatar';
import { messagingService } from '@/lib/messaging';
import ThemeToggle from '@/components/theme/ThemeToggle';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* ── Top Navbar ──────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800 z-20 transition-colors">
        <div className="px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/feed" className="text-xl font-bold text-blue-600 cursor-pointer">
            DECP
          </Link>

          {/* Nav links + right controls */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive(link.href)
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
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

            </div>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 md:mx-2" />

            <div className="flex items-center gap-2">
              <ThemeToggle />
               <NotificationBell />

              
              {/* Avatar + dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-gray-900"
                >
                  {profile ? (
                    <UserAvatar
                      name={profile.name}
                      initials={profile.initials}
                      profilePictureUrl={profile.profilePictureUrl}
                      roleBadge={profile.roleBadge}
                      size="md"
                    />
                  ) : (
                    <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg transition-colors dark:border-gray-800 dark:bg-gray-900">
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      Profile
                    </Link>

                    {user?.role === 'ADMIN' && (
                      <>
                        <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                        {adminLinks.map(link => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setDropdownOpen(false)}
                            className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </>
                    )}

                    <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                    <button
                      onClick={() => { signOut(); setDropdownOpen(false); }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>

             
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="pt-14 pb-16 md:pb-0">
        {children}
      </main>

      {/* ── Mobile Bottom Tab Bar ───────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-800 z-10 transition-colors">
        <div className="flex justify-around py-2">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors cursor-pointer ${
                isActive(link.href) ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
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
