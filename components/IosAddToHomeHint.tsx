"use client";

import { useState, useEffect } from "react";

const DISMISS_KEY = "ios-add-hint-dismissed-at";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && "ontouchend" in document); // iPad on iPadOS 13+
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;

  return isIos && isSafari && !isStandalone;
}

export function IosAddToHomeHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIosSafari()) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - parseInt(dismissed, 10) < DISMISS_MS) return;

    // Show after 8 seconds so the visitor has had time to read the hero
    const timer = setTimeout(() => setShow(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!show) return null;

  return (
    <div className="safe-bottom fixed bottom-0 left-0 right-0 z-[55] p-3">
      <div className="animate-sheet-up mx-auto max-w-md rounded-2xl border border-border bg-bg-soft/95 p-4 shadow-2xl backdrop-blur-lg">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg">
              Add Waleed AI to your Home Screen
            </p>
            <p className="mt-0.5 text-xs text-muted">
              For fullscreen access and offline use
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-bg hover:text-fg active:scale-90"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Steps */}
        <ol className="space-y-2 text-xs text-muted">
          <li className="flex items-start gap-2">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
              1
            </span>
            <span className="pt-0.5">
              Tap the <ShareIcon /> Share button in Safari&apos;s toolbar
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
              2
            </span>
            <span className="pt-0.5">
              Scroll down and tap{" "}
              <strong className="text-fg">Add to Home Screen</strong>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
              3
            </span>
            <span className="pt-0.5">
              Tap <strong className="text-fg">Add</strong> in the top-right
              corner
            </span>
          </li>
        </ol>

        {/* Dismiss */}
        <button
          type="button"
          onClick={dismiss}
          className="mt-4 w-full rounded-full border border-border bg-bg/50 px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-accent/50 hover:text-fg"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

/* ---------- Icons ---------- */

function ShareIcon() {
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
      className="inline-block align-text-bottom"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
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
