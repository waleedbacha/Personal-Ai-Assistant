"use client";

import { useEffect, useState } from "react";
import { persona } from "@/data/persona";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("wb-welcome-seen");
    if (!hasSeen) {
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("wb-welcome-seen", "true");
  };

  const hasLogo = Boolean(persona.logo) && !logoFailed;
  const initials = persona.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="animate-fade-in absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal Content */}
      <div className="animate-fade-in-up safe-top safe-bottom relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl">
        {/* Header area with logo */}
        <div className="relative bg-gradient-to-br from-accent/20 to-transparent px-6 py-8 text-center sm:px-8">
          <div className="mx-auto mb-6 flex justify-center">
            {hasLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={persona.logo}
                alt={persona.name}
                onError={() => setLogoFailed(true)}
                className="h-16 w-auto object-contain sm:h-20"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-xl font-semibold text-accent ring-1 ring-accent/30 sm:h-20 sm:w-20">
                {initials}
              </div>
            )}
          </div>

          <h2 className="font-serif text-2xl font-bold text-fg sm:text-3xl">
            Meet Your AI Assistant
          </h2>
          <p className="mt-2 text-sm text-muted">
            Version 1.0 · Powered by WB © 2026
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <p className="text-sm leading-relaxed text-muted sm:text-[15px]">
            This isn’t just a chatbot. It’s a fully integrated personal AI
            designed to showcase work, manage schedules, and bring actual
            clients directly to you.
          </p>

          <div className="mt-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-bg-soft p-1.5 text-accent">
                <CodeIcon />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-fg">
                  Real-Time Portfolio Tracking
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Acts as your live portfolio. Connected directly with GitHub
                  and Google Calendar to track recent commits, active work, and
                  upcoming events through simple conversations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-bg-soft p-1.5 text-accent">
                <BriefcaseIcon />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-fg">
                  Client Acquisition & Services
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Functions as your personal service provider
                  representative—talking with site visitors, answering questions
                  about your background, and capturing prospective clients for
                  you.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-bg-soft p-1.5 text-accent">
                <SettingsIcon />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-fg">
                  Custom Integrations
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  We also offer custom AI integrations tailored to your specific
                  workflow, data requirements, and external tools.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border bg-bg-soft/30 px-6 py-4 sm:px-8">
          <button
            onClick={handleClose}
            className="flex w-full items-center justify-center rounded-full bg-accent px-4 py-3 text-sm font-medium text-bg transition-all duration-300 hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(201,169,97,0.3)] active:scale-[0.98]"
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Icons ---------- */

function CodeIcon() {
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
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function BriefcaseIcon() {
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
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function SettingsIcon() {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
