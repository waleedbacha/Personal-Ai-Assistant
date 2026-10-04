"use client";

import type { ChatMode } from "@/lib/buildSystemPrompt";

const MODES: { id: ChatMode; label: string; hint: string }[] = [
  { id: "default", label: "Default", hint: "Balanced answers" },
  { id: "recruiter", label: "Recruiter", hint: "Achievement-focused" },
  { id: "client", label: "Client", hint: "Services & process" },
  { id: "technical", label: "Technical", hint: "Stack & architecture" },
];

type Props = {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
};

export function ModeChips({ mode, onChange, disabled }: Props) {
  return (
    <div
      role="group"
      aria-label="Answer style"
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      {MODES.map((m) => {
        const active = m.id === mode;
        return (
          <button
            key={m.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m.id)}
            title={m.hint}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs ${
              active
                ? "border-accent bg-accent/15 text-accent shadow-[0_0_16px_rgba(201,169,97,0.2)]"
                : "border-border bg-bg-soft/50 text-muted hover:-translate-y-0.5 hover:border-accent/50 hover:text-fg"
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
