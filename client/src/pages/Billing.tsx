import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

export function Billing() {
  const { session, isPro, refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.get('success')) void refreshProfile();
  }, [params, refreshProfile]);

  async function checkout() {
    if (!session?.access_token) return;
    setError(null);
    setLoading(true);
    const res = await apiFetch('/api/billing/checkout-session', session.access_token, { method: 'POST' });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error || 'Checkout unavailable');
      return;
    }
    const data = (await res.json()) as { url?: string };
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-medium">Upgrade</h1>
        <p className="text-sm text-fr-muted mt-1">Pro is billed monthly via Stripe Checkout.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-fr-card/40 p-5 space-y-2">
          <h2 className="font-medium">Free</h2>
          <p className="text-sm text-fr-muted">Public rooms, core timer & chat, ambient sounds.</p>
          <p className="text-xs text-fr-muted pt-2">{isPro ? '' : 'Current plan'}</p>
        </div>
        <div className="rounded-xl border border-fr-accent/30 bg-fr-accent-dim p-5 space-y-3">
          <h2 className="font-medium text-fr-accent">Pro</h2>
          <ul className="text-sm text-fr-muted space-y-1 list-disc list-inside">
            <li>Private rooms</li>
            <li>Extra ambient track</li>
            <li>Avatar customization</li>
          </ul>
          {isPro ? (
            <p className="text-xs text-fr-accent pt-2">You are on Pro. Thank you.</p>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => void checkout()}
              className="w-full rounded-xl bg-fr-accent/30 text-fr-accent py-2 text-sm hover:bg-fr-accent/40 transition-colors disabled:opacity-50"
            >
              {loading ? 'Redirecting…' : 'Subscribe with Stripe'}
            </button>
          )}
        </div>
      </div>

      {params.get('success') && (
        <p className="text-sm text-fr-muted text-center">Payment received — refreshing your plan…</p>
      )}
      {params.get('canceled') && <p className="text-sm text-fr-muted text-center">Checkout canceled.</p>}
      {error && <p className="text-sm text-rose-300/90 text-center">{error}</p>}

      <p className="text-center text-sm">
        <Link to="/dashboard" className="text-fr-muted hover:text-fr-text">
          Back to rooms
        </Link>
      </p>
    </div>
  );
}
