import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, signOut } = useAuth();
  const { pathname } = useLocation();
  const hideHeader = pathname === '/' && !session;

  return (
    <div className="min-h-dvh flex flex-col">
      {!isSupabaseConfigured && (
        <div className="bg-amber-500/15 border-b border-amber-500/25 text-amber-100/90 text-center text-xs sm:text-sm px-3 py-2">
          Add <code className="font-mono text-amber-50/90">VITE_SUPABASE_URL</code> and{' '}
          <code className="font-mono text-amber-50/90">VITE_SUPABASE_ANON_KEY</code> to{' '}
          <code className="font-mono text-amber-50/90">client/.env</code>, then restart Vite.
        </div>
      )}
      {!hideHeader && (
        <header className="border-b border-white/5 bg-fr-card/40 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Link to="/" className="text-fr-text font-medium tracking-tight hover:text-fr-accent transition-colors">
              FocusRoom
            </Link>
            <nav className="flex items-center gap-4 text-sm text-fr-muted">
              {session ? (
                <>
                  <Link to="/dashboard" className="hover:text-fr-text transition-colors">
                    Rooms
                  </Link>
                  <Link to="/billing" className="hover:text-fr-text transition-colors">
                    Upgrade
                  </Link>
                  <Link to="/settings" className="hover:text-fr-text transition-colors">
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="text-fr-muted hover:text-fr-text transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hover:text-fr-text transition-colors">
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-xl bg-fr-accent/20 text-fr-accent px-3 py-1.5 hover:bg-fr-accent/30 transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}
