import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      {/* Navigation Bar (Public) */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between p-4 px-6 md:px-8">
          <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse group">
            {/* Logo Placeholder */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              D
            </div>
            <span className="self-center text-2xl font-bold whitespace-nowrap text-gray-900 dark:text-white tracking-tight">
              DECP
            </span>
          </Link>
          <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
            <Link href="/login">
              <button
                type="button"
                className="text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm px-6 py-2.5 text-center shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 button-press dark:focus:ring-blue-800"
              >
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-48 md:pb-32 px-4 shadow-[inset_0_-100px_100px_-10px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_-100px_100px_-10px_rgba(17,24,39,0.7)]">
        <div className="max-w-7xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight leading-none text-gray-900 dark:text-white md:text-6xl lg:text-7xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Connect.</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Collaborate.</span>{" "}
            Grow.
          </h1>
          <p className="mb-10 text-lg font-normal text-gray-500 dark:text-gray-400 lg:text-xl sm:px-16 xl:px-48 leading-relaxed max-w-4xl mx-auto">
            The Department Engagement &amp; Career Platform is your dedicated space for students and alumni. Discover jobs, attend events, share knowledge, and build your professional network within the department.
          </p>
          <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <Link href="/login">
              <span className="inline-flex justify-center items-center py-3.5 px-8 text-base font-medium text-center text-white rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 button-press hover:-translate-y-1">
                Get Started
                <svg className="w-5 h-5 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </span>
            </Link>
            <a href="#features" className="inline-flex justify-center items-center py-3.5 px-8 text-base font-medium text-center text-gray-900 dark:text-white rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 transition-colors duration-200">
              Learn deeper
            </a>
          </div>
        </div>
      </section>

      {/* Feature Section Preview */}
      <section id="features" className="bg-white dark:bg-gray-900 py-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center animate-in fade-in zoom-in-95 duration-1000 delay-300">
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 card-hover">
              <div className="w-14 h-14 mx-auto bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Careers &amp; Jobs</h3>
              <p className="text-gray-500 dark:text-gray-400">Find exclusive internship and job opportunities posted by alumni and faculty.</p>
            </div>
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 card-hover">
              <div className="w-14 h-14 mx-auto bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Department Events</h3>
              <p className="text-gray-500 dark:text-gray-400">RSVP to seminars, workshops, and department gatherings to stay engaged.</p>
            </div>
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 card-hover">
              <div className="w-14 h-14 mx-auto bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Community Hub</h3>
              <p className="text-gray-500 dark:text-gray-400">Ask questions, share advice, and connect with peers and experienced alumni.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} Department Engagement &amp; Career Platform. Accounts are created by department administration.</p>
        </div>
      </footer>
    </div>
  );
}
