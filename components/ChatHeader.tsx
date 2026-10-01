'use client';

import { useState } from 'react';
import { persona } from '@/data/persona';

type Props = {
  isLoading: boolean;
  onNewChat: () => void;
};

export function ChatHeader({ isLoading, onNewChat }: Props) {
  const [logoFailed, setLogoFailed] = useState(false);

  const initials = persona.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const hasLogo = Boolean(persona.logo) && !logoFailed;

  return (
    <header className="animate-fade-in-down sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-bg/80 px-4 py-3 backdrop-blur-lg sm:px-6">
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={persona.logo}
          alt={persona.name}
          onError={() => setLogoFailed(true)}
          className="h-9 w-auto max-w-[140px] object-contain"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent ring-1 ring-accent/30">
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        {!hasLogo && (
          <h1 className="truncate font-serif text-base font-semibold text-fg sm:text-lg">
            {persona.name}
          </h1>
        )}
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              isLoading ? 'animate-accent-glow bg-accent' : 'bg-emerald-400'
            }`}
          />
          {isLoading ? 'Thinking…' : 'Online'}
        </p>
      </div>

      <button
        type="button"
        onClick={onNewChat}
        aria-label="Start a new chat"
        className="group flex items-center gap-1.5 rounded-full border border-border bg-bg-soft/60 px-3 py-1.5 text-xs font-medium text-muted transition-all duration-300 hover:border-accent/60 hover:bg-bg-soft hover:text-fg active:scale-95 sm:text-sm"
      >
        <span className="transition-transform duration-300 group-hover:rotate-90">
          <PlusIcon />
        </span>
        <span className="hidden sm:inline">New chat</span>
      </button>
    </header>
  );
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}