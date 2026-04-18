import { useEffect, useState } from 'react';
import type { TimerState } from '../types/room';

function formatMs(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/** Derive remaining time from server timer state (synced via Socket.io). */
export function useTimerRemaining(timer: TimerState | null): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!timer?.isRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [timer?.isRunning, timer?.endsAt]);

  if (!timer) return 0;
  if (timer.isRunning && timer.endsAt) {
    void tick;
    return Math.max(0, timer.endsAt - Date.now());
  }
  return timer.pausedRemainingMs;
}

export function TimerDisplay({ timer }: { timer: TimerState | null }) {
  const remaining = useTimerRemaining(timer);
  if (!timer) {
    return <div className="text-fr-muted text-sm">Connecting to timer…</div>;
  }

  const phaseLabel = timer.phase === 'focus' ? 'Focus' : 'Break';

  return (
    <div className="text-center space-y-2">
      <p className="text-xs uppercase tracking-[0.2em] text-fr-muted">{phaseLabel}</p>
      <div className="text-5xl sm:text-6xl font-medium tabular-nums tracking-tight text-fr-text">
        {formatMs(remaining)}
      </div>
      <p className="text-xs text-fr-muted">
        {timer.isRunning ? 'Running' : 'Paused'} · 25 / 5 min default
      </p>
    </div>
  );
}
