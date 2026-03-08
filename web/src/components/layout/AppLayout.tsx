'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { href: '/feed',     label: 'Feed',      icon: '🏠' },
  { href: '/jobs',     label: 'Jobs',       icon: '💼' },
  { href: '/events',   label: 'Events',     icon: '📅' },
  { href: '/messages', label: 'Messages',   icon: '💬' },
  { href: '/users',    label: 'Directory',  icon: '👥' },
  { href: '/profile',  label: 'Profile',    icon: '👤' },
];

const adminLinks = [
  { href: '/admin/users',      label: 'Manage Users',  icon: '⚙️' },
  { href: '/admin/dashboard',  label: 'Analytics',     icon: '📊' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:w-56 bg-white border-r border-gray-200 fixed h-full z-10">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">DECP</h1>
          <p className="text-xs text-gray-400">Department Platform</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}

          {user?.role === 'ADMIN' && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin
              </div>
              {adminLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-red-50 text-red-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User info + sign out */}
        <div className="p-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 truncate mb-2">{user?.email}</div>
          <button
            onClick={signOut}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-1 md:ml-56 pb-16 md:pb-0">
        {children}
      </main>

      {/* ── Mobile Bottom Tab Bar ───────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around py-2">
          {navLinks.slice(0, 5).map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
                isActive(link.href) ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <span className="text-lg leading-none">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
