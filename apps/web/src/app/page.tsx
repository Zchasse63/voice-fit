/**
 * VoiceFit Web Dashboard - Landing Page
 * 
 * This page redirects users to login or dashboard based on auth status
 */

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light-primary dark:bg-background-dark-primary">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
          VoiceFit Web Dashboard
        </h1>
        <p className="text-md text-text-light-secondary dark:text-text-dark-secondary mb-8">
          Your AI fitness coach, now on the web
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="btn btn-primary px-8 py-3 rounded-md"
          >
            Sign In
          </a>
          <a
            href="/signup"
            className="btn px-8 py-3 rounded-md border border-border-light-light dark:border-border-dark-light"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}

