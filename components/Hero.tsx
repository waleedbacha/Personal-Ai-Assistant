"use client";

import { useState } from "react";
import { persona } from "@/data/persona";
import { ChatInput } from "./ChatInput";
import { SuggestionChips } from "./SuggestionChips";
import { ModeChips } from "./ModeChips";
import type { ChatMode } from "@/lib/buildSystemPrompt";

type Props = {
  onSend: (text: string) => void;
  isLoading: boolean;
  isListening: boolean;
  isMicSupported: boolean;
  onMicToggle: () => void;
  isSpeechSupported: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onOpenHistory: () => void;
  historyCount: number;
};

export function Hero({
  onSend,
  isLoading,
  isListening,
  isMicSupported,
  onMicToggle,
  isSpeechSupported,
  isMuted,
  onMuteToggle,
  mode,
  onModeChange,
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
  const eyebrowColor = persona.eyebrowColor || "#3b82f6";
  const eyebrowText = persona.eyebrow || "";

  return (
    <div className="bg-glow relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
      {/* History button — top-right, only when there is history */}
      {historyCount > 0 && (
        <button
          type="button"
          onClick={onOpenHistory}
          aria-label="Open chat history"
          className="animate-fade-in-down absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-border bg-bg-soft/60 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-sm transition-all duration-300 hover:border-accent/60 hover:bg-bg-soft hover:text-fg active:scale-95 sm:right-6 sm:top-6 sm:text-sm"
        >
          <HistoryIcon />
          <span className="hidden sm:inline">History</span>
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-bg">
            {historyCount > 99 ? "99+" : historyCount}
          </span>
        </button>
      )}

      <div className="w-full max-w-3xl text-center">
        {/* ============ ANIMATED EYEBROW ============ */}
        <div
          className="mb-6 flex flex-col items-center"
          aria-label={eyebrowText}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-[0.35em] sm:text-sm"
            style={{ color: eyebrowColor }}
          >
            {eyebrowText.split("").map((char, i) => (
              <span
                key={`${char}-${i}`}
                className="eyebrow-letter"
                style={{ animationDelay: `${-(i * 0.08)}s` }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </h2>

          <span
            className="eyebrow-underline mt-3 block h-[2px] w-16 rounded-full sm:w-24"
            style={{ backgroundColor: eyebrowColor }}
          />
        </div>

        {/* Logo */}
        <div className="animate-fade-in-scale stagger-1 flex justify-center">
          {hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={persona.logo}
              alt={persona.name}
              onError={() => setLogoFailed(true)}
              className="h-32 w-auto max-w-[90vw] object-contain sm:h-44 lg:h-56"
            />
          ) : (
            <h1 className="font-serif text-4xl font-bold leading-tight text-fg sm:text-6xl lg:text-7xl">
              {persona.name}
            </h1>
          )}
        </div>

        {/* Tagline */}
        <p className="animate-fade-in-up stagger-3 mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          {persona.tagline}
        </p>

        {/* Mode chips */}
        <div className="animate-fade-in-up stagger-4 mt-8">
          <ModeChips mode={mode} onChange={onModeChange} disabled={isLoading} />
        </div>

        {/* Input pill */}
        <div className="animate-fade-in-up stagger-5 mt-4">
          <ChatInput
            variant="hero"
            onSend={onSend}
            onStop={() => {}}
            isLoading={isLoading}
            isListening={isListening}
            isMicSupported={isMicSupported}
            onMicToggle={onMicToggle}
            isSpeechSupported={isSpeechSupported}
            isMuted={isMuted}
            onMuteToggle={onMuteToggle}
          />
        </div>

        {/* Suggestion chips */}
        <div className="animate-fade-in-up stagger-6 mt-6">
          <SuggestionChips
            suggestions={persona.suggestions}
            onSelect={onSend}
            disabled={isLoading}
          />
        </div>

        {/* Footer hint */}
        <p className="animate-fade-in stagger-7 mt-12 text-xs text-muted/60">
          Powered by WB · {persona.role}
        </p>
      </div>
    </div>
  );
}

/* ---------- Icons ---------- */

function HistoryIcon() {
  return (
    <svg
      width="14"
      height="14"
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
