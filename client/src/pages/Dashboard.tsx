import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

export function Dashboard() {
  const { session, isPro } = useAuth();
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState('');
  const [creating, setCreating] = useState(false);
  const [wantPrivate, setWantPrivate] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function createRoom() {
    if (!session?.access_token) return;
    setErr(null);
    setCreating(true);
    try {
      const res = await apiFetch('/api/rooms', session.access_token, {
        method: 'POST',
        body: JSON.stringify({ isPrivate: wantPrivate && isPro }),
      });
      const data = (await res.json().catch(() => ({}))) as { roomId?: string; error?: string };
      if (!res.ok) {
        setErr(
          data.error ||
            (res.status === 503
              ? 'API server is not configured (missing Supabase env on the server).'
              : `Could not create room (${res.status})`)
        );
        return;
      }
      if (!data.roomId) {
        setErr('Could not create room');
        return;
      }
      navigate(`/room/${data.roomId}`);
    } catch {
      setErr(
        'Cannot reach the API. From focusroom/server run npm run dev (port 4000). For local dev, leave VITE_API_URL empty in client/.env so requests use the Vite proxy.'
      );
    } finally {
      setCreating(false);
    }
  }

  function joinRoom() {
    const id = joinId.trim().toLowerCase();
    if (!/^[a-f0-9]{8}$/.test(id)) {
      setErr('Enter a valid 8-character room ID.');
      return;
    }
    setErr(null);
    navigate(`/room/${id}`);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-medium">Study rooms</h1>
        <p className="text-sm text-fr-muted">Create a room or join with an ID from a friend.</p>
      </div>

      <div className="rounded-xl border border-white/5 bg-fr-card/60 p-6 space-y-4">
        <h2 className="text-sm font-medium text-fr-text">Create</h2>
        <label className="flex items-center gap-2 text-sm text-fr-muted cursor-pointer">
          <input
            type="checkbox"
            checked={wantPrivate && isPro}
            disabled={!isPro}
            onChange={(e) => setWantPrivate(e.target.checked)}
            className="rounded border-white/20"
          />
          Private room (Pro)
        </label>
        {!isPro && (
          <p className="text-xs text-fr-muted">Upgrade to Pro for private rooms.</p>
        )}
        <button
          type="button"
          onClick={() => void createRoom()}
          disabled={creating}
          className="w-full rounded-xl bg-fr-accent/20 text-fr-accent py-2.5 text-sm hover:bg-fr-accent/30 transition-colors disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'New room'}
        </button>
      </div>

      <div className="rounded-xl border border-white/5 bg-fr-card/60 p-6 space-y-4">
        <h2 className="text-sm font-medium text-fr-text">Join</h2>
        <input
          placeholder="Room ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          className="w-full rounded-xl bg-fr-bg border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-fr-accent/40"
        />
        <button
          type="button"
          onClick={joinRoom}
          className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-fr-text hover:bg-white/5 transition-colors"
        >
          Join room
        </button>
      </div>

      {err && <p className="text-sm text-rose-300/90 text-center">{err}</p>}
    </div>
  );
}
