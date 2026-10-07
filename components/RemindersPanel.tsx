"use client";

import type { Reminder } from "@/lib/reminders";

type Props = {
  items: Reminder[];
  isLoading: boolean;
  error: string | null;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
};

function formatDue(iso: string): { label: string; overdue: boolean } {
  const date = new Date(iso);
  const now = Date.now();
  const diff = date.getTime() - now;
  const overdue = diff < 0;

  // Absolute short format — readable everywhere
  const label = date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return { label, overdue };
}

export function RemindersPanel({
  items,
  isLoading,
  error,
  onComplete,
  onDelete,
}: Props) {
  if (isLoading && items.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-muted">Loading…</p>;
  }

  if (error) {
    return (
      <p className="px-4 py-8 text-center text-sm text-red-300">{error}</p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-muted">No reminders yet.</p>
        <p className="mt-2 text-xs text-muted/70">
          Ask the assistant to remind you about something.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {items.map((r) => {
        const { label, overdue } = formatDue(r.dueAt);
        return (
          <div
            key={r._id}
            className="group flex items-start gap-2 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-bg-soft/60"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">{r.text}</p>
              <p
                className={`mt-0.5 text-[11px] ${
                  overdue ? "text-red-400" : "text-muted"
                }`}
              >
                {overdue ? "Overdue · " : "Due · "}
                {label}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => r._id && onComplete(r._id)}
                aria-label="Mark as done"
                className="grid h-7 w-7 place-items-center rounded-full text-muted transition-all hover:bg-accent/15 hover:text-accent active:scale-90"
              >
                <CheckIcon />
              </button>
              <button
                type="button"
                onClick={() => r._id && onDelete(r._id)}
                aria-label="Delete reminder"
                className="grid h-7 w-7 place-items-center rounded-full text-muted transition-all hover:bg-bg hover:text-red-400 active:scale-90"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CheckIcon() {
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
      <polyline points="20 6 9 17 4 12" />
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
