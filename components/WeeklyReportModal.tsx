"use client";

import { useEffect, useRef, useState } from "react";
import { Markdown } from "./Markdown";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Phase = "loading" | "done" | "error";

type DataSizes = {
  commits: number;
  events: number;
  conversations: number;
};

export function WeeklyReportModal({ open, onClose }: Props) {
  const [report, setReport] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dataSizes, setDataSizes] = useState<DataSizes | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasFetched = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // ----------------------------------------------------------
  // Reset when modal opens
  // ----------------------------------------------------------
  useEffect(() => {
    if (open) {
      setPhase("loading");
      setProgress(0);
      setReport(null);
      setError(null);
      setDataSizes(null);
      setIsRefreshing(false);
      hasFetched.current = false;
    }
  }, [open]);

  // ----------------------------------------------------------
  // Progress animation
  // ----------------------------------------------------------
  useEffect(() => {
    if (!open || phase !== "loading") return;

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return p;
        const step = p < 40 ? 3 : p < 70 ? 1.5 : 0.5;
        return Math.min(95, p + step);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [open, phase]);

  // ----------------------------------------------------------
  // Fetching
  // ----------------------------------------------------------
  async function fetchReport(forceRefresh: boolean) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), 55000);

    try {
      const url = forceRefresh
        ? "/api/weekly-report?refresh=1"
        : "/api/weekly-report";
      const res = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Server error (${res.status}).`);
        setPhase("error");
        return;
      }

      const data = await res.json();

      if (!data.ok || typeof data.report !== "string") {
        setError(data.error || "Invalid response.");
        setPhase("error");
        return;
      }

      setReport(data.report);
      setDataSizes(data.dataSizes ?? null);
      setProgress(100);
      setTimeout(() => {
        setPhase("done");
        setIsRefreshing(false);
      }, 350);
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = (err as Error)?.name === "AbortError";
      setError(
        isAbort
          ? "Report took too long. Please try again."
          : "Network error. Please try again.",
      );
      setPhase("error");
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchReport(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ----------------------------------------------------------
  // Escape to close
  // ----------------------------------------------------------
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ----------------------------------------------------------
  // Lock body scroll
  // ----------------------------------------------------------
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-[60] animate-fade-in bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-label="Weekly report"
        className="fixed inset-0 z-[61] flex items-center justify-center p-3 sm:p-6"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="safe-top safe-bottom animate-fade-in-up flex h-full max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/15 text-accent">
                <ReportIcon />
              </span>
              <div className="min-w-0">
                <h2 className="font-serif text-base font-semibold text-fg sm:text-lg">
                  Weekly Report
                </h2>
                <p className="text-[11px] text-muted sm:text-xs">
                  {phase === "loading" && "Analysing the week…"}
                  {phase === "done" && "Report ready"}
                  {phase === "error" && "Something went wrong"}
                </p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1">
              {phase === "done" && (
                <button
                  type="button"
                  onClick={() => {
                    setIsRefreshing(true);
                    setPhase("loading");
                    setProgress(0);
                    fetchReport(true);
                  }}
                  disabled={isRefreshing}
                  aria-label="Refresh report"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-bg-soft hover:text-fg active:scale-95 disabled:opacity-50"
                >
                  <RefreshIcon />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-bg-soft hover:text-fg active:scale-95"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {phase === "loading" && (
              <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-12">
                <div className="flex flex-col items-center gap-3">
                  <span className="text-sm font-medium text-fg">
                    {isRefreshing
                      ? "Regenerating your report"
                      : "Generating your weekly report"}
                  </span>
                  <span className="text-xs text-muted">
                    Gathering commits, events, and conversations
                  </span>
                </div>

                <div className="w-full max-w-sm">
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bg-soft">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent/60 via-accent to-accent transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted/70">
                    <span>Working…</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                </div>

                <p className="max-w-xs text-center text-[11px] leading-relaxed text-muted/60">
                  This usually takes 5–10 seconds depending on how much activity
                  happened this week.
                </p>
              </div>
            )}

            {phase === "error" && (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-red-500/15 text-red-400">
                  <AlertIcon />
                </span>
                <p className="text-sm text-fg">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    hasFetched.current = false;
                    setPhase("loading");
                    setProgress(0);
                    setError(null);
                  }}
                  className="rounded-full border border-border bg-bg-soft/60 px-4 py-2 text-xs font-medium text-fg transition-colors hover:border-accent/50"
                >
                  Try again
                </button>
              </div>
            )}

            {phase === "done" && report && (
              <>
                {/* Stats bar */}
                {dataSizes && (
                  <div className="grid grid-cols-3 gap-2 border-b border-border px-4 py-4 sm:px-6">
                    <StatCard
                      value={dataSizes.commits}
                      label="Commits"
                      icon={<CommitIcon />}
                    />
                    <StatCard
                      value={dataSizes.events}
                      label="Events"
                      icon={<CalendarIcon />}
                    />
                    <StatCard
                      value={dataSizes.conversations}
                      label="Conversations"
                      icon={<ChatIcon />}
                    />
                  </div>
                )}

                <div className="markdown-body px-4 py-5 text-sm leading-relaxed text-fg sm:px-6 sm:py-6 sm:text-[15px]">
                  <Markdown>{report}</Markdown>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Stat card ---------- */

function StatCard({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-bg-soft/40 px-3 py-3">
      <span className="text-accent">{icon}</span>
      <span className="font-serif text-xl font-semibold text-fg sm:text-2xl">
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-muted">
        {label}
      </span>
    </div>
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

function ReportIcon() {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function RefreshIcon() {
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
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <polyline points="21 3 21 8 16 8" />
    </svg>
  );
}

function CommitIcon() {
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
      <circle cx="12" cy="12" r="4" />
      <line x1="2" y1="12" x2="8" y2="12" />
      <line x1="16" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function CalendarIcon() {
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
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChatIcon() {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
