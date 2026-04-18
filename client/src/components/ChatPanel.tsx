import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types/room';

export function ChatPanel({
  messages,
  onSend,
  selfId,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  selfId: string | undefined;
}) {
  const [draft, setDraft] = useState('');
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full min-h-[280px] max-h-[min(420px,50vh)] rounded-xl border border-white/5 bg-fr-card/80 overflow-hidden">
      <div className="px-3 py-2 border-b border-white/5 text-xs text-fr-muted uppercase tracking-wider">
        Chat
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-sm">
        {messages.map((m) => (
          <div key={m.id} className="text-left">
            <span className={m.userId === selfId ? 'text-fr-accent' : 'text-fr-muted'}>
              {m.displayName}
            </span>
            <span className="text-fr-muted"> · </span>
            <span className="text-fr-text/90">{m.text}</span>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form
        className="p-2 border-t border-white/5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = draft.trim();
          if (!t) return;
          onSend(t);
          setDraft('');
        }}
      >
        <input
          className="flex-1 rounded-lg bg-fr-bg border border-white/10 px-3 py-2 text-sm text-fr-text placeholder:text-fr-muted/60 focus:outline-none focus:ring-1 focus:ring-fr-accent/40"
          placeholder="Message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
        />
        <button
          type="submit"
          className="rounded-lg bg-fr-accent/20 text-fr-accent px-3 py-2 text-sm hover:bg-fr-accent/30 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
