"use client";

import { useEffect } from "react";
import type { ChatSession } from "@/hooks/useChatHistory";

type Props = {
  open: boolean;
  onClose: () => void;
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

export function HistoryDrawer({
  open,
  onClose,
  sessions,
  activeId,
  onSelect,
  onDelete,
  onClearAll,
}: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Chat history"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-[88vw] max-w-sm flex-col border-l border-border bg-bg shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-serif text-base font-semibold text-fg">
            Chat history
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-bg-soft hover:text-fg active:scale-95"
          >
            <CloseIcon />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {sessions.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted">
              No saved conversations yet.
              <br />
              Your chats will appear here.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {sessions.map((s) => {
                const isActive = s.id === activeId;
                return (
                  <li key={s.id}>
                    <div
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
                        <TrashIcon />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {sessions.length > 0 && (
          <div className="border-t border-border p-3">
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
              className="w-full rounded-lg border border-border bg-bg-soft/50 px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-red-500/40 hover:text-red-400"
            >
              Clear all
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

/* ---------- Icons ---------- */

function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TrashIcon() {
  return (
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
  );
}
