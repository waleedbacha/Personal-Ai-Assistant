"use client";

type Props = {
  action: "created" | "completed" | "deleted";
  text?: string;
  dueAt?: string;
};

function formatDue(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReminderConfirmation({ action, text, dueAt }: Props) {
  const config = {
    created: {
      icon: <BellIcon />,
      title: "Reminder created",
      subtitle: text
        ? `${text}${dueAt ? ` · ${formatDue(dueAt)}` : ""}`
        : "Saved successfully",
      accent: "bg-accent/15 text-accent",
    },
    completed: {
      icon: <CheckIcon />,
      title: "Reminder completed",
      subtitle: text || "Marked as done",
      accent: "bg-emerald-500/15 text-emerald-400",
    },
    deleted: {
      icon: <TrashIcon />,
      title: "Reminder deleted",
      subtitle: text || "Removed permanently",
      accent: "bg-red-500/15 text-red-400",
    },
  }[action];

  return (
    <div className="animate-fade-in-up mt-3 w-full max-w-xl">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-bg-soft/70 px-4 py-3">
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${config.accent}`}
        >
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">{config.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">
            {config.subtitle}
          </p>
        </div>
      </div>
    </div>
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

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
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
      width="16"
      height="16"
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
    </svg>
  );
}
