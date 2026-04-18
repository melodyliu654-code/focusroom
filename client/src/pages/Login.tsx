import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-medium text-center mb-8">Welcome back</h1>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setPending(true);
          const { error: err } = await signIn(email, password);
          setPending(false);
          if (err) {
            setError(err.message);
            return;
          }
          navigate(from, { replace: true });
        }}
      >
        <div>
          <label className="block text-xs text-fr-muted mb-1">Email</label>
          <input
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-xl bg-fr-card border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-fr-accent/40"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-fr-muted mb-1">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-xl bg-fr-card border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-fr-accent/40"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-rose-300/90">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-fr-accent/25 text-fr-accent py-2.5 text-sm font-medium hover:bg-fr-accent/35 transition-colors disabled:opacity-50"
        >
          {pending ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      <p className="text-center text-sm text-fr-muted mt-6">
        No account?{' '}
        <Link to="/signup" className="text-fr-accent hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
