"use client";

import { useState } from "react";
import { persona } from "@/data/persona";

type Props = {
  isLoading: boolean;
  onNewChat: () => void;
  onOpenHistory: () => void;
  historyCount: number;
};

export function ChatHeader({
  isLoading,
  onNewChat,
  onOpenHistory,
  historyCount,
}: Props) {
  const [logoFailed, setLogoFailed] = useState(false);

  const initials = persona.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasLogo = Boolean(persona.logo) && !logoFailed;

  return (
    <header className="safe-top safe-x animate-fade-in-down sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-bg/80 px-4 py-3 backdrop-blur-lg sm:px-6">
      <button
        type="button"
        onClick={onNewChat}
        aria-label="Back to home"
        className="shrink-0 cursor-pointer transition-opacity duration-200 hover:opacity-80 active:scale-95"
      >
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
      </button>

      <div className="min-w-0 flex-1">
        {!hasLogo && (
          <h1 className="truncate font-serif text-base font-semibold text-fg sm:text-lg">
            {persona.name}
          </h1>
        )}
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              isLoading ? "animate-accent-glow bg-accent" : "bg-emerald-400"
            }`}
          />
          {isLoading ? "Thinking…" : "Online"}
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenHistory}
        aria-label="Open chat history"
        className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-bg-soft/60 text-muted transition-all duration-300 hover:border-accent/60 hover:bg-bg-soft hover:text-fg active:scale-95"
      >
        <HistoryIcon />
        {historyCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-bg">
            {historyCount > 99 ? "99+" : historyCount}
          </span>
        )}
      </button>

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

/* ---------- Icons ---------- */

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

function HistoryIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <polyline points="3 3 3 8 8 8" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}
