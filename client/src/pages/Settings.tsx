import { useState } from 'react';
import { getAvatarStyle, getDisplayName, setAvatarStyle, setDisplayName, type AvatarStyle } from '../lib/prefs';
import { useAuth } from '../contexts/AuthContext';
import { AvatarSprite } from '../components/AvatarSprite';

const styles: AvatarStyle[] = ['soft', 'orb', 'wave'];

export function Settings() {
  const { user, isPro } = useAuth();
  const [name, setName] = useState(() => getDisplayName());
  const [av, setAv] = useState<AvatarStyle>(() => getAvatarStyle());

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-medium">Settings</h1>
        <p className="text-sm text-fr-muted mt-1">Signed in as {user?.email}</p>
      </div>

      <div className="rounded-xl border border-white/5 bg-fr-card/60 p-6 space-y-4">
        <label className="block text-sm text-fr-muted">Display name (shown in rooms)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl bg-fr-bg border border-white/10 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => setDisplayName(name)}
          className="rounded-xl bg-fr-accent/20 text-fr-accent px-4 py-2 text-sm hover:bg-fr-accent/30 transition-colors"
        >
          Save name
        </button>
      </div>

      <div className="rounded-xl border border-white/5 bg-fr-card/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-fr-text">Avatar style</span>
          {!isPro && <span className="text-xs text-fr-muted">Pro unlocks extra customization</span>}
        </div>
        <div className="flex gap-4">
          {styles.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setAv(s);
                setAvatarStyle(s);
              }}
              className={`rounded-xl p-2 border transition-colors ${
                av === s ? 'border-fr-accent/60 bg-fr-accent-dim' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <AvatarSprite style={s} />
              <span className="block text-xs text-fr-muted mt-1 capitalize">{s}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
