"use client";

import type { ChatSession } from "@/hooks/useChatHistory";

type Props = {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function HistoryPanel({
  sessions,
  activeId,
  onSelect,
  onDelete,
  onClearAll,
}: Props) {
  if (sessions.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted">
        No saved conversations yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {sessions.map((s) => {
        const isActive = s.id === activeId;
        return (
          <div
            key={s.id}
            className={`group flex items-start gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
              isActive
                ? "border-accent/40 bg-accent/10"
                : "border-transparent hover:border-border hover:bg-bg-soft/60"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              className="min-w-0 flex-1 text-left"
            >
              <p
                className={`truncate text-sm font-medium ${
                  isActive ? "text-accent" : "text-fg"
                }`}
              >
                {s.title}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                <span>{relativeTime(s.updatedAt)}</span>
                {s.mode !== "default" && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{s.mode}</span>
                  </>
                )}
              </p>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(s.id);
              }}
              aria-label={`Delete "${s.title}"`}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted opacity-0 transition-all hover:bg-bg hover:text-red-400 group-hover:opacity-100 active:scale-90"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => {
          if (
            window.confirm(
              "Delete all saved conversations? This cannot be undone.",
            )
          ) {
            onClearAll();
          }
        }}
        className="mt-2 w-full rounded-lg border border-border bg-bg-soft/50 px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-red-500/40 hover:text-red-400"
      >
        Clear all
      </button>
    </div>
  );
}
