import type { AvatarStyle } from '../types/room';

const base = 'w-12 h-12 rounded-2xl shadow-lg border border-white/5';

export function AvatarSprite({ style, label }: { style: AvatarStyle; label?: string }) {
  if (style === 'orb') {
    return (
      <div
        className={`${base} bg-gradient-to-br from-violet-400/40 to-indigo-600/50 fr-anim-orb`}
        title={label}
      />
    );
  }
  if (style === 'wave') {
    return (
      <div
        className={`${base} bg-gradient-to-tr from-sky-400/30 to-emerald-500/30 fr-anim-wave`}
        title={label}
      />
    );
  }
  return (
    <div
      className={`${base} bg-gradient-to-br from-rose-300/25 to-amber-400/25 fr-anim-soft`}
      title={label}
    />
  );
}
