import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/** Stable ambient samples (local playback only — not synced). */
const TRACKS: { id: string; label: string; url: string; proOnly?: boolean }[] = [
  {
    id: 'lofi',
    label: 'Lofi',
    url: '/focusroom/client/public/lofi.mp3',
  },
  {
    id: 'rain',
    label: 'Rain',
    url: 'https://actions.google.com/sounds/v1/weather/rain.ogg',
  },
  {
    id: 'cafe',
    label: 'Café',
    url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
  },
  {
    id: 'night',
    label: 'Night',
    url: 'https://actions.google.com/sounds/v1/ambiences/movie_theater.ogg',
    proOnly: true,
  },
];

export function AudioDock() {
  const { isPro } = useAuth();
  const [active, setActive] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.35);
  const refs = useRef<Record<string, HTMLAudioElement | null>>({});

  useEffect(() => {
    TRACKS.forEach((t) => {
      const el = refs.current[t.id];
      if (el) el.volume = volume;
    });
  }, [volume]);

  useEffect(() => {
    TRACKS.forEach((t) => {
      const el = refs.current[t.id];
      if (!el) return;
      if (active === t.id) {
        void el.play().catch(() => {
          /* autoplay blocked until user gesture — expected */
        });
      } else {
        el.pause();
        el.currentTime = 0;
      }
    });
  }, [active]);

  return (
    <div className="rounded-xl border border-white/5 bg-fr-card/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <span className="text-xs text-fr-muted uppercase tracking-wider shrink-0">Ambient</span>
      <div className="flex flex-wrap gap-2">
        {TRACKS.map((t) => {
          const locked = t.proOnly && !isPro;
          return (
            <button
              key={t.id}
              type="button"
              disabled={locked}
              onClick={() => {
                if (locked) return;
                setActive((cur) => (cur === t.id ? null : t.id));
              }}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                active === t.id
                  ? 'bg-fr-accent/25 text-fr-accent'
                  : 'bg-fr-bg/80 text-fr-muted hover:text-fr-text'
              } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {t.label}
              {t.proOnly ? ' · Pro' : ''}
            </button>
          );
        })}
      </div>
      <label className="flex items-center gap-2 text-xs text-fr-muted ml-auto">
        Vol
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-24 accent-fr-accent"
        />
      </label>
      {TRACKS.map((t) => (
        <audio key={t.id} ref={(el) => { refs.current[t.id] = el; }} src={t.url} loop playsInline />
      ))}
    </div>
  );
}
