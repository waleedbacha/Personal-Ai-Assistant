"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export function InstallBanner() {
  const { shouldShowBanner, promptInstall, dismissBanner, isInstalled } =
    useInstallPrompt();

  if (isInstalled || !shouldShowBanner) return null;

  return (
    <div className="animate-fade-in-up fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-96">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-bg-soft/95 p-4 shadow-2xl backdrop-blur-lg">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
          <DownloadIcon />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">Install Waleed AI</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            Quick access from your home screen. Works offline.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={promptInstall}
              className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-bg transition-all duration-300 hover:bg-accent-hover hover:shadow-[0_0_16px_rgba(201,169,97,0.35)] active:scale-95"
            >
              Install
            </button>
            <button
              type="button"
              onClick={() => dismissBanner(true)}
              className="rounded-full px-3 py-1.5 text-xs text-muted transition-colors hover:text-fg"
            >
              Not now
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => dismissBanner(false)}
          aria-label="Close"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-bg hover:text-fg active:scale-90"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

/* ---------- Icons ---------- */

function DownloadIcon() {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
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
