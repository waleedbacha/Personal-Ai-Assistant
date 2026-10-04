"use client";

import { useState, KeyboardEvent, FormEvent } from "react";

type Variant = "hero" | "bottom";

type Props = {
  variant?: Variant;
  onSend: (text: string) => void;
  onStop?: () => void;
  isLoading: boolean;
  isListening: boolean;
  isMicSupported: boolean;
  onMicToggle: () => void;
  isSpeechSupported: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
};

export function ChatInput({
  variant = "bottom",
  onSend,
  onStop,
  isLoading,
  isListening,
  isMicSupported,
  onMicToggle,
  isSpeechSupported,
  isMuted,
  onMuteToggle,
}: Props) {
  const [value, setValue] = useState("");

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const isHero = variant === "hero";

  return (
    <form
      onSubmit={submit}
      className={
        isHero
          ? "flex items-end gap-2 rounded-full border border-border bg-bg-soft/80 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-lg transition-shadow duration-300 focus-within:shadow-[0_10px_50px_rgba(201,169,97,0.15)]"
          : "flex items-end gap-2 border-t border-border bg-bg/80 px-3 py-3 backdrop-blur-lg sm:px-6 sm:py-4"
      }
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        maxLength={2000}
        placeholder={isHero ? "Ask me anything…" : "Type a message…"}
        className={`flex-1 resize-none bg-transparent text-fg placeholder:text-muted/60 outline-none transition-all ${
          isHero
            ? "max-h-40 px-4 py-2.5 text-[15px]"
            : "max-h-40 rounded-xl bg-bg-soft px-4 py-3 text-sm sm:text-base"
        }`}
      />

      {isMicSupported && (
        <button
          type="button"
          onClick={onMicToggle}
          aria-label="Toggle voice input"
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all duration-300 ${
            isListening
              ? "animate-pulse-ring bg-red-500/90 text-white"
              : "text-muted hover:scale-105 hover:bg-bg-soft hover:text-fg active:scale-95"
          }`}
        >
          <MicIcon listening={isListening} />
        </button>
      )}

      {isSpeechSupported && (
        <button
          type="button"
          onClick={onMuteToggle}
          aria-label="Toggle voice output"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition-all duration-300 hover:scale-105 hover:bg-bg-soft hover:text-fg active:scale-95"
        >
          {isMuted ? <VolumeOffIcon /> : <VolumeIcon />}
        </button>
      )}

      {isLoading && onStop ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop generating"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bg-soft text-fg ring-1 ring-border transition-all duration-300 hover:bg-bg hover:ring-accent/50 active:scale-95"
        >
          <StopIcon />
        </button>
      ) : (
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          aria-label="Send"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-bg transition-all duration-300 hover:scale-105 hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(201,169,97,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          <SendIcon />
        </button>
      )}
    </form>
  );
}

/* ---------- Icons ---------- */

function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function MicIcon({ listening }: { listening: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="9"
        y="2"
        width="6"
        height="12"
        rx="3"
        fill={listening ? "currentColor" : "none"}
      />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}
