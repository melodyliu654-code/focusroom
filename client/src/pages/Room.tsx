import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AudioDock } from '../components/AudioDock';
import { AvatarSprite } from '../components/AvatarSprite';
import { ChatPanel } from '../components/ChatPanel';
import { TimerDisplay } from '../components/TimerDisplay';
import { apiFetch } from '../lib/api';
import { useRoomSocket } from '../hooks/useRoomSocket';

export function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const { session, user } = useAuth();
  const [metaErr, setMetaErr] = useState<string | null>(null);
  const [metaOk, setMetaOk] = useState(false);

  const { connected, joinError, users, messages, timer, hostUserId, sendChat, timerCommand } =
    useRoomSocket(metaOk ? roomId : undefined);

  useEffect(() => {
    if (!roomId || !session?.access_token) return;
    let cancelled = false;
    void (async () => {
      const res = await apiFetch(`/api/rooms/${roomId}`, session.access_token);
      if (cancelled) return;
      if (!res.ok) {
        setMetaErr('Room not found or unavailable.');
        setMetaOk(false);
        return;
      }
      const meta = await res.json();
      if ((meta as { full?: boolean }).full) {
        setMetaErr('This room is full.');
        setMetaOk(false);
        return;
      }
      setMetaErr(null);
      setMetaOk(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, session?.access_token]);

  const isHost = user?.id && hostUserId === user.id;
  const displayError = metaErr || joinError;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6 min-h-[calc(100dvh-56px)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-fr-muted uppercase tracking-wider">Room</p>
          <p className="font-mono text-sm text-fr-text">{roomId}</p>
        </div>
        <div className="text-xs text-fr-muted">
          {connected ? 'Connected' : 'Connecting…'}
        </div>
        <Link to="/dashboard" className="text-sm text-fr-muted hover:text-fr-text">
          Leave
        </Link>
      </div>

      {displayError && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {displayError}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 items-start">
        <aside className="rounded-xl border border-white/5 bg-fr-card/50 p-4">
          <p className="text-xs text-fr-muted uppercase tracking-wider mb-3">Here now</p>
          <div className="grid grid-cols-2 gap-3">
            {users.map((u) => (
              <div key={u.socketId} className="flex flex-col items-center gap-1">
                <AvatarSprite style={u.avatarStyle} label={u.displayName} />
                <span className="text-xs text-fr-muted truncate max-w-full">{u.displayName}</span>
              </div>
            ))}
            {users.length === 0 && <span className="text-sm text-fr-muted col-span-2">No one yet</span>}
          </div>
        </aside>

        <section className="rounded-xl border border-white/5 bg-fr-card/40 p-8 flex flex-col items-center justify-center gap-8 min-h-[280px]">
          <TimerDisplay timer={timer} />
          {isHost ? (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => timerCommand('start')}
                className="rounded-xl bg-fr-accent/25 text-fr-accent px-4 py-2 text-sm hover:bg-fr-accent/35 transition-colors"
              >
                Start
              </button>
              <button
                type="button"
                onClick={() => timerCommand('pause')}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5 transition-colors"
              >
                Pause
              </button>
              <button
                type="button"
                onClick={() => timerCommand('reset')}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => timerCommand('skip')}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5 transition-colors"
              >
                Skip phase
              </button>
            </div>
          ) : (
            <p className="text-sm text-fr-muted">Only the host can control the timer.</p>
          )}
        </section>

        <aside className="lg:min-h-[320px]">
          <ChatPanel messages={messages} onSend={sendChat} selfId={user?.id} />
        </aside>
      </div>

      <AudioDock />
    </div>
  );
}
