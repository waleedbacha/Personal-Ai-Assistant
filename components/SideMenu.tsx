"use client";

import { useEffect, useState } from "react";
import type { ChatSession } from "@/hooks/useChatHistory";
import type { Reminder } from "@/lib/reminders";
import { HistoryPanel } from "./HistoryPanel";
import { RemindersPanel } from "./RemindersPanel";

type View = "menu" | "reminders" | "history";

type Props = {
  open: boolean;
  onClose: () => void;
  // Reminders
  reminders: Reminder[];
  remindersLoading: boolean;
  remindersError: string | null;
  dueCount: number;
  onCompleteReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  // History
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClearAllSessions: () => void;
  // Actions
  onNewChat: () => void;
};

export function SideMenu({
  open,
  onClose,
  reminders,
  remindersLoading,
  remindersError,
  dueCount,
  onCompleteReminder,
  onDeleteReminder,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAllSessions,
  onNewChat,
}: Props) {
  const [view, setView] = useState<View>("menu");

  // Reset to root menu when the drawer closes
  useEffect(() => {
    if (!open) setView("menu");
  }, [open]);

  // Escape closes
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

      {/* Drawer — slides in from the right */}
      <aside
        role="dialog"
        aria-label="Menu"
        aria-hidden={!open}
        className={`safe-top safe-bottom safe-x fixed right-0 top-0 z-50 flex h-full w-[88vw] max-w-sm flex-col border-l border-border bg-bg shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          {view !== "menu" ? (
            <button
              type="button"
              onClick={() => setView("menu")}
              aria-label="Back to menu"
              className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-bg-soft hover:text-fg active:scale-95"
            >
              <BackIcon />
            </button>
          ) : null}

          <h2 className="flex-1 font-serif text-base font-semibold text-fg">
            {view === "menu" && "Menu"}
            {view === "reminders" && "Reminders"}
            {view === "history" && "Chat history"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-bg-soft hover:text-fg active:scale-95"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {view === "menu" && (
            <nav className="flex flex-col p-2">
              <button
                type="button"
                onClick={() => setView("reminders")}
                className="flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-left transition-colors hover:border-border hover:bg-bg-soft/60"
              >
                <span className="flex items-center gap-3">
                  <BellIcon />
                  <span className="text-sm font-medium text-fg">Reminders</span>
                </span>
                {dueCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-bg">
                    {dueCount > 99 ? "99+" : dueCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setView("history")}
                className="flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-left transition-colors hover:border-border hover:bg-bg-soft/60"
              >
                <span className="flex items-center gap-3">
                  <HistoryIcon />
                  <span className="text-sm font-medium text-fg">
                    Chat history
                  </span>
                </span>
                {sessions.length > 0 && (
                  <span className="text-xs text-muted">{sessions.length}</span>
                )}
              </button>

              <div className="mx-4 my-2 h-px bg-border" />

              <button
                type="button"
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-left transition-colors hover:border-border hover:bg-bg-soft/60"
              >
                <PlusIcon />
                <span className="text-sm font-medium text-fg">New chat</span>
              </button>
            </nav>
          )}

          {view === "reminders" && (
            <RemindersPanel
              items={reminders}
              isLoading={remindersLoading}
              error={remindersError}
              onComplete={onCompleteReminder}
              onDelete={onDeleteReminder}
            />
          )}

          {view === "history" && (
            <HistoryPanel
              sessions={sessions}
              activeId={activeSessionId}
              onSelect={(id) => {
                onSelectSession(id);
                onClose();
              }}
              onDelete={onDeleteSession}
              onClearAll={onClearAllSessions}
            />
          )}
        </div>
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

function BackIcon() {
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
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function BellIcon() {
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
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
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

function PlusIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
