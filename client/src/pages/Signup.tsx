import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-medium text-center mb-8">Create account</h1>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setPending(true);
          const { error: err } = await signUp(email, password);
          setPending(false);
          if (err) {
            setError(err.message);
            return;
          }
          navigate('/login', { replace: true });
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
            autoComplete="new-password"
            required
            minLength={6}
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
          {pending ? 'Creating…' : 'Sign up'}
        </button>
      </form>
      <p className="text-center text-sm text-fr-muted mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-fr-accent hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
