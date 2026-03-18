'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Just for this mock, we sign out first to ensure clean state
      await signOut();
      
      const { authService } = await import('@/lib/auth');
      await authService.signIn(email, password);

      const { userApi } = await import('@/lib/api/userApi');
      const profile = await userApi.getMyProfile();
      router.push(profile.profileComplete ? '/feed' : '/profile/setup');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center px-4 py-8 md:px-8 md:py-12 lg:px-16 lg:py-16 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <h2 className="text-center text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-500">
          Welcome back
        </h2>
        <p className="mt-3 text-center text-base text-gray-600 dark:text-gray-300 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          Sign in to the Department Engagement &amp; Career Platform
        </p>
      </div>

      <div className="w-full max-w-md mx-auto p-6 md:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-500 delay-200 card-hover transition-colors duration-200">
        <form className="space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-sm text-red-700 font-medium" role="alert" id="login-error">{error}</p>
            </div>
          )}
          
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="peer w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 placeholder-transparent hover:border-gray-300 dark:hover:border-gray-500"
              placeholder="Email address"
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label
              htmlFor="email"
              className="absolute left-4 top-2 text-xs font-medium text-gray-500 dark:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all duration-200 cursor-text"
            >
              Email address
            </label>
          </div>

          <div className="relative">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="peer w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 placeholder-transparent hover:border-gray-300 dark:hover:border-gray-500"
              placeholder="Password"
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label
              htmlFor="password"
              className="absolute left-4 top-2 text-xs font-medium text-gray-500 dark:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all duration-200 cursor-text"
            >
              Password
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 focus:ring-4 focus:ring-blue-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 button-press"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Accounts are created by the department administrator. 
            <br />If you don&apos;t have an account, please contact the department office.
          </p>
        </div>
      </div>
    </div>
  );
}
