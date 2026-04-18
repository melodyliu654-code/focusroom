import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-8">
      <p className="text-xs uppercase tracking-[0.25em] text-fr-muted">Study together, quietly</p>
      <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-fr-text">FocusRoom</h1>
      <p className="text-fr-muted text-lg leading-relaxed">
        Body doubling, Pomodoro, ambient sound, and a light chat — a calm space to study with others.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/signup"
          className="rounded-xl bg-fr-accent/25 text-fr-accent px-6 py-3 text-sm font-medium hover:bg-fr-accent/35 transition-colors"
        >
          Get started
        </Link>
        <Link
          to="/login"
          className="rounded-xl border border-white/10 px-6 py-3 text-sm text-fr-muted hover:text-fr-text hover:border-white/20 transition-colors"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
