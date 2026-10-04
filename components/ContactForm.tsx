"use client";

import { useState } from "react";

type Props = {
  /** Optional intro sentence the model passes in. Empty string when unused. */
  intro?: string;
};

type Status = "idle" | "sending" | "sent" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({ intro }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const hasIntro = Boolean(intro && intro.trim().length > 0);

  const canSubmit =
    status !== "sending" &&
    name.trim().length >= 2 &&
    EMAIL_RE.test(email.trim()) &&
    message.trim().length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          source: "the chat assistant",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Could not send. Please try again.");
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setError("Network error. Please check your connection.");
    }
  };

  // ------------------------------------------------------------
  // Success state
  // ------------------------------------------------------------
  if (status === "sent") {
    return (
      <div className="animate-fade-in-up mt-3 w-full max-w-xl rounded-2xl border border-border bg-bg-soft/70 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
            <CheckIcon />
          </div>
          <div className="min-w-0">
            <p className="font-serif text-base font-semibold text-fg">
              Message sent
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Thanks, {name.split(" ")[0] || "there"}. Waleed will get back to
              you at <span className="text-accent">{email}</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Collapsed — a single button that opens the form
  // ------------------------------------------------------------
  if (!open) {
    return (
      <div className="animate-fade-in-up mt-3 w-full max-w-xl">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group inline-flex w-full items-center gap-3 rounded-2xl border border-border bg-bg-soft/70 px-4 py-3 text-left transition-all duration-300 hover:border-accent/60 hover:bg-bg-soft hover:shadow-[0_4px_20px_rgba(201,169,97,0.12)] active:scale-[0.99]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent transition-transform duration-300 group-hover:scale-105">
            <MailIcon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-fg">
              Send a message directly
            </span>
            <span className="block text-[11px] text-muted">
              Name, email, message — takes 30 seconds
            </span>
          </span>
          <span className="shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-accent">
            <ChevronRightIcon />
          </span>
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Expanded — the form
  // ------------------------------------------------------------
  return (
    <div className="animate-fade-in-up mt-3 w-full max-w-xl rounded-2xl border border-border bg-bg-soft/70 p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {hasIntro ? (
            <p className="text-sm leading-relaxed text-muted">{intro}</p>
          ) : (
            <p className="text-sm font-medium text-fg">Send a message</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Collapse form"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-bg hover:text-fg active:scale-90"
        >
          <CloseIcon />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Your name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === "sending"}
            maxLength={80}
            placeholder="Jane Smith"
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/50 outline-none transition-colors focus:border-accent/60 disabled:opacity-60"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Your email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "sending"}
            maxLength={200}
            placeholder="jane@company.com"
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/50 outline-none transition-colors focus:border-accent/60 disabled:opacity-60"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Message
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={status === "sending"}
            rows={4}
            maxLength={4000}
            placeholder="Tell Waleed a bit about what you're looking for…"
            className="resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm leading-relaxed text-fg placeholder:text-muted/50 outline-none transition-colors focus:border-accent/60 disabled:opacity-60"
          />
          <span className="text-right text-[10px] text-muted/60">
            {message.length}/4000
          </span>
        </label>

        {status === "error" && error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-bg transition-all duration-300 hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(201,169,97,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
        >
          {status === "sending" ? (
            <>
              <SpinnerIcon />
              Sending…
            </>
          ) : (
            <>
              Send message
              <ArrowIcon />
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-muted/60">
          Your email is only used so Waleed can reply.
        </p>
      </form>
    </div>
  );
}

/* ---------- Icons ---------- */

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

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
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

function SpinnerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function MailIcon() {
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
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function ChevronRightIcon() {
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
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
